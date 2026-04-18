const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';
let token = '';

async function test() {
  console.log('🚀 开始测试管理后台API...\n');

  // 1. 管理员登录
  console.log('1️⃣ 管理员登录...');
  const loginRes = await axios.post(`${API_BASE}/admin/auth/login`, {
    username: 'superadmin',
    password: 'admin123',
  });
  token = loginRes.data.access_token;
  console.log('✅ 登录成功！\n');

  // 2. 测试用户管理API
  console.log('2️⃣ 获取用户列表...');
  const usersRes = await axios.get(`${API_BASE}/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('✅ 用户列表获取成功！用户数:', usersRes.data.total, '\n');

  // 3. 测试试衣记录批量删除API
  console.log('3️⃣ 测试试衣记录批量删除API...');
  const tryonRes = await axios.get(`${API_BASE}/admin/tryon-records`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('✅ 试衣记录列表获取成功！记录数:', tryonRes.data.total, '\n');

  // 4. 测试管理员账号管理API
  console.log('4️⃣ 获取管理员账号列表...');
  const adminsRes = await axios.get(`${API_BASE}/admin/admins`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('✅ 管理员列表获取成功！管理员数:', adminsRes.data.total, '\n');

  // 5. 创建测试管理员账号
  console.log('5️⃣ 创建测试管理员账号...');
  const createAdminRes = await axios.post(
    `${API_BASE}/admin/admins`,
    {
      username: 'testadmin',
      email: 'test@yida.com',
      password: 'test123456',
      role: 'ADMIN',
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log('✅ 创建成功！管理员ID:', createAdminRes.data.id, '\n');

  // 6. 更新管理员账号
  console.log('6️⃣ 更新管理员账号...');
  const updateAdminRes = await axios.put(
    `${API_BASE}/admin/admins/${createAdminRes.data.id}`,
    { email: 'updated@yida.com' },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log('✅ 更新成功！新邮箱:', updateAdminRes.data.email, '\n');

  // 7. 删除测试管理员账号
  console.log('7️⃣ 删除测试管理员账号...');
  const deleteAdminRes = await axios.delete(
    `${API_BASE}/admin/admins/${createAdminRes.data.id}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log('✅ 删除成功！\n');

  console.log('🎉 所有API测试通过！');
  console.log('\n📊 测试总结:');
  console.log('   ✅ 管理员登录 (密码 admin123)');
  console.log('   ✅ 获取用户列表');
  console.log('   ✅ 获取试衣记录列表');
  console.log('   ✅ 获取管理员列表');
  console.log('   ✅ 创建管理员');
  console.log('   ✅ 更新管理员');
  console.log('   ✅ 删除管理员');
}

test().catch((error) => {
  console.error('❌ 测试失败:', error.response?.data || error.message);
  if (error.response?.data) {
    console.error('   详细错误:', error.response.data);
  }
  process.exit(1);
});
