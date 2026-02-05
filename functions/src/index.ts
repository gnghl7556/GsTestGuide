import { onObjectFinalized } from 'firebase-functions/v2/storage';
import { onCall } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { generateDefectReport } from './utils/excelGenerator';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParseLib = require('pdf-parse');
// 함수면 그대로 쓰고, 아니면 .default를 사용 (방어 코드)
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const pdfParse = typeof pdfParseLib === 'function' ? pdfParseLib : pdfParseLib.default;
console.log('[DEBUG] pdfParse type:', typeof pdfParse);

initializeApp();

const REGION = 'asia-northeast3';

const isAgreementPath = (objectPath: string) => objectPath.startsWith('agreements/');

const parseTestNumber = (objectPath: string) => {
  const parts = objectPath.split('/');
  return parts.length >= 2 ? parts[1] : '';
};

// ==========================================
// 1. 메인 클라우드 함수 (onAgreementUpload)
// ==========================================
export const onAgreementUpload = onObjectFinalized({ region: REGION }, async (event) => {
  const objectPath = event.data.name;
  console.log('Triggered with:', objectPath);
  if (!objectPath || !isAgreementPath(objectPath)) return;

  const testNumber = parseTestNumber(objectPath);
  console.log('Detected testNumber:', testNumber);
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

    let text = '';
    if (fileExt !== '.pdf') {
      await db.collection('agreementDocs').doc(testNumber).set(
        { parseStatus: 'failed', parseError: 'PDF 파일만 지원됩니다.' },
        { merge: true }
      );
      return;
    }

    const buffer = await fs.promises.readFile(localPath);

    try {
      const result = await pdfParse(buffer);
      text = result.text || '';
    } catch (error) {
      console.error('[PDF Parse] failed:', error);
      await db.collection('agreementDocs').doc(testNumber).set(
        {
          parseStatus: 'failed',
          parseError: String(error),
        },
        { merge: true }
      );
      return;
    }

    console.log(`[DEBUG] PDF Text Start: ${text.substring(0, 500)}`);

    if (!text.trim()) {
      console.log('저장 시도 중...');
      await db.collection('agreementDocs').doc(testNumber).set(
        {
          parseStatus: 'failed',
          parseError: '텍스트를 추출할 수 없는 PDF입니다. (이미지 스캔본 등)',
        },
        { merge: true }
      );
      return;
    }

    // 추출 로직 실행
    const parsed = extractAgreementFields(text);
    const cleanParsed = removeUndefined(parsed);
    const parseStatus = text.trim() ? 'parsed' : 'failed';

    // 진행 상황 업데이트 (옵션)
    if (parseStatus === 'parsed') {
      await db.collection('agreementDocs').doc(testNumber).set(
        {
          parseProgress: 50,
          parsed: cleanParsed
        }, 
        { merge: true }
      );
    }

    // 최종 저장
    console.log('저장 시도 중...');
    await db.collection('agreementDocs').doc(testNumber).set(
      {
        parseStatus,
        parsed: cleanParsed,
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
      .replace(/\([^)]*\)/g, '')
      .replace(/\s*영문명[\s\S]*$/g, '')
      .replace(/[A-Za-z]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  };

  const { department, jobTitle } = extractDepartmentAndTitle(normalized);
  const managerName = extractManagerName() || '';
  const managerMobile = findMobile() || '';
  const managerEmail = findEmail() || '';
  const companyName = extractCompanyName() || '';
  const productNameKo = extractProductName() || '';

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

  return {
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
  };
};

// ==========================================
// 3. 기타 Cloud Functions (필요시 포함)
// ==========================================
export const generateFeatureDraft = onCall({ region: REGION }, async () => {
    // ... 기존 generateFeatureDraft 로직 ...
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
