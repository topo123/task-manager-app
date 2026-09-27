const API_URL = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}, user) {
  if (!user) throw new Error('You must be signed in.');

  const token = await user.getIdToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

export const api = {
  listTasks: (user) => request('/api/tasks', {}, user),
  createTask: (user, task) => request('/api/tasks', { method: 'POST', body: JSON.stringify(task) }, user),
  updateTask: (user, id, task) => request(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(task) }, user),
  deleteTask: (user, id) => request(`/api/tasks/${id}`, { method: 'DELETE' }, user),
};
