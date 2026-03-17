export interface User {
  id: string;
  email: string;
  name: string;
}

export async function fetchUsers(): Promise<User[]> {
  const response = await fetch('/api/users');
  return response.json();
}

export async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

export async function createUser(data: Partial<User>): Promise<User> {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}

export async function updateUser(id: string, data: Partial<User>): Promise<User> {
  const response = await fetch(`/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}

export async function deleteUser(id: string): Promise<void> {
  await fetch(`/api/users/${id}`, { method: 'DELETE' });
}
