<template>
  <div class="company-layout">
    <CompanySidebar />
    
    <div class="company-main">
      <div class="company-header">
        <div class="header-left">
          <h1>成员管理</h1>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/company/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item :to="{ path: '/company/settings' }">企业设置</el-breadcrumb-item>
            <el-breadcrumb-item>成员管理</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="showInviteDialog">
            <el-icon><Plus /></el-icon>
            邀请成员
          </el-button>
        </div>
      </div>

      <div class="members-container">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>企业成员列表</span>
              <el-button type="text" @click="refreshList">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>
          
          <el-table :data="memberList" v-loading="loading">
            <el-table-column prop="name" label="成员姓名" width="120" />
            <el-table-column prop="email" label="邮箱地址" min-width="180" />
            <el-table-column prop="role" label="角色" width="120">
              <template #default="{ row }">
                <el-tag :type="getRoleTag(row.role)">{{ getRoleText(row.role) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="department" label="部门" width="120" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'info'">
                  {{ row.status === 'active' ? '活跃' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="joinDate" label="加入时间" width="120" />
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="editMember(row)">编辑</el-button>
                <el-button 
                  size="small" 
                  :type="row.status === 'active' ? 'warning' : 'success'"
                  @click="toggleMemberStatus(row)"
                >
                  {{ row.status === 'active' ? '禁用' : '启用' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </div>

    <!-- 邀请成员对话框 -->
    <el-dialog v-model="inviteDialogVisible" title="邀请成员" width="500px">
      <el-form :model="inviteForm" label-width="80px">
        <el-form-item label="邮箱地址">
          <el-input v-model="inviteForm.email" placeholder="请输入成员邮箱地址" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="inviteForm.role" placeholder="请选择角色">
            <el-option label="管理员" value="admin" />
            <el-option label="普通成员" value="member" />
            <el-option label="观察者" value="viewer" />
          </el-select>
        </el-form-item>
        <el-form-item label="部门">
          <el-input v-model="inviteForm.department" placeholder="请输入部门名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="inviteDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="sendInvite">发送邀请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import CompanySidebar from '../components/CompanySidebar.vue'
import { Plus, Refresh } from '@element-plus/icons-vue'

interface Member {
  id: string
  name: string
  email: string
  role: string
  department: string
  status: 'active' | 'inactive'
  joinDate: string
}

interface InviteForm {
  email: string
  role: string
  department: string
}

const loading = ref(false)
const memberList = ref<Member[]>([])
const inviteDialogVisible = ref(false)
const inviteForm = reactive<InviteForm>({
  email: '',
  role: 'member',
  department: ''
})

const getRoleTag = (role: string) => {
  const roleMap = {
    'admin': 'danger',
    'member': 'primary',
    'viewer': 'info'
  }
  return roleMap[role as keyof typeof roleMap] || 'info'
}

const getRoleText = (role: string) => {
  const roleMap = {
    'admin': '管理员',
    'member': '普通成员',
    'viewer': '观察者'
  }
  return roleMap[role as keyof typeof roleMap] || role
}

const loadMembers = async () => {
  loading.value = true
  try {
    // 模拟数据
    memberList.value = [
      {
        id: '1',
        name: '张三',
        email: 'zhangsan@example.com',
        role: 'admin',
        department: '技术部',
        status: 'active',
        joinDate: '2024-01-01'
      },
      {
        id: '2',
        name: '李四',
        email: 'lisi@example.com',
        role: 'member',
        department: '人事部',
        status: 'active',
        joinDate: '2024-01-05'
      }
    ]
  } catch (error) {
    console.error('加载成员列表失败:', error)
  } finally {
    loading.value = false
  }
}

const showInviteDialog = () => {
  inviteDialogVisible.value = true
  Object.assign(inviteForm, {
    email: '',
    role: 'member',
    department: ''
  })
}

const sendInvite = async () => {
  console.log('发送邀请:', inviteForm)
  inviteDialogVisible.value = false
}

const editMember = (member: Member) => {
  console.log('编辑成员:', member)
}

const toggleMemberStatus = (member: Member) => {
  console.log('切换成员状态:', member)
}

const refreshList = () => {
  loadMembers()
}

onMounted(() => {
  loadMembers()
})
</script>

<style scoped>
@import '@/assets/styles/common.css';
.members-container {
  padding: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>