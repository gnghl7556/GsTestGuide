import { onObjectFinalized } from 'firebase-functions/v2/storage';
import { onCall } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import * as pdfParse from 'pdf-parse';

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

    let text = '';
    if (fileExt !== '.pdf') {
      await db.collection('agreementDocs').doc(testNumber).set(
        { parseStatus: 'failed', parseError: 'PDF 파일만 지원됩니다.' },
        { merge: true }
      );
      return;
    }

    const buffer = await fs.promises.readFile(localPath);
    
    // 로그 추가 포인트
    const result = await pdfParse(buffer);
    text = result.text || '';
    console.log(`[DEBUG] PDF Text Start: ${text.substring(0, 500)}`);

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

const findFirstValue = (
  rules: Array<{
    input: string;
    re: RegExp;
    transform?: (value: string) => string;
  }>
) => {
  for (const rule of rules) {
    const m = execOnce(rule.re, rule.input);
    if (m?.[1]) {
      const raw = rule.transform ? rule.transform(m[1]) : m[1];
      return raw.trim();
    }
  }
  return undefined;
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
    const m = execOnce(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i, normalized);
    return m?.[0];
  };

  const findMobile = () => {
    const m = execOnce(/010\s*-?\s*\d{3,4}\s*-?\s*\d{4}/, normalized);
    return m?.[0] ? m[0].replace(/\s/g, '') : undefined;
  };

  const extractManagerName = () => {
    const m1 = execOnce(/업\s*무\s*담\s*당\s*자[\s\S]{0,1500}?성\s*명\s*[:：]?\s*([^\n]+)/, normalized);
    if (m1?.[1]) return m1[1].trim();
    const matches = [...normalized.matchAll(/성\s*명\s*[:：]?\s*([^\n]+)/g)];
    if (matches.length > 0) return matches[matches.length - 1][1].trim();
    return undefined;
  };

  const { department, jobTitle } = extractDepartmentAndTitle(normalized);
  const managerName = extractManagerName() || '';
  const managerMobile = findMobile() || '';
  const managerEmail = findEmail() || '';

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
    담당자: managerName,
    연락처: managerMobile,
    이메일: managerEmail,
  };
};

// ==========================================
// 3. 기타 Cloud Functions (필요시 포함)
// ==========================================
export const generateFeatureDraft = onCall({ region: REGION }, async () => {
    // ... 기존 generateFeatureDraft 로직 ...
});

export const exportDefectsXlsx = onCall({ region: REGION }, async () => {
    // ... 기존 exportDefectsXlsx 로직 ...
});
