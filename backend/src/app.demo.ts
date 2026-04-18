import { Module, Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestFactory } from '@nestjs/core';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

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
      mode: '演示模式',
    };
  }
}

@ApiTags('认证')
@Controller('auth')
class DemoAuthController {
  @Post('guest-login')
  @ApiOperation({ summary: '游客登录（演示）' })
  guestLogin(@Body() body: { deviceId: string }) {
    return {
      access_token: 'demo-token-' + Date.now(),
      user: {
        id: 'demo-user-id',
        nickname: '演示用户',
        isMember: false,
        dailyTryOnCount: 0,
      },
    };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户（演示）' })
  getMe() {
    return {
      id: 'demo-user-id',
      nickname: '演示用户',
      isMember: false,
      dailyTryOnCount: 0,
    };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [HealthController, DemoAuthController],
})
class AppDemoModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppDemoModule);
  
  app.enableCors({
    origin: true,
    credentials: true,
  });
  
  const config = new DocumentBuilder()
    .setTitle('AI虚拟试衣间 API')
    .setDescription('AI虚拟试衣间后端API文档（演示模式）')
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
║   🚀 AI虚拟试衣间后端API（演示模式）                       ║
║                                                              ║
║   API文档: http://localhost:${port}/api/docs               ║
║   健康检查: http://localhost:${port}/                       ║
║                                                              ║
║   注意: 此为演示模式，如需完整功能请配置PostgreSQL和Redis  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
