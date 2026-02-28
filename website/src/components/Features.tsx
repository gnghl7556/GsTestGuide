import { useReveal } from '../hooks/useReveal';

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: '체크리스트 기반 점검',
    description: '13개 점검항목을 순차적으로 진행하며, 각 단계별 체크포인트를 하나씩 확인합니다. 이전 항목을 완료해야 다음으로 진행되는 게이트 로직이 내장되어 있습니다.',
    accent: 'from-blue-500 to-cyan-400',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: '실시간 진행률 추적',
    description: '전체 점검 완료율을 실시간으로 표시합니다. 사이드바에서 각 항목의 상태(미완료/적합/부적합/보류)를 미니 도트로 한눈에 파악할 수 있습니다.',
    accent: 'from-purple-500 to-pink-400',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    title: '결함 분류 가이드',
    description: '품질특성별 결함 유형과 등급(치명적/주요/보통/경미) 기준이 내장되어 있어, 결함 발견 시 즉시 참조하여 정확하게 분류할 수 있습니다.',
    accent: 'from-amber-500 to-orange-400',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    title: '담당자 즉시 연동',
    description: '각 점검 단계별 담당자(자리배정, 장비, PL 등)의 연락처와 요청 방법이 카드 형태로 표시됩니다. 관리자 페이지에서 실시간 업데이트됩니다.',
    accent: 'from-emerald-500 to-teal-400',
  },
];

export function Features() {
  const sectionRef = useReveal<HTMLElement>();

  return (
    <section ref={sectionRef} className="reveal relative py-32 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-blue-400 mb-4">
            Core Features
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight">
            시험 수행에 필요한
            <br />
            <span className="gradient-text">모든 기능을 하나에</span>
          </h2>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {FEATURES.map((feature, i) => (
            <div
              key={feature.title}
              className={`reveal reveal-delay-${i + 1} group relative rounded-2xl glass glass-hover p-8 transition-all duration-500 hover:scale-[1.02]`}
            >
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.accent} text-white mb-5`}>
                {feature.icon}
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-400">
                {feature.description}
              </p>

              {/* Hover glow */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.accent} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
