import { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
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
  buildMilestoneList,
  type MilestoneItem,
  type MilestoneColor,
} from '../../constants/schedule';

type ScheduleWizardProps = {
  project: Project;
  onSave: (updates: Record<string, unknown>) => void;
  onClose: () => void;
};

/* ── Step 1: Sortable Item ── */

function SortableItem({
  item,
  checked,
  onToggle,
  onRemove,
}: {
  item: MilestoneItem;
  checked: boolean;
  onToggle: () => void;
  onRemove?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const colors = MILESTONE_COLOR_MAP[item.color];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-all ${
        checked ? `${colors.border} ${colors.bg}` : 'border-ln bg-surface-raised opacity-60'
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab text-tx-muted hover:text-tx-secondary touch-none"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <circle cx="4" cy="3" r="1.2" />
          <circle cx="10" cy="3" r="1.2" />
          <circle cx="4" cy="7" r="1.2" />
          <circle cx="10" cy="7" r="1.2" />
          <circle cx="4" cy="11" r="1.2" />
          <circle cx="10" cy="11" r="1.2" />
        </svg>
      </button>
      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colors.dot}`} />
      <span className={`flex-1 text-xs font-semibold ${checked ? colors.text : 'text-tx-muted'}`}>
        {item.label}
      </span>
      <label className="relative flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="sr-only"
        />
        <div
          className={`w-8 h-[18px] rounded-full transition-colors ${
            checked ? 'bg-accent' : 'bg-surface-sunken'
          }`}
        >
          <div
            className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm absolute top-[2px] transition-transform ${
              checked ? 'translate-x-[18px]' : 'translate-x-[2px]'
            }`}
          />
        </div>
      </label>
      {!item.builtIn && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="text-tx-muted hover:text-red-500 transition-colors ml-1"
          title="삭제"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
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

  // Build initial items from project
  const initialItems = useMemo(() => buildMilestoneList(project), [project]);

  const [items, setItems] = useState<MilestoneItem[]>(initialItems);
  const [enabled, setEnabled] = useState<Set<string>>(() => {
    const set = new Set<string>();
    for (const item of initialItems) {
      // built-in always enabled by default; custom always enabled
      set.add(item.id);
    }
    return set;
  });
  const [focusId, setFocusId] = useState<string | null>(null);

  // Custom milestone add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState<MilestoneColor>(CUSTOM_COLORS[0]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const activeItems = useMemo(() => items.filter((i) => enabled.has(i.id)), [items, enabled]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id);
      const newIndex = prev.findIndex((i) => i.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleToggle = (id: string) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddCustom = () => {
    if (!newLabel.trim()) return;
    const id = `custom-${Date.now()}`;
    const usedColors = items.filter((i) => !i.builtIn).map((i) => i.color);
    const availColor = CUSTOM_COLORS.find((c) => !usedColors.includes(c)) ?? newColor;
    const newItem: MilestoneItem = {
      id,
      label: newLabel.trim(),
      color: availColor,
      builtIn: false,
      date: '',
    };
    setItems((prev) => [...prev, newItem]);
    setEnabled((prev) => new Set(prev).add(id));
    setNewLabel('');
    setNewColor(CUSTOM_COLORS[(CUSTOM_COLORS.indexOf(availColor) + 1) % CUSTOM_COLORS.length]);
    setShowAddForm(false);
  };

  const handleRemoveCustom = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setEnabled((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // Step 2: focus logic
  const handleDateSelect = (dateStr: string) => {
    if (!focusId) return;
    setItems((prev) =>
      prev.map((i) => (i.id === focusId ? { ...i, date: dateStr } : i))
    );
    // Auto-advance to next unfilled active item
    const currentIdx = activeItems.findIndex((i) => i.id === focusId);
    const nextUnfilled = activeItems.find(
      (i, idx) => idx > currentIdx && !i.date && i.id !== focusId
    );
    if (nextUnfilled) {
      setFocusId(nextUnfilled.id);
    } else {
      // Check remaining unfilled
      const anyUnfilled = activeItems.find((i) => !items.find((it) => it.id === i.id)?.date && i.id !== focusId);
      if (anyUnfilled) setFocusId(anyUnfilled.id);
    }
  };

  const goToStep2 = () => {
    setStep(2);
    // Set focus to first unfilled active item
    const updatedActive = items.filter((i) => enabled.has(i.id));
    const firstUnfilled = updatedActive.find((i) => !i.date);
    setFocusId(firstUnfilled?.id ?? updatedActive[0]?.id ?? null);
  };

  const handleSave = () => {
    const updates: Record<string, unknown> = {};
    const activeList = items.filter((i) => enabled.has(i.id));

    // Built-in milestones
    for (const m of MILESTONES) {
      const item = activeList.find((i) => i.id === m.key);
      updates[m.key] = item?.date || '';
    }

    // Custom milestones
    const customMs = activeList
      .filter((i) => !i.builtIn)
      .map((i) => ({ id: i.id, label: i.label, date: i.date, color: i.color }));
    updates.customMilestones = customMs;

    // Order
    updates.milestoneOrder = activeList.map((i) => i.id);

    onSave(updates);
  };

  const allActiveFilled = useMemo(
    () => activeItems.every((i) => items.find((it) => it.id === i.id)?.date),
    [activeItems, items]
  );

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
            <div className="text-[11px] font-semibold text-tx-muted mb-1">
              마일스톤을 선택하고 드래그하여 순서를 변경하세요
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {items.map((item) => (
                    <SortableItem
                      key={item.id}
                      item={item}
                      checked={enabled.has(item.id)}
                      onToggle={() => handleToggle(item.id)}
                      onRemove={!item.builtIn ? () => handleRemoveCustom(item.id) : undefined}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Add custom milestone */}
            {!showAddForm ? (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="w-full rounded-xl border border-dashed border-ln px-3 py-2.5 text-xs font-semibold text-tx-tertiary hover:text-accent hover:border-accent/40 transition-colors"
              >
                + 일정 추가
              </button>
            ) : (
              <div className="rounded-xl border border-accent/30 bg-accent/5 px-3 py-3 space-y-2.5">
                <input
                  type="text"
                  placeholder="마일스톤 이름"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
                  autoFocus
                  className="w-full h-8 rounded-lg border border-ln bg-surface-base px-3 text-xs text-tx-primary placeholder:text-tx-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-tx-muted shrink-0">색상</span>
                  <div className="flex gap-1.5">
                    {CUSTOM_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewColor(c)}
                        className={`w-5 h-5 rounded-full ${MILESTONE_COLOR_MAP[c].dot} transition-all ${
                          newColor === c ? 'ring-2 ring-offset-1 ring-accent scale-110' : 'opacity-60 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowAddForm(false); setNewLabel(''); }}
                    className="flex-1 rounded-lg border border-ln px-2 py-1.5 text-[11px] font-semibold text-tx-tertiary hover:text-tx-primary"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCustom}
                    disabled={!newLabel.trim()}
                    className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-white ${
                      newLabel.trim() ? 'bg-accent hover:bg-accent-hover' : 'bg-accent/40 cursor-not-allowed'
                    }`}
                  >
                    추가
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="px-5 py-4 space-y-4">
            {/* Milestone chips - horizontal */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {activeItems.map((item) => {
                const current = items.find((i) => i.id === item.id)!;
                const isFocused = focusId === item.id;
                const hasFilled = !!current.date;
                const colors = MILESTONE_COLOR_MAP[current.color];

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
                        {current.label}
                      </span>
                    </div>
                    {hasFilled && (
                      <div className={`text-[10px] ${colors.text} opacity-70`}>{current.date}</div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Calendar */}
            <WizardCalendar
              milestones={items.filter((i) => enabled.has(i.id))}
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
              disabled={activeItems.length === 0}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold text-white ${
                activeItems.length > 0 ? 'bg-accent hover:bg-accent-hover' : 'bg-accent/40 cursor-not-allowed'
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
              disabled={!allActiveFilled}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold text-white ${
                allActiveFilled ? 'bg-accent hover:bg-accent-hover' : 'bg-accent/40 cursor-not-allowed'
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
