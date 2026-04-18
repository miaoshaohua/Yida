import { NestFactory } from '@nestjs/core';
import { Module, Controller, Get } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

@Controller()
class HealthController {
  @Get()
  health() {
    return {
      status: 'ok',
      message: 'AI虚拟试衣间后端API正在运行',
      version: '1.0.0',
    };
  }
}

@Module({
  controllers: [HealthController],
})
class TestAppModule {}

async function bootstrap() {
  const app = await NestFactory.create(TestAppModule);
  
  const config = new DocumentBuilder()
    .setTitle('AI虚拟试衣间 API')
    .setDescription('AI虚拟试衣间后端API文档（测试模式）')
    .setVersion('1.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🚀 AI虚拟试衣间后端API（测试模式）                       ║
║                                                              ║
║   API文档: http://localhost:${port}/api/docs               ║
║   健康检查: http://localhost:${port}/                       ║
║                                                              ║
║   注意: 此为测试模式，如需完整功能请配置PostgreSQL和Redis  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
