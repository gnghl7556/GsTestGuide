import { useReveal } from '../hooks/useReveal';

const PHASES = [
  {
    step: '01',
    title: '시험준비',
    color: 'text-blue-400',
    gradient: 'from-blue-500/20 to-blue-500/0',
    dotColor: 'bg-blue-500',
    items: [
      '시험 확인 (합의서·일정·환경)',
      '자리/장비 배정 및 확보',
      'OS·필수 SW 설치',
      '네트워크 환경 구성',
      '서버 계정·추가 환경 설정',
    ],
  },
  {
    step: '02',
    title: '시험수행',
    color: 'text-purple-400',
    gradient: 'from-purple-500/20 to-purple-500/0',
    dotColor: 'bg-purple-500',
    items: [
      '기능 리스트 작성',
      '패치 전 결함 탐색',
      '패치 전 결함 보고',
      '업체 제품 패치',
      '패치 후 결함 탐색',
      '패치 후 결함 보고',
    ],
  },
  {
    step: '03',
    title: '시험종료',
    color: 'text-emerald-400',
    gradient: 'from-emerald-500/20 to-emerald-500/0',
    dotColor: 'bg-emerald-500',
    items: [
      '최종 시험품(CD) 수령·검증',
      '최종 산출물 작성·점검',
    ],
  },
];

export function Workflow() {
  const sectionRef = useReveal<HTMLElement>();

  return (
    <section ref={sectionRef} className="reveal relative py-32 px-6">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/[0.02] to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">
        {/* Section header */}
        <div className="text-center mb-20">
          <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-purple-400 mb-4">
            Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight">
            <span className="gradient-text-warm">3단계</span>
            {' '}프로세스
          </h2>
          <p className="mt-4 text-slate-400 text-lg max-w-xl mx-auto">
            GS 인증 시험의 전체 흐름을 단계별로 안내합니다
          </p>
        </div>

        {/* Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
          {/* Horizontal connector (desktop) */}
          <div className="hidden lg:block absolute top-[72px] left-[16.67%] right-[16.67%] h-[2px] timeline-connector opacity-30" />

          {PHASES.map((phase, i) => (
            <div key={phase.step} className={`reveal reveal-delay-${i + 1} relative`}>
              {/* Step indicator */}
              <div className="flex flex-col items-center mb-8">
                <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${phase.gradient} border border-white/10 flex items-center justify-center mb-3`}>
                  <span className={`text-2xl font-black ${phase.color}`}>{phase.step}</span>
                  <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full ${phase.dotColor} ring-4 ring-[#0a0a0f]`} />
                </div>
                <h3 className="text-xl font-bold text-white">{phase.title}</h3>
              </div>

              {/* Items */}
              <div className="glass rounded-2xl p-6 space-y-3">
                {phase.items.map((item, j) => (
                  <div key={j} className="flex items-start gap-3 text-sm">
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${phase.dotColor} shrink-0`} />
                    <span className="text-slate-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
