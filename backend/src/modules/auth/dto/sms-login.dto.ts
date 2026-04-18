import { IsString, IsMobilePhone, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SmsLoginDto {
  @ApiProperty({ description: '手机号' })
  @IsMobilePhone('zh-CN')
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ description: '验证码' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;
}
