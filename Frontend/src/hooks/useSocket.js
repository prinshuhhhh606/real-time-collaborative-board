import { useEffect, useState } from 'react';
import { getSocket } from '../services/socketService';

export default function useSocket(boardId) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('kanban_token');
    if (!token || !boardId) return;

    const instance = getSocket();
    instance.auth = { token };
    instance.emit('board:join', boardId);
    setSocket(instance);

    return () => {
      instance.off('board:join');
    };
  }, [boardId]);

  return socket;
}
