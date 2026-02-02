import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Clock, Circle, ChevronDown, ChevronRight, ChevronsDown, ChevronsUp, Check, X } from 'lucide-react';

import type { ChecklistItem, QuickReviewAnswer, QuickQuestionId, ReviewData } from '../types';
import { CATEGORIES, CATEGORY_THEMES } from '../data/constants';


interface NavSidebarProps {
  checklist: ChecklistItem[];
  reviewData: Record<string, ReviewData>;
  quickReviewById: Record<string, QuickReviewAnswer>;
  selectedReqId: string | null;
  setSelectedReqId: (id: string) => void;
  activeCategory: string;
  onSelectQuestion: (itemId: string, questionId: QuickQuestionId) => void;
  onOpenFeatureManager: () => void;
  onOpenTestCaseManager: () => void;
}

export function NavSidebar({
  checklist,
  reviewData,
  quickReviewById,
  selectedReqId,
  setSelectedReqId,
  activeCategory,
  onSelectQuestion,
  onOpenFeatureManager,
  onOpenTestCaseManager
}: NavSidebarProps) {
  const [expandedCats, setExpandedCats] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'HOLD' | 'FAIL'>('ALL');
  const [evidenceOnly, setEvidenceOnly] = useState(false);
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
        setExpandedCats(prev => [...prev, item.category]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleCategory = (catId: string) => {
    setExpandedCats(prev => 
      prev.includes(catId) 
        ? prev.filter(id => id !== catId) 
        : [...prev, catId]
    );
  };

  // getStatusIcon removed (unused)

  return (
    <nav className="h-full bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden shadow-sm">
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
        <div>
          <h2 className="text-sm font-extrabold text-gray-800 tracking-wider flex items-center gap-2">
            점검 항목 목록
            <span className="text-[10px] text-gray-400 font-medium tracking-normal inline-flex items-center gap-2">
              <span>{completedItems.length}/{applicableItems.length}</span>
              <span className="h-1.5 w-14 bg-gray-100 rounded-full overflow-hidden">
                <span className="block h-full bg-blue-500" style={{ width: `${completionRate}%` }} />
              </span>
            </span>
          </h2>
        </div>
        <button
          onClick={() => setExpandedCats(expandedCats.length > 0 ? [] : CATEGORIES.map(c => c.id))}
          aria-label={expandedCats.length > 0 ? '모두 접기' : '모두 펼치기'}
          title={expandedCats.length > 0 ? '모두 접기' : '모두 펼치기'}
          className="h-7 w-7 rounded-md border border-gray-200 bg-white text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors inline-flex items-center justify-center"
        >
          {expandedCats.length > 0 ? <ChevronsUp size={14} /> : <ChevronsDown size={14} />}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        <div className="px-1 pb-1 flex items-center gap-1 text-[10px] font-semibold text-gray-500">
          {(['ALL', 'PENDING', 'HOLD', 'FAIL'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`px-2 py-1 rounded-md border ${
                statusFilter === key ? 'bg-gray-100 border-gray-300 text-gray-700' : 'border-gray-200 hover:border-gray-300'
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
              evidenceOnly ? 'bg-gray-100 border-gray-300 text-gray-700' : 'border-gray-200 hover:border-gray-300'
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
                    : `bg-white hover:bg-gray-50 ${theme.text} ${hasActiveItem ? `${theme.lightBg} bg-gradient-to-r from-white to-transparent` : ''}`
                } ${isActiveCategory ? `${theme.bg} ${theme.text} ring-1 ring-inset ${theme.ring}` : ''}`}
              >
                {!isExpanded && hasActiveItem && (
                  <span
                    className={`absolute inset-0 ${theme.lightBg} bg-gradient-to-r from-white/70 via-transparent to-transparent pointer-events-none z-0`}
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
                            <span key={item.id} className="h-3 w-3 rounded-full bg-gray-200" aria-hidden="true" />
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
                          <span key={item.id} className="h-3 w-3 rounded-full bg-gray-200" aria-hidden="true" />
                        );
                      })}
                    </span>
                  </span>
                </span>
              </button>
              
              {isExpanded && (
                <ul className="space-y-2 pl-2 ml-1 my-1 animate-in slide-in-from-top-1 duration-200">
                  {catItems.map((item, index) => {
                    const isActive = selectedReqId === item.id;
                    const isNA = item.status === 'Not_Applicable';
                    const status = reviewData[item.id]?.status ?? 'None';
                    const statusIcon =
                      status === 'Verified' ? (
                        <CheckCircle2 size={16} className="text-emerald-600" />
                      ) : status === 'Cannot_Verify' ? (
                        <AlertCircle size={16} className="text-red-500" />
                      ) : status === 'Hold' ? (
                        <Clock size={16} className="text-yellow-600" />
                      ) : (
                        <Circle size={14} className="text-gray-300" />
                      );
                    
                    const isFeatureList = item.id === 'DUR-PLAN-04';
                    const isTestCase = item.id === 'DUR-DESIGN-02';
                    return (
                      <li key={item.id}>
                        <div className="space-y-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedReqId(item.id)}
                            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-start justify-between gap-2 border shadow-sm
                              ${isActive 
                                ? `bg-white ${theme.text} font-bold ${theme.border} border-l-2 ${theme.activeBorder}` 
                                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                              }
                              ${isNA && !isActive ? 'opacity-50 line-through decoration-gray-300' : ''}
                            `}
                          >
                            <div className="flex items-start gap-2 min-w-0">
                              <span className="mt-0.5 shrink-0">{statusIcon}</span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`shrink-0 font-mono text-[10px] ${isActive ? theme.text : 'text-gray-400'}`}>
                                    {String(index + 1).padStart(2, '0')}
                                  </span>
                                  <span className="block truncate">{item.title}</span>
                                </div>
                              </div>
                            </div>
                          </button>
                          {isFeatureList && (
                            <div className="pl-7">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenFeatureManager();
                                }}
                                className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2 py-1 text-[10px] font-semibold text-gray-600 hover:text-gray-800"
                              >
                                기능 리스트 관리
                              </button>
                            </div>
                          )}
                          {isTestCase && (
                            <div className="pl-7">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenTestCaseManager();
                                }}
                                className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2 py-1 text-[10px] font-semibold text-gray-600 hover:text-gray-800"
                              >
                                TC 관리
                              </button>
                            </div>
                          )}
                          {isActive && item.checkPoints && item.checkPoints.length > 0 && (
                            <ul className={`pl-7 space-y-1 ${isNA ? 'opacity-60' : ''}`}>
                              {item.checkPoints.slice(0, 3).map((point, idx) => {
                                const qid = (`Q${idx + 1}` as QuickQuestionId);
                                const answer = quickReviewById[item.id]?.answers?.[qid];
                                const chipStyle =
                                  answer === 'YES'
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                    : answer === 'NO'
                                      ? 'border-red-200 bg-red-50 text-red-700'
                                      : answer === 'NA'
                                        ? 'border-gray-200 bg-gray-50 text-gray-500'
                                        : 'border-gray-200 bg-white text-gray-400';
                                const icon =
                                  answer === 'YES' ? (
                                    <Check size={10} className="text-emerald-600" />
                                  ) : answer === 'NO' ? (
                                    <X size={10} className="text-red-500" />
                                  ) : answer === 'NA' ? (
                                    <span className="text-[10px] font-bold leading-none text-gray-400">–</span>
                                  ) : (
                                    <span className="text-[10px] font-bold leading-none text-gray-300">·</span>
                                  );
                                return (
                                  <li key={`${item.id}-kw-${idx}`}>
                                    <button
                                      type="button"
                                      onClick={() => onSelectQuestion(item.id, qid)}
                                      disabled={isNA}
                                      title={point}
                                      className={`w-full text-left inline-flex items-center gap-2 rounded-md border px-2 py-1 text-[10px] transition-colors ${chipStyle} ${isNA ? 'cursor-not-allowed' : 'hover:border-gray-300'}`}
                                    >
                                      {icon}
                                      <span className="truncate">{toShortLabel(point)}</span>
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
