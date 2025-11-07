<template>
  <div id="app">
    <!-- 导航栏 -->
    <el-header class="header">
      <div class="header-content">
        <div class="logo">
          <h2>大学生兼职平台</h2>
        </div>
        <el-menu
          :default-active="activeIndex"
          class="nav-menu"
          mode="horizontal"
          @select="handleSelect"
          router
        >
          <el-menu-item index="/">首页</el-menu-item>
          <el-menu-item index="/jobs">兼职岗位</el-menu-item>
          <el-menu-item v-if="userStore.isAuthenticated && userStore.isCompany" index="/company/dashboard">企业控制台</el-menu-item>
          <el-menu-item v-if="userStore.isAuthenticated && !userStore.isCompany" index="/profile">个人中心</el-menu-item>
          <el-menu-item v-if="userStore.isAuthenticated" index="/messages">消息与通知</el-menu-item>
        </el-menu>
        <div class="header-actions">
          <template v-if="!userStore.isAuthenticated">
            <el-button type="primary" @click="$router.push('/login')">登录</el-button>
            <el-button @click="$router.push('/register')">注册</el-button>
          </template>
          <template v-else>
            <el-dropdown>
              <span class="user-info">
                <el-avatar :size="32" :src="userStore.user?.avatar" />
                {{ userStore.user?.username }}
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="$router.push('/profile')">个人中心</el-dropdown-item>
                  <el-dropdown-item @click="$router.push('/settings')">设置</el-dropdown-item>
                  <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </div>
      </div>
    </el-header>

    <!-- 主要内容区域 -->
    <el-main class="main-content">
      <router-view />
    </el-main>

    <!-- 页脚 -->
    <el-footer class="footer">
      <div class="footer-content">
        <div class="footer-section">
          <h4>关于我们</h4>
          <p>专业的大学生兼职平台，连接企业与学生</p>
        </div>
        <div class="footer-section">
          <h4>联系我们</h4>
          <p>邮箱: contact@campusjob.com</p>
          <p>电话: 400-123-4567</p>
        </div>
        <div class="footer-section">
          <h4>关注我们</h4>
          <div class="social-links">
            <el-link :underline="false">微信</el-link>
            <el-link :underline="false">微博</el-link>
            <el-link :underline="false">QQ群</el-link>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2024 大学生兼职平台. 保留所有权利.</p>
      </div>
    </el-footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from './store'

const router = useRouter()
const userStore = useUserStore()
const activeIndex = ref('/')

const handleSelect = (key: string) => {
  activeIndex.value = key
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await userStore.logout()
    ElMessage.success('退出登录成功')
    router.push('/')
  } catch (error) {
    // 用户取消操作
  }
}

onMounted(async () => {
  // 初始化用户状态
  userStore.initialize()
  
  // 测试 Supabase 连接（仅在开发环境）
  if (import.meta.env.DEV) {
    try {
      const { testSupabaseConnection } = await import('./utils/supabase-test')
      await testSupabaseConnection()
    } catch (error) {
      console.warn('Supabase 连接测试失败:', error)
    }
  }
})
</script>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  padding: 0;
  height: 60px;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  height: 100%;
}

.logo h2 {
  margin: 0;
  color: #409eff;
  font-weight: 600;
}

.nav-menu {
  border-bottom: none;
  flex: 1;
  justify-content: center;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.main-content {
  flex: 1;
  padding: 0;
  background-color: #f5f7fa;
}

.footer {
  background-color: #2c3e50;
  color: #fff;
  padding: 40px 0 20px;
}

.footer-content {
  display: flex;
  justify-content: space-around;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.footer-section h4 {
  margin-bottom: 15px;
  color: #ecf0f1;
}

.footer-section p {
  margin: 5px 0;
  color: #bdc3c7;
}

.social-links {
  display: flex;
  gap: 15px;
}

.footer-bottom {
  text-align: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #34495e;
  color: #95a5a6;
}
</style>