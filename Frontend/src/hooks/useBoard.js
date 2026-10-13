import { useEffect, useState } from 'react';
import { boardService } from '../services/boardService';

export default function useBoard(boardId) {
  const [board, setBoard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!boardId) return;

    const fetchBoard = async () => {
      try {
        setLoading(true);
        const data = await boardService.getBoard(boardId);
        setBoard(data.board);
        setTasks(data.tasks || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to fetch board.');
      } finally {
        setLoading(false);
      }
    };

    fetchBoard();
  }, [boardId]);

  return { board, tasks, loading, error, setTasks };
}
