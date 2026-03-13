import type { User as AppUser } from '../../../../types';
import { BaseModal } from '../../../../components/ui/BaseModal';

interface ManageUsersModalProps {
  open: boolean;
  onClose: () => void;
  users: AppUser[];
  onOpenCreateUser: () => void;
  onEditUser: (user: AppUser) => void;
  onDeleteUser: (user: { id: string; name: string }) => void;
}

export function ManageUsersModal({
  open,
  onClose,
  users,
  onOpenCreateUser,
  onEditUser,
  onDeleteUser
}: ManageUsersModalProps) {
  return (
    <BaseModal open={open} onClose={onClose} size="2xl">
      <div className="flex items-center justify-between border-b border-ln px-5 py-4">
        <div className="text-sm font-extrabold text-tx-primary">사용자 관리</div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-ln px-2 py-1 text-xs font-semibold text-tx-tertiary hover:text-tx-primary"
        >
          닫기
        </button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto px-5 py-4 space-y-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-ln bg-surface-sunken px-4 py-3"
          >
            <div className="text-xs text-tx-secondary">
              <div className="text-sm font-semibold text-tx-primary">
                {user.name} {user.rank ? `(${user.rank})` : ''}
              </div>
              <div>{user.email || '이메일 미등록'}</div>
              <div>{user.phone || '연락처 미등록'}</div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onEditUser(user)}
                className="rounded-md border border-ln bg-interactive-hover px-3 py-1 text-xs font-semibold text-tx-secondary hover:bg-surface-sunken"
              >
                수정
              </button>
              <button
                type="button"
                onClick={() => onDeleteUser({ id: user.id, name: user.name })}
                className="rounded-md border border-danger/40 bg-danger-subtle px-3 py-1 text-xs font-semibold text-danger-text hover:bg-danger/20"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <div className="text-xs text-tx-muted">등록된 사용자가 없습니다.</div>
        )}
      </div>
      <div className="border-t border-ln px-5 py-3 flex justify-end">
        <button
          type="button"
          onClick={onOpenCreateUser}
          className="rounded-md border border-ln bg-interactive-hover px-4 py-2 text-xs font-semibold text-tx-secondary hover:bg-surface-sunken"
        >
          사용자 추가
        </button>
      </div>
    </BaseModal>
  );
}
