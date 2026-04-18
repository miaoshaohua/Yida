import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TryOnService } from './tryon.service';
import { TryOnController } from './tryon.controller';
import { TryOnProcessor } from './tryon.processor';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'tryon',
    }),
    StorageModule,
  ],
  providers: [TryOnService, TryOnProcessor],
  controllers: [TryOnController],
  exports: [TryOnService],
})
export class TryOnModule {}
