interface ParsingOverlayProps {
  visible: boolean;
  progress: number;
}

export function ParsingOverlay({ visible, progress }: ParsingOverlayProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-backdrop)] p-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f172a] shadow-xl text-white">
        <div className="px-5 py-6 text-center space-y-3">
          <div className="text-sm font-extrabold">시험 합의서 분석 중</div>
          <div className="text-xs text-white/70">
            분석이 완료될 때까지 다른 작업이 잠시 제한됩니다.
          </div>
          <div className="mt-2 space-y-3 text-left">
            <div className="text-[11px] text-white/50">추출 단계 진행</div>
            <div className="h-3 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-[11px] text-white/40">
              {progress}% 완료
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-white/50">
              <span>1) 시험신청번호</span>
              <span>2) 계약/인증 유형</span>
              <span>3) 국문명/업체명</span>
              <span>4) 담당자/연락처</span>
            </div>
          </div>
          <div className="text-[11px] text-white/50">허용 가능한 최대 시간: 약 3분</div>
        </div>
      </div>
    </div>
  );
}
