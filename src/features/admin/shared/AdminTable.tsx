import type { ReactNode } from 'react';

type Column = {
  label: string;
  className?: string;
  align?: 'left' | 'right';
};

type AdminTableProps = {
  columns: Column[];
  children: ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
  headerSlot?: ReactNode;
};

export function AdminTable({ columns, children, emptyMessage = '데이터가 없습니다.', isEmpty, headerSlot }: AdminTableProps) {
  return (
    <div className="rounded-xl border border-ln bg-surface-base overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ln bg-surface-raised">
              {headerSlot}
              {columns.filter((c) => !headerSlot || c.label !== '').map((col, i) => (
                <th
                  key={i}
                  className={`px-4 py-3 text-xs font-bold text-tx-secondary ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  } ${col.className ?? ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {children}
            {isEmpty && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-tx-muted">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
