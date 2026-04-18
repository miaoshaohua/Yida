# FASHN VTON API 文档

## 📡 基本信息

**API 基础 URL**: `https://miaoshaohua--fashn-vton-api-fastapi-app.modal.run`

---

## 🔌 API 端点列表

| 端点 | 方法 | 描述 |
|------|------|------|
| `/tryon` | POST | 虚拟试衣（核心功能） |
| `/health` | GET | 健康检查 |
| `/info` | GET | 模型信息 |
| `/docs` | GET | Swagger API 文档 |

---

## 1️⃣ 健康检查 API

### 请求

```http
GET https://miaoshaohua--fashn-vton-api-fastapi-app.modal.run/health
```

### 响应示例

```json
{
  "status": "healthy",
  "service": "fashn-vton-api",
  "version": "1.5.0"
}
```

### Python 调用示例

```python
import requests

response = requests.get(
    "https://miaoshaohua--fashn-vton-api-fastapi-app.modal.run/health",
    timeout=10
)
print(response.json())
```

---

## 2️⃣ 模型信息 API

### 请求

```http
GET https://miaoshaohua--fashn-vton-api-fastapi-app.modal.run/info
```

### 响应示例

```json
{
  "service": "FASHN VTON Virtual Try-On API",
  "version": "1.5.0",
  "categories": ["tops", "bottoms", "one-pieces"],
  "gpu": "A10G",
  "optimizations": ["keep_warm=1", "timesteps=20"]
}
```

---

## 3️⃣ 虚拟试衣 API (核心功能)

### 请求

```http
POST https://miaoshaohua--fashn-vton-api-fastapi-app.modal.run/tryon
Content-Type: application/json
```

### 请求参数 (Request Body)

| 参数 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| `person_file` | string (base64) | ✅ 是 | - | 人物图片（base64 编码） |
| `garment_file` | string (base64) | ✅ 是 | - | 服装图片（base64 编码） |
| `category` | string | 否 | "tops" | 服装类型：`tops`, `bottoms`, `one-pieces` |
| `num_samples` | integer | 否 | 1 | 生成图片数量（1-4） |
| `num_timesteps` | integer | 否 | 20 | 采样步数（10-50，越高质量越好） |
| `guidance_scale` | float | 否 | 1.5 | 引导尺度 |
| `seed` | integer | 否 | 42 | 随机种子（固定可复现） |

### 请求示例

```json
{
  "person_file": "base64编码的人物图片...",
  "garment_file": "base64编码的服装图片...",
  "category": "tops",
  "num_samples": 1,
  "num_timesteps": 20,
  "guidance_scale": 1.5,
  "seed": 42
}
```

### 响应参数 (Response)

| 参数 | 类型 | 描述 |
|------|------|------|
| `success` | boolean | 是否成功 |
| `images` | array[string] | 生成的图片（base64 编码） |
| `count` | integer | 生成图片数量 |
| `seed` | integer | 使用的随机种子 |
| `error` | string | 错误信息（失败时） |
| `detail` | string | 详细信息（失败时） |

### 响应示例（成功）

```json
{
  "success": true,
  "images": [
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAMLAkADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5u..."
  ],
  "count": 1,
  "seed": 42
}
```

---

## 🐍 Python 调用示例

### 基础调用

```python
import base64
import requests
from PIL import Image
import io

# 图片路径
person_image_path = "path/to/person.jpg"
garment_image_path = "path/to/garment.jpg"

# 读取图片并转换为 base64
with open(person_image_path, "rb") as f:
    person_base64 = base64.b64encode(f.read()).decode("utf-8")

with open(garment_image_path, "rb") as f:
    garment_base64 = base64.b64encode(f.read()).decode("utf-8")

# 构建请求
payload = {
    "person_file": person_base64,
    "garment_file": garment_base64,
    "category": "tops",
    "num_samples": 1,
    "num_timesteps": 20,
    "guidance_scale": 1.5,
    "seed": 42
}

# 发送请求
response = requests.post(
    "https://miaoshaohua--fashn-vton-api-fastapi-app.modal.run/tryon",
    json=payload,
    timeout=1200  # 20 分钟超时
)

# 解析响应
result = response.json()

if result["success"]:
    # 保存结果图片
    for i, img_base64 in enumerate(result["images"]):
        img_data = base64.b64decode(img_base64)
        img = Image.open(io.BytesIO(img_data))
        img.save(f"result_{i+1}.jpg")
        print(f"已保存 result_{i+1}.jpg")
else:
    print(f"失败: {result.get('error')}")
```

