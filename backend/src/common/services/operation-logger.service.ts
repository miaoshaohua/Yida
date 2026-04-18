import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OperationType } from '@prisma/client';

@Injectable()
export class OperationLoggerService {
  constructor(private prisma: PrismaService) {}

  async log(options: {
    adminId: string;
    operationType: OperationType;
    module?: string;
    entityId?: string;
    details?: string;
    beforeData?: any;
    afterData?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.operationLog.create({
      data: {
        adminId: options.adminId,
        operationType: options.operationType,
        module: options.module,
        entityId: options.entityId,
        details: options.details,
        beforeData: options.beforeData ? JSON.stringify(options.beforeData) : null,
        afterData: options.afterData ? JSON.stringify(options.afterData) : null,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
      },
    });
  }

  formatDiff(before: any, after: any, fields: string[]): string {
    const changes: string[] = [];
    for (const field of fields) {
      const beforeValue = before?.[field];
      const afterValue = after?.[field];
      if (beforeValue !== afterValue) {
        const beforeStr = beforeValue || '空';
        const afterStr = afterValue || '空';
        changes.push(`${field}: "${beforeStr}" → "${afterStr}"`);
      }
    }
    return changes.length > 0 ? changes.join('; ') : '无变更';
  }
}
