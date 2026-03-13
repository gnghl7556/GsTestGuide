import { BaseModal } from '../../../../components/ui/BaseModal';

interface ParsingOverlayProps {
  visible: boolean;
  progress: number;
}

export function ParsingOverlay({ visible, progress }: ParsingOverlayProps) {
  return (
    <BaseModal open={visible} onClose={() => {}} size="md" closeOnEsc={false} closeOnBackdropClick={false}>
      <div className="px-5 py-6 text-center space-y-3">
        <div className="text-sm font-extrabold text-tx-primary">시험 합의서 분석 중</div>
        <div className="text-xs text-tx-secondary">
          분석이 완료될 때까지 다른 작업이 잠시 제한됩니다.
        </div>
        <div className="mt-2 space-y-3 text-left">
          <div className="text-[11px] text-tx-muted">추출 단계 진행</div>
          <div className="h-3 rounded-full bg-surface-sunken overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-[11px] text-tx-muted">
            {progress}% 완료
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-tx-tertiary">
            <span>1) 시험신청번호</span>
            <span>2) 계약/인증 유형</span>
            <span>3) 국문명/업체명</span>
            <span>4) 담당자/연락처</span>
          </div>
        </div>
        <div className="text-[11px] text-tx-muted">허용 가능한 최대 시간: 약 3분</div>
      </div>
    </BaseModal>
  );
}
