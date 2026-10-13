import { CalendarDays, CircleUserRound } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './TaskCard.css';

const priorityColors = {
  Low: 'priority-low',
  Medium: 'priority-medium',
  High: 'priority-high',
  Urgent: 'priority-urgent',
};

export default function TaskCard({ task, onClick }) {
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate && dueDate < new Date() && task.status !== 'Done';
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      className={`task-card ${isDragging ? 'dragging' : ''}`}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <div className="task-card-top">
        <span className={`priority-badge ${priorityColors[task.priority] || 'priority-medium'}`}>{task.priority}</span>
      </div>
      <h4>{task.title}</h4>
      {task.description && <p className="task-description">{task.description}</p>}

      <div className="task-meta-row">
        <div className="mini-meta">
          <CircleUserRound size={14} />
          <span>{task.assignedTo ? task.assignedTo.name : 'Unassigned'}</span>
        </div>
        {dueDate && (
          <div className={`mini-meta ${isOverdue ? 'overdue' : ''}`}>
            <CalendarDays size={14} />
            <span>{dueDate.toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {isOverdue && <div className="overdue-pill">Overdue</div>}
    </button>
  );
}
