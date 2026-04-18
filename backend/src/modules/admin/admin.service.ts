import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { OperationLoggerService } from '../../common/services/operation-logger.service';
import { Admin, UserStatus, UserRole, OrderStatus, OperationType, PermissionModule, PermissionAction } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private logger: OperationLoggerService,
  ) {}

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayTryOnCount, totalUsers, paidUsers, totalRevenue, totalRecords] = await Promise.all([
      this.prisma.tryOnRecord.count({
        where: { createdAt: { gte: today, lt: tomorrow } },
      }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isMember: true } }),
      this.prisma.order.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
      }),
      this.prisma.tryOnRecord.count(),
    ]);

    return {
      todayTryOns: todayTryOnCount,
      totalUsers,
      paidUsers,
      totalRevenue: totalRevenue._sum.amount?.toNumber() || 0,
      totalTryOns: totalRecords,
    };
  }

  async getUsers(page: number, pageSize: number, search?: string) {
    const skip = (page - 1) * pageSize;
    const where = search ? {
      OR: [
        { phone: { contains: search } },
        { nickname: { contains: search } },
      ],
    } : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          _count: {
            select: { tryOnRecords: true, orders: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const formattedUsers = users.map((user: any) => ({
      ...user,
      totalTryOnCount: user._count?.tryOnRecords || 0,
    }));

    return {
      users: formattedUsers,
      total,
    };
  }

  async getUserDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tryOnRecords: { take: 10, orderBy: { createdAt: 'desc' } },
        orders: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async updateUserStatus(
    userId: string,
    status: UserStatus,
    admin: Admin,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    await this.prisma.operationLog.create({
      data: {
        adminId: admin.id,
        operationType: OperationType.UPDATE_USER,
        details: `更新用户 ${userId} 状态为 ${status}`,
        ipAddress,
        userAgent,
      },
    });

    return updatedUser;
  }

  async getOrders(page: number, pageSize: number, status?: OrderStatus) {
    const skip = (page - 1) * pageSize;
    const where = status ? { status } : {};

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: { user: true },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      total,
    };
  }

  async getOrderDetail(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    return order;
  }

  async refundOrder(
    orderId: string,
    admin: Admin,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException('订单状态不允许退款');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.REFUNDED },
    });

    await this.logger.log({
      adminId: admin.id,
      operationType: OperationType.REFUND_ORDER,
      module: 'ORDERS',
      entityId: orderId,
      details: `订单 ${order.orderNo} 退款`,
      beforeData: { id: order.id, orderNo: order.orderNo, amount: order.amount, status: order.status },
      afterData: { id: updatedOrder.id, orderNo: updatedOrder.orderNo, amount: updatedOrder.amount, status: updatedOrder.status },
      ipAddress,
      userAgent,
    });

    return updatedOrder;
  }

  async batchDeleteOrders(
    orderIds: string[],
    admin: Admin,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const orders = await this.prisma.order.findMany({
      where: { id: { in: orderIds } },
      select: { id: true, orderNo: true, amount: true, status: true, productType: true },
    });

    if (orders.length === 0) {
      throw new NotFoundException('没有要删除的订单');
    }

    await this.prisma.order.deleteMany({
      where: { id: { in: orderIds } },
    });

    await this.logger.log({
      adminId: admin.id,
      operationType: OperationType.REFUND_ORDER,
      module: 'ORDERS',
      entityId: orderIds.join(','),
      details: `批量删除 ${orders.length} 个订单`,
      beforeData: orders.map(o => ({
        id: o.id,
        orderNo: o.orderNo,
        amount: o.amount,
        status: o.status,
        productType: o.productType,
      })),
      afterData: null,
      ipAddress,
      userAgent,
    });

    return { message: `成功删除 ${orders.length} 个订单` };
  }

  async getTryOnRecords(page: number, pageSize: number, userId?: string) {
    const skip = (page - 1) * pageSize;
    const where = userId ? { userId } : {};

    const [records, total] = await Promise.all([
      this.prisma.tryOnRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: { user: true },
      }),
      this.prisma.tryOnRecord.count({ where }),
    ]);

    const recordsWithExpiry = records.map((record) => {
      const now = new Date();
      const expiresAt = new Date(record.expiresAt);
      const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        ...record,
        daysRemaining,
        isExpiringSoon: daysRemaining <= 7,
      };
    });

    return {
      records: recordsWithExpiry,
      total,
    };
  }

  async getTryOnRecordDetail(recordId: string) {
    const record = await this.prisma.tryOnRecord.findUnique({
      where: { id: recordId },
      include: { user: true },
    });

    if (!record) {
      throw new NotFoundException('记录不存在');
    }

    const [personImageUrl, clothImageUrl, resultImageUrl] = await Promise.all([
      this.storageService.getPresignedUrl(record.personImageKey),
      this.storageService.getPresignedUrl(record.clothImageKey),
      record.resultImageKey ? this.storageService.getPresignedUrl(record.resultImageKey) : null,
    ]);

    return {
      ...record,
      personImageUrl,
      clothImageUrl,
      resultImageUrl,
    };
  }

  async deleteTryOnRecord(
    recordId: string,
    admin: Admin,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const record = await this.prisma.tryOnRecord.findUnique({
      where: { id: recordId },
    });

    if (!record) {
      throw new NotFoundException('记录不存在');
    }

    const keysToDelete = [record.personImageKey, record.clothImageKey];
    if (record.resultImageKey) {
      keysToDelete.push(record.resultImageKey);
    }

    await this.storageService.deleteFiles(keysToDelete);

    await this.prisma.tryOnRecord.delete({
      where: { id: recordId },
    });

    await this.logger.log({
      adminId: admin.id,
      operationType: OperationType.DELETE_RECORD,
      module: 'TRYON',
      entityId: recordId,
      details: `删除试衣记录 ${recordId}`,
      beforeData: {
        id: record.id,
        userId: record.userId,
        personImageKey: record.personImageKey,
        clothImageKey: record.clothImageKey,
        resultImageKey: record.resultImageKey,
        status: record.status,
      },
      afterData: null,
      ipAddress,
      userAgent,
    });

    return { message: '删除成功' };
  }

  async getPhotos(page: number, pageSize: number, expiringSoon?: boolean) {
    const skip = (page - 1) * pageSize;
    const now = new Date();
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    let where: any = {};
    if (expiringSoon) {
      where.expiresAt = { gte: now, lte: sevenDaysLater };
    }

    const [records, total] = await Promise.all([
      this.prisma.tryOnRecord.findMany({
        where,
        orderBy: { expiresAt: 'asc' },
        skip,
        take: pageSize,
        include: { user: true },
      }),
      this.prisma.tryOnRecord.count({ where }),
    ]);

    const photosWithDetails = records.map((record) => {
      const expiresAt = new Date(record.expiresAt);
      const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        id: record.id,
        fileKey: record.personImageKey,
        fileName: record.personImageKey.split('/').pop() || 'unknown.jpg',
        fileSize: 0, // 本地存储无法直接获取文件大小
        mimeType: 'image/jpeg',
        userId: record.userId,
        expiresAt: record.expiresAt,
        createdAt: record.createdAt,
      };
    });

    return {
      photos: photosWithDetails,
      total,
    };
  }

  async batchDeletePhotos(
    photoIds: string[],
    admin: Admin,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const records = await this.prisma.tryOnRecord.findMany({
      where: { id: { in: photoIds } },
      select: { id: true, personImageKey: true, clothImageKey: true, resultImageKey: true, userId: true },
    });

    if (records.length === 0) {
      throw new NotFoundException('没有要删除的照片');
    }

    const keysToDelete: string[] = [];
    for (const record of records) {
      keysToDelete.push(record.personImageKey, record.clothImageKey);
      if (record.resultImageKey) {
        keysToDelete.push(record.resultImageKey);
      }
    }

    await this.storageService.deleteFiles(keysToDelete);

    await this.prisma.tryOnRecord.deleteMany({
      where: { id: { in: photoIds } },
    });

    await this.logger.log({
      adminId: admin.id,
      operationType: OperationType.BATCH_DELETE_RECORDS,
      module: 'PHOTOS',
      entityId: photoIds.join(','),
      details: `批量删除 ${records.length} 张照片`,
      beforeData: records.map(r => ({
        id: r.id,
        personImageKey: r.personImageKey,
        clothImageKey: r.clothImageKey,
        resultImageKey: r.resultImageKey,
      })),
      afterData: null,
      ipAddress,
      userAgent,
    });

    return { message: `成功删除 ${records.length} 张照片` };
  }

  async getConfigs() {
    return this.prisma.systemConfig.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async updateConfig(
    configKey: string,
    value: string,
    admin: Admin,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const config = await this.prisma.systemConfig.upsert({
      where: { key: configKey },
      update: { value },
      create: { key: configKey, value, type: 'STRING' },
    });

    await this.prisma.operationLog.create({
      data: {
        adminId: admin.id,
        operationType: OperationType.UPDATE_CONFIG,
        details: `更新配置 ${configKey} = ${value}`,
        ipAddress,
        userAgent,
      },
    });

    return config;
  }

  async getAnnouncements() {
    return this.prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createAnnouncement(
    data: { title: string; content: string; priority?: number },
    admin: Admin,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const announcement = await this.prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        priority: data.priority || 0,
      },
    });

    await this.prisma.operationLog.create({
      data: {
        adminId: admin.id,
        operationType: OperationType.CREATE_ANNOUNCEMENT,
        details: `创建公告: ${data.title}`,
        ipAddress,
        userAgent,
      },
    });

    return announcement;
  }

  async deleteAnnouncement(
    announcementId: string,
    admin: Admin,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.prisma.announcement.delete({
      where: { id: announcementId },
    });

    await this.prisma.operationLog.create({
      data: {
        adminId: admin.id,
        operationType: OperationType.DELETE_ANNOUNCEMENT,
        details: `删除公告 ${announcementId}`,
        ipAddress,
        userAgent,
      },
    });

    return { message: '删除成功' };
  }

  async batchDeleteTryOnRecords(
    recordIds: string[],
    admin: Admin,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const records = await this.prisma.tryOnRecord.findMany({
      where: { id: { in: recordIds } },
    });

    if (records.length === 0) {
      throw new NotFoundException('没有要删除的记录');
    }

    const keysToDelete: string[] = [];
    for (const record of records) {
      keysToDelete.push(record.personImageKey, record.clothImageKey);
      if (record.resultImageKey) {
        keysToDelete.push(record.resultImageKey);
      }
    }

    await this.storageService.deleteFiles(keysToDelete);

    await this.prisma.tryOnRecord.deleteMany({
      where: { id: { in: recordIds } },
    });

    await this.logger.log({
      adminId: admin.id,
      operationType: OperationType.BATCH_DELETE_RECORDS,
      module: 'TRYON',
      entityId: recordIds.join(','),
      details: `批量删除 ${records.length} 条试衣记录`,
      beforeData: records.map(r => ({
        id: r.id,
        userId: r.userId,
        personImageKey: r.personImageKey,
        clothImageKey: r.clothImageKey,
        resultImageKey: r.resultImageKey,
        status: r.status,
      })),
      afterData: null,
      ipAddress,
      userAgent,
    });

    return { message: `成功删除 ${records.length} 条记录` };
  }

  async updateUser(
    userId: string,
    data: { nickname?: string; phone?: string; email?: string; status?: UserStatus },
    admin: Admin,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const updateData: any = {};
    if (data.nickname !== undefined) updateData.nickname = data.nickname;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.status !== undefined) updateData.status = data.status;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        phone: true,
        email: true,
        nickname: true,
        status: true,
        updatedAt: true,
      },
    });

    const fields = ['nickname', 'phone', 'email', 'status'];
    const diff = this.logger.formatDiff(user, updatedUser, fields);

    await this.logger.log({
      adminId: admin.id,
      operationType: OperationType.UPDATE_USER,
      module: 'USERS',
      entityId: userId,
      details: `更新用户 ${userId} 信息: ${diff}`,
      beforeData: { nickname: user.nickname, phone: user.phone, email: user.email, status: user.status },
      afterData: { nickname: updatedUser.nickname, phone: updatedUser.phone, email: updatedUser.email, status: updatedUser.status },
      ipAddress,
      userAgent,
    });

    return updatedUser;
  }

  async deleteUser(
    userId: string,
    admin: Admin,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });

    await this.logger.log({
      adminId: admin.id,
      operationType: OperationType.DELETE_USER,
      module: 'USERS',
      entityId: userId,
      details: `删除用户: ${user.nickname || user.phone || userId}`,
      beforeData: { id: user.id, nickname: user.nickname, phone: user.phone, email: user.email },
      afterData: null,
      ipAddress,
      userAgent,
    });

    return { message: '删除成功' };
  }

  async batchDeleteUsers(
    userIds: string[],
    admin: Admin,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, nickname: true, phone: true, email: true },
    });

    if (users.length === 0) {
      throw new NotFoundException('没有要删除的用户');
    }

    await this.prisma.user.deleteMany({
      where: { id: { in: userIds } },
    });

    await this.logger.log({
      adminId: admin.id,
      operationType: OperationType.DELETE_USER,
      module: 'USERS',
      entityId: userIds.join(','),
      details: `批量删除 ${users.length} 个用户`,
      beforeData: users.map(u => ({
        id: u.id,
        nickname: u.nickname,
        phone: u.phone,
        email: u.email,
      })),
      afterData: null,
      ipAddress,
      userAgent,
    });

    return { message: `成功删除 ${users.length} 个用户` };
  }

  async createUser(
    data: { phone?: string; email?: string; nickname?: string; status?: UserStatus },
    admin: Admin,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const newUser = await this.prisma.user.create({
      data: {
        phone: data.phone,
        email: data.email,
        nickname: data.nickname,
        status: data.status || UserStatus.ACTIVE,
      },
      select: {
        id: true,
        phone: true,
        email: true,
        nickname: true,
        status: true,
        createdAt: true,
      },
    });

    await this.logger.log({
      adminId: admin.id,
      operationType: OperationType.CREATE_USER,
      module: 'USERS',
      entityId: newUser.id,
      details: `创建用户: ${newUser.nickname || newUser.phone || newUser.id}`,
      afterData: newUser,
      ipAddress,
      userAgent,
    });

    return newUser;
  }

  async getAdmins(page: number, pageSize: number, search?: string) {
    const skip = (page - 1) * pageSize;
    const where = search ? {
      OR: [
        { username: { contains: search } },
        { email: { contains: search } },
      ],
    } : {};

    const [admins, total] = await Promise.all([
      this.prisma.admin.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true,
          lastLoginAt: true,
          loginCount: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.admin.count({ where }),
    ]);

    return {
      admins,
      total,
    };
  }

  async createAdmin(
    data: { username: string; email?: string; password: string; role?: UserRole; status?: UserStatus },
    admin: Admin,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.admin.findUnique({
      where: { username: data.username },
    });

    if (existing) {
      throw new ConflictException('用户名已存在');
    }

    if (data.email) {
      const existingEmail = await this.prisma.admin.findUnique({
        where: { email: data.email },
      });
      if (existingEmail) {
        throw new ConflictException('邮箱已存在');
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const newAdmin = await this.prisma.admin.create({
      data: {
        username: data.username,
        email: data.email,
        password: hashedPassword,
        role: data.role || UserRole.ADMIN,
        status: data.status || UserStatus.ACTIVE,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    await this.prisma.operationLog.create({
      data: {
        adminId: admin.id,
        operationType: OperationType.CREATE_USER,
        details: `创建管理员账号: ${data.username}`,
        ipAddress,
        userAgent,
      },
    });

    return newAdmin;
  }

  async updateAdmin(
    adminId: string,
    data: { email?: string; password?: string; role?: UserRole; status?: UserStatus },
    currentAdmin: Admin,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const targetAdmin = await this.prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!targetAdmin) {
      throw new NotFoundException('管理员不存在');
    }

    if (targetAdmin.role === UserRole.SUPER_ADMIN && currentAdmin.role !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException('无权修改超级管理员账号');
    }

    const updateData: any = {};
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 12);
    }

    const updated = await this.prisma.admin.update({
      where: { id: adminId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    await this.prisma.operationLog.create({
      data: {
        adminId: currentAdmin.id,
        operationType: OperationType.UPDATE_USER,
        details: `更新管理员账号: ${targetAdmin.username}`,
        ipAddress,
        userAgent,
      },
    });

    return updated;
  }

  async deleteAdmin(
    adminId: string,
    currentAdmin: Admin,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const targetAdmin = await this.prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!targetAdmin) {
      throw new NotFoundException('管理员不存在');
    }

    if (targetAdmin.id === currentAdmin.id) {
      throw new BadRequestException('不能删除自己的账号');
    }

    if (targetAdmin.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('不能删除超级管理员账号');
    }

    await this.prisma.admin.delete({
      where: { id: adminId },
    });

    await this.prisma.operationLog.create({
      data: {
        adminId: currentAdmin.id,
        operationType: OperationType.DELETE_USER,
        details: `删除管理员账号: ${targetAdmin.username}`,
        ipAddress,
        userAgent,
      },
    });

    return { message: '删除成功' };
  }

  async getAdminPermissions(adminId: string) {
    const permissions = await this.prisma.adminPermission.findMany({
      where: { adminId },
    });
    return permissions;
  }

  async updateAdminPermissions(
    adminId: string,
    permissions: { module: PermissionModule; actions: PermissionAction[] }[],
    currentAdmin: Admin,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const targetAdmin = await this.prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!targetAdmin) {
      throw new NotFoundException('管理员不存在');
    }

    if (targetAdmin.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('不能修改超级管理员权限');
    }

    await this.prisma.adminPermission.deleteMany({
      where: { adminId },
    });

    for (const perm of permissions) {
      await this.prisma.adminPermission.create({
        data: {
          adminId,
          module: perm.module,
          actions: perm.actions,
        },
      });
    }

    await this.logger.log({
      adminId: currentAdmin.id,
      operationType: OperationType.UPDATE_PERMISSION,
      module: 'ADMINS',
      entityId: adminId,
      details: `更新管理员 ${targetAdmin.username} 权限: ${permissions.map(p => `${p.module}: ${p.actions.join(',')}`).join('; ')}`,
      afterData: { permissions },
      ipAddress,
      userAgent,
    });

    return this.getAdminPermissions(adminId);
  }

  async getOperationLogs(
    page: number,
    pageSize: number,
    adminId?: string,
    module?: string,
    operationType?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const skip = (page - 1) * pageSize;
    const where: any = {};

    if (adminId) {
      where.adminId = adminId;
    }
    if (module) {
      where.module = module;
    }
    if (operationType) {
      if (operationType.endsWith('_')) {
        const matchingTypes = Object.values(OperationType).filter((t) =>
          (t as string).startsWith(operationType)
        );
        if (matchingTypes.length > 0) {
          where.operationType = { in: matchingTypes };
        } else {
          where.operationType = 'LOGIN';
        }
      } else {
        where.operationType = operationType as OperationType;
      }
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate + 'T00:00:00.000Z');
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.operationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          admin: {
            select: { id: true, username: true },
          },
        },
      }),
      this.prisma.operationLog.count({ where }),
    ]);

    return {
      logs: logs.map((log) => ({
        id: log.id,
        adminId: log.adminId,
        adminName: log.admin?.username || '系统',
        operationType: log.operationType,
        module: log.module,
        entityId: log.entityId,
        details: log.details,
        beforeData: log.beforeData ? JSON.parse(log.beforeData) : null,
        afterData: log.afterData ? JSON.parse(log.afterData) : null,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
      })),
      total,
    };
  }

  async getApiLogs(
    page: number,
    pageSize: number,
    clothingType?: string,
    statusCode?: number,
  ) {
    const skip = (page - 1) * pageSize;
    const where: any = {};

    if (clothingType) {
      where.clothingType = clothingType;
    }
    if (statusCode) {
      where.statusCode = statusCode;
    }

    const [logs, total] = await Promise.all([
      this.prisma.apiLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.apiLog.count({ where }),
    ]);

    return {
      logs: logs.map((log) => ({
        id: log.id,
        taskId: log.taskId,
        endpoint: log.endpoint,
        method: log.method,
        requestData: log.requestData ? JSON.parse(log.requestData) : null,
        responseData: log.responseData ? JSON.parse(log.responseData) : null,
        clothingType: log.clothingType,
        category: log.category,
        statusCode: log.statusCode,
        duration: log.duration,
        errorMessage: log.errorMessage,
        createdAt: log.createdAt,
      })),
      total,
    };
  }

  async getApiLogDetail(id: string) {
    const log = await this.prisma.apiLog.findUnique({
      where: { id },
    });

    if (!log) {
      throw new NotFoundException('API日志不存在');
    }

    return {
      id: log.id,
      taskId: log.taskId,
      endpoint: log.endpoint,
      method: log.method,
      requestData: log.requestData ? JSON.parse(log.requestData) : null,
      responseData: log.responseData ? JSON.parse(log.responseData) : null,
      clothingType: log.clothingType,
      category: log.category,
      statusCode: log.statusCode,
      duration: log.duration,
      errorMessage: log.errorMessage,
      createdAt: log.createdAt,
    };
  }
}
