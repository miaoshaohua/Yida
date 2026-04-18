import { Controller, Post, Body, Get, Param, UseGuards, Query, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TryOnService } from './tryon.service';
import { CreateTryOnTaskDto } from './dto/create-tryon-task.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('试衣')
@Controller('tryon')
export class TryOnController {
  constructor(private readonly tryonService: TryOnService) {}

  @Post('tasks')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建试衣任务' })
  async createTask(@CurrentUser() user: User, @Body() dto: CreateTryOnTaskDto) {
    return this.tryonService.createTask(user, dto);
  }

  @Get('tasks/my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的试衣任务列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量' })
  async getMyTasks(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tryonService.getMyTasks(
      user.id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('tasks/:taskId')
  @ApiOperation({ summary: '查询任务状态' })
  @ApiParam({ name: 'taskId', description: '任务ID' })
  async getTaskStatus(@Param('taskId') taskId: string) {
    return this.tryonService.getTaskStatus(taskId);
  }

  @Delete('tasks/:taskId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除试衣任务' })
  @ApiParam({ name: 'taskId', description: '任务ID' })
  async deleteTask(@CurrentUser() user: User, @Param('taskId') taskId: string) {
    return this.tryonService.deleteTask(user.id, taskId);
  }
}
