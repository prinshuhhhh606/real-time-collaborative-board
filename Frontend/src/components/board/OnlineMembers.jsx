import './OnlineMembers.css';

export default function OnlineMembers({ onlineUsers = [] }) {
  return (
    <div className="member-list">
      {onlineUsers.map((user) => (
        <div key={user._id || user.email} className="member-pill-row">
          <span className="avatar-dot">{user.name?.[0] || '?'}</span>
          <span>{user.name || 'Member'}</span>
        </div>
      ))}
    </div>
  );
}
