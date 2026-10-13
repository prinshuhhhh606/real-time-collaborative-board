import './MemberAvatars.css';

export default function MemberAvatars({ members = [] }) {
  return (
    <div className="member-list">
      {members.map((member) => (
        <div key={member._id || member.email} className="member-pill-row">
          <span className="avatar-dot">{member.name?.[0] || '?'}</span>
          <span>{member.name || member.email}</span>
        </div>
      ))}
    </div>
  );
}
