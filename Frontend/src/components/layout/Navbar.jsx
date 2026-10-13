import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="brand-block">
        <span className="brand-mark">K</span>
        <div>
          <strong>Kanban Board</strong>
          <small>{user?.name}</small>
        </div>
      </div>

      <button className="ghost-btn" onClick={logout}>
        <LogOut size={16} />
        Logout
      </button>
    </header>
  );
}
