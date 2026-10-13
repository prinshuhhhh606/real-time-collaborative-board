
import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import TaskCard from './TaskCard';
import './KanbanColumn.css';

export default function KanbanColumn({
  title,
  tasks = [],
  onTaskClick,
  onMoveTask,
  onAddTask,
}) {
  const [taskTitle, setTaskTitle] = useState('');

  const { setNodeRef, isOver } = useDroppable({
    id: title,
  });

  const handleAddTask = (e) => {
    e.preventDefault();

    const trimmedTitle = taskTitle.trim();

    if (!trimmedTitle) return;

    if (onAddTask) {
      onAddTask({
        title: trimmedTitle,
        status: title,
      });
    }

    setTaskTitle('');
  };

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column ${isOver ? 'drop-active' : ''}`}
    >
      <div className="column-header">
        <h3>{title}</h3>
        <span>{tasks.length}</span>
      </div>

      <form className="quick-add-task" onSubmit={handleAddTask}>
        <input
          type="text"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          placeholder={`Add task to ${title}...`}
          aria-label={`New task for ${title}`}
        />

        <button type="submit" disabled={!taskTitle.trim()}>
          + Add
        </button>
      </form>

      <SortableContext
        items={tasks.map((task) => task._id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="task-list">
          {tasks.length === 0 ? (
            <div className="column-empty">
              No tasks yet. Add one above!
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onClick={() => onTaskClick?.(task)}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
