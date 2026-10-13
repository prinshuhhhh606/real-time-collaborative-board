import { Plus } from 'lucide-react';
import './BoardHeader.css';

export default function BoardHeader({ board, onCreateTask, memberCount }) {
  return (
    <header className="board-header">
      <div>
        <p className="eyebrow">Board</p>
        <h1>{board?.title || 'Board'}</h1>
      </div>

      <div className="board-header-actions">
        <span className="member-pill">{memberCount} members</span>
        <button className="primary-btn" onClick={onCreateTask}>
          <Plus size={16} />
          Add task
        </button>
      </div>
    </header>
  );
}
