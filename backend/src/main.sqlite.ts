import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppSqliteModule } from './app.sqlite';

async function bootstrap() {
  const app = await NestFactory.create(AppSqliteModule);
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  app.enableCors({
    origin: true,
    credentials: true,
  });
  
  const config = new DocumentBuilder()
    .setTitle('AI虚拟试衣间 API')
    .setDescription('AI虚拟试衣间后端API文档（SQLite完整版）')
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
║   🚀 AI虚拟试衣间后端API（SQLite完整版）                   ║
║                                                              ║
║   API文档: http://localhost:${port}/api/docs               ║
║                                                              ║
║   注意: 试衣任务队列暂时禁用（需要Redis）                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
