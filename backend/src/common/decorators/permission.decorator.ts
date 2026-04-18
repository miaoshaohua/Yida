import { SetMetadata } from '@nestjs/common';
import { PermissionModule, PermissionAction } from '@prisma/client';
import { MODULE_KEY, ACTION_KEY } from '../guards/permission.guard';

export const Permissions = (module: PermissionModule, action: PermissionAction) =>
  SetMetadata(MODULE_KEY, module)(SetMetadata(ACTION_KEY, action));
