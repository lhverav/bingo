export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'host' | 'admin';
}

const mockUsers: User[] = [
  {
    id: '1',
    email: 'host@bingo.com',
    password: '123456',
    name: 'Host Principal',
    role: 'host',
  },
  {
    id: '2',
    email: 'admin@bingo.com',
    password: 'admin123',
    name: 'Administrador',
    role: 'admin',
  },
];

export function findUser(email: string, password: string): User | undefined {
  return mockUsers.find(
    (user) => user.email === email && user.password === password
  );
}

export function getUserById(id: string): User | undefined {
  return mockUsers.find((user) => user.id === id);
}
