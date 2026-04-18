import { IsString, IsMobilePhone, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendSmsDto {
  @ApiProperty({ description: '手机号' })
  @IsMobilePhone('zh-CN')
  @IsNotEmpty()
  phone: string;
}
