import { useEffect, useState } from 'react';
import type { UserRank, UserUpdateInput } from '../../../../types';

interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  initialData: { id: string; name: string; rank: UserRank | ''; email: string; phone: string };
  onUpdateUser: (id: string, input: UserUpdateInput) => Promise<boolean>;
  hasDuplicateUser: (candidate: { id: string; name: string; email: string }) => boolean;
}

export function EditUserModal({
  open,
  onClose,
  initialData,
  onUpdateUser,
  hasDuplicateUser
}: EditUserModalProps) {
  const [form, setForm] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(initialData);
      setError(null);
    }
  }, [open, initialData]);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }
    if (hasDuplicateUser({ id: form.id, name: form.name, email: form.email })) {
      setError('이미 등록된 사용자입니다. 이름 또는 이메일을 확인해주세요.');
      return;
    }
    setError(null);
    setLoading(true);
    const ok = await onUpdateUser(form.id, {
      name: form.name.trim(),
      rank: form.rank.trim() ? (form.rank.trim() as UserRank) : undefined,
      email: form.email.trim(),
      phone: form.phone.trim()
    });
    setLoading(false);
    if (!ok) {
      setError('사용자 수정에 실패했습니다.');
      return;
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[var(--overlay-backdrop)] p-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] shadow-xl text-slate-900 dark:text-white">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 px-5 py-4">
          <div className="text-sm font-extrabold">사용자 수정</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 dark:border-white/10 px-2 py-1 text-xs font-semibold text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white"
          >
            닫기
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="text-xs text-slate-500 dark:text-white/60 block mb-1">이름</label>
            <input
              className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-2 text-sm text-slate-700 dark:text-white/80 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-white/60 block mb-1">직급</label>
            <input
              className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-2 text-sm text-slate-700 dark:text-white/80 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
              value={form.rank}
              onChange={(e) => setForm((prev) => ({ ...prev, rank: e.target.value as UserRank | '' }))}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-white/60 block mb-1">이메일</label>
            <input
              className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-2 text-sm text-slate-700 dark:text-white/80 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-white/60 block mb-1">연락처</label>
            <input
              className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-2 text-sm text-slate-700 dark:text-white/80 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          {error && <div className="text-xs text-red-300">{error}</div>}
        </div>
        <div className="border-t border-slate-200 dark:border-white/10 px-5 py-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 dark:border-white/10 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white"
          >
            취소
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="rounded-md bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-xs font-semibold text-white shadow-[0_0_20px_rgba(88,120,255,0.4)]"
          >
            {loading ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
