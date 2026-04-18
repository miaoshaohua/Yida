import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly useLocalStorage: boolean;
  private readonly s3Client?: S3Client;
  private readonly bucketName?: string;
  private readonly presignedUrlExpiresIn: number;
  private readonly uploadDir: string;

  constructor() {
    this.useLocalStorage = process.env.STORAGE_MODE === 'local';
    this.presignedUrlExpiresIn = parseInt(process.env.R2_PRESIGNED_URL_EXPIRES_IN || '1800');
    this.uploadDir = path.join(process.cwd(), 'uploads');

    if (this.useLocalStorage) {
      this.logger.log('使用本地存储模式');
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true });
      }
    } else {
      this.logger.log('使用 R2 存储模式');
      this.bucketName = process.env.R2_BUCKET_NAME || 'yida-images';
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
      });
    }
  }

  /**
   * 生成文件存储Key（带userId）
   */
  private generateKey(userId: string, filename: string): string {
    const timestamp = Date.now();
    const hash = createHash('md5').update(`${userId}-${filename}-${timestamp}`).digest('hex');
    const ext = filename.split('.').pop() || 'jpg';
    return `${userId}/${timestamp}-${hash}.${ext}`;
  }

  /**
   * 生成文件存储Key（匿名）
   */
  private generateAnonymousKey(filename: string): string {
    const timestamp = Date.now();
    const hash = createHash('md5').update(`${filename}-${timestamp}`).digest('hex');
    const ext = filename.split('.').pop() || 'jpg';
    return `anonymous/${timestamp}-${hash}.${ext}`;
  }

  /**
   * 获取本地文件的完整路径
   */
  private getLocalFilePath(key: string): string {
    const filePath = path.join(this.uploadDir, key);
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return filePath;
  }

  /**
   * 上传文件
   */
  async uploadFile(
    userId: string,
    filename: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    const key = this.generateKey(userId, filename);
    
    if (this.useLocalStorage) {
      const filePath = this.getLocalFilePath(key);
      fs.writeFileSync(filePath, buffer);
      this.logger.log(`本地文件上传成功: ${key}`);
    } else {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      });
      await this.s3Client!.send(command);
      this.logger.log(`R2文件上传成功: ${key}`);
    }
    return key;
  }

  /**
   * 删除文件
   */
  async deleteFile(key: string): Promise<void> {
    if (this.useLocalStorage) {
      const filePath = this.getLocalFilePath(key);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      this.logger.log(`本地文件删除成功: ${key}`);
    } else {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.s3Client!.send(command);
      this.logger.log(`R2文件删除成功: ${key}`);
    }
  }

  /**
   * 获取文件URL
   */
  async getPresignedUrl(key: string): Promise<string> {
    if (this.useLocalStorage) {
      return `/uploads/${encodeURIComponent(key)}`;
    } else {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      const url = await getSignedUrl(this.s3Client!, command, {
        expiresIn: this.presignedUrlExpiresIn,
      });
      return url;
    }
  }

  /**
   * 生成上传预签名URL（本地模式返回直接上传接口）
   */
  async getUploadPresignedUrl(
    filename: string,
    userId?: string,
  ): Promise<{ uploadUrl: string; fileKey: string; expiresIn: number }> {
    const key = userId 
      ? this.generateKey(userId, filename) 
      : this.generateAnonymousKey(filename);
    
    if (this.useLocalStorage) {
      return {
        uploadUrl: `/storage/upload-direct?key=${encodeURIComponent(key)}`,
        fileKey: key,
        expiresIn: 86400,
      };
    } else {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      const uploadUrl = await getSignedUrl(this.s3Client!, command, {
        expiresIn: this.presignedUrlExpiresIn,
      });
      this.logger.log(`生成R2上传预签名URL成功: ${key}`);
      return {
        uploadUrl,
        fileKey: key,
        expiresIn: this.presignedUrlExpiresIn,
      };
    }
  }

  /**
   * 直接上传文件（支持本地和R2模式）
   */
  async uploadDirect(key: string, buffer: Buffer, mimeType: string): Promise<void> {
    if (this.useLocalStorage) {
      const filePath = this.getLocalFilePath(key);
      fs.writeFileSync(filePath, buffer);
      this.logger.log(`本地直接上传成功: ${key}`);
    } else {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      });
      await this.s3Client!.send(command);
      this.logger.log(`R2直接上传成功: ${key}`);
    }
  }

  /**
   * 下载文件，返回 Buffer
   */
  async downloadFile(key: string): Promise<Buffer> {
    if (this.useLocalStorage) {
      const filePath = this.getLocalFilePath(key);
      return fs.readFileSync(filePath);
    } else {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      const response = await this.s3Client!.send(command);
      const bytes = await response.Body?.transformToByteArray();
      if (!bytes) {
        throw new Error(`无法从 R2 下载文件: ${key}`);
      }
      return Buffer.from(bytes);
    }
  }

  /**
   * 上传文件 Buffer
   */
  async uploadBuffer(key: string, buffer: Buffer, mimeType: string): Promise<void> {
    if (this.useLocalStorage) {
      const filePath = this.getLocalFilePath(key);
      fs.writeFileSync(filePath, buffer);
      this.logger.log(`本地文件上传成功: ${key}`);
    } else {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      });
      await this.s3Client!.send(command);
      this.logger.log(`R2文件上传成功: ${key}`);
    }
  }

  /**
   * 批量删除文件
   */
  async deleteFiles(keys: string[]): Promise<void> {
    for (const key of keys) {
      try {
        await this.deleteFile(key);
      } catch (error) {
        this.logger.error(`删除文件失败 ${key}: ${error.message}`);
      }
    }
  }
}
