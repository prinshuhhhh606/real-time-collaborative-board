import { createContext, useContext, useMemo, useReducer } from 'react';
import { boardService } from '../services/boardService';
import { taskService } from '../services/taskService';

const BoardContext = createContext(null);

const initialState = {
  boards: [],
  currentBoard: null,
  tasks: [],
  loading: false,
  error: '',
  filters: {
    priority: 'all',
    assignee: 'all',
    due: 'all',
  },
};

function boardReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_BOARDS':
      return { ...state, boards: action.payload, loading: false, error: '' };
    case 'SET_BOARD':
      return { ...state, currentBoard: action.payload.board, tasks: action.payload.tasks || [], loading: false, error: '' };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'UPDATE_TASKS':
      return { ...state, tasks: action.payload };
    default:
      return state;
  }
}

export function BoardProvider({ children }) {
  const [state, dispatch] = useReducer(boardReducer, initialState);

  const loadBoards = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await boardService.listBoards();
      dispatch({ type: 'SET_BOARDS', payload: response.boards || [] });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to load boards.' });
    }
  };

  const loadBoard = async (boardId) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await boardService.getBoard(boardId);
      dispatch({ type: 'SET_BOARD', payload: { board: response.board, tasks: response.tasks || [] } });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to load board.' });
    }
  };

  const createBoard = async (title) => {
    const response = await boardService.createBoard({ title });
    dispatch({ type: 'SET_BOARDS', payload: [...state.boards, response.board] });
    return response;
  };

  const syncBoardState = (board, tasks) => {
    dispatch({ type: 'SET_BOARD', payload: { board, tasks: tasks || [] } });
  };

  const updateTasks = (nextTasks) => {
    dispatch({ type: 'UPDATE_TASKS', payload: nextTasks });
  };

  const moveTask = async (taskId, status, position) => {
    const response = await taskService.moveTask(taskId, { status, position });
    const nextTasks = state.tasks.map((task) => (task._id === taskId ? response.task : task));
    dispatch({ type: 'UPDATE_TASKS', payload: nextTasks });
    return response;
  };

  const setFilters = (filters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  };

  const value = useMemo(
    () => ({
      ...state,
      loadBoards,
      loadBoard,
      createBoard,
      syncBoardState,
      updateTasks,
      moveTask,
      setFilters,
    }),
    [state]
  );

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
}

export function useBoard() {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoard must be used inside BoardProvider');
  }
  return context;
}
