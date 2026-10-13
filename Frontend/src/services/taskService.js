
import api from './api';

export const taskService = {
  // Create a task inside a board
  createTask: async (boardId, payload) => {
    if (!boardId) {
      throw new Error('Board ID is required to create a task.');
    }

    const response = await api.post(
      `/boards/${boardId}/tasks`,
      payload
    );

    return response.data;
  },

  // Get all tasks for a board
  getTasks: async (boardId) => {
    if (!boardId) {
      throw new Error('Board ID is required to fetch tasks.');
    }

    const response = await api.get(`/boards/${boardId}/tasks`);
    return response.data;
  },

  // Update task details
  updateTask: async (taskId, payload) => {
    if (!taskId) {
      throw new Error('Task ID is required to update a task.');
    }

    const response = await api.patch(`/tasks/${taskId}`, payload);
    return response.data;
  },

  // Move task to another column or position
  moveTask: async (taskId, payload) => {
    if (!taskId) {
      throw new Error('Task ID is required to move a task.');
    }

    const response = await api.patch(
      `/tasks/${taskId}/move`,
      payload
    );

    return response.data;
  },

  // Delete a task
  deleteTask: async (taskId) => {
    if (!taskId) {
      throw new Error('Task ID is required to delete a task.');
    }

    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  },

  // Get comments for a task
  getComments: async (taskId) => {
    if (!taskId) {
      throw new Error('Task ID is required to fetch comments.');
    }

    const response = await api.get(
      `/comments/tasks/${taskId}/comments`
    );

    return response.data;
  },

  // Add a comment to a task
  createComment: async (taskId, payload) => {
    if (!taskId) {
      throw new Error('Task ID is required to create a comment.');
    }

    const response = await api.post(
      `/comments/tasks/${taskId}/comments`,
      payload
    );

    return response.data;
  },
};
