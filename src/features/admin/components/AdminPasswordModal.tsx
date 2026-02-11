import { useState, useEffect, useRef } from 'react';
import { useAdminAuth } from '../hooks/useAdminAuth';

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

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-sm rounded-xl border border-ln bg-surface-base shadow-xl">
        <div className="border-b border-ln px-4 py-3 text-sm font-extrabold text-tx-primary">
          관리자 인증
        </div>
        <div className="px-4 py-4 space-y-3">
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
              className="w-full rounded-lg border border-ln px-3 py-2 text-sm text-tx-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="관리자 비밀번호 입력"
            />
          </div>
          {error && (
            <p className="text-xs font-semibold text-danger-text">{error}</p>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-ln px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-ln px-3 py-1.5 text-xs font-semibold text-tx-secondary hover:text-tx-primary"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
