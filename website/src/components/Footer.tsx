export function Footer() {
  return (
    <footer className="relative py-16 px-6 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        {/* CTA banner */}
        <div className="relative rounded-3xl overflow-hidden mb-16">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-emerald-600/20" />
          <div className="absolute inset-0 glass" />
          <div className="relative px-8 py-12 sm:px-16 sm:py-16 text-center">
            <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">
              지금 바로 시작하세요
            </h3>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              GS 인증 시험을 보다 체계적이고 효율적으로 진행할 수 있습니다
            </p>
            <a
              href="https://tta-gs-test-guide.web.app"
              target="_blank"
              rel="noreferrer"
              aria-label="GS Test Guide 앱 바로가기"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-slate-900 font-bold text-sm hover:scale-105 transition-transform duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              앱 바로가기
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">GS Test Guide</span>
            <span>&middot;</span>
            <span>TTA GS 인증 시험 보조 도구</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/gnghl7556/GsTestGuide"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub 저장소 열기"
              className="hover:text-slate-400 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
            >
              GitHub
            </a>
            <span>&middot;</span>
            <span className="flex items-center gap-1">
              Built with
              <span className="text-slate-400 font-semibold">Claude Code</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
