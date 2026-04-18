import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Admin, PermissionModule, PermissionAction } from '@prisma/client';

export const MODULE_KEY = 'module';
export const ACTION_KEY = 'action';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const admin: Admin = request.user;

    if (!admin) {
      throw new ForbiddenException('未登录');
    }

    // Super admin has all permissions
    if (admin.role === 'SUPER_ADMIN') {
      return true;
    }

    const module = this.reflector.get<PermissionModule>(MODULE_KEY, context.getHandler());
    const action = this.reflector.get<PermissionAction>(ACTION_KEY, context.getHandler());

    if (!module || !action) {
      return true; // No permission required
    }

    const permission = await this.prisma.adminPermission.findUnique({
      where: {
        adminId_module: {
          adminId: admin.id,
          module,
        },
      },
    });

    if (!permission) {
      throw new ForbiddenException('无权执行此操作');
    }

    if (!permission.actions.includes(action)) {
      throw new ForbiddenException('无权执行此操作');
    }

    return true;
  }
}
