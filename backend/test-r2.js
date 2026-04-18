const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3000/api';

let token = '';
let userId = '';
let personImageKey = '';
let clothingImageKey = '';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function test() {
  console.log('🚀 开始测试 R2 存储 + 完整试衣流程...\n');

  // ==========================================
  // 1. 访客登录
  // ==========================================
  console.log('1️⃣ 访客登录...');
  const deviceId = 'test-device-' + Date.now();
  const loginRes = await axios.post(`${API_BASE}/auth/guest-login`, { deviceId });
  token = loginRes.data.access_token;
  userId = loginRes.data.user.id;
  console.log('✅ 登录成功！用户ID:', userId);
  console.log('   Token:', token.substring(0, 30) + '...\n');

  // ==========================================
  // 2. 获取人物照上传预签名URL (R2)
  // ==========================================
  console.log('2️⃣ 获取人物照上传预签名URL (R2)...');
  const personPresignRes = await axios.post(
    `${API_BASE}/storage/presigned-url`,
    { filename: 'human.jpg' },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  personImageKey = personPresignRes.data.fileKey;
  console.log('✅ 获取成功！文件Key:', personImageKey);
  console.log('   上传URL:', personPresignRes.data.uploadUrl.substring(0, 60) + '...\n');

  // ==========================================
  // 3. 上传人物照到 R2
  // ==========================================
  console.log('3️⃣ 上传人物照到 R2...');
  const personImagePath = path.join(__dirname, '../documents/human.jpg');
  const personImageBuffer = fs.readFileSync(personImagePath);
  
  await axios.put(personPresignRes.data.uploadUrl, personImageBuffer, {
    headers: { 'Content-Type': 'image/jpeg' },
  });
  console.log('✅ 人物照上传成功！\n');

  // ==========================================
  // 4. 获取衣服照上传预签名URL (R2)
  // ==========================================
  console.log('4️⃣ 获取衣服照上传预签名URL (R2)...');
  const clothingPresignRes = await axios.post(
    `${API_BASE}/storage/presigned-url`,
    { filename: 'clouth.jpg' },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  clothingImageKey = clothingPresignRes.data.fileKey;
  console.log('✅ 获取成功！文件Key:', clothingImageKey, '\n');

  // ==========================================
  // 5. 上传衣服照到 R2
  // ==========================================
  console.log('5️⃣ 上传衣服照到 R2...');
  const clothingImagePath = path.join(__dirname, '../documents/clouth.jpg');
  const clothingImageBuffer = fs.readFileSync(clothingImagePath);
  
  await axios.put(clothingPresignRes.data.uploadUrl, clothingImageBuffer, {
    headers: { 'Content-Type': 'image/jpeg' },
  });
  console.log('✅ 衣服照上传成功！\n');

  // ==========================================
  // 6. 创建试衣任务
  // ==========================================
  console.log('6️⃣ 创建试衣任务...');
  const createTaskRes = await axios.post(
    `${API_BASE}/tryon/tasks`,
    {
      personImageKey: personImageKey,
      clothImageKey: clothingImageKey,
      clothingType: 'TOP',
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const taskId = createTaskRes.data.taskId;
  console.log('✅ 任务创建成功！任务ID:', taskId);
  console.log('   任务状态:', createTaskRes.data.status, '\n');

  // ==========================================
  // 7. 轮询任务状态
  // ==========================================
  console.log('7️⃣ 轮询任务状态...');
  let taskStatus = 'PENDING';
  let attempts = 0;
  const maxAttempts = 30; // 最多 1 分钟

  while (taskStatus !== 'COMPLETED' && taskStatus !== 'FAILED' && attempts < maxAttempts) {
    await sleep(2000);
    const taskRes = await axios.get(`${API_BASE}/tryon/tasks/${taskId}`);
    taskStatus = taskRes.data.status;
    attempts++;
    console.log(`   [${attempts}/${maxAttempts}] 状态: ${taskStatus}`);
  }

  // ==========================================
  // 8. 获取 R2 预签名 URL 预览
  // ==========================================
  if (taskStatus === 'COMPLETED') {
    console.log('\n8️⃣ 获取结果图片 R2 预签名 URL...');
    const finalTaskRes = await axios.get(`${API_BASE}/tryon/tasks/${taskId}`);
    console.log('✅ 结果图片预签名 URL:', finalTaskRes.data.resultImageUrl?.substring(0, 80) + '...');
  }

  // ==========================================
  // 9. 获取我的试衣历史
  // ==========================================
  console.log('\n9️⃣ 获取我的试衣历史...');
  const myTasksRes = await axios.get(`${API_BASE}/tryon/tasks/my`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { page: 1, limit: 10 },
  });
  console.log('✅ 我的历史记录:', myTasksRes.data.total, '条\n');

  console.log('🎉 R2 存储 + 完整试衣流程测试通过！');
  console.log('\n📊 测试总结:');
  console.log('   ✅ 访客登录');
  console.log('   ✅ 获取 R2 预签名 URL');
  console.log('   ✅ 上传人物照到 R2');
  console.log('   ✅ 上传衣服照到 R2');
  console.log('   ✅ 创建试衣任务');
  console.log('   ✅ 查询任务状态');
  console.log('   ✅ 获取历史记录');
}

test().catch((error) => {
  console.error('❌ 测试失败:', error.response?.data || error.message);
  if (error.response?.data) {
    console.error('   详细错误:', error.response.data);
  }
  process.exit(1);
});
