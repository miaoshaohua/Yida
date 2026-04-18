import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  /**
   * 获取用户的试衣记录列表
   */
  async getTryOnRecords(user: User, page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;
    
    const [records, total] = await Promise.all([
      this.prisma.tryOnRecord.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.tryOnRecord.count({
        where: { userId: user.id },
      }),
    ]);

    const recordsWithUrls = await Promise.all(
      records.map(async (record) => {
        let resultImageUrl = null;
        if (record.resultImageKey) {
          resultImageUrl = await this.storageService.getPresignedUrl(record.resultImageKey);
        }
        return {
          ...record,
          resultImageUrl,
        };
      }),
    );

    return {
      data: recordsWithUrls,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 获取单条试衣记录详情
   */
  async getTryOnRecordDetail(user: User, recordId: string) {
    const record = await this.prisma.tryOnRecord.findUnique({
      where: { id: recordId, userId: user.id },
    });

    if (!record) {
      throw new NotFoundException('记录不存在');
    }

    const [personImageUrl, clothImageUrl, resultImageUrl] = await Promise.all([
      this.storageService.getPresignedUrl(record.personImageKey),
      this.storageService.getPresignedUrl(record.clothImageKey),
      record.resultImageKey ? this.storageService.getPresignedUrl(record.resultImageKey) : null,
    ]);

    return {
      ...record,
      personImageUrl,
      clothImageUrl,
      resultImageUrl,
    };
  }

  /**
   * 删除试衣记录
   */
  async deleteTryOnRecord(user: User, recordId: string) {
    const record = await this.prisma.tryOnRecord.findUnique({
      where: { id: recordId, userId: user.id },
    });

    if (!record) {
      throw new NotFoundException('记录不存在');
    }

    const keysToDelete = [record.personImageKey, record.clothImageKey];
    if (record.resultImageKey) {
      keysToDelete.push(record.resultImageKey);
    }

    await this.storageService.deleteFiles(keysToDelete);

    await this.prisma.tryOnRecord.delete({
      where: { id: recordId },
    });

    return { message: '删除成功' };
  }

  /**
   * 批量删除试衣记录
   */
  async batchDeleteTryOnRecords(user: User, recordIds: string[]) {
    const records = await this.prisma.tryOnRecord.findMany({
      where: { id: { in: recordIds }, userId: user.id },
    });

    if (records.length === 0) {
      throw new NotFoundException('没有找到可删除的记录');
    }

    const keysToDelete: string[] = [];
    records.forEach((record) => {
      keysToDelete.push(record.personImageKey, record.clothImageKey);
      if (record.resultImageKey) {
        keysToDelete.push(record.resultImageKey);
      }
    });

    await this.storageService.deleteFiles(keysToDelete);

    await this.prisma.tryOnRecord.deleteMany({
      where: { id: { in: recordIds }, userId: user.id },
    });

    return { message: `成功删除 ${records.length} 条记录` };
  }
}
