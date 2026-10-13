import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function AppLayout({ children, boards = [] }) {
  return (
    <div className="app-shell">
      <Sidebar boards={boards} />
      <div>
        <Navbar />
        <main>{children}</main>
      </div>
    </div>
  );
}
