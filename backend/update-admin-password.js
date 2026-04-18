const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updatePassword() {
  const newPassword = 'admin123';
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.admin.updateMany({
    where: { role: 'SUPER_ADMIN' },
    data: { password: hashedPassword },
  });

  console.log('✅ 超级管理员密码已更新为: admin123');
}

updatePassword()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
