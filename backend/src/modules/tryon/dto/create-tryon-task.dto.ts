import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTryOnTaskDto {
  @ApiProperty({ description: '人物图片Key' })
  @IsString()
  @IsNotEmpty()
  personImageKey: string;

  @ApiProperty({ description: '服装图片Key' })
  @IsString()
  @IsNotEmpty()
  clothImageKey: string;

  @ApiProperty({
    description: '服装类型',
    enum: ['TOP', 'BOTTOM', 'DRESS', 'OUTERWEAR', 'FULL_BODY'],
    required: false,
    default: 'TOP',
  })
  @IsOptional()
  @IsString()
  clothingType?: string;
}
