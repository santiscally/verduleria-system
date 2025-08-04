import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../entities/user.entity';
import { ILoginRequest, ILoginResponse } from '../types';

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  async login(credentials: ILoginRequest): Promise<ILoginResponse> {
    const { username, password } = credentials;

    const user = await this.userRepository.findOne({
      where: { username, is_active: true }
    });

    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Credenciales inválidas');
    }

    // Actualizar última fecha de login
    user.last_login = new Date();
    await this.userRepository.save(user);

    const payload = { id: user.id, username: user.username };
    const secret = process.env.JWT_SECRET || 'default_secret_key';
    const token = jwt.sign(payload, secret, { expiresIn: '7d' });

    return {
      token,
      user: {
        id: user.id,
        username: user.username
      }
    };
  }

  async createDefaultUser(): Promise<void> {
    const existingUser = await this.userRepository.findOne({
      where: { username: process.env.ADMIN_USERNAME || 'admin' }
    });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(
        process.env.ADMIN_PASSWORD || 'admin123',
        10
      );

      const defaultUser = this.userRepository.create({
        username: process.env.ADMIN_USERNAME || 'admin',
        password: hashedPassword,
        email: 'admin@verduleria.com',
        is_active: true
      });

      await this.userRepository.save(defaultUser);
      console.log('Usuario admin creado exitosamente');
    }
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const isValidPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Contraseña actual incorrecta');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);
  }
}