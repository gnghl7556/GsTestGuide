import { useEffect, useState } from 'react';
import type { UserRank, UserUpdateInput } from '../../../../types';
import { isValidEmail, isValidPhone } from '../../../../utils/validation';
import { FormModal } from '../../../../components/ui/FormModal';

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
    if (form.email.trim() && !isValidEmail(form.email.trim())) {
      setError('올바른 이메일 형식이 아닙니다.');
      return;
    }
    if (form.phone.trim() && !isValidPhone(form.phone.trim())) {
      setError('올바른 연락처 형식이 아닙니다. (예: 010-0000-0000)');
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

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="사용자 수정"
      size="lg"
      busy={loading}
      submitLabel="저장"
      onSubmit={handleSubmit}
      error={error}
    >
      <div>
        <label className="text-xs text-tx-tertiary block mb-1">이름</label>
        <input
          className="w-full rounded-lg border border-ln bg-input-bg px-3 py-2 text-sm text-input-text focus:outline-none focus:ring-2 focus:ring-accent/60"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
        />
      </div>
      <div>
        <label className="text-xs text-tx-tertiary block mb-1">직급</label>
        <input
          className="w-full rounded-lg border border-ln bg-input-bg px-3 py-2 text-sm text-input-text focus:outline-none focus:ring-2 focus:ring-accent/60"
          value={form.rank}
          onChange={(e) => setForm((prev) => ({ ...prev, rank: e.target.value as UserRank | '' }))}
        />
      </div>
      <div>
        <label className="text-xs text-tx-tertiary block mb-1">이메일</label>
        <input
          className="w-full rounded-lg border border-ln bg-input-bg px-3 py-2 text-sm text-input-text focus:outline-none focus:ring-2 focus:ring-accent/60"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
        />
      </div>
      <div>
        <label className="text-xs text-tx-tertiary block mb-1">연락처</label>
        <input
          className="w-full rounded-lg border border-ln bg-input-bg px-3 py-2 text-sm text-input-text focus:outline-none focus:ring-2 focus:ring-accent/60"
          value={form.phone}
          onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
        />
      </div>
    </FormModal>
  );
}
