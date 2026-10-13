import './CommentSection.css';

export default function CommentSection({ comments = [], onCommentSubmit }) {
  return (
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
      <button type="button" className="primary-btn" onClick={onCommentSubmit}>Add comment</button>
    </div>
  );
}
