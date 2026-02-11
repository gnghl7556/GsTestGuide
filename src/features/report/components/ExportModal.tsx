import { useState } from 'react';
import { X, Download } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { db, functions } from '../../../lib/firebase';

interface ExportModalProps {
  open: boolean;
  projectId: string;
  onClose: () => void;
}

const toFileName = (projectId: string, label: string) => `${projectId}_${label}.xlsx`;

const downloadWorkbook = (rows: Record<string, unknown>[], sheetName: string, fileName: string) => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const data = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, fileName);
};

export function ExportModal({ open, projectId, onClose }: ExportModalProps) {
  const [exportFeatures, setExportFeatures] = useState(true);
  const [exportTestCases, setExportTestCases] = useState(true);
  const [exportDefects, setExportDefects] = useState(true);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!db || !projectId) return;
    setExporting(true);
    try {
      if (exportFeatures) {
        const snap = await getDocs(collection(db, 'projects', projectId, 'features'));
        const rows = snap.docs.map((docSnap) => {
          const data = docSnap.data() as Record<string, unknown>;
          return {
            featureId: data.featureId || docSnap.id,
            category1: data.category1 || '',
            category2: data.category2 || '',
            category3: data.category3 || '',
            category4: data.category4 || '',
            description: data.description || '',
            version: data.version ?? 1,
            changeType: data.changeType || ''
          };
        });
        downloadWorkbook(rows, 'features', toFileName(projectId, 'features'));
      }

      if (exportTestCases) {
        const snap = await getDocs(collection(db, 'projects', projectId, 'testCases'));
        const rows = snap.docs.map((docSnap) => {
          const data = docSnap.data() as Record<string, unknown>;
          const steps = Array.isArray(data.steps) ? data.steps.join('\n') : '';
          return {
            testCaseId: data.testCaseId || docSnap.id,
            featureId: data.featureId || '',
            scenario: data.scenario || '',
            preCondition: data.preCondition || '',
            steps,
            expectedResult: data.expectedResult || '',
            status: data.status || '대기',
            version: data.version ?? 1
          };
        });
        downloadWorkbook(rows, 'testCases', toFileName(projectId, 'testCases'));
      }

      if (exportDefects) {
        if (!functions) {
          window.alert('Cloud Functions가 연결되지 않았습니다.');
        } else {
          const callable = httpsCallable(functions, 'exportDefectsXlsx');
          const result = (await callable({ projectId })) as { data: { fileBase64?: string; fileName?: string } };
          const base64 = result.data?.fileBase64;
          if (base64) {
            const binary = atob(base64);
            const len = binary.length;
            const buffer = new Uint8Array(len);
            for (let i = 0; i < len; i += 1) {
              buffer[i] = binary.charCodeAt(i);
            }
            const blob = new Blob([buffer], {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            saveAs(blob, result.data?.fileName || toFileName(projectId, 'defects'));
          }
        }
      }
    } catch (error) {
      console.warn('[Export] 실패:', error);
    } finally {
      setExporting(false);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-backdrop)] p-6">
      <div className="w-full max-w-lg rounded-2xl border border-ln bg-surface-base shadow-xl">
        <div className="flex items-center justify-between border-b border-ln px-5 py-4">
          <div className="text-sm font-extrabold text-tx-primary">산출물 내보내기</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-ln px-2 py-1 text-xs font-semibold text-tx-tertiary hover:text-tx-secondary"
          >
            <X size={14} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3 text-sm text-tx-secondary">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={exportFeatures} onChange={(e) => setExportFeatures(e.target.checked)} />
            기능 리스트 (features)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={exportTestCases} onChange={(e) => setExportTestCases(e.target.checked)} />
            테스트 케이스 (testCases)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={exportDefects} onChange={(e) => setExportDefects(e.target.checked)} />
            결함 보고서 (defects)
          </label>
        </div>
        <div className="border-t border-ln px-5 py-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-ln px-4 py-2 text-xs font-semibold text-tx-secondary hover:bg-interactive-hover"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-xs font-semibold text-white"
          >
            <Download size={14} />
            {exporting ? '내보내는 중...' : '내보내기'}
          </button>
        </div>
      </div>
    </div>
  );
}
