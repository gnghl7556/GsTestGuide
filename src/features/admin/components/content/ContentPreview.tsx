import { useMemo } from 'react';
import type { EditingState } from './types';
import { joinRef } from './types';
import type { Requirement, RequirementCategory, QuickModeItem } from '../../../../types';
import { toQuickModeItem } from '../../../../utils/quickMode';
import { CATEGORY_THEMES } from 'virtual:content/categories';

type ContentPreviewProps = {
  editing: EditingState;
  category: RequirementCategory;
};

export function ContentPreview({ editing, category }: ContentPreviewProps) {
  const quickItem = useMemo<QuickModeItem>(() => {
    const checkPoints = Object.entries(editing.checkpoints)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([iStr, body]) => {
        const i = Number(iStr);
        const refs = editing.checkpointRefs[i] ?? [];
        return joinRef(body, refs);
      });

    const mockReq: Requirement = {
      id: editing.reqId,
      category,
      title: editing.title,
      description: editing.description,
      checkPoints,
      checkpointImportances: editing.checkpointImportances,
      checkpointDetails: editing.checkpointDetails,
      evidenceExamples: editing.evidenceExamples,
      testSuggestions: editing.testSuggestions,
      passCriteria: editing.passCriteria,
      branchingRules: editing.branchingRules,
    };

    return toQuickModeItem(mockReq);
  }, [editing, category]);

  const theme = CATEGORY_THEMES[category] ?? CATEGORY_THEMES['SETUP'];
  const questions = quickItem.quickQuestions;
  const branchingRules = quickItem.branchingRules;

  return (
    <div className="rounded-xl border border-ln bg-surface-base overflow-hidden">
      {/* Header */}
      <div className={`px-5 py-3.5 border-b border-ln-subtle ${theme.lightBg}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-bold tracking-wide uppercase ${theme.text}`}>
            {category === 'SETUP' ? '시험준비' : category === 'EXECUTION' ? '시험수행' : '시험종료'}
          </span>
          <span className="text-tx-muted text-xs">/</span>
          <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${theme.lightBg} ${theme.text}`}>
            #{editing.reqId}
          </span>
        </div>
        <h3 className="text-lg font-bold text-tx-primary leading-snug">{quickItem.title}</h3>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Description */}
        <p className="text-sm text-tx-secondary leading-relaxed">{quickItem.expertDetails.description}</p>

        {/* Questions */}
        {questions.length > 0 && (
          <div className="space-y-2.5">
            {questions.map((question, index) => {
              const detail = quickItem.expertDetails.checkpointDetails?.[index];
              return (
                <div
                  key={question.id}
                  className="rounded-xl px-4 py-3.5 bg-surface-sunken/40 scale-[0.97] origin-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full text-[11px] font-bold shrink-0 text-tx-tertiary">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          question.importance === 'MUST'
                            ? 'bg-[var(--status-fail-bg)] text-[var(--status-fail-text)]'
                            : 'bg-surface-sunken text-tx-muted'
                        }`}>
                          {question.importance === 'MUST' ? '필수' : '권고'}
                        </span>
                        {question.refs && question.refs.length > 0 && question.refs.map((refLabel, ri) => (
                          <span
                            key={`ref-${ri}`}
                            className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md border bg-surface-base border-ln text-tx-secondary"
                          >
                            {refLabel}
                          </span>
                        ))}
                      </div>
                      <span className="text-[14px] leading-snug font-semibold text-tx-primary">{question.text}</span>
                    </div>
                  </div>
                  {/* Inline detail */}
                  {detail && (
                    <div className="pt-2.5 pl-9">
                      <p className="text-xs text-tx-tertiary leading-relaxed">{detail}</p>
                    </div>
                  )}
                  {/* Branching visualization */}
                  {branchingRules && branchingRules.map((rule, ri) => {
                    if (rule.sourceIndex !== index) return null;
                    return (
                      <div key={`branch-${ri}`} className="mt-1.5 pl-9 flex items-center gap-1.5 text-[10px] text-tx-muted">
                        <span className="inline-block w-3 h-px bg-tx-muted/40" />
                        <span>아니오 → CP {rule.skipIndices.map(i => i + 1).join(', ')} 건너뜀</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* Evidence / Test Suggestions / Pass Criteria */}
        {(quickItem.expertDetails.evidenceExamples.length > 0 || quickItem.expertDetails.testSuggestions.length > 0 || quickItem.expertDetails.passCriteria) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-ln-subtle">
            {quickItem.expertDetails.evidenceExamples.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-tx-tertiary uppercase tracking-wider">증빙 예시</span>
                <ul className="mt-1 space-y-0.5">
                  {quickItem.expertDetails.evidenceExamples.map((ex, i) => (
                    <li key={i} className="text-[11px] text-tx-secondary">• {ex}</li>
                  ))}
                </ul>
              </div>
            )}
            {quickItem.expertDetails.testSuggestions.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-tx-tertiary uppercase tracking-wider">테스트 제안</span>
                <ul className="mt-1 space-y-0.5">
                  {quickItem.expertDetails.testSuggestions.map((s, i) => (
                    <li key={i} className="text-[11px] text-tx-secondary">• {s}</li>
                  ))}
                </ul>
              </div>
            )}
            {quickItem.expertDetails.passCriteria && (
              <div className="rounded-md border border-status-pass-border bg-status-pass-bg px-3 py-2">
                <span className="text-[10px] font-bold text-status-pass-text uppercase tracking-wider">판정 기준</span>
                <p className="mt-0.5 text-[11px] text-status-pass-text leading-relaxed">{quickItem.expertDetails.passCriteria}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
