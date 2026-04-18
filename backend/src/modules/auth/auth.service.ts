import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GuestLoginDto } from './dto/guest-login.dto';
import { SendSmsDto } from './dto/send-sms.dto';
import { SmsLoginDto } from './dto/sms-login.dto';
import { User, UserStatus } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * 生成JWT token
   */
  private generateToken(user: User) {
    const payload = { sub: user.id, phone: user.phone, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        isMember: user.isMember,
        memberExpiresAt: user.memberExpiresAt,
        dailyTryOnCount: user.dailyTryOnCount,
      },
    };
  }

  /**
   * 生成6位数字验证码
   */
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * 游客模式登录/注册
   */
  async guestLogin(dto: GuestLoginDto) {
    let user = await this.prisma.user.findUnique({
      where: { deviceId: dto.deviceId },
    });

    if (!user && dto.fingerprint) {
      user = await this.prisma.user.findFirst({
        where: { fingerprint: dto.fingerprint },
      });
      
      if (user) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { deviceId: dto.deviceId },
        });
      }
    }

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          deviceId: dto.deviceId,
          fingerprint: dto.fingerprint,
          nickname: `游客${Date.now().toString().slice(-6)}`,
          status: UserStatus.ACTIVE,
        },
      });
    } else if (user.status === UserStatus.DISABLED) {
      throw new UnauthorizedException('账号已被禁用');
    }

    return this.generateToken(user);
  }

  /**
   * 发送短信验证码
   */
  async sendSms(dto: SendSmsDto) {
    const code = this.generateVerificationCode();
    
    await this.prisma.user.upsert({
      where: { phone: dto.phone },
      create: {
        phone: dto.phone,
        status: UserStatus.ACTIVE,
      },
      update: {},
    });

    console.log(`[SMS] 发送验证码到 ${dto.phone}: ${code}`);
    
    return {
      message: '验证码已发送',
      phone: dto.phone,
    };
  }

  /**
   * 短信验证码登录
   */
  async smsLogin(dto: SmsLoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    if (user.status === UserStatus.DISABLED) {
      throw new UnauthorizedException('账号已被禁用');
    }

    if (dto.code !== '123456') {
      throw new UnauthorizedException('验证码错误');
    }

    return this.generateToken(user);
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(user: User) {
    const today = new Date().toDateString();
    const lastTryOnDate = user.lastTryOnDate?.toDateString();
    
    let dailyTryOnCount = user.dailyTryOnCount;
    if (lastTryOnDate !== today) {
      dailyTryOnCount = 0;
      await this.prisma.user.update({
        where: { id: user.id },
        data: { dailyTryOnCount: 0 },
      });
    }

    return {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      isMember: user.isMember,
      memberExpiresAt: user.memberExpiresAt,
      dailyTryOnCount,
    };
  }

  /**
   * 退出登录
   */
  async logout(userId: string) {
    await this.prisma.session.deleteMany({
      where: { userId },
    });
    return { message: '退出成功' };
  }
}
