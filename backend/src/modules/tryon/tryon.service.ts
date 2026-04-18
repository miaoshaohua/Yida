import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateTryOnTaskDto } from './dto/create-tryon-task.dto';
import { User, TaskStatus, ClothingType, UserStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const FREE_DAILY_LIMIT = 3;

@Injectable()
export class TryOnService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    @InjectQueue('tryon') private tryonQueue: Queue,
  ) {}

  /**
   * 检查用户是否还有试衣次数
   */
  private async checkTryOnQuota(user: User): Promise<boolean> {
    if (user.isMember && user.memberExpiresAt && user.memberExpiresAt > new Date()) {
      return true;
    }

    const today = new Date().toDateString();
    const lastTryOnDate = user.lastTryOnDate?.toDateString();
    
    if (lastTryOnDate !== today) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { dailyTryOnCount: 0, lastTryOnDate: new Date() },
      });
      return true;
    }

    return user.dailyTryOnCount < FREE_DAILY_LIMIT;
  }

  /**
   * 创建试衣任务
   */
  async createTask(user: User, dto: CreateTryOnTaskDto) {
    if (user.status === UserStatus.DISABLED) {
      throw new BadRequestException('账号已被禁用');
    }

    const hasQuota = await this.checkTryOnQuota(user);
    if (!hasQuota) {
      throw new BadRequestException('今日试衣次数已用完，请升级会员');
    }

    const clothingType = (dto.clothingType || ClothingType.TOP) as ClothingType;

    const taskId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const task = await this.prisma.tryOnTask.create({
      data: {
        taskId,
        userId: user.id,
        personImageKey: dto.personImageKey,
        clothImageKey: dto.clothImageKey,
        clothingType: clothingType,
        status: TaskStatus.PENDING,
      },
    });

    await this.prisma.tryOnRecord.create({
      data: {
        userId: user.id,
        taskId: task.id,
        personImageKey: dto.personImageKey,
        clothImageKey: dto.clothImageKey,
        clothingType: clothingType,
        status: TaskStatus.PENDING,
        expiresAt,
      },
    });

    await this.tryonQueue.add('process-tryon', {
      taskId: task.id,
      userId: user.id,
      personImageKey: dto.personImageKey,
      clothImageKey: dto.clothImageKey,
      clothingType: clothingType,
    });

    return {
      taskId: task.taskId,
      status: TaskStatus.PENDING,
      message: '任务已提交，正在处理中...',
    };
  }

  /**
   * 查询任务状态
   */
  async getTaskStatus(taskId: string) {
    let task = await this.prisma.tryOnTask.findFirst({
      where: { taskId },
    });
    if (!task) {
      task = await this.prisma.tryOnTask.findUnique({
        where: { id: taskId },
      });
    }

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    let resultImageUrl = null;
    if (task.resultImageKey && task.status === TaskStatus.COMPLETED) {
      resultImageUrl = await this.storageService.getPresignedUrl(task.resultImageKey);
    }

    return {
      taskId: task.taskId,
      status: task.status,
      resultImageUrl,
      errorMessage: task.errorMessage,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }

  async deleteTask(userId: string, recordId: string) {
    const record = await this.prisma.tryOnRecord.findFirst({
      where: {
        OR: [
          { id: recordId },
          { taskId: recordId },
        ],
        userId,
      },
    });

    if (!record) {
      throw new NotFoundException('任务不存在或无权限删除');
    }

    await this.prisma.tryOnRecord.delete({
      where: { id: record.id },
    });

    return { success: true };
  }

  /**
   * 获取我的试衣任务列表
   */
  async getMyTasks(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      this.prisma.tryOnRecord.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.tryOnRecord.count({
        where: { userId },
      }),
    ]);

    const tasksWithUrls = await Promise.all(
      tasks.map(async (task) => {
        let resultImageUrl = null;
        if (task.resultImageKey && task.status === TaskStatus.COMPLETED) {
          try {
            resultImageUrl = await this.storageService.getPresignedUrl(task.resultImageKey);
          } catch (error) {
            console.error('获取结果图片URL失败:', error);
          }
        }

        return {
          id: task.id,
          taskId: task.taskId,
          status: task.status,
          resultImageUrl,
          createdAt: task.createdAt,
        };
      })
    );

    return {
      tasks: tasksWithUrls,
      total,
    };
  }

  /**
   * 更新任务状态（供Processor调用）
   */
  async updateTaskStatus(
    id: string,
    status: TaskStatus,
    resultImageKey?: string,
    errorMessage?: string,
  ) {
    const data: any = { status, updatedAt: new Date() };
    
    if (resultImageKey) {
      data.resultImageKey = resultImageKey;
    }
    
    if (errorMessage) {
      data.errorMessage = errorMessage;
    }

    const task = await this.prisma.tryOnTask.update({
      where: { id },
      data,
    });

    await this.prisma.tryOnRecord.updateMany({
      where: { taskId: id },
      data: {
        status,
        resultImageKey,
        errorMessage,
      },
    });

    if (status === TaskStatus.COMPLETED) {
      await this.prisma.user.update({
        where: { id: task.userId },
        data: {
          dailyTryOnCount: { increment: 1 },
          lastTryOnDate: new Date(),
        },
      });
    }

    return task;
  }
}
