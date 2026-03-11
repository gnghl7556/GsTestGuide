import { useState, useMemo, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Project } from '../../types';
import {
  MILESTONES,
  MILESTONE_COLOR_MAP,
  CUSTOM_COLORS,
  buildInitialLists,
  type MilestoneItem,
  type MilestoneColor,
} from '../../constants/schedule';

type ScheduleWizardProps = {
  project: Project;
  onSave: (updates: Record<string, unknown>) => void;
  onClose: () => void;
};

const REGISTERED_ID = 'registered-zone';
const POOL_ID = 'pool-zone';

/* ── Grip icon ── */
const GripIcon = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor" className="shrink-0">
    <circle cx="4" cy="3" r="1.2" />
    <circle cx="10" cy="3" r="1.2" />
    <circle cx="4" cy="7" r="1.2" />
    <circle cx="10" cy="7" r="1.2" />
    <circle cx="4" cy="11" r="1.2" />
    <circle cx="10" cy="11" r="1.2" />
  </svg>
);

/* ── Compact sortable chip ── */
function SortableChip({
  item,
  onRemove,
}: {
  item: MilestoneItem;
  onRemove?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };
  const colors = MILESTONE_COLOR_MAP[item.color];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 ${colors.border} ${colors.bg}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab text-tx-muted hover:text-tx-secondary touch-none"
      >
        <GripIcon />
      </button>
      <span className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
      <span className={`flex-1 text-[11px] font-semibold ${colors.text} truncate`}>
        {item.label}
      </span>
      {item.type === 'required' && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-tx-muted shrink-0">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      )}
      {onRemove && item.type !== 'required' && (
        <button
          type="button"
          onClick={onRemove}
          className="text-tx-muted hover:text-red-500 transition-colors shrink-0"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}

/* ── Overlay chip (non-interactive) ── */
function OverlayChip({ item }: { item: MilestoneItem }) {
  const colors = MILESTONE_COLOR_MAP[item.color];
  return (
    <div className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 shadow-lg ${colors.border} ${colors.bg}`}>
      <GripIcon />
      <span className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
      <span className={`text-[11px] font-semibold ${colors.text}`}>{item.label}</span>
    </div>
  );
}

/* ── Droppable zone wrapper ── */
function DroppableZone({
  id,
  label,
  hint,
  isOver,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  isOver: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border-2 border-dashed p-3 transition-colors min-h-[60px] ${
        isOver ? 'border-accent/50 bg-accent/5' : 'border-ln bg-surface-raised/50'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] font-bold text-tx-secondary">{label}</span>
        {hint && <span className="text-[10px] text-tx-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

/* ── Step 2: Calendar ── */
function WizardCalendar({
  milestones,
  focusId,
  onSelectDate,
}: {
  milestones: MilestoneItem[];
  focusId: string | null;
  onSelectDate: (date: string) => void;
}) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const startDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const toDateStr = (d: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  const dateColorMap = useMemo(() => {
    const map = new Map<string, MilestoneColor[]>();
    for (const m of milestones) {
      if (!m.date) continue;
      const existing = map.get(m.date) ?? [];
      existing.push(m.color);
      map.set(m.date, existing);
    }
    return map;
  }, [milestones]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="rounded-lg border border-ln px-2.5 py-1 text-xs font-medium text-tx-tertiary hover:text-tx-primary hover:bg-surface-raised transition-colors"
        >
          ‹ 이전
        </button>
        <span className="text-sm font-bold text-tx-primary">
          {year}년 {month + 1}월
        </span>
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="rounded-lg border border-ln px-2.5 py-1 text-xs font-medium text-tx-tertiary hover:text-tx-primary hover:bg-surface-raised transition-colors"
        >
          다음 ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-[10px] font-semibold text-tx-muted mb-1.5">
        {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
          <div key={d} className="text-center py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: startDay }, (_, i) => (
          <div key={`blank-${i}`} className="h-10" />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateStr = toDateStr(day);
          const colors = dateColorMap.get(dateStr);
          const isToday = dateStr === todayStr;
          const isFocusDate = milestones.find((m) => m.id === focusId)?.date === dateStr;

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDate(dateStr)}
              className={`h-10 rounded-lg text-xs font-medium transition-all relative flex flex-col items-center justify-center gap-0.5
                ${isFocusDate ? 'bg-accent text-white ring-2 ring-accent/40' : ''}
                ${!isFocusDate && isToday ? 'bg-surface-raised text-accent font-bold ring-1 ring-accent/30' : ''}
                ${!isFocusDate && !isToday ? 'text-tx-secondary hover:bg-surface-raised' : ''}
              `}
            >
              <span>{day}</span>
              {colors && colors.length > 0 && (
                <div className="flex gap-0.5">
                  {colors.map((c, ci) => (
                    <span key={ci} className={`w-1.5 h-1.5 rounded-full ${MILESTONE_COLOR_MAP[c].dot}`} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Wizard ── */

export function ScheduleWizard({ project, onSave, onClose }: ScheduleWizardProps) {
  const [step, setStep] = useState<1 | 2>(1);

  const initial = useMemo(() => buildInitialLists(project), [project]);
  const [registered, setRegistered] = useState<MilestoneItem[]>(initial.registered);
  const [pool, setPool] = useState<MilestoneItem[]>(initial.pool);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const recentlyMovedRef = useRef(false);

  // Custom add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState<MilestoneColor>(CUSTOM_COLORS[0]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const allItems = useMemo(() => [...registered, ...pool], [registered, pool]);

  function findContainer(id: string | number): 'registered' | 'pool' | null {
    const sid = String(id);
    if (sid === REGISTERED_ID) return 'registered';
    if (sid === POOL_ID) return 'pool';
    if (registered.some((i) => i.id === sid)) return 'registered';
    if (pool.some((i) => i.id === sid)) return 'pool';
    return null;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);
    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    const item = allItems.find((i) => i.id === String(active.id));
    if (!item) return;

    // Required items can't leave registered
    if (item.type === 'required' && overContainer === 'pool') return;

    recentlyMovedRef.current = true;
    const overId = String(over.id);
    const isOverContainer = overId === REGISTERED_ID || overId === POOL_ID;

    if (activeContainer === 'pool' && overContainer === 'registered') {
      setPool((prev) => prev.filter((i) => i.id !== item.id));
      setRegistered((prev) => {
        if (isOverContainer) return [...prev, item];
        const idx = prev.findIndex((i) => i.id === overId);
        return [...prev.slice(0, idx + 1), item, ...prev.slice(idx + 1)];
      });
    } else if (activeContainer === 'registered' && overContainer === 'pool') {
      setRegistered((prev) => prev.filter((i) => i.id !== item.id));
      setPool((prev) => {
        if (isOverContainer) return [...prev, item];
        const idx = prev.findIndex((i) => i.id === overId);
        return [...prev.slice(0, idx + 1), item, ...prev.slice(idx + 1)];
      });
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);
    if (!activeContainer || !overContainer) return;

    // Cross-container handled in onDragOver
    if (activeContainer !== overContainer) return;
    if (active.id === over.id) return;

    const setList = activeContainer === 'registered' ? setRegistered : setPool;
    setList((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === String(active.id));
      const newIndex = prev.findIndex((i) => i.id === String(over.id));
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  // Move item between zones via button
  function moveToPool(id: string) {
    const item = registered.find((i) => i.id === id);
    if (!item || item.type === 'required') return;
    setRegistered((prev) => prev.filter((i) => i.id !== id));
    setPool((prev) => [...prev, item]);
  }

  function deleteCustom(id: string) {
    setPool((prev) => prev.filter((i) => i.id !== id));
    setRegistered((prev) => prev.filter((i) => i.id !== id));
  }

  // Add custom milestone to pool
  function handleAddCustom() {
    if (!newLabel.trim()) return;
    const id = `custom-${Date.now()}`;
    const usedColors = [...registered, ...pool].filter((i) => i.type !== 'required').map((i) => i.color);
    const availColor = CUSTOM_COLORS.find((c) => !usedColors.includes(c)) ?? newColor;
    const newItem: MilestoneItem = {
      id,
      label: newLabel.trim(),
      color: availColor,
      type: 'custom',
      date: '',
    };
    setPool((prev) => [...prev, newItem]);
    setNewLabel('');
    setNewColor(CUSTOM_COLORS[(CUSTOM_COLORS.indexOf(availColor) + 1) % CUSTOM_COLORS.length]);
    setShowAddForm(false);
  }

  // Step 2 logic
  function handleDateSelect(dateStr: string) {
    if (!focusId) return;
    setRegistered((prev) =>
      prev.map((i) => (i.id === focusId ? { ...i, date: dateStr } : i))
    );
    const currentIdx = registered.findIndex((i) => i.id === focusId);
    const nextUnfilled = registered.find((i, idx) => idx > currentIdx && !i.date);
    if (nextUnfilled) {
      setFocusId(nextUnfilled.id);
    } else {
      const anyUnfilled = registered.find((i) => !i.date && i.id !== focusId);
      if (anyUnfilled) setFocusId(anyUnfilled.id);
    }
  }

  function goToStep2() {
    setStep(2);
    const firstUnfilled = registered.find((i) => !i.date);
    setFocusId(firstUnfilled?.id ?? registered[0]?.id ?? null);
  }

  function handleSave() {
    const updates: Record<string, unknown> = {};
    for (const m of MILESTONES) {
      const item = registered.find((i) => i.id === m.key);
      updates[m.key] = item?.date || '';
    }
    const nonRequired = registered.filter((i) => i.type !== 'required');
    updates.customMilestones = nonRequired.map((i) => ({
      id: i.id,
      label: i.label,
      date: i.date,
      color: i.color,
    }));
    updates.milestoneOrder = registered.map((i) => i.id);
    onSave(updates);
  }

  const allRegisteredFilled = useMemo(
    () => registered.every((i) => !!i.date),
    [registered]
  );

  const activeItem = activeId ? allItems.find((i) => i.id === activeId) : null;

  const isOverRegistered = (() => {
    if (!activeId) return false;
    const item = allItems.find((i) => i.id === activeId);
    return item ? findContainer(activeId) !== 'registered' : false;
  })();

  const isOverPool = (() => {
    if (!activeId) return false;
    const item = allItems.find((i) => i.id === activeId);
    return item ? item.type !== 'required' && findContainer(activeId) !== 'pool' : false;
  })();

  return (
    <div className="flex flex-col h-full">
      {/* Step indicator */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-ln">
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
              step === 1 ? 'bg-accent text-white' : 'bg-accent/20 text-accent'
            }`}
          >
            {step > 1 ? '✓' : '1'}
          </div>
          <span className={`text-xs font-semibold ${step === 1 ? 'text-tx-primary' : 'text-tx-tertiary'}`}>
            항목 선택
          </span>
        </div>
        <div className="flex-1 h-px bg-ln" />
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
              step === 2 ? 'bg-accent text-white' : 'bg-surface-sunken text-tx-muted'
            }`}
          >
            2
          </div>
          <span className={`text-xs font-semibold ${step === 2 ? 'text-tx-primary' : 'text-tx-muted'}`}>
            날짜 입력
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {step === 1 ? (
          <div className="px-5 py-4 space-y-3">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              {/* 시험 일정 등록 영역 */}
              <DroppableZone
                id={REGISTERED_ID}
                label="시험 일정 등록"
                hint="— 필수 일정 + 선택 일정"
                isOver={isOverRegistered}
              >
                <SortableContext items={registered.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1.5">
                    {registered.map((item) => (
                      <SortableChip
                        key={item.id}
                        item={item}
                        onRemove={item.type !== 'required' ? () => moveToPool(item.id) : undefined}
                      />
                    ))}
                  </div>
                </SortableContext>
                {registered.length === 0 && (
                  <div className="text-[11px] text-tx-muted text-center py-3">
                    아래에서 일정을 드래그하여 추가하세요
                  </div>
                )}
              </DroppableZone>

              {/* 시험 일정 목록 영역 */}
              <DroppableZone
                id={POOL_ID}
                label="시험 일정 목록"
                hint="— 후보 일정 (드래그하여 등록)"
                isOver={isOverPool}
              >
                <SortableContext items={pool.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1.5">
                    {pool.map((item) => (
                      <SortableChip
                        key={item.id}
                        item={item}
                        onRemove={item.type === 'custom' ? () => deleteCustom(item.id) : undefined}
                      />
                    ))}
                  </div>
                </SortableContext>
                {pool.length === 0 && !showAddForm && (
                  <div className="text-[11px] text-tx-muted text-center py-2">
                    모든 일정이 등록되었습니다
                  </div>
                )}

                {/* + 일정 추가 */}
                {!showAddForm ? (
                  <button
                    type="button"
                    onClick={() => setShowAddForm(true)}
                    className="w-full mt-2 rounded-lg border border-dashed border-ln px-2.5 py-1.5 text-[11px] font-semibold text-tx-tertiary hover:text-accent hover:border-accent/40 transition-colors"
                  >
                    + 일정 추가
                  </button>
                ) : (
                  <div className="mt-2 rounded-lg border border-accent/30 bg-accent/5 px-2.5 py-2 space-y-2">
                    <input
                      type="text"
                      placeholder="마일스톤 이름"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
                      autoFocus
                      className="w-full h-7 rounded-md border border-ln bg-surface-base px-2.5 text-[11px] text-tx-primary placeholder:text-tx-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-tx-muted shrink-0">색상</span>
                      <div className="flex gap-1.5">
                        {CUSTOM_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewColor(c)}
                            className={`w-4 h-4 rounded-full ${MILESTONE_COLOR_MAP[c].dot} transition-all ${
                              newColor === c ? 'ring-2 ring-offset-1 ring-accent scale-110' : 'opacity-50 hover:opacity-100'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex-1" />
                      <button
                        type="button"
                        onClick={() => { setShowAddForm(false); setNewLabel(''); }}
                        className="rounded-md border border-ln px-2 py-1 text-[10px] font-semibold text-tx-tertiary hover:text-tx-primary"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCustom}
                        disabled={!newLabel.trim()}
                        className={`rounded-md px-2 py-1 text-[10px] font-semibold text-white ${
                          newLabel.trim() ? 'bg-accent hover:bg-accent-hover' : 'bg-accent/40 cursor-not-allowed'
                        }`}
                      >
                        추가
                      </button>
                    </div>
                  </div>
                )}
              </DroppableZone>

              <DragOverlay>
                {activeItem ? <OverlayChip item={activeItem} /> : null}
              </DragOverlay>
            </DndContext>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-4">
            {/* Milestone chips */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {registered.map((item) => {
                const isFocused = focusId === item.id;
                const hasFilled = !!item.date;
                const colors = MILESTONE_COLOR_MAP[item.color];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFocusId(item.id)}
                    className={`shrink-0 rounded-xl border px-3 py-2 transition-all ${
                      isFocused
                        ? `${colors.border} ${colors.bg} scale-105 shadow-md`
                        : hasFilled
                        ? `${colors.border} ${colors.bg} opacity-80`
                        : 'border-dashed border-ln bg-surface-raised opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {hasFilled && !isFocused ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={colors.text}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <span className={`w-2 h-2 rounded-full ${colors.dot} ${isFocused ? 'animate-pulse' : ''}`} />
                      )}
                      <span className={`text-[11px] font-semibold ${isFocused ? colors.text : hasFilled ? colors.text : 'text-tx-muted'}`}>
                        {item.label}
                      </span>
                    </div>
                    {hasFilled && (
                      <div className={`text-[10px] ${colors.text} opacity-70`}>{item.date}</div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Calendar */}
            <WizardCalendar
              milestones={registered}
              focusId={focusId}
              onSelectDate={handleDateSelect}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-ln px-5 py-3 flex justify-between shrink-0">
        {step === 1 ? (
          <>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-ln px-3 py-1.5 text-xs font-semibold text-tx-tertiary hover:text-tx-primary"
            >
              취소
            </button>
            <button
              type="button"
              onClick={goToStep2}
              disabled={registered.length === 0}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold text-white ${
                registered.length > 0 ? 'bg-accent hover:bg-accent-hover' : 'bg-accent/40 cursor-not-allowed'
              }`}
            >
              다음 →
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-lg border border-ln px-3 py-1.5 text-xs font-semibold text-tx-tertiary hover:text-tx-primary"
            >
              ← 이전
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!allRegisteredFilled}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold text-white ${
                allRegisteredFilled ? 'bg-accent hover:bg-accent-hover' : 'bg-accent/40 cursor-not-allowed'
              }`}
            >
              저장
            </button>
          </>
        )}
      </div>
    </div>
  );
}
