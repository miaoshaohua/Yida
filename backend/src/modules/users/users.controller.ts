import { Controller, Get, Delete, Param, Query, UseGuards, Body, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('用户')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('tryon-records')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取试衣记录列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量' })
  async getTryOnRecords(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.usersService.getTryOnRecords(
      user,
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 20,
    );
  }

  @Get('tryon-records/:recordId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取试衣记录详情' })
  async getTryOnRecordDetail(@CurrentUser() user: User, @Param('recordId') recordId: string) {
    return this.usersService.getTryOnRecordDetail(user, recordId);
  }

  @Delete('tryon-records/:recordId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除试衣记录' })
  async deleteTryOnRecord(@CurrentUser() user: User, @Param('recordId') recordId: string) {
    return this.usersService.deleteTryOnRecord(user, recordId);
  }

  @Post('tryon-records/batch-delete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '批量删除试衣记录' })
  async batchDeleteTryOnRecords(
    @CurrentUser() user: User,
    @Body() body: { recordIds: string[] },
  ) {
    return this.usersService.batchDeleteTryOnRecords(user, body.recordIds);
  }
}
