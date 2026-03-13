import { useState, useEffect, useRef } from 'react';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { FormModal } from '../../../components/ui/FormModal';

type AdminPasswordModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function AdminPasswordModal({ open, onClose, onSuccess }: AdminPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { authenticate } = useAdminAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPassword('');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSubmit = () => {
    if (!password.trim()) {
      setError('비밀번호를 입력해주세요.');
      return;
    }
    const ok = authenticate(password);
    if (ok) {
      onSuccess();
    } else {
      setError('비밀번호가 틀렸습니다.');
      setPassword('');
      inputRef.current?.focus();
    }
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="관리자 인증"
      size="sm"
      onSubmit={handleSubmit}
      submitLabel="확인"
      cancelLabel="취소"
      error={error || null}
    >
      <div>
        <label className="block text-xs font-semibold text-tx-secondary mb-1">비밀번호</label>
        <input
          ref={inputRef}
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
          className="w-full rounded-lg border border-ln bg-input-bg px-3 py-2 text-sm text-tx-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
          placeholder="관리자 비밀번호 입력"
        />
      </div>
    </FormModal>
  );
}
