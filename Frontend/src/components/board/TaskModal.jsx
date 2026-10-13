import { useEffect, useState } from 'react';
import { taskService } from '../../services/taskService';
import './TaskModal.css';

export default function TaskModal({ task, members, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    dueDate: '',
    assignedTo: '',
    status: 'Todo',
  });
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    if (!task) return;

    setForm({
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'Medium',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      assignedTo: task.assignedTo?._id || '',
      status: task.status || 'Todo',
    });

    const loadComments = async () => {
      try {
        const response = await taskService.getComments(task._id);
        setComments(response.comments || []);
      } catch (error) {
        console.error('Unable to load comments', error);
      }
    };

    loadComments();
  }, [task]);

  const handleSave = (event) => {
    event.preventDefault();
    onSave({
      ...form,
      assignedTo: form.assignedTo || null,
    });
  };

  const handleComment = async () => {
    if (!commentText.trim() || !task) return;
    const response = await taskService.createComment(task._id, { text: commentText.trim() });
    setComments((current) => [...current, response.comment]);
    setCommentText('');
  };

  if (!task) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card wide-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit task</h3>
          <button onClick={onClose}>×</button>
        </div>

        <div className="task-modal-body">
          <form onSubmit={handleSave} className="stack-form">
            <label>
              Title
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </label>
   
            <label>
              Description
              <textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
                Status
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

            <div className="modal-actions">
              <button type="button" className="danger-btn" onClick={() => onDelete(task._id)}>
                Delete task
              </button>
              <button type="submit" className="primary-btn">Save changes</button>
            </div>
          </form>

          <div className="comment-panel">
            <h4>Comments</h4>
            <div className="comment-list">
              {comments.length === 0 ? <p className="muted">No comments yet.</p> : comments.map((comment) => (
                <div key={comment._id} className="comment-item">
                  <strong>{comment.author?.name || 'Member'}</strong>
                  <span>{comment.text}</span>
                </div>
              ))}
            </div>

            <div className="comment-compose">
              <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} rows={3} placeholder="Write a comment..." />
              <button type="button" className="primary-btn" onClick={handleComment}>Add comment</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
