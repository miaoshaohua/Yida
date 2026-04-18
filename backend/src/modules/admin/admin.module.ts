import { Module, OnModuleInit } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminJwtStrategy } from './admin-jwt.strategy';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { OperationLoggerService } from '../../common/services/operation-logger.service';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '2h' },
    }),
  ],
  providers: [AdminService, AdminAuthService, AdminJwtStrategy, OperationLoggerService],
  controllers: [AdminController],
  exports: [AdminService, AdminAuthService],
})
export class AdminModule implements OnModuleInit {
  constructor(private adminAuthService: AdminAuthService) {}

  async onModuleInit() {
    await this.adminAuthService.initSuperAdmin();
  }
}
