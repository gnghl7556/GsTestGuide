import { useMemo, useState } from 'react';

export interface PlContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
}

interface PlDirectoryPageProps {
  data: PlContact[];
  onAdd: (input: PlContactInput) => void;
  onDelete: (id: string) => void;
  dbReady: boolean;
}

export interface PlContactInput {
  name: string;
  role: string;
  phone: string;
  email: string;
}

const emptyForm = {
  name: '',
  role: '',
  phone: '',
  email: ''
};

export function PlDirectoryPage({ data, onAdd, onDelete, dbReady }: PlDirectoryPageProps) {
  const [form, setForm] = useState(emptyForm);
  const canAdd = useMemo(() => {
    return form.name.trim() && form.phone.trim() && form.email.trim();
  }, [form]);

  const addContact = () => {
    if (!canAdd) return;
    onAdd({
      name: form.name.trim(),
      role: form.role.trim() || 'PL',
      phone: form.phone.trim(),
      email: form.email.trim()
    });
    setForm(emptyForm);
  };

  const removeContact = (id: string) => {
    onDelete(id);
  };

  return (
    <section className="h-full bg-surface-base rounded-xl border border-ln shadow-sm p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-tx-primary">PL 담당자 관리</h2>
          <p className="text-sm text-tx-tertiary">담당자 정보를 등록해 체크리스트에서 선택할 수 있습니다.</p>
        </div>
      </div>

      {!dbReady && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Firestore 연결이 확인되지 않았습니다. `.env` 설정을 확인해주세요.
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
        <div className="rounded-xl border border-ln bg-surface-raised p-4">
          <h3 className="text-sm font-bold text-tx-primary mb-3">담당자 등록</h3>
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-tx-secondary">
              성함
              <input
                className="mt-1 w-full rounded-lg border border-ln bg-surface-base px-3 py-2 text-sm"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="예: 모상현"
              />
            </label>
            <label className="block text-xs font-semibold text-tx-secondary">
              직급/역할
              <input
                className="mt-1 w-full rounded-lg border border-ln bg-surface-base px-3 py-2 text-sm"
                value={form.role}
                onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                placeholder="예: 전임"
              />
            </label>
            <label className="block text-xs font-semibold text-tx-secondary">
              연락처
              <input
                className="mt-1 w-full rounded-lg border border-ln bg-surface-base px-3 py-2 text-sm"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="예: 010-1234-5678"
              />
            </label>
            <label className="block text-xs font-semibold text-tx-secondary">
              이메일
              <input
                className="mt-1 w-full rounded-lg border border-ln bg-surface-base px-3 py-2 text-sm"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="예: 담당자@tta.or.kr"
              />
            </label>
            <button
              type="button"
              disabled={!canAdd}
              onClick={addContact}
              className={`w-full rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                canAdd
                  ? 'bg-accent text-white hover:bg-accent-hover'
                  : 'bg-surface-sunken text-tx-muted cursor-not-allowed'
              }`}
            >
              등록
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {data.length === 0 ? (
            <div className="rounded-xl border border-dashed border-ln p-6 text-sm text-tx-muted">
              등록된 담당자가 없습니다.
            </div>
          ) : (
            data.map((item) => (
              <div key={item.id} className="rounded-xl border border-ln bg-surface-base p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-tx-primary">
                    {item.name} <span className="text-tx-muted font-medium">({item.role})</span>
                  </div>
                  <div className="text-xs text-tx-tertiary mt-1">{item.phone}</div>
                  <div className="text-xs text-tx-tertiary">{item.email}</div>
                </div>
                <button
                  type="button"
                  onClick={() => removeContact(item.id)}
                  className="text-xs font-semibold text-tx-muted hover:text-tx-secondary"
                >
                  삭제
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
