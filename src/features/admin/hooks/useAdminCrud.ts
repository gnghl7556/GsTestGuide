import { useState, useCallback } from 'react';

export function useAdminCrud<T>(emptyForm: T) {
  const [form, setForm] = useState<T>(emptyForm);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const startAdd = useCallback(() => {
    setShowAddForm(true);
    setEditingKey(null);
    setForm(emptyForm);
  }, [emptyForm]);

  const startEdit = useCallback((key: string, data: T) => {
    setEditingKey(key);
    setShowAddForm(false);
    setForm(data);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingKey(null);
    setShowAddForm(false);
    setForm(emptyForm);
  }, [emptyForm]);

  const withBusy = useCallback(async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }, []);

  return {
    form, setForm,
    editingKey, setEditingKey,
    showAddForm, setShowAddForm,
    deleteTarget, setDeleteTarget,
    busy, setBusy,
    startAdd, startEdit, cancelEdit, withBusy,
  };
}
