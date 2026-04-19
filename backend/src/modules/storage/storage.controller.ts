import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, Body, Get, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { GetPresignedUrlDto } from './dto/get-presigned-url.dto';

@ApiTags('存储')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presigned-url')
  @ApiOperation({ summary: '获取上传预签名URL（仅用于R2直传）' })
  async getPresignedUrl(
    @Body() dto: GetPresignedUrlDto,
    @CurrentUser() user?: User,
  ) {
    return this.storageService.getUploadPresignedUrl(
      dto.filename,
      user?.id,
    );
  }

  @Post('upload-file')
  @ApiOperation({ summary: '通过后端代理上传图片（推荐）' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '图片文件',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadViaBackend(
    @Body('filename') filename: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp|avif)$/i }),
        ],
      }),
    )
    file: any,
    @CurrentUser() user?: User,
  ) {
    const userId = user?.id || 'anonymous';
    const fileKey = await this.storageService.uploadFile(
      userId,
      file.originalname,
      file.buffer,
      file.mimetype,
    );

    return { success: true, fileKey };
  }

  @Post('upload-direct')
  @ApiOperation({ summary: '直接上传图片到本地存储' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'key', description: '文件存储Key' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDirect(
    @Query('key') key: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp|avif)$/ }),
        ],
      }),
    )
    file: any,
  ) {
    await this.storageService.uploadDirect(
      key,
      file.buffer,
      file.mimetype,
    );
    return { success: true, key };
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '上传图片' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @CurrentUser() user: User,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp|avif)$/ }),
        ],
      }),
    )
    file: any,
  ) {
    const key = await this.storageService.uploadFile(
      user.id,
      file.originalname,
      file.buffer,
      file.mimetype,
    );

    const url = await this.storageService.getPresignedUrl(key);

    return {
      key,
      url,
      filename: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };
  }
}
