import { useState } from 'react';
import type { UserCreateInput, UserRank } from '../../../../types';
import { isValidEmail, isValidPhone } from '../../../../utils/validation';
import { FormModal } from '../../../../components/ui/FormModal';

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onCreateUser: (input: UserCreateInput) => Promise<string | null>;
  onUserCreated: (userId: string) => void;
  hasDuplicateUser: (candidate: { name: string; email: string }) => boolean;
}

export function CreateUserModal({
  open,
  onClose,
  onCreateUser,
  onUserCreated,
  hasDuplicateUser
}: CreateUserModalProps) {
  const [form, setForm] = useState({ name: '', rank: '' as UserRank | '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    onClose();
    setError(null);
  };

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
    if (hasDuplicateUser({ name: form.name, email: form.email })) {
      setError('이미 등록된 사용자입니다. 이름 또는 이메일을 확인해주세요.');
      return;
    }
    setError(null);
    setLoading(true);
    const createdId = await onCreateUser({
      name: form.name.trim(),
      rank: (form.rank.trim() || '전임') as UserRank,
      email: form.email.trim(),
      phone: form.phone.trim()
    });
    setLoading(false);
    if (!createdId) {
      setError('사용자 생성에 실패했습니다.');
      return;
    }
    onUserCreated(createdId);
    onClose();
    setForm({ name: '', rank: '', email: '', phone: '' });
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      title="사용자 추가"
      size="lg"
      busy={loading}
      submitLabel="생성"
      onSubmit={handleSubmit}
      error={error}
    >
      <div>
        <label className="text-xs text-tx-tertiary block mb-1">이름</label>
        <input
          className="w-full rounded-lg border border-ln bg-input-bg px-3 py-2 text-sm text-input-text focus:outline-none focus:ring-2 focus:ring-accent/60"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="홍길동"
        />
      </div>
      <div>
        <label className="text-xs text-tx-tertiary block mb-1">직급</label>
        <input
          className="w-full rounded-lg border border-ln bg-input-bg px-3 py-2 text-sm text-input-text focus:outline-none focus:ring-2 focus:ring-accent/60"
          value={form.rank}
          onChange={(e) => setForm((prev) => ({ ...prev, rank: e.target.value as UserRank | '' }))}
          placeholder="선임"
        />
      </div>
      <div>
        <label className="text-xs text-tx-tertiary block mb-1">이메일</label>
        <input
          className="w-full rounded-lg border border-ln bg-input-bg px-3 py-2 text-sm text-input-text focus:outline-none focus:ring-2 focus:ring-accent/60"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          placeholder="name@company.com"
        />
      </div>
      <div>
        <label className="text-xs text-tx-tertiary block mb-1">연락처</label>
        <input
          className="w-full rounded-lg border border-ln bg-input-bg px-3 py-2 text-sm text-input-text focus:outline-none focus:ring-2 focus:ring-accent/60"
          value={form.phone}
          onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
          placeholder="010-0000-0000"
        />
      </div>
    </FormModal>
  );
}
