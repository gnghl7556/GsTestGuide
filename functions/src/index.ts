import { onObjectFinalized } from 'firebase-functions/v2/storage';
import { onCall } from 'firebase-functions/v2/https';
import { onRequest } from 'firebase-functions/v2/https';
import { HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { generateDefectReport } from './utils/excelGenerator';
import { parseDocumentFromBuffer } from './parsers';

initializeApp();

const REGION = 'asia-northeast3';

const isAgreementPath = (objectPath: string) => objectPath.startsWith('agreements/');

const parseTestNumber = (objectPath: string) => {
  const parts = objectPath.split('/');
  return parts.length >= 2 ? parts[1] : '';
};

const PREVIEW_ASSETS = [
  { fileName: 'doc-agreement-preview.png', storagePath: 'previews/doc-agreement-preview.png', contentType: 'image/png' },
  { fileName: 'doc-seat-plan-preview.png', storagePath: 'previews/doc-seat-plan-preview.png', contentType: 'image/png' }
] as const;

const isProjectFinalized = async (projectId: string) => {
  const db = getFirestore();
  const projectRef = db.collection('projects').doc(projectId);
  const projectSnap = await projectRef.get();
  if (!projectSnap.exists) return false;
  const project = projectSnap.data() as {
    status?: string;
    executionState?: { finalizedAt?: unknown };
  };
  return project.status === '완료' || Boolean(project.executionState?.finalizedAt);
};

// ==========================================
// 1. 메인 클라우드 함수 (onAgreementUpload)
// ==========================================
export const onAgreementUpload = onObjectFinalized({ region: REGION }, async (event) => {
  const objectPath = event.data.name;
  if (!objectPath || !isAgreementPath(objectPath)) return;

  const testNumber = parseTestNumber(objectPath);
  if (!testNumber) return;

  const fileName = objectPath.split('/').slice(2).join('/');
  const db = getFirestore();

  // 초기 상태 저장
  await db.collection('agreementDocs').doc(testNumber).set(
    {
      testNumber,
      storagePath: objectPath,
      fileName,
      uploadedAt: FieldValue.serverTimestamp(),
      parseStatus: 'pending',
      parsed: {},
      parseProgress: 0,
    },
    { merge: true }
  );

  const bucket = getStorage().bucket();
  const fileExt = path.extname(fileName).toLowerCase();
  const localPath = path.join(os.tmpdir(), `agreement-${Date.now()}${fileExt || '.pdf'}`);

  try {
    await bucket.file(objectPath).download({ destination: localPath });

    const buffer = await fs.promises.readFile(localPath);

    // 통합 파서를 사용하여 PDF 텍스트 추출 + 정제
    const parseResult = await parseDocumentFromBuffer(buffer, fileName, {
      removePageNumbers: true,
      removeHeadersFooters: false,
      removeWatermarks: true,
      removeRepeatingPatterns: false,
    });

    if (!parseResult.success) {
      await db.collection('agreementDocs').doc(testNumber).set(
        {
          parseStatus: 'failed',
          parseError: parseResult.error || 'PDF 파싱에 실패했습니다.',
        },
        { merge: true }
      );
      return;
    }

    const text = parseResult.cleanedText;

    if (!text.trim()) {
      await db.collection('agreementDocs').doc(testNumber).set(
        {
          parseStatus: 'failed',
          parseError: '텍스트를 추출할 수 없는 PDF입니다. (이미지 스캔본 등)',
        },
        { merge: true }
      );
      return;
    }

    // 추출 로직 실행 (confidence 포함)
    const { extractionRate, fieldConfidence, ...fieldValues } = extractAgreementFields(text);
    const cleanParsed = removeUndefined(fieldValues);

    // 진행 상황 업데이트
    await db.collection('agreementDocs').doc(testNumber).set(
      { parseProgress: 50, parsed: cleanParsed },
      { merge: true }
    );

    // 최종 저장 (confidence + extractionRate 포함)
    await db.collection('agreementDocs').doc(testNumber).set(
      {
        parseStatus: 'parsed',
        parsed: cleanParsed,
        extractionRate,
        fieldConfidence,
        userVerified: false,
        parsedAt: FieldValue.serverTimestamp(),
        parseProgress: 100,
      },
      { merge: true }
    );

  } catch (error) {
    console.error('Error processing file:', error);
    await db.collection('agreementDocs').doc(testNumber).set(
      {
        parseStatus: 'failed',
        parseError: String(error),
      },
      { merge: true }
    );
  } finally {
    // 임시 파일 삭제
    fs.promises.unlink(localPath).catch(() => undefined);
  }
});

// ==========================================
// 2. 헬퍼 함수들 (반드시 메인 함수 밖에 위치)
// ==========================================

const removeUndefined = <T extends Record<string, unknown>>(input: T): T => {
  const entries = Object.entries(input).filter(([, value]) => value !== undefined);
  return Object.fromEntries(entries) as T;
};

const execOnce = (re: RegExp, input: string) => {
  const flags = re.flags.includes('g') ? re.flags.replace(/g/g, '') : re.flags;
  const safe = new RegExp(re.source, flags);
  return safe.exec(input);
};

const matchesAny = (re: RegExp, inputs: string[]) => inputs.some((input) => !!execOnce(re, input));

const selectCheckedOption = (
  options: Array<{ label: string; re: RegExp }>,
  inputs: string[],
  fallback = '확인 필요'
) => {
  for (const option of options) {
    if (matchesAny(option.re, inputs)) return option.label;
  }
  return fallback;
};

const buildAgreementFieldExtractors = (text: string) => {
  const normalized = text.replace(/\r\n?/g, '\n');
  const flattened = normalized.replace(/\s+/g, ' ').trim();
  const compact = normalized.replace(/\s+/g, '');

  const findValueByLine = (keywordRegex: RegExp) => {
    const m = execOnce(keywordRegex, normalized);
    return m?.[1] ? m[1].trim() : undefined;
  };

  return { normalized, flattened, compact, findValueByLine };
};

const extractDepartmentAndTitle = (normalized: string) => {
  const m = normalized.match(/(?:^|\n)\s*([^\n]+?)\s*부서\s*\/\s*직급\b/);
  if (!m?.[1]) return { department: '', jobTitle: '' };
  const raw = m[1].trim();
  const lastSlashIndex = raw.lastIndexOf('/');
  if (lastSlashIndex > -1) {
    return {
      department: raw.slice(0, lastSlashIndex).trim(),
      jobTitle: raw.slice(lastSlashIndex + 1).trim(),
    };
  }
  return { department: raw, jobTitle: '' };
};

const extractAgreementFields = (text: string) => {
  const context = buildAgreementFieldExtractors(text);
  const { normalized, compact, findValueByLine } = context;

  const findEmail = () => {
    // 업무 담당자 섹션의 E-Mail을 우선 추출
    const managerEmailMatch = execOnce(
      /업\s*무\s*담\s*당\s*자[\s\S]{0,400}?E\s*-?\s*Mail\s*[:：]?\s*([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i,
      normalized
    );
    if (managerEmailMatch?.[1]) return managerEmailMatch[1];

    // 대표자 E-Mail 제외: 대표자 섹션 내의 이메일은 무시
    const representativeEmailMatch = execOnce(
      /대표자[\s\S]{0,200}?E\s*-?\s*Mail\s*[:：]?\s*([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i,
      normalized
    );

    const fallback = execOnce(
      /E\s*-?\s*Mail\s*[:：]?\s*([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i,
      normalized
    );

    if (fallback?.[1] && fallback[1] !== representativeEmailMatch?.[1]) {
      return fallback[1];
    }
    return undefined;
  };

  const findMobile = () => {
    const normalizePhone = (raw: string) => {
      const digits = raw.replace(/\D/g, '');
      if (digits.length === 11) return digits.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
      if (digits.length === 10) return digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
      return undefined;
    };

    const m1 = execOnce(
      /업\s*무\s*담\s*당\s*자[\s\S]{0,1200}?Mobile[\s\S]{0,120}?((?:\d[\s-]*){9,13})/i,
      normalized
    );
    if (m1?.[1]) {
      const normalizedPhone = normalizePhone(m1[1]);
      if (normalizedPhone) return normalizedPhone;
    }

    const m2 = execOnce(/010\s*-?\s*\d{3,4}\s*-?\s*\d{4}/, normalized);
    return m2?.[0] ? m2[0].replace(/\s/g, '') : undefined;
  };

  const extractManagerName = () => {
    let raw = '';
    const m1 = execOnce(/업\s*무\s*담\s*당\s*자[\s\S]{0,1500}?성\s*명\s*[:：]?\s*([^\n]+)/, normalized);
    if (m1?.[1]) {
      raw = m1[1];
    } else {
      const matches = [...normalized.matchAll(/성\s*명\s*[:：]?\s*([^\n]+)/g)];
      if (matches.length > 0) raw = matches[matches.length - 1][1];
    }

    if (!raw) return undefined;

    return raw.split(/\s+(?:전화|연락|이메일|서명|인\s*$)/)[0].trim();
  };

  const extractCompanyName = () => {
    const m = execOnce(/신청(?:기업|기관)[\s\S]{0,400}?국문명\s+(?![:：])\s*([^\n]+)/, normalized);
    return m?.[1]?.trim() ? cleanName(m[1]) : undefined;
  };

  const extractProductName = () => {
    const m = execOnce(/제품명[\s\S]{0,400}?국문명\s*[:：]\s*([^\n]+)/, normalized);
    return m?.[1]?.trim() ? cleanName(m[1]) : undefined;
  };

  const cleanName = (raw: string) => {
    return raw
      .replace(/\s*영문명[\s\S]*$/g, '')
      .replace(/\([^)]*\)/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  };

  const extractTestTarget = () => {
    // "제품 구성" section: text between "제품 구성" and "제조자"
    const m = execOnce(/제품\s*구성\s*\n([\s\S]+?)제조자/, normalized);
    if (!m?.[1]) return undefined;
    const lines = m[1].split('\n')
      .map(l => l.trim())
      .filter(l => l && l.length > 1 && !/^TIS-\d/.test(l) && !/한국정보통신/.test(l));
    if (lines.length === 0) return undefined;
    return lines.map(l => l.replace(/^-\s*/, '')).join(', ');
  };

  const extractTestEnvironment = () => {
    // Full environment section: 2.2 시험환경 ~ 시험기간
    const envMatch = execOnce(
      /2\.2\s*시험환경[\s\S]+?(?=\n\s*\d+\.\s*시험기간)/,
      normalized
    );
    const envSection = envMatch?.[0] || '';

    // Equipment subsection: 시험용 장비 ~ 시험용 데이터 or 다중 웹브라우저
    const equipMatch = execOnce(
      /시험용\s*\n\s*장비[\s\S]+?(?=시험용\s*\n\s*데이터|다중\s*\n\s*웹브라우저)/,
      normalized
    );
    const equipSection = equipMatch?.[0] || envSection;

    // 1. hasServer: dedicated server entries "(N대)" preceded by 서버
    const hasServer = /서버\s*\n\s*\(\s*\d+\s*대\s*\)/.test(equipSection) ? '유' : '무';

    // 2. requiredEquipmentCount
    let totalEquip = 0;
    // Structured table: "(N대)"
    const structuredCounts = [...equipSection.matchAll(/\(\s*(\d+)\s*대\s*\)/g)];
    for (const mc of structuredCounts) totalEquip += parseInt(mc[1]);
    // Free-form fallback: "N대," or "N대 " (e.g., "PC 5대, VR HMD 4대")
    if (totalEquip === 0) {
      const freeFormCounts = [...equipSection.matchAll(/(\d+)\s*대[,\s]/g)];
      for (const mc of freeFormCounts) totalEquip += parseInt(mc[1]);
    }
    const requiredEquipmentCount = totalEquip > 0 ? String(totalEquip) : undefined;

    // 3. operatingSystem: all "OS:" values
    const osMatches = [...envSection.matchAll(/OS\s*:\s*([^\n]+)/gi)];
    const osList = osMatches.map(om => om[1].trim()).filter(Boolean);
    const operatingSystem = osList.length > 0 ? [...new Set(osList)].join(', ') : undefined;

    // 4. hardwareSpec: first server's CPU/메모리/Storage/GPU
    const specs: string[] = [];
    const cpuM = execOnce(/CPU\s*:\s*([^\n]+)/i, envSection);
    if (cpuM) specs.push(`CPU: ${cpuM[1].trim()}`);
    const memM = execOnce(/(?:메모리|Memory)\s*:\s*([^,\n]+)/i, envSection);
    if (memM) specs.push(`메모리: ${memM[1].trim()}`);
    const stoM = execOnce(/(?:Storage|Stroage)\s*:\s*([^,\n]+)/i, envSection);
    if (stoM) specs.push(`Storage: ${stoM[1].trim()}`);
    const gpuM = execOnce(/GPU\s*:\s*([^\n]+)/i, envSection);
    if (gpuM) specs.push(`GPU: ${gpuM[1].trim()}`);
    const hardwareSpec = specs.length > 0 ? specs.join(', ') : undefined;

    // 5. networkEnvironment
    const netParts: string[] = [];
    const netLine = execOnce(/Network\s*:\s*([^\n]+)/i, envSection);
    if (netLine) netParts.push(netLine[1].trim());
    // "<시험환경 구성에 필요한 기타 사항>" subsection content
    const envEtcMatch = execOnce(
      /시험환경\s*구성에\s*필요한\s*기타\s*사항[>》]?\s*\n([\s\S]+?)(?=시험용\s*\n\s*데이터|GS인증|TIS-\d)/,
      envSection
    );
    if (envEtcMatch?.[1]) {
      const etcLines = envEtcMatch[1].split('\n')
        .map(l => l.trim())
        .filter(l => l && l.length > 1 && !/^TIS-\d/.test(l) && !/한국정보통신/.test(l) && !/^GS인증/.test(l))
        .map(l => l.replace(/^-\s*/, ''));
      if (etcLines.length > 0) netParts.push(etcLines.join(' '));
    }
    if (netParts.length === 0 && /인터넷\s*(?:망\s*)?(?:연결\s*)?필요/.test(envSection)) {
      netParts.push('인터넷 연결 필요');
    }
    const networkEnvironment = netParts.length > 0 ? netParts.join('; ') : undefined;

    // 6. otherEnvironment: "기타 사항" form field
    const etcFormMatch = execOnce(
      /기타\s*\n\s*사항\s*\n([\s\S]+?)(?=추가\s*\n?\s*협의\s*\n?\s*내용)/,
      envSection
    );
    let otherEnvironment: string | undefined;
    if (etcFormMatch?.[1]) {
      const cleaned = etcFormMatch[1].split('\n')
        .map(l => l.trim())
        .filter(l => l && l.length > 1 && !/^TIS-\d/.test(l) && !/한국정보통신/.test(l) && !/^GS인증/.test(l))
        .join(' ')
        .trim();
      if (cleaned && cleaned !== '-' && !/^해당\s*없음$/.test(cleaned)) {
        otherEnvironment = cleaned.length > 500 ? cleaned.substring(0, 500) + '...' : cleaned;
      }
    }

    // 7. equipmentPreparation
    const prepSet = new Set<string>();
    if (/신청\s*\n?\s*기업/.test(equipSection)) prepSet.add('신청 기업');
    const equipLines = equipSection.split('\n');
    for (const line of equipLines) {
      if (/^\s*TTA\s*$/.test(line) || /\bTTA\s*$/.test(line)) prepSet.add('TTA');
    }
    if (/장비\s*일체를?\s*신청\s*기업에서\s*제공/.test(equipSection)) prepSet.add('신청 기업');
    const equipmentPreparation = prepSet.size > 0 ? [...prepSet].join(', ') : undefined;

    return {
      hasServer,
      requiredEquipmentCount,
      operatingSystem,
      hardwareSpec,
      networkEnvironment,
      otherEnvironment,
      equipmentPreparation,
    };
  };

  const extractWorkingDays = () => {
    // Primary: "시험 시작일로부터 N 일(Working Day 기준)"
    const m1 = execOnce(/시험\s*시작일로부터\s*(\d+)\s*일/, normalized);
    if (m1?.[1]) return m1[1];

    // Fallback: "소요기간 N일"
    const m2 = execOnce(
      /(?:시험\s*)?소요\s*기간[\s\S]{0,100}?(\d+)\s*(?:일|영업일|근무일)/,
      normalized
    );
    if (m2?.[1]) return m2[1];

    return undefined;
  };

  const computeConfidence = (value: string | undefined): number => {
    if (!value || !value.trim() || value === '확인 필요') return 0;
    let score = 70;
    if (value.length >= 2 && value.length <= 100) score += 15;
    if (/[가-힣a-zA-Z0-9]/.test(value)) score += 15;
    return Math.min(score, 100);
  };

  const { department, jobTitle } = extractDepartmentAndTitle(normalized);
  const managerName = extractManagerName() || '';
  const managerMobile = findMobile() || '';
  const managerEmail = findEmail() || '';
  const companyName = extractCompanyName() || '';
  const productNameKo = extractProductName() || '';
  const workingDays = extractWorkingDays();
  const testTarget = extractTestTarget();
  const env = extractTestEnvironment();

  const applicationNumberMatch = normalized.match(/GS-A-\d{2}-\d{4}/);
  const applicationNumber = applicationNumberMatch?.[0] || findValueByLine(/시험신청번호\s*[:：]?\s*([^\n]+)/) || '-';

  const contractType = selectCheckedOption(
    [{ label: '최초계약', re: /최초계약\s*\(V\)/ }, { label: '재계약', re: /재계약\s*\(V\)/ }],
    [normalized, compact]
  );

  const certificationType = selectCheckedOption(
    [{ label: '신규인증', re: /신규인증\s*\(V\)/ }, { label: '재인증', re: /재인증\s*\(V\)/ }],
    [normalized, compact]
  );

  const fields: Record<string, string | undefined> = {
    applicationNumber,
    contractType,
    certificationType,
    managerName,
    managerMobile,
    managerEmail,
    managerDepartment: department,
    managerJobTitle: jobTitle,
    companyName,
    productNameKo,
    workingDays,
    testTarget,
    hasServer: env.hasServer,
    requiredEquipmentCount: env.requiredEquipmentCount,
    operatingSystem: env.operatingSystem,
    hardwareSpec: env.hardwareSpec,
    networkEnvironment: env.networkEnvironment,
    otherEnvironment: env.otherEnvironment,
    equipmentPreparation: env.equipmentPreparation,
  };

  const totalFields = Object.keys(fields).length;
  const extractedCount = Object.values(fields).filter(
    (v) => v && v.trim() && v !== '확인 필요'
  ).length;
  const extractionRate = Math.round((extractedCount / totalFields) * 100);

  const fieldConfidence: Record<string, number> = {};
  for (const [key, value] of Object.entries(fields)) {
    fieldConfidence[key] = computeConfidence(value);
  }

  return { ...fields, extractionRate, fieldConfidence };
};

// ==========================================
// 3. 기타 Cloud Functions (필요시 포함)
// ==========================================
export const generateFeatureDraft = onCall({ region: REGION }, async () => {
    // ... 기존 generateFeatureDraft 로직 ...
});

export const syncPreviewAssets = onRequest({ region: REGION }, async (_req, res) => {
  try {
    const bucket = getStorage().bucket();
    for (const asset of PREVIEW_ASSETS) {
      const localPath = path.join(__dirname, '..', 'assets', 'previews', asset.fileName);
      await bucket.upload(localPath, {
        destination: asset.storagePath,
        metadata: {
          contentType: asset.contentType,
          cacheControl: 'public,max-age=3600'
        }
      });
    }
    res.status(200).json({
      ok: true,
      uploaded: PREVIEW_ASSETS.map((asset) => asset.storagePath)
    });
  } catch (error) {
    console.error('[syncPreviewAssets] failed:', error);
    res.status(500).json({ ok: false, error: String(error) });
  }
});

export const saveDefectReport = onCall({ region: REGION }, async (request) => {
  const db = getFirestore();
  const data = (request.data || {}) as {
    projectId?: string;
    testCaseId?: string;
    reportVersion?: 1 | 2 | 3 | 4;
    isDerived?: boolean;
    summary?: string;
    testEnvironment?: string;
    severity?: 'H' | 'M' | 'L';
    frequency?: 'A' | 'I';
    qualityCharacteristic?: string;
    accessPath?: string;
    stepsToReproduce?: string[];
    description?: string;
    ttaComment?: string;
    evidenceFiles?: Array<{ name: string; url: string }>;
  };

  if (!request.auth) {
    throw new HttpsError('unauthenticated', '로그인이 필요합니다.');
  }
  if (!data.projectId) {
    throw new HttpsError('invalid-argument', 'projectId가 필요합니다.');
  }
  if (!data.summary?.trim() || !data.qualityCharacteristic?.trim()) {
    throw new HttpsError('invalid-argument', '요약과 품질 특성은 필수입니다.');
  }
  if (await isProjectFinalized(data.projectId)) {
    throw new HttpsError('failed-precondition', '4차 확정 이후에는 결함을 수정할 수 없습니다.');
  }

  const defectRef = db.collection('projects').doc(data.projectId).collection('defects').doc();
  await defectRef.set(
    {
      defectId: defectRef.id,
      linkedTestCaseId: data.testCaseId || '',
      reportVersion: data.reportVersion ?? 1,
      isDerived: Boolean(data.isDerived),
      summary: data.summary.trim(),
      testEnvironment: data.testEnvironment || '',
      severity: data.severity || 'M',
      frequency: data.frequency || 'I',
      qualityCharacteristic: data.qualityCharacteristic.trim(),
      accessPath: data.accessPath || '',
      stepsToReproduce: Array.isArray(data.stepsToReproduce) ? data.stepsToReproduce : [],
      description: data.description || '',
      ttaComment: data.ttaComment || '',
      status: '신규',
      evidenceFiles: Array.isArray(data.evidenceFiles) ? data.evidenceFiles : [],
      reportedBy: request.auth.uid,
      reportedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  return { defectId: defectRef.id };
});

export const exportDefectsXlsx = onCall({ region: REGION }, async (request) => {
  const db = getFirestore();
  const { projectId, reportVersion, reportDate, environment } = (request.data || {}) as {
    projectId?: string;
    reportVersion?: 1 | 2 | 3 | 4;
    reportDate?: string;
    environment?: string;
  };

  if (!projectId) {
    throw new Error('projectId가 필요합니다.');
  }

  const defectsSnap = await db
    .collection('projects')
    .doc(projectId)
    .collection('defects')
    .get();

  const defects = defectsSnap.docs.map((docSnap) => {
    const data = docSnap.data() as Record<string, unknown>;
    return {
      defectId: (data.defectId as string) || docSnap.id,
      defectNumber: data.defectNumber as number | undefined,
      linkedTestCaseId: data.linkedTestCaseId as string | undefined,
      reportVersion: (data.reportVersion ?? 1) as 1 | 2 | 3 | 4,
      isDerived: Boolean(data.isDerived),
      summary: (data.summary as string) || '',
      testEnvironment: (data.testEnvironment as string) || '',
      severity: ((data.severity as string) || 'M') as 'H' | 'M' | 'L',
      frequency: ((data.frequency as string) || 'I') as 'A' | 'I',
      qualityCharacteristic: (data.qualityCharacteristic as string) || '',
      accessPath: (data.accessPath as string) || '',
      stepsToReproduce: Array.isArray(data.stepsToReproduce) ? data.stepsToReproduce : [],
      description: (data.description as string) || '',
      ttaComment: (data.ttaComment as string) || '',
      status: ((data.status as string) || '신규') as '신규' | '확인' | '수정' | '보류' | '종료',
      reportedBy: (data.reportedBy as string) || '',
      reportedAt: data.reportedAt
    };
  });

  const normalizedReportVersion = reportVersion ?? 1;
  const filtered = reportVersion
    ? defects.filter((item) => item.reportVersion === reportVersion)
    : defects;

  const now = new Date();
  const dateLabel =
    reportDate || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const buffer = await generateDefectReport({
    testNumber: projectId,
    reportVersion: normalizedReportVersion,
    reportDate: dateLabel,
    environment: environment || '',
    defects: filtered
  });

  return {
    fileBase64: buffer.toString('base64'),
    fileName: `${projectId}_defects_${normalizedReportVersion}차.xlsx`
  };
});
