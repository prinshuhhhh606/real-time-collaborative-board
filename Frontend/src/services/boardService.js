import api from './api';

export const boardService = {
  listBoards: async () => {
    const response = await api.get('/boards');
    return response.data;
  },
  createBoard: async (payload) => {
    const response = await api.post('/boards', payload);
    return response.data;
  },
  getBoard: async (boardId) => {
    const response = await api.get(`/boards/${boardId}`);
    return response.data;
  },
  updateBoard: async (boardId, payload) => {
    const response = await api.patch(`/boards/${boardId}`, payload);
    return response.data;
  },
  addMember: async (boardId, payload) => {
    const response = await api.post(`/boards/${boardId}/members`, payload);
    return response.data;
  },
  removeMember: async (boardId, memberId) => {
    const response = await api.delete(`/boards/${boardId}/members/${memberId}`);
    return response.data;
  },
  getBoardActivity: async (boardId) => {
    const response = await api.get(`/activity/boards/${boardId}/activity`);
    return response.data;
  },
};

export const BoardService = boardService;
