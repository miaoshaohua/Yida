import { Module, Controller, Get, Post, Body, UseGuards, Request, HttpCode } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestFactory } from '@nestjs/core';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from './common/prisma/prisma.service';

@ApiTags('健康检查')
@Controller()
class HealthController {
  @Get()
  @ApiOperation({ summary: '健康检查' })
  health() {
    return {
      status: 'ok',
      message: 'AI虚拟试衣间后端API正在运行',
      version: '1.0.0',
      mode: 'SQLite简化版',
    };
  }
}

class GuestLoginDto {
  deviceId: string;
}

class SendSmsDto {
  phone: string;
}

class SmsLoginDto {
  phone: string;
  code: string;
}

@Controller('auth')
@ApiTags('认证')
class SimpleAuthController {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  @Post('guest-login')
  @ApiOperation({ summary: '游客登录' })
  async guestLogin(@Body() dto: GuestLoginDto) {
    let user = await this.prisma.user.findUnique({
      where: { deviceId: dto.deviceId },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          deviceId: dto.deviceId,
          nickname: '游客用户',
        },
      });
    }

    const payload = { sub: user.id, phone: user.phone, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nickname: user.nickname,
        isMember: user.isMember,
        dailyTryOnCount: user.dailyTryOnCount,
      },
    };
  }

  @Post('send-sms')
  @ApiOperation({ summary: '发送验证码（演示）' })
  @HttpCode(200)
  sendSms(@Body() dto: SendSmsDto) {
    return {
      success: true,
      message: '验证码已发送（演示模式：123456）',
    };
  }

  @Post('sms-login')
  @ApiOperation({ summary: '短信登录（演示）' })
  async smsLogin(@Body() dto: SmsLoginDto) {
    if (dto.code !== '123456') {
      return { success: false, message: '验证码错误' };
    }

    let user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone: dto.phone,
          nickname: '手机用户',
        },
      });
    }

    const payload = { sub: user.id, phone: user.phone, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        isMember: user.isMember,
        dailyTryOnCount: user.dailyTryOnCount,
      },
    };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户' })
  getCurrentUser(@Request() req) {
    return {
      id: req.user?.sub || 'demo-user-id',
      nickname: '当前用户',
      isMember: false,
      dailyTryOnCount: 0,
    };
  }
}

@Controller('users')
@ApiTags('用户')
class SimpleUsersController {
  constructor(private prisma: PrismaService) {}

  @Get('tryon-records')
  @ApiBearerAuth()
  @ApiOperation({ summary: '试衣记录列表' })
  async getTryOnRecords() {
    return {
      list: [],
      total: 0,
      page: 1,
      pageSize: 20,
    };
  }
}

@Controller('orders')
@ApiTags('订单')
class SimpleOrdersController {
  constructor(private prisma: PrismaService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建订单' })
  async createOrder() {
    return {
      id: 'demo-order-id',
      orderNo: 'ORD' + Date.now(),
      amount: 9.9,
      status: 'PENDING',
      createdAt: new Date(),
    };
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: '订单列表' })
  async getOrders() {
    return {
      list: [],
      total: 0,
      page: 1,
      pageSize: 20,
    };
  }
}

@Controller('admin')
@ApiTags('后台管理')
class SimpleAdminController {
  constructor(private prisma: PrismaService) {}

  @Get('dashboard')
  @ApiOperation({ summary: '仪表板数据' })
  async getDashboard() {
    const userCount = await this.prisma.user.count();
    const orderCount = await this.prisma.order.count();
    const recordCount = await this.prisma.tryOnRecord.count();

    return {
      totalUsers: userCount,
      totalOrders: orderCount,
      totalTryOns: recordCount,
      todayTryOns: 0,
      revenue: 0,
    };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'yida-secret-key-2024',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [
    HealthController,
    SimpleAuthController,
    SimpleUsersController,
    SimpleOrdersController,
    SimpleAdminController,
  ],
  providers: [PrismaService],
})
class AppSimpleModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppSimpleModule);
  
  app.enableCors({
    origin: true,
    credentials: true,
  });
  
  const config = new DocumentBuilder()
    .setTitle('AI虚拟试衣间 API')
    .setDescription('AI虚拟试衣间后端API文档（SQLite简化版）')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🚀 AI虚拟试衣间后端API（SQLite简化版）                   ║
║                                                              ║
║   API文档: http://localhost:${port}/api/docs               ║
║   健康检查: http://localhost:${port}/                       ║
║                                                              ║
║   可用模块: 认证、用户、订单、后台管理                      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
