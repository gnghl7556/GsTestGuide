import { useState, useMemo, useRef, useEffect } from 'react';
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
  MILESTONE_ICON_MAP,
  buildInitialLists,
  getProjectColor,
  type MilestoneItem,
  type MilestoneColor,
} from '../../constants/schedule';
import { MilestoneIcon } from './MilestoneIcon';

type ScheduleWizardProps = {
  project: Project;
  otherProjects?: Project[];
  onSave: (updates: Record<string, unknown>) => void;
  onClose: () => void;
};

const REGISTERED_ID = 'registered-zone';
const POOL_ID = 'pool-zone';

const GripIcon = () => (
  <svg width="10" height="10" viewBox="0 0 14 14" fill="currentColor" className="shrink-0">
    <circle cx="4" cy="3" r="1.2" /><circle cx="10" cy="3" r="1.2" />
    <circle cx="4" cy="7" r="1.2" /><circle cx="10" cy="7" r="1.2" />
    <circle cx="4" cy="11" r="1.2" /><circle cx="10" cy="11" r="1.2" />
  </svg>
);

/* ── Sortable chip ── */
function SortableChip({
  item, color, focused, completed, onClick, onRemove,
}: {
  item: MilestoneItem; color: MilestoneColor; focused?: boolean; completed?: boolean; onClick?: () => void; onRemove?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };
  const c = MILESTONE_COLOR_MAP[color];
  const iconName = MILESTONE_ICON_MAP[item.id] ?? 'star';

  // focused: accent highlight, completed: dimmed, default: neutral
  const chipCls = focused
    ? 'border-accent bg-accent/10 ring-1 ring-accent/40'
    : completed
      ? 'border-ln bg-surface-sunken/60 opacity-50'
      : 'border-ln bg-surface-raised/40';

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={`flex items-center gap-1 rounded-md border px-1.5 py-1 text-[10px] transition-all ${chipCls} ${onClick ? 'cursor-pointer' : ''}`}
    >
      <button type="button" {...attributes} {...listeners}
        className="cursor-grab text-tx-muted hover:text-tx-secondary touch-none shrink-0"
        onClick={(e) => e.stopPropagation()}
      ><GripIcon /></button>
      <MilestoneIcon name={iconName} className={`w-3 h-3 shrink-0 ${focused ? 'text-accent' : c.text}`} />
      <span className={`flex-1 font-semibold truncate leading-tight ${focused ? 'text-accent' : 'text-tx-primary'}`}>{item.label}</span>
      {item.date && <span className="text-[9px] text-tx-muted shrink-0">{item.date.slice(5)}</span>}
      {item.type === 'required' && !onRemove && (
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-tx-muted shrink-0">
          <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      )}
      {onRemove && (
        <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="text-tx-muted hover:text-red-500 transition-colors shrink-0">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}

function OverlayChip({ item, color }: { item: MilestoneItem; color: MilestoneColor }) {
  const c = MILESTONE_COLOR_MAP[color];
  const iconName = MILESTONE_ICON_MAP[item.id] ?? 'star';
  return (
    <div className="flex items-center gap-1 rounded-md border border-ln bg-surface-raised px-1.5 py-1 shadow-lg">
      <GripIcon />
      <MilestoneIcon name={iconName} className={`w-3 h-3 shrink-0 ${c.text}`} />
      <span className="text-[10px] font-semibold text-tx-primary">{item.label}</span>
    </div>
  );
}

function DroppableZone({ id, label, isOver, children }: {
  id: string; label: string; isOver: boolean; children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`rounded-lg border border-dashed p-2 transition-colors min-h-[40px] ${
      isOver ? 'border-accent/50 bg-accent/5' : 'border-ln bg-surface-raised/40'
    }`}>
      <div className="text-[9px] font-bold text-tx-muted uppercase tracking-wider mb-1.5">{label}</div>
      {children}
    </div>
  );
}

/* ── Other-project date entry ── */
type OtherDateEntry = { testNumber: string; color: MilestoneColor; label: string };

/* ── Calendar (weekend disabled) ── */
function WizardCalendar({
  milestones, focusId, projectColor, otherProjects, onSelectDate,
}: {
  milestones: MilestoneItem[]; focusId: string | null; projectColor: MilestoneColor;
  otherProjects?: Project[]; onSelectDate: (date: string) => void;
}) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const startDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const pc = MILESTONE_COLOR_MAP[projectColor];

  const toDateStr = (d: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  // date → milestone ids assigned on that date (for icon lookup)
  const assignedDateMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const m of milestones) {
      if (!m.date) continue;
      const arr = map.get(m.date) ?? [];
      arr.push(m.id);
      map.set(m.date, arr);
    }
    return map;
  }, [milestones]);

  // Other projects' milestone dates
  const otherDateMap = useMemo(() => {
    const map: Record<string, OtherDateEntry[]> = {};
    if (!otherProjects) return map;
    for (const p of otherProjects) {
      const color = getProjectColor(p);
      for (const ms of MILESTONES) {
        const d = p[ms.key as keyof Project] as string | undefined;
        if (!d) continue;
        (map[d] ??= []).push({ testNumber: p.testNumber, color, label: ms.label });
      }
      for (const cm of p.customMilestones ?? []) {
        if (!cm.date) continue;
        (map[cm.date] ??= []).push({ testNumber: p.testNumber, color, label: cm.label });
      }
    }
    return map;
  }, [otherProjects]);

  // Legend: unique other projects visible this month
  const otherLegend = useMemo(() => {
    if (!otherProjects) return [];
    const seen = new Set<string>();
    const result: Array<{ testNumber: string; color: MilestoneColor }> = [];
    for (const p of otherProjects) {
      if (seen.has(p.testNumber)) continue;
      // Check if any milestone falls in current month view
      const color = getProjectColor(p);
      const dates: string[] = [];
      for (const ms of MILESTONES) {
        const d = p[ms.key as keyof Project] as string | undefined;
        if (d) dates.push(d);
      }
      for (const cm of p.customMilestones ?? []) { if (cm.date) dates.push(cm.date); }
      if (dates.length > 0) {
        seen.add(p.testNumber);
        result.push({ testNumber: p.testNumber, color });
      }
    }
    return result;
  }, [otherProjects]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const focusItem = milestones.find((m) => m.id === focusId);

  return (
    <div className="select-none">
      {focusItem && (
        <div className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 mb-3 ${pc.border} ${pc.bg}`}>
          <MilestoneIcon name={MILESTONE_ICON_MAP[focusItem.id] ?? 'star'} className={`w-3.5 h-3.5 shrink-0 ${pc.text} animate-pulse`} />
          <span className={`text-[11px] font-semibold ${pc.text}`}>{focusItem.label}</span>
          <span className="text-[10px] text-tx-muted ml-auto">{focusItem.date || '날짜를 선택하세요'}</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="rounded-md border border-ln px-2 py-0.5 text-[11px] font-medium text-tx-tertiary hover:text-tx-primary hover:bg-surface-raised transition-colors">‹</button>
        <span className="text-xs font-bold text-tx-primary">{year}년 {month + 1}월</span>
        <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="rounded-md border border-ln px-2 py-0.5 text-[11px] font-medium text-tx-tertiary hover:text-tx-primary hover:bg-surface-raised transition-colors">›</button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-[9px] font-semibold mb-1">
        {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
          <div key={d} className={`text-center py-0.5 ${i === 0 || i === 6 ? 'text-tx-muted/50' : 'text-tx-muted'}`}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: startDay }, (_, i) => {
          const dayOfWeek = i;
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          return <div key={`b-${i}`} className={`h-9 rounded-md border ${isWeekend ? 'bg-surface-sunken/60 border-ln/40' : 'border-transparent'}`} />;
        })}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateStr = toDateStr(day);
          const dayOfWeek = new Date(year, month, day).getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const assignedIds = assignedDateMap.get(dateStr);
          const isToday = dateStr === todayStr;
          const isFocusDate = focusItem?.date === dateStr;
          const otherEntries = otherDateMap[dateStr];
          const otherColors = otherEntries ? [...new Set(otherEntries.map((e) => e.color))] : [];

          return (
            <button
              key={day}
              type="button"
              disabled={isWeekend}
              onClick={() => !isWeekend && onSelectDate(dateStr)}
              className={`h-9 rounded-md text-[11px] font-medium transition-all flex flex-col items-center justify-center gap-0.5 border
                ${isWeekend ? 'bg-surface-sunken/60 border-ln/40 text-tx-muted/40 cursor-not-allowed' : ''}
                ${!isWeekend && isFocusDate ? 'bg-accent border-accent text-white ring-2 ring-accent/40' : ''}
                ${!isWeekend && !isFocusDate && isToday ? 'bg-surface-raised border-accent/30 text-accent font-bold ring-1 ring-accent/30' : ''}
                ${!isWeekend && !isFocusDate && !isToday && assignedIds ? 'bg-surface-raised border-ln text-tx-primary shadow-sm hover:shadow-md hover:border-ln-strong' : ''}
                ${!isWeekend && !isFocusDate && !isToday && !assignedIds ? 'bg-surface-base border-ln/50 text-tx-secondary hover:bg-surface-raised hover:border-ln' : ''}
              `}
            >
              <span>{day}</span>
              <div className="flex items-center gap-px">
                {assignedIds && !isFocusDate && !isWeekend && assignedIds.map((id) => (
                  <MilestoneIcon key={id} name={MILESTONE_ICON_MAP[id] ?? 'star'} className={`w-2.5 h-2.5 ${pc.text}`} />
                ))}
                {!isWeekend && otherColors.map((c) => (
                  <span key={c} className={`w-1.5 h-1.5 rounded-full ${MILESTONE_COLOR_MAP[c].dot} opacity-50`} />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Other projects legend */}
      {otherLegend.length > 0 && (
        <div className="mt-2 pt-2 border-t border-ln flex flex-wrap items-center gap-2">
          <span className="text-[9px] text-tx-muted font-semibold">다른 시험:</span>
          {otherLegend.map((p) => (
            <div key={p.testNumber} className="flex items-center gap-1 text-[9px] text-tx-tertiary">
              <span className={`w-1.5 h-1.5 rounded-full ${MILESTONE_COLOR_MAP[p.color].dot} opacity-50`} />
              {p.testNumber}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main Wizard ── */

export function ScheduleWizard({ project, otherProjects, onSave, onClose }: ScheduleWizardProps) {
  const initial = useMemo(() => buildInitialLists(project), [project]);
  const projectColor = initial.projectColor;
  const [registered, setRegistered] = useState<MilestoneItem[]>(initial.registered);
  const [pool, setPool] = useState<MilestoneItem[]>(initial.pool);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const recentlyMovedRef = useRef(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const first = registered.find((i) => !i.date);
    setFocusId(first?.id ?? null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const allItems = useMemo(() => [...registered, ...pool], [registered, pool]);

  function findContainer(id: string | number): 'registered' | 'pool' | null {
    const sid = String(id);
    if (sid === REGISTERED_ID) return 'registered';
    if (sid === POOL_ID) return 'pool';
    if (registered.some((i) => i.id === sid)) return 'registered';
    if (pool.some((i) => i.id === sid)) return 'pool';
    return null;
  }

  function handleDragStart(event: DragStartEvent) { setActiveId(String(event.active.id)); }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const ac = findContainer(active.id), oc = findContainer(over.id);
    if (!ac || !oc || ac === oc) return;
    const item = allItems.find((i) => i.id === String(active.id));
    if (!item) return;
    if (item.type === 'required' && oc === 'pool') return;
    recentlyMovedRef.current = true;
    const overId = String(over.id);
    const isOverZone = overId === REGISTERED_ID || overId === POOL_ID;
    if (ac === 'pool' && oc === 'registered') {
      setPool((p) => p.filter((i) => i.id !== item.id));
      setRegistered((p) => { if (isOverZone) return [...p, item]; const idx = p.findIndex((i) => i.id === overId); return [...p.slice(0, idx + 1), item, ...p.slice(idx + 1)]; });
    } else if (ac === 'registered' && oc === 'pool') {
      setRegistered((p) => p.filter((i) => i.id !== item.id));
      setPool((p) => { if (isOverZone) return [...p, item]; const idx = p.findIndex((i) => i.id === overId); return [...p.slice(0, idx + 1), item, ...p.slice(idx + 1)]; });
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const ac = findContainer(active.id), oc = findContainer(over.id);
    if (!ac || !oc || ac !== oc || active.id === over.id) return;
    (ac === 'registered' ? setRegistered : setPool)((p) => {
      const oi = p.findIndex((i) => i.id === String(active.id)), ni = p.findIndex((i) => i.id === String(over.id));
      return oi === -1 || ni === -1 ? p : arrayMove(p, oi, ni);
    });
  }

  function handleDragCancel() { setActiveId(null); }

  function moveToPool(id: string) {
    const item = registered.find((i) => i.id === id);
    if (!item || item.type === 'required') return;
    setRegistered((p) => p.filter((i) => i.id !== id));
    setPool((p) => [...p, { ...item, date: '' }]);
    if (focusId === id) setFocusId(registered.find((i) => i.id !== id)?.id ?? null);
  }

  function deleteCustom(id: string) { setPool((p) => p.filter((i) => i.id !== id)); }

  function handleAddCustom() {
    if (!newLabel.trim()) return;
    setPool((p) => [...p, { id: `custom-${Date.now()}`, label: newLabel.trim(), type: 'custom', date: '' }]);
    setNewLabel('');
    setShowAddForm(false);
  }

  function handleDateSelect(dateStr: string) {
    if (!focusId) return;
    setRegistered((p) => p.map((i) => (i.id === focusId ? { ...i, date: dateStr } : i)));
    const idx = registered.findIndex((i) => i.id === focusId);
    const next = registered.find((i, j) => j > idx && !i.date) ?? registered.find((i) => !i.date && i.id !== focusId);
    setFocusId(next?.id ?? null);
  }

  function handleSave() {
    const updates: Record<string, unknown> = {};
    for (const m of MILESTONES) { updates[m.key] = registered.find((i) => i.id === m.key)?.date || ''; }
    updates.projectColor = projectColor;
    // registered의 custom/optional 항목만 저장 — pool로 이동된 항목은 빈 배열로 대체되어 Firestore의 stale 데이터 제거
    updates.customMilestones = registered.filter((i) => i.type !== 'required')
      .map((i) => ({ id: i.id, label: i.label, date: i.date, color: projectColor }));
    updates.milestoneOrder = registered.map((i) => i.id);
    onSave(updates);
  }

  // 필수 마일스톤(시험 시작일/종료일 등)만 입력되면 저장 가능 — 선택 항목은 중간 저장 허용
  const requiredFilled = useMemo(() => registered.filter((i) => i.type === 'required').every((i) => !!i.date), [registered]);
  const activeItem = activeId ? allItems.find((i) => i.id === activeId) : null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left: item selection */}
        <div className="w-[42%] shrink-0 border-r border-ln overflow-y-auto p-3 space-y-2">
          <DndContext sensors={sensors} collisionDetection={closestCorners}
            onDragStart={handleDragStart} onDragOver={handleDragOver}
            onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
            <DroppableZone id={REGISTERED_ID} label="등록된 일정"
              isOver={!!activeId && findContainer(activeId) !== 'registered'}>
              <SortableContext items={registered.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-1">
                  {registered.map((item) => (
                    <SortableChip key={item.id} item={item} color={projectColor}
                      focused={focusId === item.id}
                      completed={focusId !== item.id && !!item.date}
                      onClick={() => setFocusId(item.id)}
                      onRemove={item.type !== 'required' ? () => moveToPool(item.id) : undefined} />
                  ))}
                </div>
              </SortableContext>
              {registered.length === 0 && (
                <div className="text-[10px] text-tx-muted text-center py-2">일정을 드래그하여 추가</div>
              )}
            </DroppableZone>

            <DroppableZone id={POOL_ID} label="후보 일정"
              isOver={!!activeId && findContainer(activeId) !== 'pool'}>
              <SortableContext items={pool.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-1">
                  {pool.map((item) => (
                    <SortableChip key={item.id} item={item} color={projectColor}
                      onRemove={item.type === 'custom' ? () => deleteCustom(item.id) : undefined} />
                  ))}
                </div>
              </SortableContext>
              {pool.length === 0 && !showAddForm && (
                <div className="text-[10px] text-tx-muted text-center py-1">모든 일정 등록됨</div>
              )}
              {!showAddForm ? (
                <button type="button" onClick={() => setShowAddForm(true)}
                  className="w-full mt-1.5 rounded-md border border-dashed border-ln px-2 py-1 text-[10px] font-semibold text-tx-tertiary hover:text-accent hover:border-accent/40 transition-colors">
                  + 추가
                </button>
              ) : (
                <div className="mt-1.5 rounded-md border border-accent/30 bg-accent/5 px-2 py-1.5 space-y-1.5">
                  <input type="text" placeholder="일정 이름" value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()} autoFocus
                    className="w-full h-6 rounded border border-ln bg-surface-base px-2 text-[10px] text-tx-primary placeholder:text-tx-muted focus:outline-none focus:ring-1 focus:ring-accent/40" />
                  <div className="flex justify-end gap-1.5">
                    <button type="button" onClick={() => { setShowAddForm(false); setNewLabel(''); }}
                      className="text-[9px] font-semibold text-tx-tertiary hover:text-tx-primary">취소</button>
                    <button type="button" onClick={handleAddCustom} disabled={!newLabel.trim()}
                      className={`rounded px-1.5 py-0.5 text-[9px] font-semibold text-white ${
                        newLabel.trim() ? 'bg-accent' : 'bg-accent/40 cursor-not-allowed'}`}>추가</button>
                  </div>
                </div>
              )}
            </DroppableZone>

            <DragOverlay>{activeItem ? <OverlayChip item={activeItem} color={projectColor} /> : null}</DragOverlay>
          </DndContext>
        </div>

        {/* Right: calendar */}
        <div className="flex-1 overflow-y-auto p-3">
          <WizardCalendar milestones={registered} focusId={focusId}
            projectColor={projectColor} otherProjects={otherProjects} onSelectDate={handleDateSelect} />
        </div>
      </div>

      <div className="border-t border-ln px-4 py-2.5 flex justify-between shrink-0">
        <button type="button" onClick={onClose}
          className="rounded-lg border border-ln px-3 py-1.5 text-xs font-semibold text-tx-tertiary hover:text-tx-primary">취소</button>
        <button type="button" onClick={handleSave} disabled={!requiredFilled}
          className={`rounded-lg px-4 py-1.5 text-xs font-semibold text-white ${
            requiredFilled ? 'bg-accent hover:bg-accent-hover' : 'bg-accent/40 cursor-not-allowed'}`}>저장</button>
      </div>
    </div>
  );
}
