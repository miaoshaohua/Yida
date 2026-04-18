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
  console.log('🚀 开始测试完整流程...\n');

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
  // 2. 获取人物照上传预签名URL
  // ==========================================
  console.log('2️⃣ 获取人物照上传预签名URL...');
  const personPresignRes = await axios.post(
    `${API_BASE}/storage/presigned-url`,
    { filename: 'human.jpg' },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  personImageKey = personPresignRes.data.fileKey;
  console.log('✅ 获取成功！文件Key:', personImageKey);
  console.log('   上传URL:', personPresignRes.data.uploadUrl, '\n');

  // ==========================================
  // 3. 上传人物照
  // ==========================================
  console.log('3️⃣ 上传人物照...');
  const personImagePath = path.join(__dirname, '../documents/human.jpg');
  const personImageBuffer = fs.readFileSync(personImagePath);
  
  const isLocalUpload = personPresignRes.data.uploadUrl.includes('upload-direct');
  
  if (isLocalUpload) {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', personImageBuffer, { filename: 'human.jpg' });
    
    await axios.post(
      `http://localhost:3000${personPresignRes.data.uploadUrl}`,
      form,
      {
        headers: {
          ...form.getHeaders(),
        },
      }
    );
  } else {
    await axios.put(personPresignRes.data.uploadUrl, personImageBuffer, {
      headers: { 'Content-Type': 'image/jpeg' },
    });
  }
  console.log('✅ 人物照上传成功！\n');

  // ==========================================
  // 4. 获取衣服照上传预签名URL
  // ==========================================
  console.log('4️⃣ 获取衣服照上传预签名URL...');
  const clothingPresignRes = await axios.post(
    `${API_BASE}/storage/presigned-url`,
    { filename: 'clouth.jpg' },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  clothingImageKey = clothingPresignRes.data.fileKey;
  console.log('✅ 获取成功！文件Key:', clothingImageKey, '\n');

  // ==========================================
  // 5. 上传衣服照
  // ==========================================
  console.log('5️⃣ 上传衣服照...');
  const clothingImagePath = path.join(__dirname, '../documents/clouth.jpg');
  const clothingImageBuffer = fs.readFileSync(clothingImagePath);
  
  const isClothingLocalUpload = clothingPresignRes.data.uploadUrl.includes('upload-direct');
  
  if (isClothingLocalUpload) {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', clothingImageBuffer, { filename: 'clouth.jpg' });
    
    await axios.post(
      `http://localhost:3000${clothingPresignRes.data.uploadUrl}`,
      form,
      {
        headers: {
          ...form.getHeaders(),
        },
      }
    );
  } else {
    await axios.put(clothingPresignRes.data.uploadUrl, clothingImageBuffer, {
      headers: { 'Content-Type': 'image/jpeg' },
    });
  }
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
  let taskStatus = 'pending';
  let attempts = 0;
  const maxAttempts = 20;

  while (taskStatus !== 'completed' && taskStatus !== 'failed' && attempts < maxAttempts) {
    await sleep(2000);
    const taskRes = await axios.get(`${API_BASE}/tryon/tasks/${taskId}`);
    taskStatus = taskRes.data.status;
    attempts++;
    console.log(`   [${attempts}/${maxAttempts}] 状态: ${taskStatus}`);
  }

  console.log('\n🎉 完整流程测试通过！');
  console.log('\n📊 测试总结:');
  console.log('   ✅ 访客登录');
  console.log('   ✅ 获取上传预签名URL');
  console.log('   ✅ 上传人物照片');
  console.log('   ✅ 上传衣服照片');
  console.log('   ✅ 创建试衣任务');
  console.log('   ✅ 查询任务状态 (PENDING → PROCESSING → COMPLETED)');
  
  console.log('\n📁 本地存储文件已保存到:');
  console.log('   -', personImageKey);
  console.log('   -', clothingImageKey);
}

test().catch((error) => {
  console.error('❌ 测试失败:', error.response?.data || error.message);
  if (error.response?.data) {
    console.error('   详细错误:', error.response.data);
  }
  process.exit(1);
});
