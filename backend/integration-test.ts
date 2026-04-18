import axios from 'axios';

const API = 'http://localhost:3000';
let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string) {
  if (condition) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.error(`  ❌ ${name}`);
    failed++;
  }
}

async function runTest(name: string, fn: () => Promise<void>) {
  console.log(`\n--- ${name} ---`);
  try {
    await fn();
  } catch (err: any) {
    console.error(`  ❌ 异常: ${err.response?.data?.message || err.message}`);
    failed++;
  }
}

async function main() {
  console.log('=== Yida 全流程集成测试 ===\n');

  // Test 1: 游客登录
  await runTest('游客登录 + 指纹识别', async () => {
    const deviceId = `test_device_${Date.now()}`;
    const fingerprint = 'test_fp_' + Math.random().toString(36).slice(2);
    
    const res1 = await axios.post(`${API}/api/auth/guest-login`, { deviceId, fingerprint });
    assert(res1.status === 201, '游客登录成功');
    assert(res1.data.access_token, '返回 JWT token');
    assert(res1.data.user.id, '返回用户信息');
    assert(res1.data.user.dailyTryOnCount === 0, '初始试衣次数为0');
    const userId = res1.data.user.id;

    // 清理缓存后重新登录
    const newDeviceId = `test_device_new_${Date.now()}`;
    const res2 = await axios.post(`${API}/api/auth/guest-login`, { deviceId: newDeviceId, fingerprint });
    assert(res2.status === 201, '指纹识别登录成功');
    assert(res2.data.user.id === userId, '识别到同一用户');
  });

  // Test 2: 获取用户信息
  await runTest('获取用户信息', async () => {
    const deviceId = `test_device_info_${Date.now()}`;
    const res1 = await axios.post(`${API}/api/auth/guest-login`, { deviceId, fingerprint: 'fp_info' });
    const token = res1.data.access_token;
    const headers = { Authorization: `Bearer ${token}` };

    const res2 = await axios.get(`${API}/api/auth/me`, { headers });
    assert(res2.status === 200, '获取用户信息成功');
    assert(res2.data.nickname, '返回用户昵称');
  });

  // Test 3: 创建试衣任务
  await runTest('创建试衣任务', async () => {
    const deviceId = `test_device_tryon_${Date.now()}`;
    const res1 = await axios.post(`${API}/api/auth/guest-login`, { deviceId, fingerprint: 'fp_tryon' });
    const token = res1.data.access_token;
    const headers = { Authorization: `Bearer ${token}` };

    // 创建任务（使用模拟数据）
    const res2 = await axios.post(`${API}/api/tryon/tasks`, {
      personImageKey: 'test_person.jpg',
      clothImageKey: 'test_cloth.jpg',
      clothingType: 'FULL_BODY',
    }, { headers });
    assert(res2.status === 201, '创建任务成功');
    assert(res2.data.taskId, '返回 taskId');
    assert(res2.data.status === 'PENDING' || res2.data.status === 'PROCESSING', '任务状态正确');
  });

  // Test 4: 获取我的任务列表
  await runTest('获取我的任务列表', async () => {
    const deviceId = `test_device_list_${Date.now()}`;
    const res1 = await axios.post(`${API}/api/auth/guest-login`, { deviceId, fingerprint: 'fp_list' });
    const token = res1.data.access_token;
    const headers = { Authorization: `Bearer ${token}` };

    const res2 = await axios.get(`${API}/api/tryon/tasks/my?page=1&limit=10`, { headers });
    assert(res2.status === 200, '获取任务列表成功');
    assert(Array.isArray(res2.data.tasks), '返回 tasks 数组');
    assert(typeof res2.data.total === 'number', '返回 total 数字');
  });

  // Test 5: 管理员登录
  await runTest('管理员登录', async () => {
    const res = await axios.post(`${API}/api/admin/auth/login`, {
      username: 'superadmin',
      password: 'admin123',
    });
    assert(res.status === 201, '管理员登录成功');
    assert(res.data.access_token, '返回管理员 JWT');
    assert(res.data.admin.role === 'SUPER_ADMIN', '超级管理员角色');
  });

  // Test 6: 管理员获取操作日志
  await runTest('管理员获取操作日志', async () => {
    const loginRes = await axios.post(`${API}/api/admin/auth/login`, {
      username: 'superadmin',
      password: 'admin123',
    });
    const token = loginRes.data.access_token;
    const headers = { Authorization: `Bearer ${token}` };

    // 测试操作类型筛选
    const res1 = await axios.get(`${API}/api/admin/operation-logs?operationType=LOGIN&page=1&pageSize=5`, { headers });
    assert(res1.status === 200, '按操作类型筛选成功');
    assert(Array.isArray(res1.data.logs), '返回 logs 数组');
    
    // 测试日期筛选
    const today = new Date().toISOString().split('T')[0];
    const res2 = await axios.get(`${API}/api/admin/operation-logs?startDate=${today}&page=1&pageSize=5`, { headers });
    assert(res2.status === 200, '按日期筛选成功');
    
    // 测试组合筛选
    const res3 = await axios.get(`${API}/api/admin/operation-logs?module=ADMINS&operationType=DELETE_&page=1&pageSize=5`, { headers });
    assert(res3.status === 200, '组合筛选成功');
  });

  console.log('\n========================================');
  console.log(`测试结果: ✅ 通过 ${passed} 项 | ❌ 失败 ${failed} 项`);
  console.log('========================================\n');
  
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('测试执行失败:', err.response?.data || err.message);
  process.exit(1);
});
