import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class GetPresignedUrlDto {
  @ApiProperty({ description: '文件名' })
  @IsString()
  @IsNotEmpty()
  filename: string;
}
