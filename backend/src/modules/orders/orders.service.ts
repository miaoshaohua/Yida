import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { User, OrderStatus, OperationType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建支付订单（沙箱模式）
   */
  async createOrder(user: User, productType: 'MONTHLY' | 'YEARLY') {
    const orderNo = `ORD${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const amount = productType === 'MONTHLY' ? 9.9 : 49;
    
    const order = await this.prisma.order.create({
      data: {
        orderNo,
        userId: user.id,
        amount,
        productType,
        status: OrderStatus.PENDING,
      },
    });

    return {
      orderId: order.id,
      orderNo: order.orderNo,
      amount: order.amount,
      productType: order.productType,
      status: order.status,
      message: '订单创建成功，请完成支付',
    };
  }

  /**
   * 模拟支付成功（沙箱模式）
   */
  async simulatePaymentSuccess(orderId: string, user: User) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId, userId: user.id },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('订单状态不正确');
    }

    const now = new Date();
    let memberExpiresAt = new Date();
    
    if (order.productType === 'MONTHLY') {
      memberExpiresAt.setMonth(memberExpiresAt.getMonth() + 1);
    } else {
      memberExpiresAt.setFullYear(memberExpiresAt.getFullYear() + 1);
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.PAID,
        paidAt: now,
        transactionId: uuidv4(),
      },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isMember: true,
        memberExpiresAt,
      },
    });

    return {
      message: '支付成功，会员已开通',
      memberExpiresAt,
    };
  }

  /**
   * 获取用户订单列表
   */
  async getOrders(user: User, page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;
    
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.order.count({
        where: { userId: user.id },
      }),
    ]);

    return {
      data: orders,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
