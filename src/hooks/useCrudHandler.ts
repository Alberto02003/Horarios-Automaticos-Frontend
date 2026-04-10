import { useState } from "react";

/**
 * Generic CRUD state handler for modal-based entity management.
 * Manages: showForm, editing item, confirm delete item.
 */
export function useCrudHandler<T extends { id: number }>() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<T | null>(null);

  const openCreate = () => { setEditing(null); setShowForm(true); };
  const openEdit = (item: T) => { setEditing(item); setShowForm(true); };
  const closeForm = () => { setEditing(null); setShowForm(false); };
  const openDelete = (item: T) => setConfirmDelete(item);
  const closeDelete = () => setConfirmDelete(null);

  return {
    showForm, setShowForm,
    editing,
    confirmDelete, setConfirmDelete,
    openCreate, openEdit, closeForm,
    openDelete, closeDelete,
  };
}
