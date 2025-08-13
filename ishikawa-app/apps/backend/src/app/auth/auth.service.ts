import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs-extra';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { User, AuthResponse, JwtPayload } from './user.interface';
import { RegisterDto, LoginDto } from './auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly usersDbPath = join(__dirname, '../../users.json');
  private usersDb: { users: User[] } = { users: [] };

  constructor(private readonly jwtService: JwtService) {
    this.loadUsersDb();
  }

  private loadUsersDb(): void {
    try {
      if (fs.existsSync(this.usersDbPath)) {
        this.usersDb = fs.readJsonSync(this.usersDbPath);
      } else {
        // Create initial admin user
        this.createInitialUsers();
      }
    } catch (error) {
      this.logger.error('Error loading users database', error);
      this.usersDb = { users: [] };
    }
  }

  private saveUsersDb(): void {
    try {
      fs.writeJsonSync(this.usersDbPath, this.usersDb, { spaces: 2 });
    } catch (error) {
      this.logger.error('Error saving users database', error);
    }
  }

  private async createInitialUsers(): Promise<void> {
    const adminUser: User = {
      id: uuidv4(),
      email: 'admin@kla.com',
      password: await bcrypt.hash('admin123', 10),
      name: 'KLA Administrator',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const demoUser: User = {
      id: uuidv4(),
      email: 'demo@kla.com',
      password: await bcrypt.hash('demo123', 10),
      name: 'Demo User',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.usersDb.users = [adminUser, demoUser];
    this.saveUsersDb();
    this.logger.log('Initial users created: admin@kla.com / demo@kla.com');
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, password, name } = registerDto;

    // Check if user already exists
    const existingUser = this.usersDb.users.find(user => user.email === email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser: User = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.usersDb.users.push(newUser);
    this.saveUsersDb();

    this.logger.log(`New user registered: ${email}`);

    // Generate JWT token
    const payload: JwtPayload = { sub: newUser.id, email: newUser.email, name: newUser.name };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    // Find user
    const user = this.usersDb.users.find(u => u.email === email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    this.logger.log(`User logged in: ${email}`);

    // Generate JWT token
    const payload: JwtPayload = { sub: user.id, email: user.email, name: user.name };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  async validateUserById(userId: string): Promise<Omit<User, 'password'> | null> {
    const user = this.usersDb.users.find(u => u.id === userId);
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getUserProfile(userId: string): Promise<Omit<User, 'password'>> {
    const user = await this.validateUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}
