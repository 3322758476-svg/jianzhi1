# Supabase 后端配置指南

## 项目状态
✅ **Supabase 连接已配置**
- URL: `https://wptvwhlazelotraoagwt.supabase.co`
- 匿名密钥已配置到 `.env` 文件
- 开发服务器已启动: `http://localhost:5186/`

## 需要完成的手动配置

### 1. 数据库迁移执行

**步骤：**
1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 登录您的账户
3. 选择项目: `wptvwhlazelotraoagwt`
4. 进入 **SQL Editor** 页面
5. 复制并执行以下 SQL 代码：

```sql
-- 创建消息表
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  receiver_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'system')),
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);

-- 创建通知表
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('system', 'job', 'application', 'message', 'security')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  related_id TEXT,
  important BOOLEAN DEFAULT FALSE,
  urgent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE,
  starred BOOLEAN DEFAULT FALSE
);

-- 创建联系人关系表
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES auth.users(id),
  user2_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_contacts_user1 ON contacts(user1_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user2 ON contacts(user2_id);

-- 启用行级安全策略
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- 消息表的行级安全策略
CREATE POLICY "用户只能查看自己的消息" ON messages
  FOR ALL USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

-- 通知表的行级安全策略
CREATE POLICY "用户只能查看自己的通知" ON notifications
  FOR ALL USING (
    auth.uid() = user_id
  );

-- 联系人表的行级安全策略
CREATE POLICY "用户只能查看自己的联系人" ON contacts
  FOR ALL USING (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );
```

### 2. 存储桶配置

**步骤：**
1. 在 Supabase Dashboard 中进入 **Storage** 页面
2. 创建以下存储桶：

**messages 存储桶**
- 名称: `messages`
- 公开访问: ✅ 启用
- 文件大小限制: 50MB
- 允许的文件类型: 所有

**images 存储桶**
- 名称: `images`
- 公开访问: ✅ 启用
- 文件大小限制: 20MB
- 允许的文件类型: 图片文件

### 3. 测试连接

项目已包含连接测试工具。在浏览器控制台中运行：

```javascript
// 在浏览器控制台中测试连接
import { testSupabaseConnection, checkEnvironment } from './src/utils/supabase-test'

// 检查环境变量
checkEnvironment()

// 测试连接
testSupabaseConnection()
```

## 功能特性

### 已实现的功能
- ✅ 实时消息推送
- ✅ 文件上传下载
- ✅ 通知管理
- ✅ 联系人管理
- ✅ 行级安全策略
- ✅ TypeScript 类型定义

### API 接口

**消息相关**
- `messageApi.getContacts(userId)` - 获取联系人列表
- `messageApi.getMessages(contactId)` - 获取聊天消息
- `messageApi.sendMessage(message)` - 发送消息
- `messageApi.uploadFile(file)` - 上传文件
- `messageApi.subscribeToMessages()` - 实时订阅

**通知相关**
- `notificationApi.getNotifications(userId)` - 获取通知
- `notificationApi.markAsRead(notificationId)` - 标记已读
- `notificationApi.deleteNotification(notificationId)` - 删除通知
- `notificationApi.subscribeToNotifications()` - 实时订阅

## 故障排除

### 常见问题

1. **连接失败**
   - 检查 `.env` 文件中的 URL 和密钥是否正确
   - 确认 Supabase 项目是否正常运行

2. **表不存在错误**
   - 确保已执行数据库迁移 SQL
   - 检查表名和字段名是否正确

3. **存储桶权限错误**
   - 确认存储桶已设置为公开访问
   - 检查存储策略是否正确配置

### 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建项目
npm run build

# 预览构建结果
npm run preview
```

## 下一步

完成数据库迁移和存储桶配置后，您的兼职平台将具备完整的后端功能，包括：
- 实时聊天系统
- 文件共享功能
- 通知推送
- 用户认证集成
- 数据安全保障

如需进一步帮助，请参考 Supabase 官方文档或联系技术支持。