import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async validateUser(email: string, password: string): Promise<any> {
    // Simplified for testing
    if (email === 'test@test.com' && password === 'password') {
      return { id: 1, email, role: 'admin' };
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email }
    };
  }

  async register(email: string, password: string) {
    // Simplified for testing
    return { id: 2, email };
  }
}
