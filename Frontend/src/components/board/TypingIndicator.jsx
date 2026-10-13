import './TypingIndicator.css';

export default function TypingIndicator({ users = [] }) {
  if (!users.length) return null;

  return (
    <div className="typing-indicator">
      {users.map((user) => user.name).join(', ')} is typing...
    </div>
  );
}
