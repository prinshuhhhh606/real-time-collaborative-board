
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

import { useAuth } from '../context/AuthContext';
import { boardService } from '../services/boardService';
import { taskService } from '../services/taskService';
import { getSocket } from '../services/socketService';

import BoardHeader from '../components/board/BoardHeader';
import BoardFilters from '../components/board/BoardFilters';
import KanbanColumn from '../components/board/KanbanColumn';
import CreateTaskModal from '../components/board/CreateTaskModal';
import TaskModal from '../components/board/TaskModal';

const STATUSES = ['Todo', 'In Progress', 'Review', 'Done'];

const getErrorMessage = (err, fallback) => {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback
  );
};

export default function BoardPage() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [board, setBoard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({
    priority: 'all',
    assignee: 'all',
    due: 'all',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const loadBoard = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await boardService.getBoard(boardId);

      if (!response?.board) {
        throw new Error('Board data was not returned by the server.');
      }

      setBoard(response.board);
      setMembers(
        response.board.members?.map((member) => member.user).filter(Boolean) || []
      );
      setTasks(response.tasks || []);
    } catch (err) {
      console.error('Load board error:', err.response?.data || err);
      setError(getErrorMessage(err, 'Unable to load board.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (boardId) {
      loadBoard();
    }
  }, [boardId]);

  useEffect(() => {
    const token = localStorage.getItem('kanban_token');

    if (!token || !boardId) return;

    const socket = getSocket();
    socket.auth = { token };

    const handleBoardSync = (data) => {
      if (data?.board) {
        setBoard(data.board);
        setMembers(
          data.board.members?.map((member) => member.user).filter(Boolean) || []
        );
      }

      if (data?.tasks) {
        setTasks(data.tasks);
      }
    };

    const handleTaskCreated = ({ task }) => {
      if (!task) return;

      setTasks((current) => [
        ...current.filter((item) => item._id !== task._id),
        task,
      ]);
    };

    const handleTaskUpdated = ({ task }) => {
      if (!task) return;

      setTasks((current) =>
        current.map((item) => (item._id === task._id ? task : item))
      );
    };

    const handleTaskMoved = ({ task }) => {
      if (!task) return;

      setTasks((current) =>
        current.map((item) => (item._id === task._id ? task : item))
      );
    };

    const handleTaskDeleted = ({ taskId }) => {
      setTasks((current) => current.filter((item) => item._id !== taskId));
    };

    // Register listeners before joining the board.
    socket.on('board:sync', handleBoardSync);
    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:moved', handleTaskMoved);
    socket.on('task:deleted', handleTaskDeleted);

    socket.emit('board:join', boardId);

    return () => {
      socket.off('board:sync', handleBoardSync);
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:moved', handleTaskMoved);
      socket.off('task:deleted', handleTaskDeleted);
    };
  }, [boardId]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (
        filters.priority !== 'all' &&
        task.priority !== filters.priority
      ) {
        return false;
      }

      const assignedUserId =
        task.assignedTo?._id || task.assignedTo;

      if (
        filters.assignee !== 'all' &&
        String(assignedUserId || '') !== String(filters.assignee)
      ) {
        return false;
      }

      if (filters.due === 'overdue') {
        if (!task.dueDate) return false;

        const deadline = new Date(task.dueDate);

        if (
          Number.isNaN(deadline.getTime()) ||
          deadline >= new Date() ||
          task.status === 'Done'
        ) {
          return false;
        }
      }

      if (filters.due === 'today') {
        if (!task.dueDate) return false;

        const deadline = new Date(task.dueDate);

        if (
          Number.isNaN(deadline.getTime()) ||
          deadline.toDateString() !== new Date().toDateString()
        ) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, filters]);

  const groupedTasks = useMemo(() => {
    return Object.fromEntries(
      STATUSES.map((status) => [
        status,
        filteredTasks
          .filter((task) => task.status === status)
          .sort(
            (a, b) =>
              (a.position || 0) - (b.position || 0)
          ),
      ])
    );
  }, [filteredTasks]);

  const handleCreateTask = async (payload) => {
    if (isCreating) return;

    if (!boardId) {
      setError('Board ID is missing. Please reopen the board.');
      return;
    }

    if (!payload || typeof payload !== 'object') {
      setError('Invalid task details. Please try again.');
      return;
    }

    // Supports common title field names used by task forms.
    const title = String(payload.title || payload.name || '').trim();

    if (!title) {
      setError('Please enter a task title.');
      return;
    }

    const status = STATUSES.includes(payload.status)
      ? payload.status
      : 'Todo';

    const taskPayload = {
      ...payload,
      title,
      status,
      assignedTo: payload.assignedTo || null,
      dueDate: payload.dueDate || null,
    };

    try {
      setIsCreating(true);
      setError('');

      console.log('Creating task:', {
        boardId,
        payload: taskPayload,
      });

      await taskService.createTask(boardId, taskPayload);

      setCreateModalOpen(false);
      await loadBoard();
    } catch (err) {
      console.error('Create task failed:', {
        message: err.message,
        status: err.response?.status,
        response: err.response?.data,
      });

      setError(
        getErrorMessage(err, 'Unable to create task. Check the server logs.')
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveTask = async (payload) => {
    if (!editingTask?._id) return;

    try {
      setError('');

      await taskService.updateTask(editingTask._id, payload);

      setEditingTask(null);
      await loadBoard();
    } catch (err) {
      console.error('Update task error:', err.response?.data || err);
      setError(getErrorMessage(err, 'Unable to save this task.'));
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!taskId) return;

    try {
      setError('');

      await taskService.deleteTask(taskId);

      setEditingTask(null);
      await loadBoard();
    } catch (err) {
      console.error('Delete task error:', err.response?.data || err);
      setError(getErrorMessage(err, 'Unable to delete task.'));
    }
  };

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;

    const sourceTask = tasks.find(
      (task) => String(task._id) === String(active.id)
    );

    if (!sourceTask) return;

    const targetTask = tasks.find(
      (task) => String(task._id) === String(over.id)
    );

    const targetStatus = STATUSES.includes(String(over.id))
      ? String(over.id)
      : targetTask?.status || sourceTask.status;

    if (!STATUSES.includes(targetStatus)) return;

    // Avoid unnecessary API requests for a same-column drop.
    if (sourceTask.status === targetStatus && targetTask) return;

    try {
      setError('');

      const nextPosition = groupedTasks[targetStatus]?.length || 0;

      await taskService.moveTask(sourceTask._id, {
        status: targetStatus,
        position: nextPosition,
      });

      await loadBoard();
    } catch (err) {
      console.error('Move task error:', err.response?.data || err);
      setError(getErrorMessage(err, 'Task move failed.'));
    }
  };

  if (loading) {
    return <div className="page-loading">Loading board...</div>;
  }

  if (!board) {
    return (
      <div className="page-empty">
        <p>{error || 'Board not found.'}</p>
        <button onClick={() => navigate('/')}>
          Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="app-shell board-view">
      <aside className="sidebar">
        <div className="brand-block">
          <span className="brand-mark">K</span>
          <div>
            <strong>{board.title}</strong>
            <small>{user?.name}</small>
          </div>
        </div>

        <button
          className="ghost-btn full-width"
          onClick={() => navigate('/')}
        >
          Back to dashboard
        </button>

        <div className="sidebar-section">
          <h4>Members</h4>

          <div className="member-list">
            {members.map((member) => (
              <div key={member._id} className="member-pill-row">
                <span className="avatar-dot">
                  {member.name?.[0] || '?'}
                </span>
                <span>{member.name}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="board-main-panel">
        <BoardHeader
          board={board}
          memberCount={members.length}
          onCreateTask={() => {
            setError('');
            setCreateModalOpen(true);
          }}
        />

        <BoardFilters
          filters={filters}
          members={members}
          onChange={(key, value) =>
            setFilters((current) => ({
              ...current,
              [key]: value,
            }))
          }
          onClear={() =>
            setFilters({
              priority: 'all',
              assignee: 'all',
              due: 'all',
            })
          }
        />

        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          <div className="kanban-board">
            {STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                title={status}
                tasks={groupedTasks[status] || []}
                onTaskClick={(task) => setEditingTask(task)}
              />
            ))}
          </div>
        </DndContext>
      </main>

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateTask}
        members={members}
      />

      <TaskModal
        task={editingTask}
        members={members}
        onClose={() => setEditingTask(null)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />
    </div>
  );
}
