export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden dot-grid">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-blue-500/[0.07] blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-500/[0.05] blur-[100px] pointer-events-none" />

      {/* Badge */}
      <div className="relative z-10 mb-8 animate-fade-in">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-semibold text-slate-400 tracking-wide uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          GS 인증 시험 보조 도구
        </span>
      </div>

      {/* Main heading */}
      <h1 className="relative z-10 text-center max-w-4xl animate-slide-up">
        <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[1.05] tracking-tight">
          <span className="text-white">시험의 모든 순간을</span>
          <br />
          <span className="gradient-text">체계적으로</span>
        </span>
      </h1>

      {/* Subtitle */}
      <p className="relative z-10 mt-6 text-lg sm:text-xl text-slate-400 text-center max-w-2xl leading-relaxed animate-slide-up" style={{ animationDelay: '0.15s' }}>
        GS(Good Software) 인증 시험의 준비부터 종료까지,
        <br className="hidden sm:block" />
        13개 점검항목을 순차적으로 가이드합니다.
      </p>

      {/* CTA */}
      <div className="relative z-10 mt-10 flex items-center gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <a
          href="https://tta-gs-test-guide.web.app"
          target="_blank"
          rel="noreferrer"
          aria-label="GS Test Guide 앱 시작하기"
          className="group relative inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-slate-900 font-bold text-sm hover:scale-105 transition-transform duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <span>시작하기</span>
          <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </a>
        <a
          href="https://github.com/gnghl7556/GsTestGuide"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub 저장소 열기"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl glass glass-hover font-semibold text-sm text-slate-300 transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
          GitHub
        </a>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-float">
        <div className="w-6 h-10 rounded-full border-2 border-slate-600 flex items-start justify-center p-1.5">
          <div className="w-1 h-2.5 rounded-full bg-slate-500 animate-pulse" />
        </div>
      </div>
    </section>
  );
}
