import { useState, type FormEvent } from 'react';
import { logger } from '../../../lib/logger';

export interface UseAdminCrudOptions<TItem, TForm> {
  emptyForm: TForm;
  itemToForm: (item: TItem) => TForm;
  getId: (item: TItem) => string;
  createFn: (payload: unknown) => Promise<void>;
  updateFn: (id: string, payload: unknown) => Promise<void>;
  deleteFn: (id: string) => Promise<void>;
  /** Build the API payload from form state. Called before create/update. */
  formToPayload: (form: TForm) => unknown;
  /** Optional pre-submit hook (e.g. image upload). Return updated form or throw to abort. */
  onBeforeSubmit?: (form: TForm) => Promise<TForm>;
  /** Called after successful create/update/delete */
  reload: () => void;
  deleteConfirmMessage?: string;
}

export interface UseAdminCrudResult<TForm> {
  showForm: boolean;
  editingId: string | null;
  form: TForm;
  setForm: React.Dispatch<React.SetStateAction<TForm>>;
  saving: boolean;
  error: string | null;
  deleteError: string | null;
  clearDeleteError: () => void;
  openNew: (defaults?: Partial<TForm>) => void;
  openEdit: (id: string, form: TForm) => void;
  handleSubmit: (e: FormEvent) => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
  closeForm: () => void;
}

export function useAdminCrud<TItem, TForm>(
  opts: UseAdminCrudOptions<TItem, TForm>
): UseAdminCrudResult<TForm> {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TForm>(opts.emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const openNew = (defaults?: Partial<TForm>) => {
    setEditingId(null);
    setForm(defaults ? { ...opts.emptyForm, ...defaults } : opts.emptyForm);
    setError(null);
    setShowForm(true);
  };

  const openEdit = (id: string, itemForm: TForm) => {
    setEditingId(id);
    setForm(itemForm);
    setError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      let finalForm = form;
      if (opts.onBeforeSubmit) {
        finalForm = await opts.onBeforeSubmit(form);
      }

      const payload = opts.formToPayload(finalForm);

      if (editingId) {
        await opts.updateFn(editingId, payload);
      } else {
        await opts.createFn(payload);
      }

      setShowForm(false);
      setEditingId(null);
      opts.reload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('Admin CRUD submit failed', err);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const msg = opts.deleteConfirmMessage ?? 'Удалить?';
    if (!confirm(msg)) return;

    setDeleteError(null);
    try {
      await opts.deleteFn(id);
      opts.reload();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error('Admin CRUD delete failed', err);
      setDeleteError(errMsg);
    }
  };

  return {
    showForm,
    editingId,
    form,
    setForm,
    saving,
    error,
    deleteError,
    clearDeleteError: () => setDeleteError(null),
    openNew,
    openEdit,
    handleSubmit,
    handleDelete,
    closeForm,
  };
}
