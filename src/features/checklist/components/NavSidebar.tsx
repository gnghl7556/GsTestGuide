import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Clock, Circle, ChevronDown, ChevronRight, ChevronsDown, ChevronsUp, Check, X, BookOpen } from 'lucide-react';

import type { ChecklistItem, ExecutionItemGate, QuickModeItem, QuickReviewAnswer, ReviewData } from '../../../types';
import { CATEGORIES, CATEGORY_THEMES } from 'virtual:content/categories';
import { ReferenceGuideModal } from './ReferenceGuideModal';


interface NavSidebarProps {
  checklist: ChecklistItem[];
  reviewData: Record<string, ReviewData>;
  quickReviewById: Record<string, QuickReviewAnswer>;
  quickModeById: Record<string, QuickModeItem>;
  selectedReqId: string | null;
  setSelectedReqId: (id: string) => void;
  activeCategory: string;
  itemGates: Record<string, ExecutionItemGate>;
}

export function NavSidebar({
  checklist,
  reviewData,
  quickReviewById,
  quickModeById,
  selectedReqId,
  setSelectedReqId,
  activeCategory,
  itemGates
}: NavSidebarProps) {
  const [expandedCats, setExpandedCats] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'HOLD' | 'FAIL'>('ALL');
  const [evidenceOnly, setEvidenceOnly] = useState(false);
  const [showRefGuide, setShowRefGuide] = useState(false);
  const shortLabelMap: Record<string, string> = {
    '담당 PL 및 시험 배정 안내 메일을 확인했는가?': '시험 배정 안내',
    '시험 합의서, 제품 설명서, 사용자 매뉴얼 및 시험 공유 폴더를 확인했는가?': '시험 자료 확인'
  };
  const toShortLabel = (text: string) => {
    const mapped = shortLabelMap[text];
    if (mapped) return mapped;
    const cleaned = text.replace(/[?.,]/g, '').trim();
    return cleaned.length > 14 ? `${cleaned.slice(0, 14)}…` : cleaned;
  };

  const applicableItems = checklist.filter(item => item.status !== 'Not_Applicable');
  const completedItems = applicableItems.filter(item => {
    const status = reviewData[item.id]?.status;
    return status === 'Verified' || status === 'Cannot_Verify';
  });
  const completionRate = applicableItems.length === 0
    ? 0
    : Math.round((completedItems.length / applicableItems.length) * 100);

  useEffect(() => {
    if (selectedReqId) {
      const item = checklist.find(i => i.id === selectedReqId);
      if (item && !expandedCats.includes(item.category)) {
        setExpandedCats(prev =>
          prev.includes(item.category) ? prev : [item.category]
        );
      }
    }
  }, [selectedReqId, checklist]);

  const toggleCategory = (catId: string) => {
    setExpandedCats(prev =>
      prev.includes(catId)
        ? prev.filter(id => id !== catId)
        : [...prev, catId]
    );
  };

  // getStatusIcon removed (unused)

  return (
    <nav className="h-full bg-surface-base rounded-xl border border-ln flex flex-col overflow-hidden shadow-sm">
      <div className="p-4 border-b border-ln-subtle bg-surface-base flex justify-between items-center">
        <div>
          <h2 className="text-sm font-extrabold text-tx-primary tracking-wider flex items-center gap-2">
            점검 항목 목록
            <span className="text-[10px] text-tx-muted font-medium tracking-normal inline-flex items-center gap-2">
              <span>{completedItems.length}/{applicableItems.length}</span>
              <span className="h-1.5 w-14 bg-surface-sunken rounded-full overflow-hidden">
                <span className="block h-full bg-accent" style={{ width: `${completionRate}%` }} />
              </span>
            </span>
          </h2>
        </div>
        <button
          onClick={() => setExpandedCats(expandedCats.length > 0 ? [] : CATEGORIES.map(c => c.id))}
          aria-label={expandedCats.length > 0 ? '모두 접기' : '모두 펼치기'}
          title={expandedCats.length > 0 ? '모두 접기' : '모두 펼치기'}
          className="h-7 w-7 rounded-md border border-ln bg-surface-base text-tx-muted hover:text-tx-secondary hover:border-ln-strong transition-colors inline-flex items-center justify-center"
        >
          {expandedCats.length > 0 ? <ChevronsUp size={14} /> : <ChevronsDown size={14} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        <div className="px-1 pb-1 flex items-center gap-1 text-[10px] font-semibold text-tx-tertiary">
          {(['ALL', 'PENDING', 'HOLD', 'FAIL'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`px-2 py-1 rounded-md border ${
                statusFilter === key
                  ? 'bg-surface-sunken border-ln-strong text-tx-secondary'
                  : 'border-ln hover:border-ln-strong'
              }`}
            >
              {key === 'ALL' && '전체'}
              {key === 'PENDING' && '미완료'}
              {key === 'HOLD' && '보류'}
              {key === 'FAIL' && '불가'}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setEvidenceOnly(!evidenceOnly)}
            className={`px-2 py-1 rounded-md border ${
              evidenceOnly
                ? 'bg-surface-sunken border-ln-strong text-tx-secondary'
                : 'border-ln hover:border-ln-strong'
            }`}
          >
            증빙 미매핑
          </button>
        </div>
        {CATEGORIES.map((cat) => {
          const catItemsAll = checklist.filter(item => item.category === cat.id);
          const catItems = catItemsAll.filter((item) => {
            const status = reviewData[item.id]?.status ?? 'None';
            if (statusFilter === 'PENDING' && status !== 'None') return false;
            if (statusFilter === 'HOLD' && status !== 'Hold') return false;
            if (statusFilter === 'FAIL' && status !== 'Cannot_Verify') return false;
            if (evidenceOnly) {
              const docName = reviewData[item.id]?.docName || '';
              const page = reviewData[item.id]?.page || '';
              if (docName.trim() || page.trim()) return false;
            }
            return true;
          });
          if (catItems.length === 0) return null;

          const theme = CATEGORY_THEMES[cat.id];
          const isExpanded = expandedCats.includes(cat.id);
          const hasActiveItem = catItems.some(item => item.id === selectedReqId);
          const isActiveCategory = activeCategory === cat.id;
          return (
            <div key={cat.id} className="select-none">
              {/* 카테고리 헤더: 숫자 표시 제거됨 */}
              <button
                onClick={() => toggleCategory(cat.id)}
                className={`w-full pl-2 pr-3 py-2 mb-0.5 text-sm font-bold rounded-lg flex items-center gap-2 transition-colors relative ${
                  isExpanded
                    ? `${theme.lightBg} ${theme.text}`
                    : `bg-surface-base hover:bg-surface-raised ${theme.text} ${hasActiveItem ? `${theme.lightBg}` : ''}`
                } ${isActiveCategory ? `${theme.bg} ${theme.text} ring-1 ring-inset ${theme.ring}` : ''}`}
              >
                {!isExpanded && hasActiveItem && (
                  <span
                    className={`absolute inset-0 ${theme.lightBg} pointer-events-none z-0`}
                    aria-hidden="true"
                  />
                )}
                <span className="relative z-10 flex items-center gap-2 w-full">
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span className="flex-1 flex items-center justify-between gap-2">
                    <span className="block">{cat.name}</span>
                    <span className="inline-flex items-center gap-1.5">
                      {catItems.map((item) => {
                        const status = reviewData[item.id]?.status ?? 'None';
                        if (item.status === 'Not_Applicable') {
                          return (
                            <span key={item.id} className="h-3 w-3 rounded-full bg-surface-sunken" aria-hidden="true" />
                          );
                        }
                        if (status === 'Verified') {
                          return (
                            <span key={item.id} className="h-3 w-3 rounded-full bg-green-500 text-white inline-flex items-center justify-center" aria-label="적합">
                              <Check size={8} />
                            </span>
                          );
                        }
                        if (status === 'Cannot_Verify') {
                          return (
                            <span key={item.id} className="h-3 w-3 rounded-full bg-red-500 text-white inline-flex items-center justify-center" aria-label="불가">
                              <X size={8} />
                            </span>
                          );
                        }
                        if (status === 'Hold') {
                          return (
                            <span key={item.id} className="h-3 w-3 rounded-full bg-yellow-400 text-white inline-flex items-center justify-center" aria-label="보류">
                              <span className="text-[10px] font-bold leading-none">–</span>
                            </span>
                          );
                        }
                        return (
                          <span key={item.id} className="h-3 w-3 rounded-full bg-surface-sunken" aria-hidden="true" />
                        );
                      })}
                    </span>
                  </span>
                </span>
              </button>

              {isExpanded && (
                <ul className="space-y-0.5 pl-2 ml-1 my-1 animate-in slide-in-from-top-1 duration-200">
                  {catItems.map((item, index) => {
                    const isActive = selectedReqId === item.id;
                    const isNA = item.status === 'Not_Applicable';
                    const gate = itemGates[item.id];
                    const isBlocked = gate?.state && gate.state !== 'enabled';
                    const status = reviewData[item.id]?.status ?? 'None';
                    const statusIcon =
                      status === 'Verified' ? (
                        <CheckCircle2 size={12} className="text-emerald-600" />
                      ) : status === 'Cannot_Verify' ? (
                        <AlertCircle size={12} className="text-red-500" />
                      ) : status === 'Hold' ? (
                        <Clock size={12} className="text-yellow-600" />
                      ) : (
                        <Circle size={10} className="text-tx-muted" />
                      );

                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => {
                            if (isBlocked) return;
                            setSelectedReqId(item.id);
                          }}
                          disabled={isBlocked}
                          title={isBlocked ? gate?.reason : undefined}
                          className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all duration-150 flex items-start justify-between gap-2
                            ${isActive
                              ? `${theme.lightBg} ${theme.text} font-bold border-l-[3px] ${theme.activeBorder} border border-r-transparent border-y-transparent shadow-sm`
                              : `${theme.idleBg} border ${theme.idleBorder} ${theme.idleText} ${theme.idleHoverBg} ${theme.idleHoverBorder}`
                            }
                            ${isBlocked ? 'opacity-50 cursor-not-allowed' : ''}
                            ${isNA && !isActive ? 'opacity-40 line-through decoration-ln-strong' : ''}
                          `}
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            <span className="mt-0.5 shrink-0">{statusIcon}</span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`shrink-0 font-mono text-[10px] ${isActive ? theme.text : theme.idleText}`}>
                                  {String(index + 1).padStart(2, '0')}
                                </span>
                                <span className="block truncate flex-1">{toShortLabel(item.title)}</span>
                                {isBlocked && (
                                  <span className="shrink-0 rounded-full border border-ln bg-surface-sunken px-1.5 py-0.5 text-[9px] font-semibold text-tx-tertiary">
                                    잠금
                                  </span>
                                )}
                                {(() => {
                                  const questions = quickModeById[item.id]?.quickQuestions ?? [];
                                  if (questions.length === 0) return null;
                                  return (
                                    <span className="hidden lg:flex items-center gap-0.5 ml-auto">
                                      {questions.map((q) => {
                                        const answer = quickReviewById[item.id]?.answers?.[q.id];
                                        return (
                                          <span
                                            key={`${item.id}-mini-${q.id}`}
                                            title={q.text}
                                            className={`inline-block h-2 w-2 rounded-full ${
                                              answer === 'YES' ? 'bg-emerald-500'
                                              : answer === 'NO' ? 'bg-red-500'
                                              : answer === 'NA' ? 'bg-yellow-400'
                                              : 'bg-gray-300 dark:bg-white/15'
                                            }`}
                                          />
                                        );
                                      })}
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      <div className="p-3 border-t border-ln-subtle">
        <button
          type="button"
          onClick={() => setShowRefGuide(true)}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-ln bg-surface-base px-3 py-2 text-xs font-semibold text-tx-tertiary hover:bg-surface-raised hover:text-tx-primary transition-colors"
        >
          <BookOpen size={14} />
          참조 가이드
        </button>
      </div>
      <ReferenceGuideModal open={showRefGuide} onClose={() => setShowRefGuide(false)} />
    </nav>
  );
}
