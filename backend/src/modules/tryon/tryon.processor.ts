import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { TryOnService } from './tryon.service';
import { TaskStatus, ClothingType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

@Processor('tryon')
export class TryOnProcessor {
  private readonly logger = new Logger(TryOnProcessor.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private tryonService: TryOnService,
  ) {}

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job) {
    this.logger.log(`Completed job ${job.id} of type ${job.name}`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Failed job ${job.id} of type ${job.name}: ${error.message}`);
  }

  @Process('process-tryon')
  async processTryOn(job: Job) {
    const { id: jobId } = job;
    const { taskId: databaseTaskId, userId, personImageKey, clothImageKey, clothingType } = job.data;

    try {
      await this.tryonService.updateTaskStatus(databaseTaskId, TaskStatus.PROCESSING);

      this.logger.log(`[${jobId}] 调用FASHN VTON API...`);
      
      const resultImageKey = await this.callFashnVtonApi(
      personImageKey,
      clothImageKey,
      clothingType,
      databaseTaskId,
    );

      await this.tryonService.updateTaskStatus(
        databaseTaskId,
        TaskStatus.COMPLETED,
        resultImageKey,
      );

      this.logger.log(`[${jobId}] 试衣任务完成`);
    } catch (error) {
      this.logger.error(`[${jobId}] 试衣任务失败: ${error.message}`);
      
      await this.tryonService.updateTaskStatus(
        databaseTaskId,
        TaskStatus.FAILED,
        undefined,
        error.message || '试衣生成失败，请重试',
      );
    }
  }

  /**
   * 调用FASHN VTON API
   */
  private async callFashnVtonApi(
    personImageKey: string,
    clothImageKey: string,
    clothingType: ClothingType,
    databaseTaskId?: string,
  ): Promise<string> {
    // 从存储下载图片
    this.logger.log(`从存储下载图片: ${personImageKey}, ${clothImageKey}`);
    const personBuffer = await this.storageService.downloadFile(personImageKey);
    const clothBuffer = await this.storageService.downloadFile(clothImageKey);

    // 转换为 base64
    const personBase64 = personBuffer.toString('base64');
    const clothBase64 = clothBuffer.toString('base64');

    // 映射服装类型 (使用字符串键以确保队列序列化后仍然正确)
    const categoryMap: { [key: string]: string } = {
      'TOP': 'tops',
      'BOTTOM': 'bottoms',
      'DRESS': 'one-pieces',
      'OUTERWEAR': 'tops',
      'FULL_BODY': 'one-pieces',
    };

    // 确保 clothingType 是大写字符串（处理队列序列化后可能的格式变化）
    const normalizedClothingType = String(clothingType).toUpperCase();
    const category = categoryMap[normalizedClothingType] || 'tops';

    const apiUrl = process.env.FASHN_API_URL || 'https://api.fashn.ai/v1/vton';
    
    this.logger.log(`调用FASHN API: ${apiUrl}/tryon`);
    this.logger.log(`服装类型 (原始值): ${clothingType} (typeof: ${typeof clothingType})`);
    this.logger.log(`服装类型 (标准化): ${normalizedClothingType}`);
    this.logger.log(`服装类型 (映射): ${category}`);

    // 调用 FASHN API
    const requestBody = {
      person_file: personBase64,
      garment_file: clothBase64,
      category: category,
      num_samples: 1,
      num_timesteps: 20,
      guidance_scale: 1.5,
      seed: 42,
    };

    const startTime = Date.now();
    let statusCode = 0;
    let responseData = '';
    let errorMessage = '';

    try {
      const response = await axios.post(
        `${apiUrl}/tryon`,
        requestBody,
        {
          timeout: 1200000, // 20分钟超时
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      statusCode = response.status;
      const result = response.data;

      if (!result.success) {
        throw new Error(result.error || 'FASHN API 调用失败');
      }

      // 保存结果图片
      const resultImageKey = clothImageKey.replace(/\.[^/.]+$/, '') + '_result.jpg';
      const resultBase64 = result.images[0];
      const resultBuffer = Buffer.from(resultBase64, 'base64');
      await this.storageService.uploadBuffer(resultImageKey, resultBuffer, 'image/jpeg');

      this.logger.log(`结果图片已保存: ${resultImageKey}`);

      // 记录成功响应
      responseData = JSON.stringify({
        success: true,
        images_count: result.images?.length || 0,
      });

      return resultImageKey;
    } catch (error: any) {
      statusCode = error.response?.status || 0;
      errorMessage = error.response?.data?.error || error.message;
      responseData = JSON.stringify({
        success: false,
        error: error.message,
        response: error.response?.data,
      });
      throw error;
    } finally {
      // 记录 API 调用日志
      const duration = Date.now() - startTime;
      await this.prisma.apiLog.create({
        data: {
          taskId: databaseTaskId || undefined,
          endpoint: `${apiUrl}/tryon`,
          method: 'POST',
          requestData: JSON.stringify({
            category,
            num_samples: 1,
            num_timesteps: 20,
            guidance_scale: 1.5,
            seed: 42,
            person_file: '[base64]',
            garment_file: '[base64]',
          }),
          responseData,
          clothingType,
          category,
          statusCode,
          duration,
          errorMessage: errorMessage || undefined,
        },
      });
    }
  }
}
