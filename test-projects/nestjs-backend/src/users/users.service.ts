import { Injectable, NotFoundException } from '@nestjs/common';

interface User {
  id: string;
  email: string;
  name: string;
}

@Injectable()
export class UsersService {
  private users: User[] = [
    { id: '1', email: 'test@test.com', name: 'Test User' }
  ];

  findAll(): User[] {
    return this.users;
  }

  findOne(id: string): User {
    const user = this.users.find(u => u.id === id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  create(data: { email: string; name: string }): User {
    const user = { id: String(this.users.length + 1), ...data };
    this.users.push(user);
    return user;
  }

  update(id: string, data: Partial<User>): User {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) throw new NotFoundException('User not found');
    this.users[index] = { ...this.users[index], ...data };
    return this.users[index];
  }

  remove(id: string): void {
    const index = this.users.findIndex(u => u.id === id);
    if (index !== -1) this.users.splice(index, 1);
  }
}
