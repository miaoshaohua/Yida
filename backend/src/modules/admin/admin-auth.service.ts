import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { Admin, UserStatus, UserRole, OperationType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * 初始化超级管理员
   */
  async initSuperAdmin() {
    const existing = await this.prisma.admin.findFirst({
      where: { role: UserRole.SUPER_ADMIN },
    });

    if (existing) {
      return;
    }

    const email = process.env.ADMIN_EMAIL || 'admin@yida.com';
    const password = process.env.ADMIN_PASSWORD || 'change-this-in-production';
    const hashedPassword = await bcrypt.hash(password, 12);

    await this.prisma.admin.create({
      data: {
        username: 'superadmin',
        email,
        password: hashedPassword,
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
      },
    });

    console.log('✅ 超级管理员初始化成功');
  }

  /**
   * 管理员登录
   */
  async login(dto: AdminLoginDto, ipAddress?: string, userAgent?: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { username: dto.username },
    });

    if (!admin) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (admin.status === UserStatus.DISABLED) {
      throw new UnauthorizedException('账号已被禁用');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, admin.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    await this.prisma.admin.update({
      where: { id: admin.id },
      data: {
        lastLoginAt: new Date(),
        loginCount: { increment: 1 },
      },
    });

    await this.prisma.operationLog.create({
      data: {
        adminId: admin.id,
        operationType: OperationType.LOGIN,
        module: 'ADMINS',
        details: '管理员登录',
        ipAddress,
        userAgent,
      },
    });

    const payload = { sub: admin.id, username: admin.username, role: admin.role };
    
    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '2h' }),
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    };
  }

  /**
   * 获取当前管理员信息
   */
  async getCurrentAdmin(admin: Admin) {
    return {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      status: admin.status,
      lastLoginAt: admin.lastLoginAt,
      loginCount: admin.loginCount,
    };
  }

  /**
   * 管理员退出登录
   */
  async logout(admin: Admin, ipAddress?: string, userAgent?: string) {
    await this.prisma.operationLog.create({
      data: {
        adminId: admin.id,
        operationType: OperationType.LOGOUT,
        module: 'ADMINS',
        details: '管理员退出登录',
        ipAddress,
        userAgent,
      },
    });

    return { message: '退出成功' };
  }
}
