import { Link } from 'react-router-dom';

export default function Sidebar({ boards = [] }) {
  return (
    <aside className="sidebar">
      <div className="brand-block">
        <span className="brand-mark">K</span>
        <div>
          <strong>Kanban</strong>
          <small>Workspace</small>
        </div>
      </div>

      <div className="sidebar-section">
        <h4>Projects</h4>
        <div className="sidebar-board-list">
          {boards.map((board) => (
            <Link key={board._id} className="board-link" to={`/boards/${board._id}`}>
              {board.title}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
