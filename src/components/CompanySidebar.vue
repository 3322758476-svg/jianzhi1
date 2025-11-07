<template>
  <div class="company-sidebar">
    <!-- 企业信息卡片 -->
    <div class="company-info-card">
      <div class="company-avatar">
        <el-avatar :size="60" :src="companyInfo.logo" />
      </div>
      <div class="company-details">
        <div class="company-name">{{ companyInfo.name }}</div>
        <div class="company-industry">{{ companyInfo.industry }}</div>
        <div class="company-status">
          <el-tag :type="companyInfo.status === 'verified' ? 'success' : 'warning'" size="small">
            {{ companyInfo.status === 'verified' ? '已认证' : '待认证' }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 导航菜单 -->
    <el-menu
      :default-active="activeMenu"
      class="sidebar-menu"
      :router="true"
      @select="handleMenuSelect"
    >
      <!-- 仪表盘 -->
      <el-menu-item index="/company/dashboard">
        <el-icon><DataBoard /></el-icon>
        <span>控制台首页</span>
      </el-menu-item>

      <!-- 岗位管理 -->
      <el-sub-menu index="jobs">
        <template #title>
          <el-icon><Briefcase /></el-icon>
          <span>岗位管理</span>
        </template>
        <el-menu-item index="/company/jobs">
          <el-icon><List /></el-icon>
          <span>岗位列表</span>
        </el-menu-item>
        <el-menu-item index="/company/jobs/new">
          <el-icon><Plus /></el-icon>
          <span>发布新岗位</span>
        </el-menu-item>
        <el-menu-item index="/company/jobs/archived">
          <el-icon><FolderDelete /></el-icon>
          <span>已归档岗位</span>
        </el-menu-item>
      </el-sub-menu>

      <!-- 申请管理 -->
      <el-sub-menu index="applications">
        <template #title>
          <el-icon><Document /></el-icon>
          <span>申请管理</span>
          <el-badge v-if="pendingCount > 0" :value="pendingCount" class="menu-badge" />
        </template>
        <el-menu-item index="/company/applications">
          <el-icon><List /></el-icon>
          <span>全部申请</span>
        </el-menu-item>
        <el-menu-item index="/company/applications/pending">
          <el-icon><Clock /></el-icon>
          <span>待处理申请</span>
          <el-badge v-if="pendingCount > 0" :value="pendingCount" class="menu-badge" />
        </el-menu-item>
        <el-menu-item index="/company/applications/reviewing">
          <el-icon><Search /></el-icon>
          <span>审核中申请</span>
        </el-menu-item>
        <el-menu-item index="/company/applications/accepted">
          <el-icon><SuccessFilled /></el-icon>
          <span>已通过申请</span>
        </el-menu-item>
        <el-menu-item index="/company/applications/rejected">
          <el-icon><CloseBold /></el-icon>
          <span>已拒绝申请</span>
        </el-menu-item>
      </el-sub-menu>



      <!-- 企业设置 -->
      <el-sub-menu index="settings">
        <template #title>
          <el-icon><Setting /></el-icon>
          <span>企业设置</span>
        </template>
        <el-menu-item index="/company/settings/profile">
          <el-icon><User /></el-icon>
          <span>企业资料</span>
        </el-menu-item>
        <el-menu-item index="/company/settings/members">
          <el-icon><UserFilled /></el-icon>
          <span>成员管理</span>
        </el-menu-item>
        <el-menu-item index="/company/settings/permissions">
          <el-icon><Lock /></el-icon>
          <span>权限管理</span>
        </el-menu-item>
        <el-menu-item index="/company/settings/integration">
          <el-icon><Connection /></el-icon>
          <span>系统集成</span>
        </el-menu-item>
      </el-sub-menu>

      <!-- 帮助中心 -->
      <el-menu-item index="/company/help">
        <el-icon><QuestionFilled /></el-icon>
        <span>帮助中心</span>
      </el-menu-item>
    </el-menu>

    <!-- 快捷操作 -->
    <div class="quick-actions">
      <div class="section-title">快捷操作</div>
      <div class="action-buttons">
        <el-button type="primary" size="small" @click="handleQuickAction('newJob')">
          <el-icon><Plus /></el-icon>
          发布岗位
        </el-button>
        <el-button size="small" @click="handleQuickAction('viewApplications')">
          <el-icon><Document /></el-icon>
          查看申请
        </el-button>
      </div>
    </div>

    <!-- 系统状态 -->
    <div class="system-status">
      <div class="section-title">系统状态</div>
      <div class="status-items">
        <div class="status-item">
          <div class="status-label">在线状态</div>
          <div class="status-value">
            <el-tag type="success" size="small">正常</el-tag>
          </div>
        </div>
        <div class="status-item">
          <div class="status-label">最后同步</div>
          <div class="status-value">{{ lastSyncTime }}</div>
        </div>
        <div class="status-item">
          <div class="status-label">API状态</div>
          <div class="status-value">
            <el-tag type="success" size="small">正常</el-tag>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../store'
import {
  DataBoard,
  Briefcase,
  Document,
  Setting,
  User,
  QuestionFilled,
  List,
  Plus,
  FolderDelete,
  Clock,
  Search,
  SuccessFilled,
  CloseBold,
  UserFilled,
  Lock,
  Connection
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 响应式数据
const activeMenu = ref('')
const pendingCount = ref(5) // 模拟待处理申请数量
const unreadMessages = ref(3) // 模拟未读消息数量
const lastSyncTime = ref('刚刚')

// 企业信息
const companyInfo = computed(() => {
  const user = userStore.user
  return {
    name: user?.companyName || '未设置企业名称',
    industry: user?.industry || '未知行业',
    logo: user?.logo || '',
    status: user?.companyStatus || 'pending'
  }
})

// 处理菜单选择
const handleMenuSelect = (index: string) => {
  activeMenu.value = index
}

// 处理快捷操作
const handleQuickAction = (action: string) => {
  switch (action) {
    case 'newJob':
      router.push('/company/jobs/new')
      break
    case 'viewApplications':
      router.push('/company/applications')
      break
  }
}

// 更新活动菜单
const updateActiveMenu = () => {
  const path = route.path
  if (path.startsWith('/company/dashboard')) {
    activeMenu.value = '/company/dashboard'
  } else if (path.startsWith('/company/jobs')) {
    activeMenu.value = path
  } else if (path.startsWith('/company/applications')) {
    activeMenu.value = path
  } else if (path.startsWith('/company/settings')) {
    activeMenu.value = path
  } else if (path.startsWith('/company/help')) {
    activeMenu.value = path
  }
}

onMounted(() => {
  updateActiveMenu()
  
  // 监听路由变化
  router.afterEach(() => {
    updateActiveMenu()
  })
})
</script>

<style scoped>
.company-sidebar {
  width: 280px;
  height: 100vh;
  background: #f8f9fa;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.company-info-card {
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
  background: white;
}

.company-avatar {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.company-details {
  text-align: center;
}

.company-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.company-industry {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.sidebar-menu {
  flex: 1;
  border: none;
  background: transparent;
}

:deep(.sidebar-menu .el-menu-item),
:deep(.sidebar-menu .el-sub-menu__title) {
  height: 48px;
  line-height: 48px;
  margin: 2px 8px;
  border-radius: 6px;
}

:deep(.sidebar-menu .el-menu-item.is-active) {
  background-color: #ecf5ff;
  color: #409eff;
}

:deep(.sidebar-menu .el-menu-item:hover),
:deep(.sidebar-menu .el-sub-menu__title:hover) {
  background-color: #f5f7fa;
}

.menu-badge {
  margin-left: auto;
}

.quick-actions {
  padding: 20px;
  border-top: 1px solid #e4e7ed;
  background: white;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-buttons .el-button {
  justify-content: flex-start;
}

.system-status {
  padding: 20px;
  border-top: 1px solid #e4e7ed;
  background: white;
}

.status-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-label {
  font-size: 12px;
  color: #909399;
}

.status-value {
  font-size: 12px;
  color: #606266;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .company-sidebar {
    width: 240px;
  }
}

@media (max-width: 768px) {
  .company-sidebar {
    width: 100%;
    height: auto;
    position: fixed;
    top: 0;
    left: -100%;
    z-index: 1000;
    transition: left 0.3s;
  }
  
  .company-sidebar.mobile-open {
    left: 0;
  }
}
</style>