### 完整封装

```python
import base64
import requests
from PIL import Image
import io
import os

class FASHNVTONClient:
    def __init__(self, api_url=None):
        self.api_url = api_url or "https://miaoshaohua--fashn-vton-api-fastapi-app.modal.run"

    def try_on(self, person_image_path, garment_image_path,
                category="tops", num_samples=1, num_timesteps=20,
                guidance_scale=1.5, seed=42, output_folder="output"):
        """虚拟试衣"""

        # 读取并编码图片
        with open(person_image_path, "rb") as f:
            person_base64 = base64.b64encode(f.read()).decode("utf-8")

        with open(garment_image_path, "rb") as f:
            garment_base64 = base64.b64encode(f.read()).decode("utf-8")

        # 发送请求
        payload = {
            "person_file": person_base64,
            "garment_file": garment_base64,
            "category": category,
            "num_samples": num_samples,
            "num_timesteps": num_timesteps,
            "guidance_scale": guidance_scale,
            "seed": seed
        }

        response = requests.post(
            f"{self.api_url}/tryon",
            json=payload,
            timeout=1200
        )

        result = response.json()

        if result.get("success"):
            # 创建输出文件夹
            os.makedirs(output_folder, exist_ok=True)

            # 保存图片
            saved_paths = []
            for i, img_base64 in enumerate(result["images"]):
                filename = f"tryon_result_{i+1}.jpg"
                filepath = os.path.join(output_folder, filename)

                img_data = base64.b64decode(img_base64)
                img = Image.open(io.BytesIO(img_data))
                img.save(filepath)
                saved_paths.append(filepath)

            return {
                "success": True,
                "images": saved_paths,
                "count": result["count"]
            }
        else:
            return {
                "success": False,
                "error": result.get("error", "未知错误")
            }

# 使用示例
client = FASHNVTONClient()
result = client.try_on(
    person_image_path="person.jpg",
    garment_image_path="garment.jpg",
    category="tops",
    num_timesteps=20,
    output_folder="results"
)

if result["success"]:
    print(f"成功！生成了 {result['count']} 张图片")
    for path in result["images"]:
        print(f"  - {path}")
else:
    print(f"失败: {result['error']}")
```

---

## 📊 参数说明

### category (服装类型)

| 值 | 描述 |
|------|------|
| `tops` | 上衣（衬衫、T恤、外套等） |
| `bottoms` | 下装（裤子、裙子等） |
| `one-pieces` | 连体装（连衣裙、连体裤等） |

### num_timesteps (采样步数)

| 值 | 速度 | 质量 | 推荐场景 |
|------|------|------|---------|
| 10-15 | 最快 | 较低 | 快速预览 |
| 20 | 快 | 良好 | **推荐（平衡）** |
| 30 | 较慢 | 很好 | 高质量需求 |
| 40-50 | 最慢 | 最好 | 最高质量 |

### seed (随机种子)

- **固定值（如 42）**: 每次生成相同结果，用于复现
- **随机值（如 time.time()）**: 每次生成不同结果

---

## ⚠️ 注意事项

1. **超时设置**: 建议 timeout >= 1200 秒（20 分钟）
2. **首次请求**: 需要 2-5 分钟（冷启动 + 模型加载）
3. **后续请求**: 通常 1-3 分钟（容器已热）
4. **图片格式**: 支持 JPG、PNG 等常见格式
5. **图片大小**: 建议不超过 10MB

---

## 🔗 相关链接

- **Modal Dashboard**: https://modal.com/apps/miaoshaohua/main/deployed/fashn-vton-api
- **Swagger 文档**: https://miaoshaohua--fashn-vton-api-fastapi-app.modal.run/docs

---

## 📝 更新日志

### v1.5.0 (2026-04-15)
- 使用 A10G GPU
- 默认 20 个采样步数
- 启用 keep_warm 优化
- 添加 CORS 支持
- 添加完整的 API 文档
