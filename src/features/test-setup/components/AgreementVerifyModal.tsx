import { useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import type { AgreementParsed } from '../../../types';

type AgreementVerifyModalProps = {
  open: boolean;
  onClose: () => void;
  parsed: AgreementParsed;
  onSave: (corrected: Record<string, string>) => Promise<void>;
};

const FIELD_GROUPS = [
  {
    label: '기본 정보',
    fields: [
      { key: 'applicationNumber', label: '신청번호' },
      { key: 'contractType', label: '계약유형' },
      { key: 'certificationType', label: '인증유형' },
    ],
  },
  {
    label: '제품/업체',
    fields: [
      { key: 'productNameKo', label: '제품명 (국문)' },
      { key: 'companyName', label: '업체명' },
    ],
  },
  {
    label: '업무 담당자',
    fields: [
      { key: 'managerName', label: '담당자 성명' },
      { key: 'managerMobile', label: '담당자 연락처' },
      { key: 'managerEmail', label: '담당자 이메일' },
      { key: 'managerDepartment', label: '담당자 부서' },
      { key: 'managerJobTitle', label: '담당자 직급' },
    ],
  },
  {
    label: '시험 정보',
    fields: [
      { key: 'testTarget', label: '시험대상' },
      { key: 'workingDays', label: '시험 소요기간 (일)' },
    ],
  },
  {
    label: '시험환경',
    fields: [
      { key: 'hasServer', label: '서버 유무' },
      { key: 'requiredEquipmentCount', label: '필요 장비 수' },
      { key: 'operatingSystem', label: '운영체제' },
      { key: 'hardwareSpec', label: '하드웨어 사양' },
      { key: 'networkEnvironment', label: '네트워크 환경' },
      { key: 'otherEnvironment', label: '기타 환경' },
      { key: 'equipmentPreparation', label: '장비 준비' },
    ],
  },
];

const ALL_FIELD_KEYS = FIELD_GROUPS.flatMap((g) => g.fields.map((f) => f.key));

function ConfidenceBadge({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-surface-sunken px-2 py-0.5 text-[10px] font-semibold text-tx-tertiary">
        <AlertCircle size={10} />
        미추출
      </span>
    );
  }
  const color =
    value >= 80
      ? 'bg-status-pass-bg text-status-pass-text'
      : 'bg-amber-100 text-amber-700';
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${color}`}>
      <CheckCircle2 size={10} />
      {value}%
    </span>
  );
}

export function AgreementVerifyModal({ open, onClose, parsed, onSave }: AgreementVerifyModalProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const key of ALL_FIELD_KEYS) {
      initial[key] = (parsed as Record<string, unknown>)[key] as string || '';
    }
    return initial;
  });
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const confidence = parsed.fieldConfidence || {};
  const extractionRate = parsed.extractionRate ?? 0;
  const extractedCount = ALL_FIELD_KEYS.filter((k) => (confidence[k] ?? 0) > 0).length;
  const totalCount = ALL_FIELD_KEYS.length;

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(values);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const hasUnextracted = ALL_FIELD_KEYS.some((k) => (confidence[k] ?? 0) === 0);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--overlay-backdrop)] p-6">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-ln bg-surface-base shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ln px-5 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="text-sm font-extrabold text-tx-primary">합의서 추출 결과</div>
            <span className="rounded-full bg-accent-subtle px-2.5 py-0.5 text-[11px] font-bold text-accent-text">
              추출률 {extractionRate}% ({extractedCount}/{totalCount})
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-ln px-2 py-1 text-xs font-semibold text-tx-tertiary hover:text-tx-secondary"
          >
            닫기
          </button>
        </div>

        {/* Body - scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {FIELD_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="text-xs font-bold text-tx-tertiary uppercase tracking-wider mb-2">
                {group.label}
              </div>
              <div className="space-y-2">
                {group.fields.map((field) => {
                  const conf = confidence[field.key] ?? 0;
                  const isUnextracted = conf === 0;
                  return (
                    <div key={field.key} className="flex items-center gap-3">
                      <label className="w-32 shrink-0 text-xs font-semibold text-tx-secondary text-right">
                        {field.label}
                      </label>
                      <input
                        type="text"
                        value={values[field.key] || ''}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        className={`flex-1 rounded-lg border px-3 py-1.5 text-sm ${
                          isUnextracted
                            ? 'border-dashed border-amber-300 bg-amber-50/30 text-tx-secondary placeholder:text-amber-400'
                            : 'border-ln bg-surface-base text-tx-primary'
                        }`}
                        placeholder={isUnextracted ? '직접 입력' : ''}
                      />
                      <div className="w-16 shrink-0">
                        <ConfidenceBadge value={conf} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {hasUnextracted && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
              <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
              <span className="text-xs text-amber-700">미추출 필드가 있습니다. 직접 입력해주세요.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-ln px-5 py-3 flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-ln px-4 py-2 text-xs font-semibold text-tx-secondary hover:bg-interactive-hover"
          >
            건너뛰기
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {saving ? '저장 중...' : '확인 및 적용'}
          </button>
        </div>
      </div>
    </div>
  );
}
