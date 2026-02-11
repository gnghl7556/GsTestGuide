import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { useTestSetupContext } from '../../../providers/useTestSetupContext';
import { Button } from '../../../components/ui';
import type { UserRank } from '../../../types';

const RANK_OPTIONS: UserRank[] = ['전임', '선임', '책임', '수석'];

type UserFormData = {
  name: string;
  rank: UserRank;
  email: string;
  phone: string;
};

const emptyForm: UserFormData = { name: '', rank: '전임', email: '', phone: '' };

export function UserManagement() {
  const { users, createUser, updateUser, deleteUser } = useTestSetupContext();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UserFormData>(emptyForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!form.name.trim() || !form.email.trim()) return;
    await createUser({
      name: form.name.trim(),
      rank: form.rank,
      email: form.email.trim(),
      phone: form.phone.trim(),
    });
    setForm(emptyForm);
    setShowAddForm(false);
  };

  const handleEditStart = (user: typeof users[number]) => {
    setEditingId(user.id);
    setForm({ name: user.name, rank: user.rank, email: user.email, phone: user.phone });
  };

  const handleEditSave = async () => {
    if (!editingId || !form.name.trim()) return;
    await updateUser(editingId, {
      name: form.name.trim(),
      rank: form.rank,
      email: form.email.trim(),
      phone: form.phone.trim(),
    });
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleDelete = async (id: string) => {
    await deleteUser(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-tx-primary">사용자 관리</h1>
          <p className="text-xs text-tx-tertiary mt-1">시험원 계정을 관리합니다. ({users.length}명)</p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setShowAddForm(true);
            setForm(emptyForm);
          }}
        >
          <Plus size={14} className="mr-1" />
          사용자 추가
        </Button>
      </div>

      <div className="rounded-xl border border-ln bg-surface-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ln bg-surface-raised">
                <th className="px-4 py-3 text-left text-xs font-bold text-tx-secondary">이름</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-tx-secondary">직급</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-tx-secondary">이메일</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-tx-secondary">연락처</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-tx-secondary w-28">작업</th>
              </tr>
            </thead>
            <tbody>
              {showAddForm && (
                <tr className="border-b border-ln bg-accent-subtle">
                  <td className="px-4 py-2">
                    <input
                      className="w-full rounded border border-ln px-2 py-1 text-sm"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="이름"
                      autoFocus
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      className="rounded border border-ln px-2 py-1 text-sm"
                      value={form.rank}
                      onChange={(e) => setForm({ ...form, rank: e.target.value as UserRank })}
                    >
                      {RANK_OPTIONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      className="w-full rounded border border-ln px-2 py-1 text-sm"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="이메일"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      className="w-full rounded border border-ln px-2 py-1 text-sm"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="연락처"
                    />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={handleAdd}
                        className="rounded p-1 text-status-pass-text hover:bg-status-pass-bg"
                        title="저장"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => setShowAddForm(false)}
                        className="rounded p-1 text-tx-muted hover:bg-interactive-hover"
                        title="취소"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {users.map((user) => (
                <tr key={user.id} className="border-b border-ln hover:bg-interactive-hover">
                  {editingId === user.id ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          className="w-full rounded border border-ln px-2 py-1 text-sm"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select
                          className="rounded border border-ln px-2 py-1 text-sm"
                          value={form.rank}
                          onChange={(e) => setForm({ ...form, rank: e.target.value as UserRank })}
                        >
                          {RANK_OPTIONS.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          className="w-full rounded border border-ln px-2 py-1 text-sm"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          className="w-full rounded border border-ln px-2 py-1 text-sm"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={handleEditSave}
                            className="rounded p-1 text-status-pass-text hover:bg-status-pass-bg"
                            title="저장"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => { setEditingId(null); setForm(emptyForm); }}
                            className="rounded p-1 text-tx-muted hover:bg-interactive-hover"
                            title="취소"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-semibold text-tx-primary">{user.name}</td>
                      <td className="px-4 py-3 text-tx-secondary">{user.rank}</td>
                      <td className="px-4 py-3 text-tx-secondary">{user.email}</td>
                      <td className="px-4 py-3 text-tx-secondary">{user.phone}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEditStart(user)}
                            className="rounded p-1 text-tx-muted hover:text-accent-text hover:bg-accent-subtle"
                            title="수정"
                          >
                            <Pencil size={14} />
                          </button>
                          {deleteConfirmId === user.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(user.id)}
                                className="rounded px-2 py-0.5 text-xs font-semibold text-danger-text bg-danger-subtle hover:bg-danger-subtle"
                              >
                                확인
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="rounded px-2 py-0.5 text-xs font-semibold text-tx-tertiary hover:bg-interactive-hover"
                              >
                                취소
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(user.id)}
                              className="rounded p-1 text-tx-muted hover:text-danger-text hover:bg-danger-subtle"
                              title="삭제"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {users.length === 0 && !showAddForm && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-tx-muted">
                    등록된 사용자가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
