import { useState } from 'react';
import { BackIcon, PlusIcon, EditIcon, TrashIcon, UpIcon, DownIcon, CheckIcon } from '../icons';
import ExerciseFormSheet from './ExerciseFormSheet';

export default function WorkoutBuilder({ data, dayKey, onBack, onAdd, onUpdate, onDelete, onReorder }) {
  const day = data.days[dayKey];
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const editingExercise = day.exercises.find((e) => e.id === editingId);

  const openAdd = () => { setEditingId(null); setFormOpen(true); };
  const openEdit = (id) => { setEditingId(id); setFormOpen(true); };

  const handleSave = (payload) => {
    if (editingId) onUpdate(dayKey, editingId, payload);
    else onAdd(dayKey, payload);
    setFormOpen(false);
    setEditingId(null);
  };

  return (
    <>
      <div className="topbar">
        <button className="icon-btn" onClick={onBack}><BackIcon width={18} height={18} /></button>
        <div className="brand">{day.label}<span className="dot">.</span></div>
        <button className="icon-btn" onClick={openAdd}><PlusIcon width={18} height={18} /></button>
      </div>
      <main>
        <div className="page-title stencil">Build Day</div>
        <div className="page-sub">Add, edit, reorder, or remove exercises for {day.label.toLowerCase()} day.</div>

        {day.exercises.length === 0 && (
          <div className="empty">
            <div className="stencil">No exercises yet</div>
            <div>Tap + to add your first movement.</div>
          </div>
        )}

        {day.exercises.map((ex, i) => (
          <div className="exercise-row" key={ex.id}>
            <div className="idx mono">{i + 1}</div>
            <div className="info">
              <div className="name">{ex.name}</div>
              <div className="spec">{ex.sets} sets · {ex.repMin}-{ex.repMax} reps</div>
            </div>
            <div className="reorder">
              <button className="reorder-btn" disabled={i === 0} onClick={() => onReorder(dayKey, i, -1)}>
                <UpIcon width={12} height={12} />
              </button>
              <button className="reorder-btn" disabled={i === day.exercises.length - 1} onClick={() => onReorder(dayKey, i, 1)}>
                <DownIcon width={12} height={12} />
              </button>
            </div>
            <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={() => openEdit(ex.id)}>
              <EditIcon width={15} height={15} />
            </button>
            {confirmDeleteId === ex.id ? (
              <button className="icon-btn" style={{ width: 34, height: 34, borderColor: 'var(--danger)' }} onClick={() => { onDelete(dayKey, ex.id); setConfirmDeleteId(null); }}>
                <CheckIcon width={15} height={15} color="var(--danger)" />
              </button>
            ) : (
              <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={() => setConfirmDeleteId(ex.id)}>
                <TrashIcon width={15} height={15} />
              </button>
            )}
          </div>
        ))}

        <button className="btn btn-ghost btn-block" onClick={openAdd} style={{ marginTop: 8 }}>
          <PlusIcon width={16} height={16} /> Add Exercise
        </button>
      </main>

      {formOpen && (
        <ExerciseFormSheet
          initial={editingExercise}
          onSave={handleSave}
          onClose={() => { setFormOpen(false); setEditingId(null); }}
        />
      )}
    </>
  );
}
