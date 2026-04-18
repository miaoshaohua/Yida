import { Module } from '@nestjs/common';
import { CleanupService } from './cleanup.service';
import { StorageModule } from '../storage/storage.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [StorageModule, AdminModule],
  providers: [CleanupService],
})
export class TasksModule {}
