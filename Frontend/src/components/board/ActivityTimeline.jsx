import './ActivityTimeline.css';



export default function ActivityTimeline({ activities = [] }) {
  return (
    <div className="comment-list">
      {activities.length === 0 ? (
        <p className="muted">No activity yet.</p>
      ) : (
        activities.map((entry) => (
          <div key={entry._id} className="comment-item">
            <strong>{entry.actor?.name || 'Someone'}</strong>
            <span>{entry.action}</span>
          </div>
        ))
      )}
    </div>
  );
}
