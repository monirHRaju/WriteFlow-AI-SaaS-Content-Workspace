import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import config from '../../config';
import AppError from '../../errors/AppError';
import { AuthRepository } from './auth.repository';
import { TSanitizedUser, TLoginResponse, TRegisterResponse, TRefreshResponse } from './auth.types';
import { User, Prisma } from '@prisma/client';

export class AuthService {
  // Sanitize user output (never return password)
  private static sanitizeUser(user: User): TSanitizedUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      plan: user.plan,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  // Token helper: Access Token (15 minutes)
  private static generateAccessToken(payload: { id: string; email: string; role: string }): string {
    return jwt.sign(payload, config.jwt.secret, { expiresIn: '15m' });
  }

  // Token helper: Refresh Token (7 days)
  private static generateRefreshToken(payload: { id: string }): string {
    return jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: '7d' });
  }

  // Register operational handler
  static async register(payload: Prisma.UserCreateInput): Promise<TRegisterResponse> {
    const existingUser = await AuthRepository.findByEmail(payload.email);
    if (existingUser) {
      throw new AppError(StatusCodes.CONFLICT, 'An account with this email address already exists.');
    }

    // Cryptographic password hashing (salt rounds = 12)
    const hashedPassword = await bcrypt.hash(payload.password, 12);

    // Save and retrieve
    const newUser = await AuthRepository.createUser({
      ...payload,
      password: hashedPassword,
    });

    // Sign Access & Refresh tokens
    const tokenPayload = { id: newUser.id, email: newUser.email, role: newUser.role };
    const accessToken = this.generateAccessToken(tokenPayload);
    const refreshToken = this.generateRefreshToken({ id: newUser.id });

    return {
      user: this.sanitizeUser(newUser),
      accessToken,
      refreshToken,
    };
  }

  // Login operational handler
  static async login(payload: Prisma.UserCreateInput): Promise<TLoginResponse> {
    const user = await AuthRepository.findByEmail(payload.email);
    if (!user) {
      throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid credentials provided.');
    }

    // Safe comparison of hashes
    const isPasswordMatch = await bcrypt.compare(payload.password, user.password);
    if (!isPasswordMatch) {
      throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid credentials provided.');
    }

    // Safety checks
    if (!user.isActive) {
      throw new AppError(StatusCodes.FORBIDDEN, 'Your account is currently deactivated.');
    }

    // Generate tokens
    const tokenPayload = { id: user.id, email: user.email, role: user.role };
    const accessToken = this.generateAccessToken(tokenPayload);
    const refreshToken = this.generateRefreshToken({ id: user.id });

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  // Refresh Token validation handler (rotates refresh token)
  static async refresh(token: string): Promise<TRefreshResponse> {
    if (!token) {
      throw new AppError(StatusCodes.UNAUTHORIZED, 'No refresh token was provided.');
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
    } catch (err) {
      throw new AppError(StatusCodes.UNAUTHORIZED, 'Refresh token has expired or is invalid.');
    }

    const { id } = decoded;

    // Check database user integrity
    const user = await AuthRepository.findById(id);
    if (!user) {
      throw new AppError(StatusCodes.UNAUTHORIZED, 'User associated with this token does not exist.');
    }

    if (!user.isActive) {
      throw new AppError(StatusCodes.UNAUTHORIZED, 'User account has been deactivated.');
    }

    const tokenPayload = { id: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.generateAccessToken(tokenPayload),
      refreshToken: this.generateRefreshToken({ id: user.id }),
    };
  }

  // Get current logged-in user profile
  static async getMe(id: string): Promise<TSanitizedUser> {
    const user = await AuthRepository.findById(id);
    if (!user) {
      throw new AppError(StatusCodes.NOT_FOUND, 'User profile could not be found.');
    }
    return this.sanitizeUser(user);
  }
}
