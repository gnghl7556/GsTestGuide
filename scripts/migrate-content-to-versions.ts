/**
 * migrate-content-to-versions.ts
 *
 * 기존 마크다운 원본(REQUIREMENTS_DB) + contentOverrides → contentVersions 컬렉션으로 마이그레이션.
 *
 * 사전 준비:
 *   1. GOOGLE_APPLICATION_CREDENTIALS 환경변수에 서비스 계정 키 경로 설정
 *      또는 `gcloud auth application-default login` 으로 ADC 설정
 *   2. 브라우저 콘솔에서 requirements.json 내보내기:
 *      ```js
 *      import { REQUIREMENTS_DB } from 'virtual:content/process';
 *      copy(JSON.stringify(REQUIREMENTS_DB, null, 2));
 *      ```
 *      → 복사된 JSON을 scripts/requirements.json 으로 저장
 *   3. 또는 --build-requirements 플래그로 마크다운에서 직접 빌드 (gray-matter 필요)
 *
 * 실행:
 *   npx ts-node scripts/migrate-content-to-versions.ts --dry-run
 *   npx ts-node scripts/migrate-content-to-versions.ts --validate
 *   npx ts-node scripts/migrate-content-to-versions.ts              # 실제 적용
 *
 * 플래그:
 *   --dry-run              실제 쓰기 없이 계획만 출력
 *   --validate             마이그레이션 후 데이터 검증 (읽기 전용)
 *   --build-requirements   마크다운 파일에서 REQUIREMENTS_DB를 직접 빌드
 *   --project-id=<id>      Firebase 프로젝트 ID 지정
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// ─── Types ────────────────────────────────────────────────────────────────────

type QuestionImportance = 'MUST' | 'SHOULD';

interface BranchingRule {
  sourceIndex: number;
  triggerAnswer: 'NO';
  skipIndices: number[];
}

interface ContentSnapshot {
  title: string;
  description: string;
  checkpoints: string[];
  checkpointImportances: Record<number, QuestionImportance>;
  checkpointDetails: Record<number, string>;
  checkpointEvidences: Record<number, number[]>;
  checkpointOrder: number[];
  evidenceExamples: string[];
  testSuggestions: string[];
  passCriteria: string;
  branchingRules: BranchingRule[];
}

interface ContentOverride {
  title?: string;
  description?: string;
  checkpoints?: Record<number, string>;
  checkpointImportances?: Record<number, QuestionImportance>;
  checkpointDetails?: Record<number, string>;
  checkpointEvidences?: Record<number, number[]>;
  checkpointOrder?: number[];
  evidenceExamples?: string[];
  testSuggestions?: string[];
  passCriteria?: string;
  branchingRules?: BranchingRule[];
  updatedAt?: unknown;
  updatedBy?: string;
}

interface Requirement {
  id: string;
  category: string;
  title: string;
  description: string;
  checkPoints?: string[];
  evidenceExamples?: string[];
  testSuggestions?: string[];
  passCriteria?: string;
  checkpointImportances?: Record<number, QuestionImportance>;
  checkpointDetails?: Record<number, string>;
  checkpointEvidences?: Record<number, number[]>;
  branchingRules?: BranchingRule[];
  [key: string]: unknown;
}

// ─── Args ─────────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const projectIdArg = args.find((a) => a.startsWith('--project-id='));
  return {
    dryRun: args.includes('--dry-run'),
    validate: args.includes('--validate'),
    buildRequirements: args.includes('--build-requirements'),
    projectId: projectIdArg ? projectIdArg.split('=')[1] : undefined,
  };
}

// ─── Markdown 파싱 (vite-plugin-content.ts 로직 인라인) ──────────────────────

function readContentFiles(dir: string, ext = '.md'): { filePath: string; content: string }[] {
  const results: { filePath: string; content: string }[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...readContentFiles(fullPath, ext));
    } else if (entry.name.endsWith(ext)) {
      results.push({ filePath: fullPath, content: fs.readFileSync(fullPath, 'utf-8').replace(/\r/g, '') });
    }
  }
  return results;
}

function extractSections(markdown: string): { heading: string; content: string }[] {
  const sections: { heading: string; content: string }[] = [];
  const lines = markdown.split('\n');
  let currentHeading = '';
  let currentLines: string[] = [];
  for (const line of lines) {
    const h2Match = line.match(/^## (.+)$/);
    if (h2Match) {
      if (currentHeading) {
        sections.push({ heading: currentHeading, content: currentLines.join('\n').trim() });
      }
      currentHeading = h2Match[1].trim();
      currentLines = [];
    } else if (currentHeading) {
      currentLines.push(line);
    }
  }
  if (currentHeading) {
    sections.push({ heading: currentHeading, content: currentLines.join('\n').trim() });
  }
  return sections;
}

function parseCheckboxList(content: string): string[] {
  return content
    .split('\n')
    .map((line) => line.match(/^-\s*\[[ x]\]\s*(.+)$/)?.[1]?.trim())
    .filter((item): item is string => !!item);
}

function parseBulletList(content: string): string[] {
  return content
    .split('\n')
    .map((line) => line.match(/^-\s+(.+)$/)?.[1]?.trim())
    .filter((item): item is string => !!item);
}

const PHASE_TO_CATEGORY: Record<string, string> = {
  '시험준비': 'SETUP',
  '시험수행': 'EXECUTION',
  '시험종료': 'COMPLETION',
};

function buildRequirementsFromMarkdown(): Requirement[] {
  // gray-matter는 devDependency로 설치 필요
  let matter: (content: string) => { data: Record<string, unknown>; content: string };
  try {
    matter = require('gray-matter');
  } catch {
    console.error('ERROR: gray-matter 패키지가 필요합니다. npm install -D gray-matter 실행 후 재시도하세요.');
    process.exit(1);
  }

  const rootDir = path.resolve(__dirname, '..');
  const processDir = path.join(rootDir, 'content', 'process');
  const files = readContentFiles(processDir);

  const items: { frontmatter: Record<string, unknown>; content: string }[] = [];
  for (const file of files) {
    const { data, content } = matter(file.content);
    if (!data.id) continue;
    items.push({ frontmatter: data, content });
  }

  const phaseOrder = ['시험준비', '시험수행', '시험종료'];
  items.sort((a, b) => {
    const aIdx = phaseOrder.indexOf(a.frontmatter.phase as string);
    const bIdx = phaseOrder.indexOf(b.frontmatter.phase as string);
    if (aIdx !== bIdx) return aIdx - bIdx;
    return ((a.frontmatter.order as number) ?? 0) - ((b.frontmatter.order as number) ?? 0);
  });

  return items.map((item) => {
    const sections = extractSections(item.content);
    const phase = item.frontmatter.phase as string;
    const category = PHASE_TO_CATEGORY[phase] ?? 'SETUP';
    const findSection = (heading: string) => sections.find((s) => s.heading === heading);

    const rawCpEvidences = item.frontmatter.checkpointEvidences as Record<string | number, number[]> | undefined;
    const checkpointEvidences: Record<number, number[]> | undefined = rawCpEvidences
      ? Object.fromEntries(Object.entries(rawCpEvidences).map(([k, v]) => [Number(k), v]))
      : undefined;

    return {
      id: item.frontmatter.id as string,
      category,
      title: item.frontmatter.title as string,
      description: findSection('설명')?.content ?? '',
      checkPoints: parseCheckboxList(findSection('체크포인트')?.content ?? ''),
      evidenceExamples: parseBulletList(findSection('증빙 예시')?.content ?? ''),
      passCriteria: findSection('합격 기준')?.content?.trim() ?? '',
      ...(checkpointEvidences && { checkpointEvidences }),
    };
  });
}

// ─── 스냅샷 생성 (snapshotUtils.ts 로직 인라인) ──────────────────────────────

function requirementToSnapshot(req: Requirement, override?: ContentOverride): ContentSnapshot {
  const baseCheckpoints = req.checkPoints ?? [];
  const cpCount = baseCheckpoints.length;

  let checkpoints = [...baseCheckpoints];
  if (override?.checkpoints) {
    checkpoints = checkpoints.map((cp, i) =>
      override.checkpoints![i] != null ? override.checkpoints![i] : cp,
    );
  }

  const checkpointImportances: Record<number, QuestionImportance> = {};
  for (let i = 0; i < cpCount; i++) {
    checkpointImportances[i] =
      override?.checkpointImportances?.[i] ??
      req.checkpointImportances?.[i] ??
      'MUST';
  }

  const checkpointDetails: Record<number, string> = {};
  for (let i = 0; i < cpCount; i++) {
    const detail = override?.checkpointDetails?.[i] ?? req.checkpointDetails?.[i];
    if (detail) checkpointDetails[i] = detail;
  }

  const checkpointEvidences: Record<number, number[]> = {};
  const evSource = override?.checkpointEvidences ?? req.checkpointEvidences ?? {};
  for (const [k, v] of Object.entries(evSource)) {
    if (v.length > 0) checkpointEvidences[Number(k)] = [...v];
  }

  const defaultOrder = Array.from({ length: cpCount }, (_, i) => i);
  const checkpointOrder = override?.checkpointOrder ?? defaultOrder;

  return {
    title: override?.title ?? req.title,
    description: override?.description ?? req.description,
    checkpoints,
    checkpointImportances,
    checkpointDetails,
    checkpointEvidences,
    checkpointOrder,
    evidenceExamples: override?.evidenceExamples ?? req.evidenceExamples ?? [],
    testSuggestions: override?.testSuggestions ?? req.testSuggestions ?? [],
    passCriteria: override?.passCriteria ?? req.passCriteria ?? '',
    branchingRules: override?.branchingRules ?? req.branchingRules ?? [],
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { dryRun, validate, buildRequirements, projectId } = parseArgs();

  // Firebase 초기화
  if (!admin.apps.length) {
    admin.initializeApp({
      ...(projectId ? { projectId } : {}),
    });
  }
  const db = admin.firestore();

  // ── Validate 모드 ──────────────────────────────────────────────────────────
  if (validate) {
    console.log('=== 마이그레이션 검증 모드 ===\n');

    const versionsSnap = await db.collection('contentVersions').get();
    if (versionsSnap.empty) {
      console.log('❌ contentVersions 컬렉션이 비어있습니다. 마이그레이션이 필요합니다.');
      process.exit(1);
    }

    let totalDocs = 0;
    let totalVersions = 0;
    let errors = 0;

    for (const doc of versionsSnap.docs) {
      totalDocs++;
      const data = doc.data();
      const reqId = doc.id;

      // 루트 문서 필수 필드 확인
      if (data.currentVersion == null) {
        console.log(`  ❌ ${reqId}: currentVersion 없음`);
        errors++;
        continue;
      }
      if (!data.content || !data.content.title) {
        console.log(`  ❌ ${reqId}: content 스냅샷 누락/불완전`);
        errors++;
        continue;
      }

      // 서브컬렉션 확인
      const subSnap = await db.collection('contentVersions').doc(reqId).collection('versions').get();
      const versionCount = subSnap.size;
      totalVersions += versionCount;

      if (versionCount === 0) {
        console.log(`  ❌ ${reqId}: versions 서브컬렉션 비어있음`);
        errors++;
        continue;
      }

      // 버전 번호 연속성 확인
      const versionNums = subSnap.docs.map((d) => d.data().version as number).sort((a, b) => a - b);
      const expected = Array.from({ length: versionCount }, (_, i) => i);
      const isSequential = JSON.stringify(versionNums) === JSON.stringify(expected);

      if (!isSequential) {
        console.log(`  ⚠️  ${reqId}: 버전 번호 비연속 (found: ${versionNums.join(', ')})`);
      }

      // v0 존재 확인
      const v0 = subSnap.docs.find((d) => d.data().version === 0);
      if (!v0) {
        console.log(`  ❌ ${reqId}: v0 (원본) 없음`);
        errors++;
        continue;
      }

      console.log(`  ✅ ${reqId}: currentVersion=${data.currentVersion}, versions=${versionCount}`);
    }

    console.log(`\n=== 검증 결과 ===`);
    console.log(`총 문서: ${totalDocs}, 총 버전: ${totalVersions}, 오류: ${errors}`);
    if (errors === 0) {
      console.log('✅ 모든 검증 통과');
    } else {
      console.log('❌ 오류가 발견되었습니다.');
      process.exit(1);
    }
    return;
  }

  // ── Requirements 로딩 ──────────────────────────────────────────────────────
  let requirements: Requirement[];

  if (buildRequirements) {
    console.log('마크다운 파일에서 requirements 빌드 중...');
    requirements = buildRequirementsFromMarkdown();
    console.log(`  → ${requirements.length}개 requirement 로드 완료`);
  } else {
    const jsonPath = path.resolve(__dirname, 'requirements.json');
    if (!fs.existsSync(jsonPath)) {
      console.error(`ERROR: ${jsonPath} 파일이 없습니다.`);
      console.error('브라우저 콘솔에서 REQUIREMENTS_DB를 JSON으로 내보내거나,');
      console.error('--build-requirements 플래그를 사용하세요.');
      process.exit(1);
    }
    requirements = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    console.log(`requirements.json 로드 완료: ${requirements.length}개`);
  }

  // ── contentOverrides 로딩 ──────────────────────────────────────────────────
  console.log('contentOverrides 컬렉션 읽기...');
  const overridesSnap = await db.collection('contentOverrides').get();
  const overrides: Record<string, ContentOverride> = {};
  overridesSnap.forEach((doc) => {
    overrides[doc.id] = doc.data() as ContentOverride;
  });
  console.log(`  → ${Object.keys(overrides).length}개 오버라이드 로드 완료`);

  // ── 마이그레이션 계획 ──────────────────────────────────────────────────────
  console.log(`\n=== 마이그레이션 계획 ===`);
  const plan: {
    reqId: string;
    hasOverride: boolean;
    v0Snapshot: ContentSnapshot;
    v1Snapshot?: ContentSnapshot;
    overrideUpdatedBy?: string;
  }[] = [];

  for (const req of requirements) {
    const ov = overrides[req.id];
    const v0 = requirementToSnapshot(req);
    const entry: typeof plan[number] = {
      reqId: req.id,
      hasOverride: !!ov,
      v0Snapshot: v0,
    };

    if (ov) {
      entry.v1Snapshot = requirementToSnapshot(req, ov);
      entry.overrideUpdatedBy = ov.updatedBy ?? 'system';
    }

    plan.push(entry);
    const status = ov ? '📝 v0 + v1 (오버라이드 있음)' : '📄 v0만 (원본)';
    console.log(`  ${req.id}: ${status}`);
  }

  console.log(`\n총 ${plan.length}개 requirement 처리 예정`);
  console.log(`  - v0만: ${plan.filter((p) => !p.hasOverride).length}개`);
  console.log(`  - v0 + v1: ${plan.filter((p) => p.hasOverride).length}개`);

  if (dryRun) {
    console.log('\n🏃 --dry-run 모드: 실제 쓰기를 수행하지 않습니다.');
    return;
  }

  // ── Batch Write ────────────────────────────────────────────────────────────
  console.log('\n=== Firestore 쓰기 시작 ===');
  const now = admin.firestore.FieldValue.serverTimestamp();

  // Firestore batch는 최대 500 operations. 13 requirements × (1 root + 1~2 versions) = 최대 39 operations
  const batch = db.batch();
  let opCount = 0;

  for (const entry of plan) {
    const rootRef = db.collection('contentVersions').doc(entry.reqId);
    const currentVersion = entry.hasOverride ? 1 : 0;
    const currentSnapshot = entry.v1Snapshot ?? entry.v0Snapshot;

    // 루트 문서
    batch.set(rootRef, {
      currentVersion,
      content: currentSnapshot,
      updatedAt: now,
      updatedBy: entry.overrideUpdatedBy ?? 'migration',
    });
    opCount++;

    // v0 (원본)
    const v0Ref = rootRef.collection('versions').doc('0');
    batch.set(v0Ref, {
      version: 0,
      content: entry.v0Snapshot,
      editor: 'system',
      editorId: 'migration',
      editedAt: now,
      note: '마크다운 원본 (마이그레이션)',
      action: 'create',
    });
    opCount++;

    // v1 (오버라이드 적용)
    if (entry.hasOverride && entry.v1Snapshot) {
      const v1Ref = rootRef.collection('versions').doc('1');
      batch.set(v1Ref, {
        version: 1,
        content: entry.v1Snapshot,
        editor: entry.overrideUpdatedBy ?? 'unknown',
        editorId: entry.overrideUpdatedBy ?? 'migration',
        editedAt: now,
        note: '기존 contentOverride에서 마이그레이션',
        action: 'edit',
      });
      opCount++;
    }
  }

  console.log(`  Batch operations: ${opCount}건`);
  await batch.commit();
  console.log('  ✅ Batch commit 완료\n');

  // ── 결과 확인 ──────────────────────────────────────────────────────────────
  console.log('=== 마이그레이션 완료 ===');
  console.log(`  contentVersions: ${plan.length}개 문서 생성`);
  console.log(`  contentOverrides: 삭제하지 않음 (안전망으로 유지)`);
  console.log('\n검증하려면: npx ts-node scripts/migrate-content-to-versions.ts --validate');
}

main().catch((err) => {
  console.error('마이그레이션 실패:', err);
  process.exit(1);
});
