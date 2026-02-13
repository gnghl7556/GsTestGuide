import { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, Check, X, User, ChevronDown, ChevronRight } from 'lucide-react';
import { REQUIREMENTS_DB } from 'virtual:content/process';
import { db } from '../../../lib/firebase';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

type Contact = {
  role: string;
  name: string;
  phone: string;
  email: string;
};

type ContactFormData = Contact;

const emptyForm: ContactFormData = { role: '', name: '', phone: '', email: '' };

const CATEGORY_LABELS: Record<string, string> = {
  SETUP: '시험준비',
  EXECUTION: '시험수행',
  COMPLETION: '시험종료',
};

export function ContactManagement() {
  const [contactsByStep, setContactsByStep] = useState<Record<string, Contact[]>>({});
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [addingStep, setAddingStep] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null); // "stepId-index"
  const [form, setForm] = useState<ContactFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Group requirements by category
  const grouped = useMemo(() => {
    const groups: Record<string, typeof REQUIREMENTS_DB> = {};
    for (const req of REQUIREMENTS_DB) {
      if (!groups[req.category]) groups[req.category] = [];
      groups[req.category].push(req);
    }
    return groups;
  }, []);

  // Subscribe to Firestore stepContacts
  useEffect(() => {
    if (!db) return;
    const unsubs: (() => void)[] = [];
    for (const req of REQUIREMENTS_DB) {
      const unsub = onSnapshot(doc(db, 'stepContacts', req.id), (snap) => {
        const data = snap.data();
        setContactsByStep((prev) => ({
          ...prev,
          [req.id]: (data?.contacts as Contact[]) || [],
        }));
      });
      unsubs.push(unsub);
    }
    return () => unsubs.forEach((u) => u());
  }, []);

  // Seed from markdown defaults if Firestore is empty
  useEffect(() => {
    for (const req of REQUIREMENTS_DB) {
      if (
        req.contacts &&
        req.contacts.length > 0 &&
        (!contactsByStep[req.id] || contactsByStep[req.id].length === 0)
      ) {
        setContactsByStep((prev) => {
          if (prev[req.id] && prev[req.id].length > 0) return prev;
          return {
            ...prev,
            [req.id]: req.contacts!.map((c) => ({
              role: c.role,
              name: c.name,
              phone: c.phone ?? '',
              email: c.email ?? '',
            })),
          };
        });
      }
    }
  }, [contactsByStep]);

  const saveContacts = async (stepId: string, contacts: Contact[]) => {
    if (!db) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'stepContacts', stepId), {
        contacts,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error('Failed to save contacts:', e);
    }
    setSaving(false);
  };

  const toggleStep = (id: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = async (stepId: string) => {
    if (!form.role.trim() || !form.name.trim()) return;
    const current = contactsByStep[stepId] || [];
    const updated = [...current, { ...form }];
    await saveContacts(stepId, updated);
    setForm(emptyForm);
    setAddingStep(null);
  };

  const handleEditStart = (stepId: string, index: number) => {
    const contacts = contactsByStep[stepId] || [];
    const c = contacts[index];
    if (!c) return;
    setEditingKey(`${stepId}-${index}`);
    setForm({ role: c.role, name: c.name, phone: c.phone, email: c.email });
  };

  const handleEditSave = async (stepId: string, index: number) => {
    if (!form.role.trim() || !form.name.trim()) return;
    const current = [...(contactsByStep[stepId] || [])];
    current[index] = { ...form };
    await saveContacts(stepId, current);
    setEditingKey(null);
    setForm(emptyForm);
  };

  const handleDelete = async (stepId: string, index: number) => {
    const current = [...(contactsByStep[stepId] || [])];
    current.splice(index, 1);
    await saveContacts(stepId, current);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-extrabold text-tx-primary">담당자 관리</h1>
        <p className="text-xs text-tx-tertiary mt-1">
          각 절차별 담당자 정보를 등록/수정합니다. 체크리스트에 자동 반영됩니다.
        </p>
      </div>

      <div className="space-y-4">
        {(['SETUP', 'EXECUTION', 'COMPLETION'] as const).map((cat) => {
          const items = grouped[cat] || [];
          if (items.length === 0) return null;
          return (
            <div key={cat}>
              <div className="text-[10px] font-bold uppercase tracking-wider text-tx-muted mb-2 px-1">
                {CATEGORY_LABELS[cat]}
              </div>
              <div className="space-y-1.5">
                {items.map((req) => {
                  const contacts = contactsByStep[req.id] || [];
                  const isExpanded = expandedSteps.has(req.id);
                  return (
                    <div
                      key={req.id}
                      className="rounded-xl border border-ln bg-surface-base overflow-hidden"
                    >
                      {/* Step header */}
                      <button
                        type="button"
                        onClick={() => toggleStep(req.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-raised transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown size={14} className="text-tx-muted shrink-0" />
                        ) : (
                          <ChevronRight size={14} className="text-tx-muted shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-mono font-bold text-tx-muted mr-2">
                            {req.id}
                          </span>
                          <span className="text-sm font-semibold text-tx-primary">
                            {req.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-tx-muted bg-surface-sunken px-2 py-0.5 rounded-full">
                          {contacts.length}명
                        </span>
                      </button>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="border-t border-ln px-4 py-3 bg-surface-sunken">
                          {contacts.length === 0 && addingStep !== req.id && (
                            <p className="text-xs text-tx-muted mb-3">
                              등록된 담당자가 없습니다.
                            </p>
                          )}

                          {/* Contact cards */}
                          <div className="space-y-2 mb-3">
                            {contacts.map((c, idx) => {
                              const key = `${req.id}-${idx}`;
                              if (editingKey === key) {
                                return (
                                  <div
                                    key={key}
                                    className="rounded-lg border border-accent bg-surface-base px-3 py-2.5"
                                  >
                                    <div className="grid grid-cols-4 gap-2">
                                      <input
                                        className="rounded border border-ln px-2 py-1 text-sm"
                                        value={form.role}
                                        onChange={(e) =>
                                          setForm({ ...form, role: e.target.value })
                                        }
                                        placeholder="역할"
                                        autoFocus
                                      />
                                      <input
                                        className="rounded border border-ln px-2 py-1 text-sm"
                                        value={form.name}
                                        onChange={(e) =>
                                          setForm({ ...form, name: e.target.value })
                                        }
                                        placeholder="이름"
                                      />
                                      <input
                                        className="rounded border border-ln px-2 py-1 text-sm"
                                        value={form.phone}
                                        onChange={(e) =>
                                          setForm({ ...form, phone: e.target.value })
                                        }
                                        placeholder="연락처"
                                      />
                                      <input
                                        className="rounded border border-ln px-2 py-1 text-sm"
                                        value={form.email}
                                        onChange={(e) =>
                                          setForm({ ...form, email: e.target.value })
                                        }
                                        placeholder="이메일"
                                      />
                                    </div>
                                    <div className="flex justify-end gap-1 mt-2">
                                      <button
                                        onClick={() =>
                                          handleEditSave(req.id, idx)
                                        }
                                        disabled={saving}
                                        className="rounded px-2 py-1 text-xs font-semibold text-status-pass-text hover:bg-status-pass-bg"
                                      >
                                        <Check size={14} />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingKey(null);
                                          setForm(emptyForm);
                                        }}
                                        className="rounded px-2 py-1 text-xs text-tx-muted hover:bg-interactive-hover"
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              }
                              return (
                                <div
                                  key={key}
                                  className="rounded-lg border border-ln bg-surface-base px-3 py-2.5 flex items-center gap-3"
                                >
                                  <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                                    <User size={14} className="text-accent" />
                                  </div>
                                  <div className="flex-1 min-w-0 grid grid-cols-4 gap-2 items-center">
                                    <div>
                                      <div className="text-[10px] text-tx-muted">역할</div>
                                      <div className="text-xs font-semibold text-tx-primary truncate">
                                        {c.role}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-[10px] text-tx-muted">이름</div>
                                      <div className="text-xs font-semibold text-tx-primary truncate">
                                        {c.name}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-[10px] text-tx-muted">연락처</div>
                                      <div className="text-xs text-tx-secondary truncate">
                                        {c.phone || '-'}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-[10px] text-tx-muted">이메일</div>
                                      <div className="text-xs text-tx-secondary truncate">
                                        {c.email || '-'}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      onClick={() => handleEditStart(req.id, idx)}
                                      className="rounded p-1 text-tx-muted hover:text-accent-text hover:bg-accent-subtle"
                                      title="수정"
                                    >
                                      <Pencil size={13} />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(req.id, idx)}
                                      className="rounded p-1 text-tx-muted hover:text-danger-text hover:bg-danger-subtle"
                                      title="삭제"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Add form */}
                          {addingStep === req.id ? (
                            <div className="rounded-lg border border-accent bg-surface-base px-3 py-2.5">
                              <div className="grid grid-cols-4 gap-2">
                                <input
                                  className="rounded border border-ln px-2 py-1 text-sm"
                                  value={form.role}
                                  onChange={(e) =>
                                    setForm({ ...form, role: e.target.value })
                                  }
                                  placeholder="역할 (예: IP 담당)"
                                  autoFocus
                                />
                                <input
                                  className="rounded border border-ln px-2 py-1 text-sm"
                                  value={form.name}
                                  onChange={(e) =>
                                    setForm({ ...form, name: e.target.value })
                                  }
                                  placeholder="이름"
                                />
                                <input
                                  className="rounded border border-ln px-2 py-1 text-sm"
                                  value={form.phone}
                                  onChange={(e) =>
                                    setForm({ ...form, phone: e.target.value })
                                  }
                                  placeholder="연락처"
                                />
                                <input
                                  className="rounded border border-ln px-2 py-1 text-sm"
                                  value={form.email}
                                  onChange={(e) =>
                                    setForm({ ...form, email: e.target.value })
                                  }
                                  placeholder="이메일"
                                />
                              </div>
                              <div className="flex justify-end gap-1 mt-2">
                                <button
                                  onClick={() => handleAdd(req.id)}
                                  disabled={saving}
                                  className="rounded px-2 py-1 text-xs font-semibold text-status-pass-text hover:bg-status-pass-bg"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  onClick={() => {
                                    setAddingStep(null);
                                    setForm(emptyForm);
                                  }}
                                  className="rounded px-2 py-1 text-xs text-tx-muted hover:bg-interactive-hover"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setAddingStep(req.id);
                                setForm(emptyForm);
                                setEditingKey(null);
                              }}
                              className="flex items-center gap-1 text-xs font-semibold text-accent-text hover:text-accent-hover"
                            >
                              <Plus size={13} />
                              담당자 추가
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
