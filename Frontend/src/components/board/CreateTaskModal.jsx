import { useState } from 'react';
import './CreateTaskModal.css';

export default function CreateTaskModal({ isOpen, onClose, onSubmit, members }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    status: 'Todo',
    assignedTo: '',
    dueDate: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
    setForm({
      title: '',
      description: '',
      priority: 'Medium',
      status: 'Todo',
      assignedTo: '',
      dueDate: '',
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create task</h3>
          <button onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="stack-form">
          <label>
            Title
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </label>

          <label>
            Description
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
          </label>

          <div className="two-col-form">
            <label>
              Priority
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Urgent</option>
              </select>
            </label>

            <label>
              Column
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option>Todo</option>
                <option>In Progress</option>
                <option>Review</option>
                <option>Done</option>
              </select>
            </label>
          </div>

          <div className="two-col-form">
            <label>
              Assignee
              <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member._id} value={member._id}>{member.name}</option>
                ))}
              </select>
            </label>

            <label>
              Due date
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </label>
          </div>

          <button type="submit" className="primary-btn">Create task</button>
        </form>
      </div>
    </div>
  );
}
