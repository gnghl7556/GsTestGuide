import { UploadCloud } from 'lucide-react';

export const QUALITY_OPTIONS = [
  '기능적합성', '성능효율성', '호환성', '사용성',
  '신뢰성', '보안성', '유지보수성', '이식성', '일반적 요구사항'
] as const;

export const SEVERITY_OPTIONS = [
  { value: 'H' as const, label: 'H (High)' },
  { value: 'M' as const, label: 'M (Medium)' },
  { value: 'L' as const, label: 'L (Low)' }
];

export const FREQUENCY_OPTIONS = [
  { value: 'A' as const, label: 'A (Always)' },
  { value: 'I' as const, label: 'I (Intermittent)' }
];

type DefectFormValues = {
  summary: string;
  severity: 'H' | 'M' | 'L' | '';
  frequency: 'A' | 'I' | '';
  qualityCharacteristic: string;
  accessPath: string;
  testEnvironment: string;
  stepsToReproduce: string;
  description: string;
  ttaComment: string;
};

interface DefectFormFieldsProps {
  values: DefectFormValues;
  onChange: <K extends keyof DefectFormValues>(key: K, value: DefectFormValues[K]) => void;
  onFilesChange?: (files: File[]) => void;
  fileNames?: string[];
  disabled?: boolean;
  compact?: boolean;
}

const ButtonGroup = <T extends string>({
  options,
  value,
  onChange,
  activeClass = 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300',
  disabled
}: {
  options: { value: T; label: string }[];
  value: T | '';
  onChange: (v: T) => void;
  activeClass?: string;
  disabled?: boolean;
}) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        disabled={disabled}
        onClick={() => onChange(opt.value)}
        className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
          value === opt.value
            ? activeClass
            : 'border-ln text-tx-tertiary hover:border-ln-strong dark:border-ln dark:text-tx-muted'
        } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

export function DefectFormFields({
  values,
  onChange,
  onFilesChange,
  fileNames,
  disabled,
  compact
}: DefectFormFieldsProps) {
  const inputCls = 'w-full rounded-md border border-ln px-2.5 py-1.5 text-sm bg-input-bg text-input-text placeholder-input-placeholder focus:border-[var(--focus-ring)] outline-none transition-colors';
  const labelCls = compact
    ? 'block text-[11px] text-tx-tertiary mb-1'
    : 'block text-xs font-semibold text-tx-secondary mb-1.5';

  return (
    <div className={`grid grid-cols-1 ${compact ? 'md:grid-cols-2' : 'lg:grid-cols-2'} gap-3`}>
      {/* 요약 */}
      <div>
        <label className={labelCls}>요약 *</label>
        <input
          className={inputCls}
          value={values.summary}
          onChange={(e) => onChange('summary', e.target.value)}
          placeholder="예: 로그인 실패 시 오류 메시지 미표시"
          disabled={disabled}
        />
      </div>

      {/* 접근 경로 */}
      <div>
        <label className={labelCls}>기능 접근 경로</label>
        <input
          className={inputCls}
          value={values.accessPath}
          onChange={(e) => onChange('accessPath', e.target.value)}
          placeholder="예: 관리자 > 설정 > 계정"
          disabled={disabled}
        />
      </div>

      {/* 결함 정도 */}
      <div className="space-y-1.5">
        <label className={labelCls}>결함 정도 *</label>
        <ButtonGroup
          options={SEVERITY_OPTIONS}
          value={values.severity}
          onChange={(v) => onChange('severity', v)}
          activeClass="border-red-400 bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300"
          disabled={disabled}
        />
      </div>

      {/* 발생 빈도 */}
      <div className="space-y-1.5">
        <label className={labelCls}>발생 빈도</label>
        <ButtonGroup
          options={FREQUENCY_OPTIONS}
          value={values.frequency}
          onChange={(v) => onChange('frequency', v)}
          activeClass="border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
          disabled={disabled}
        />
      </div>

      {/* 품질 특성 */}
      <div className={`space-y-1.5 ${compact ? 'md:col-span-2' : 'lg:col-span-2'}`}>
        <label className={labelCls}>품질 특성 *</label>
        <div className="flex flex-wrap gap-2">
          {QUALITY_OPTIONS.map((q) => (
            <button
              key={q}
              type="button"
              disabled={disabled}
              onClick={() => onChange('qualityCharacteristic', q)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                values.qualityCharacteristic === q
                  ? 'border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                  : 'border-ln text-tx-tertiary hover:border-ln-strong dark:border-ln dark:text-tx-muted'
              } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* 재현 절차 */}
      <div className={compact ? 'md:col-span-2' : 'lg:col-span-2'}>
        <label className={labelCls}>재현 절차</label>
        <textarea
          className={`${inputCls} min-h-[60px] resize-none`}
          value={values.stepsToReproduce}
          onChange={(e) => onChange('stepsToReproduce', e.target.value)}
          placeholder="줄바꿈으로 절차 구분"
          disabled={disabled}
          rows={3}
        />
      </div>

      {/* 상세 설명 */}
      <div className={compact ? 'md:col-span-2' : 'lg:col-span-2'}>
        <label className={labelCls}>결함 상세 설명</label>
        <textarea
          className={`${inputCls} min-h-[80px] resize-none`}
          value={values.description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="관찰된 현상과 기대 동작을 구체적으로 작성"
          disabled={disabled}
          rows={3}
        />
      </div>

      {/* TTA 의견 */}
      <div className={compact ? 'md:col-span-2' : 'lg:col-span-2'}>
        <label className={labelCls}>TTA 의견</label>
        <textarea
          className={`${inputCls} min-h-[60px] resize-none`}
          value={values.ttaComment}
          onChange={(e) => onChange('ttaComment', e.target.value)}
          disabled={disabled}
          rows={2}
        />
      </div>

      {/* 증빙 자료 */}
      {onFilesChange && (
        <div className={compact ? 'md:col-span-2' : 'lg:col-span-2'}>
          <label className={labelCls}>증빙 자료</label>
          <label className="inline-flex items-center gap-2 rounded-md border border-ln bg-surface-base px-3 py-2 text-[11px] font-semibold text-tx-secondary hover:bg-interactive-hover cursor-pointer">
            <UploadCloud size={14} />
            파일 추가
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => onFilesChange(Array.from(e.target.files || []))}
              disabled={disabled}
            />
          </label>
          {fileNames && fileNames.length > 0 && (
            <div className="mt-1.5 text-[11px] text-tx-tertiary">
              {fileNames.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
