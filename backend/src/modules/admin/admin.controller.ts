import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import { Admin, UserRole, User, OrderStatus, UserStatus } from '@prisma/client';
import { Request } from 'express';

@ApiTags('后台管理')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly adminAuthService: AdminAuthService,
  ) {}

  @Post('auth/login')
  @ApiOperation({ summary: '管理员登录' })
  async login(@Body() dto: AdminLoginDto, @Req() req: Request) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.adminAuthService.login(dto, ipAddress, userAgent);
  }

  @Get('auth/me')
  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前管理员信息' })
  async getCurrentAdmin(@CurrentAdmin() admin: Admin) {
    return this.adminAuthService.getCurrentAdmin(admin);
  }

  @Post('auth/logout')
  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '管理员退出登录' })
  async logout(@CurrentAdmin() admin: Admin, @Req() req: Request) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.adminAuthService.logout(admin, ipAddress, userAgent);
  }

  @Get('dashboard')
  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取仪表板数据' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'dailyTryOnCount', required: false })
  @ApiQuery({ name: 'minTotalTryOn', required: false })
  @ApiQuery({ name: 'maxTotalTryOn', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getUsers(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('dailyTryOnCount') dailyTryOnCount?: string,
    @Query('minTotalTryOn') minTotalTryOn?: string,
    @Query('maxTotalTryOn') maxTotalTryOn?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getUsers(
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 20,
      search,
      dailyTryOnCount ? parseInt(dailyTryOnCount) : undefined,
      minTotalTryOn ? parseInt(minTotalTryOn) : undefined,
      maxTotalTryOn ? parseInt(maxTotalTryOn) : undefined,
      startDate,
      endDate,
    );
  }

  @Get('users/:userId')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户详情' })
  async getUserDetail(@Param('userId') userId: string) {
    return this.adminService.getUserDetail(userId);
  }

  @Put('users/:userId')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新用户信息' })
  async updateUser(
    @Param('userId') userId: string,
    @Body() body: { nickname?: string; phone?: string; email?: string; status?: UserStatus },
    @CurrentAdmin() admin: Admin,
    @Req() req: Request,
  ) {
    return this.adminService.updateUser(
      userId,
      body,
      admin,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Delete('users/:userId')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除用户' })
  async deleteUser(
    @Param('userId') userId: string,
    @CurrentAdmin() admin: Admin,
    @Req() req: Request,
  ) {
    return this.adminService.deleteUser(
      userId,
      admin,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post('users/batch-delete')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '批量删除用户' })
  async batchDeleteUsers(
    @Body() body: { userIds: string[] },
    @CurrentAdmin() admin: Admin,
    @Req() req: Request,
  ) {
    return this.adminService.batchDeleteUsers(
      body.userIds,
      admin,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get('orders')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取订单列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getOrders(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: OrderStatus,
  ) {
    return this.adminService.getOrders(
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 20,
      status,
    );
  }

  @Get('orders/:orderId')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取订单详情' })
  async getOrderDetail(@Param('orderId') orderId: string) {
    return this.adminService.getOrderDetail(orderId);
  }

  @Post('orders/:orderId/refund')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '订单退款' })
  async refundOrder(
    @Param('orderId') orderId: string,
    @CurrentAdmin() admin: Admin,
    @Req() req: Request,
  ) {
    return this.adminService.refundOrder(
      orderId,
      admin,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post('orders/batch-delete')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '批量删除订单' })
  async batchDeleteOrders(
    @Body() body: { orderIds: string[] },
    @CurrentAdmin() admin: Admin,
    @Req() req: Request,
  ) {
    return this.adminService.batchDeleteOrders(
      body.orderIds,
      admin,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get('tryon-records')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取试衣记录列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'userId', required: false })
  async getTryOnRecords(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('userId') userId?: string,
  ) {
    return this.adminService.getTryOnRecords(
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 20,
      userId,
    );
  }

  @Get('tryon-records/:recordId')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取试衣记录详情' })
  async getTryOnRecordDetail(@Param('recordId') recordId: string) {
    return this.adminService.getTryOnRecordDetail(recordId);
  }

  @Delete('tryon-records/:recordId')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除试衣记录' })
  async deleteTryOnRecord(
    @Param('recordId') recordId: string,
    @CurrentAdmin() admin: Admin,
    @Req() req: Request,
  ) {
    return this.adminService.deleteTryOnRecord(
      recordId,
      admin,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post('tryon-records/batch-delete')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '批量删除试衣记录' })
  async batchDeleteTryOnRecords(
    @Body() body: { recordIds: string[] },
    @CurrentAdmin() admin: Admin,
    @Req() req: Request,
  ) {
    return this.adminService.batchDeleteTryOnRecords(
      body.recordIds,
      admin,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get('photos')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取照片列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'expiringSoon', required: false, type: Boolean })
  async getPhotos(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('expiringSoon') expiringSoon?: string,
  ) {
    return this.adminService.getPhotos(
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 20,
      expiringSoon === 'true',
    );
  }

  @Post('photos/batch-delete')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '批量删除照片' })
  async batchDeletePhotos(
    @Body() body: { photoIds: string[] },
    @CurrentAdmin() admin: Admin,
    @Req() req: Request,
  ) {
    return this.adminService.batchDeletePhotos(
      body.photoIds,
      admin,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get('configs')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取系统配置列表' })
  async getConfigs() {
    return this.adminService.getConfigs();
  }

  @Put('configs/:configKey')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新系统配置' })
  async updateConfig(
    @Param('configKey') configKey: string,
    @Body() body: { value: string },
    @CurrentAdmin() admin: Admin,
    @Req() req: Request,
  ) {
    return this.adminService.updateConfig(
      configKey,
      body.value,
      admin,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get('announcements')
  @ApiOperation({ summary: '获取公告列表' })
  async getAnnouncements() {
    return this.adminService.getAnnouncements();
  }

  @Post('announcements')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建公告' })
  async createAnnouncement(
    @Body() body: { title: string; content: string; priority?: number },
    @CurrentAdmin() admin: Admin,
    @Req() req: Request,
  ) {
    return this.adminService.createAnnouncement(
      body,
      admin,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Delete('announcements/:announcementId')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除公告' })
  async deleteAnnouncement(
    @Param('announcementId') announcementId: string,
    @CurrentAdmin() admin: Admin,
    @Req() req: Request,
  ) {
    return this.adminService.deleteAnnouncement(
      announcementId,
      admin,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get('operation-logs')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取操作日志列表' })
  async getOperationLogs(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Query('module') module?: string,
    @Query('operationType') operationType?: string,
    @Query('adminId') adminId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getOperationLogs(
      parseInt(page, 10),
      parseInt(pageSize, 10),
      adminId,
      module,
      operationType,
      startDate,
      endDate,
    );
  }

  @Get('api-logs')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取API调用日志列表' })
  async getApiLogs(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Query('clothingType') clothingType?: string,
    @Query('statusCode') statusCode?: string,
  ) {
    return this.adminService.getApiLogs(
      parseInt(page, 10),
      parseInt(pageSize, 10),
      clothingType,
      statusCode ? parseInt(statusCode, 10) : undefined,
    );
  }

  @Get('api-logs/:id')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取API日志详情' })
  async getApiLogDetail(@Param('id') id: string) {
    return this.adminService.getApiLogDetail(id);
  }

  @Get('admins/:adminId/permissions')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取管理员权限' })
  async getAdminPermissions(@Param('adminId') adminId: string) {
    return this.adminService.getAdminPermissions(adminId);
  }

  @Put('admins/:adminId/permissions')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新管理员权限' })
  async updateAdminPermissions(
    @Param('adminId') adminId: string,
    @Body() body: { permissions: { module: string; actions: string[] }[] },
    @CurrentAdmin() admin: Admin,
    @Req() req: Request,
  ) {
    return this.adminService.updateAdminPermissions(
      adminId,
      body.permissions as any,
      admin,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get('admins')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取管理员账号列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'search', required: false })
  async getAdmins(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAdmins(
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 20,
      search,
    );
  }

  @Post('admins')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建管理员账号' })
  async createAdmin(
    @Body() dto: CreateAdminDto,
    @CurrentAdmin() admin: Admin,
    @Req() req: Request,
  ) {
    return this.adminService.createAdmin(
      dto,
      admin,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Put('admins/:adminId')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新管理员账号' })
  async updateAdmin(
    @Param('adminId') adminId: string,
    @Body() dto: UpdateAdminDto,
    @CurrentAdmin() admin: Admin,
    @Req() req: Request,
  ) {
    return this.adminService.updateAdmin(
      adminId,
      dto,
      admin,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Delete('admins/:adminId')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除管理员账号' })
  async deleteAdmin(
    @Param('adminId') adminId: string,
    @CurrentAdmin() admin: Admin,
    @Req() req: Request,
  ) {
    return this.adminService.deleteAdmin(
      adminId,
      admin,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
