import './BoardFilters.css';

export default function BoardFilters({ filters, members, onChange, onClear }) {
  return (
    <div className="filters-row">
      <select value={filters.priority} onChange={(e) => onChange('priority', e.target.value)}>
        <option value="all">All priorities</option>
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
        <option value="Urgent">Urgent</option>
      </select>

      <select value={filters.assignee} onChange={(e) => onChange('assignee', e.target.value)}>
        <option value="all">All assignees</option>
        {members.map((member) => (
          <option key={member._id} value={member._id}>{member.name}</option>
        ))}
      </select>

      <select value={filters.due} onChange={(e) => onChange('due', e.target.value)}>
        <option value="all">Any due date</option>
        <option value="overdue">Overdue</option>
        <option value="today">Due today</option>
        <option value="week">This week</option>
      </select>

      <button type="button" className="ghost-btn" onClick={onClear}>Clear filters</button>
    </div>
  );
}
