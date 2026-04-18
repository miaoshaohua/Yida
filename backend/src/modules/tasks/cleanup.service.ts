import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { OperationType } from '@prisma/client';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  /**
   * 每天凌晨2点执行清理任务
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupExpiredRecords() {
    this.logger.log('开始执行30天自动清理任务...');

    try {
      const now = new Date();
      
      const expiredRecords = await this.prisma.tryOnRecord.findMany({
        where: {
          expiresAt: {
            lt: now,
          },
        },
      });

      if (expiredRecords.length === 0) {
        this.logger.log('没有找到过期的记录');
        return;
      }

      this.logger.log(`找到 ${expiredRecords.length} 条过期记录`);

      const keysToDelete: string[] = [];
      expiredRecords.forEach((record) => {
        keysToDelete.push(record.personImageKey, record.clothImageKey);
        if (record.resultImageKey) {
          keysToDelete.push(record.resultImageKey);
        }
      });

      if (keysToDelete.length > 0) {
        this.logger.log(`准备删除 ${keysToDelete.length} 个文件`);
        await this.storageService.deleteFiles(keysToDelete);
      }

      const recordIds = expiredRecords.map((r) => r.id);
      await this.prisma.tryOnRecord.deleteMany({
        where: { id: { in: recordIds } },
      });

      await this.prisma.operationLog.create({
        data: {
          operationType: OperationType.CLEANUP_EXPIRED_RECORDS,
          details: `清理了 ${expiredRecords.length} 条过期记录，删除了 ${keysToDelete.length} 个文件`,
        },
      });

      this.logger.log(`清理任务完成：删除了 ${expiredRecords.length} 条记录，${keysToDelete.length} 个文件`);
    } catch (error) {
      this.logger.error(`清理任务失败: ${error.message}`);
    }
  }
}
