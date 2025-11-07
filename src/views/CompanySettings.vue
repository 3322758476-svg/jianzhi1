<template>
  <div class="company-settings">
    <!-- 侧边栏 -->
    <CompanySidebar />
    
    <!-- 主内容区域 -->
    <div class="company-main">
      <!-- 顶部导航栏 -->
      <div class="company-header">
        <div class="header-left">
          <h1>企业设置</h1>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/company/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>设置</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="saveSettings">
            <el-icon><Check /></el-icon>
            保存设置
          </el-button>
        </div>
      </div>

      <!-- 主要内容 -->
      <div class="settings-content">
        <el-tabs v-model="activeTab" type="border-card">
          <!-- 企业信息设置 -->
          <el-tab-pane label="企业信息" name="company">
            <el-card class="setting-card">
              <template #header>
                <h3>企业基本信息</h3>
              </template>
              
              <el-form :model="companyForm" label-width="120px" :rules="companyRules" ref="companyFormRef">
                <el-form-item label="企业名称" prop="name">
                  <el-input v-model="companyForm.name" placeholder="请输入企业名称" />
                </el-form-item>
                
                <el-form-item label="所属行业" prop="industry">
                  <el-select v-model="companyForm.industry" placeholder="请选择行业" style="width: 100%">
                    <el-option label="互联网/IT" value="互联网/IT" />
                    <el-option label="金融/银行" value="金融/银行" />
                    <el-option label="教育/培训" value="教育/培训" />
                    <el-option label="医疗/健康" value="医疗/健康" />
                    <el-option label="制造业" value="制造业" />
                    <el-option label="零售/电商" value="零售/电商" />
                    <el-option label="其他" value="其他" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="企业规模" prop="scale">
                  <el-select v-model="companyForm.scale" placeholder="请选择企业规模" style="width: 100%">
                    <el-option label="1-50人" value="1-50人" />
                    <el-option label="50-200人" value="50-200人" />
                    <el-option label="200-500人" value="200-500人" />
                    <el-option label="500-1000人" value="500-1000人" />
                    <el-option label="1000人以上" value="1000人以上" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="企业地址" prop="address">
                  <el-input v-model="companyForm.address" placeholder="请输入详细地址" />
                </el-form-item>
                
                <el-form-item label="企业简介" prop="description">
                  <el-input 
                    v-model="companyForm.description" 
                    type="textarea" 
                    :rows="4" 
                    placeholder="请输入企业简介" 
                  />
                </el-form-item>
                
                <el-form-item label="营业执照" prop="license">
                  <el-input v-model="companyForm.license" placeholder="请输入营业执照号码" />
                </el-form-item>
              </el-form>
            </el-card>
          </el-tab-pane>

          <!-- 成员管理 -->
          <el-tab-pane label="成员管理" name="members">
            <el-card class="setting-card">
              <template #header>
                <div class="card-header">
                  <h3>企业成员管理</h3>
                  <el-button type="primary" @click="showInviteDialog">
                    <el-icon><Plus /></el-icon>
                    邀请成员
                  </el-button>
                </div>
              </template>
              
              <el-table :data="members" v-loading="membersLoading" style="width: 100%">
                <el-table-column prop="username" label="姓名" />
                <el-table-column prop="email" label="邮箱" />
                <el-table-column prop="role" label="角色">
                  <template #default="{ row }">
                    <el-tag :type="getRoleTagType(row.role)">{{ getRoleName(row.role) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="department" label="部门">
                  <template #default="{ row }">
                    {{ row.department || '未分配' }}
                  </template>
                </el-table-column>
                <el-table-column prop="phone" label="联系电话" />
                <el-table-column prop="last_login_at" label="最后登录">
                  <template #default="{ row }">
                    {{ formatDate(row.last_login_at) || '从未登录' }}
                  </template>
                </el-table-column>
                <el-table-column label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.status === 'active' ? 'success' : 'info'">
                      {{ row.status === 'active' ? '活跃' : '禁用' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="250" fixed="right">
                  <template #default="{ row }">
                    <el-button 
                      size="small" 
                      @click="editMember(row)"
                      v-permission="'member:edit'"
                    >
                      编辑
                    </el-button>
                    <el-button 
                      size="small" 
                      @click="editMemberRole(row)"
                      v-permission="'permission:manage'"
                    >
                      修改角色
                    </el-button>
                    <el-button 
                      size="small" 
                      type="danger" 
                      @click="removeMember(row)"
                      v-permission="'member:manage'"
                    >
                      移除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-tab-pane>

          <!-- 权限配置 -->
          <el-tab-pane label="权限配置" name="permissions">
            <el-card class="setting-card">
              <template #header>
                <h3>角色权限配置</h3>
              </template>
              
              <div class="permission-config">
                <div class="role-selector">
                  <el-select v-model="selectedRole" placeholder="选择角色" @change="loadRolePermissions">
                    <el-option 
                      v-for="role in availableRoles" 
                      :key="role.value" 
                      :label="role.label" 
                      :value="role.value" 
                    />
                  </el-select>
                </div>
                
                <div class="permission-list" v-if="selectedRole">
                  <h4>{{ getRoleName(selectedRole) }} 权限配置</h4>
                  
                  <div class="permission-category" v-for="category in permissionCategories" :key="category.name">
                    <h5>{{ category.label }}</h5>
                    
                    <div class="permission-items">
                      <el-checkbox-group v-model="currentPermissions">
                        <el-checkbox 
                          v-for="permission in category.permissions" 
                          :key="permission.value" 
                          :label="permission.value"
                          :disabled="!hasPermission('permission:manage')"
                        >
                          {{ permission.label }}
                        </el-checkbox>
                      </el-checkbox-group>
                    </div>
                  </div>
                </div>
              </div>
            </el-card>
          </el-tab-pane>

          <!-- 数据隔离设置 -->
          <el-tab-pane label="数据隔离" name="isolation">
            <el-card class="setting-card">
              <template #header>
                <h3>数据访问控制</h3>
              </template>
              
              <div class="isolation-settings">
                <el-alert 
                  title="数据隔离机制" 
                  type="info" 
                  description="系统自动根据用户角色进行数据隔离，确保不同层级用户只能访问权限范围内的数据" 
                  show-icon 
                  :closable="false"
                />
                
                <div class="isolation-rules">
                  <h4>数据访问规则</h4>
                  
                  <el-descriptions :column="1" border>
                    <el-descriptions-item label="超级管理员">
                      可以访问和操作所有公司的数据
                    </el-descriptions-item>
                    
                    <el-descriptions-item label="企业管理员">
                      可以访问和操作本企业所有数据
                    </el-descriptions-item>
                    
                    <el-descriptions-item label="HR经理">
                      可以访问和操作本企业的岗位和申请数据
                    </el-descriptions-item>
                    
                    <el-descriptions-item label="HR助理">
                      可以查看本企业的岗位和申请数据
                    </el-descriptions-item>
                    
                    <el-descriptions-item label="面试官">
                      可以查看和审核本企业的申请数据
                    </el-descriptions-item>
                  </el-descriptions>
                </div>
              </div>
            </el-card>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- 邀请成员对话框 -->
    <el-dialog v-model="inviteDialogVisible" title="邀请新成员" width="500px">
      <el-form :model="inviteForm" label-width="80px" :rules="inviteRules" ref="inviteFormRef">
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="inviteForm.email" placeholder="请输入成员邮箱" />
        </el-form-item>
        
        <el-form-item label="姓名" prop="name">
          <el-input v-model="inviteForm.name" placeholder="请输入成员姓名" />
        </el-form-item>
        
        <el-form-item label="角色" prop="role">
          <el-select v-model="inviteForm.role" placeholder="请选择角色" style="width: 100%">
            <el-option 
              v-for="role in availableRoles" 
              :key="role.value" 
              :label="role.label" 
              :value="role.value" 
            />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="inviteDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="sendInvitation">发送邀请</el-button>
      </template>
    </el-dialog>

    <!-- 修改角色对话框 -->
    <el-dialog v-model="roleDialogVisible" title="修改成员角色" width="400px">
      <el-form :model="roleForm" label-width="80px">
        <el-form-item label="成员">
          <el-input v-model="roleForm.memberName" disabled />
        </el-form-item>
        
        <el-form-item label="新角色" prop="role">
          <el-select v-model="roleForm.role" placeholder="请选择角色" style="width: 100%">
            <el-option 
              v-for="role in availableRoles" 
              :key="role.value" 
              :label="role.label" 
              :value="role.value" 
            />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="updateMemberRole">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, Plus } from '@element-plus/icons-vue'
import { useUserStore } from '../store'
import CompanySidebar from '../components/CompanySidebar.vue'
import { roleManagementService } from '../services/roleManagementService'
import { permissionService, Permission, UserRole } from '../services/permissionService'

const router = useRouter()
const userStore = useUserStore()

// 权限检查
const hasPermission = async (permission: string) => {
  return await permissionService.hasPermission(permission as Permission)
}

// 标签页
const activeTab = ref('company')

// 企业信息表单
const companyFormRef = ref()
const companyForm = reactive({
  name: '',
  industry: '',
  scale: '',
  address: '',
  description: '',
  license: ''
})

const companyRules = {
  name: [{ required: true, message: '请输入企业名称', trigger: 'blur' }],
  industry: [{ required: true, message: '请选择行业', trigger: 'change' }]
}

// 成员管理
const members = ref([])
const membersLoading = ref(false)

// 权限配置
const selectedRole = ref('')
const currentPermissions = ref<string[]>([])

// 邀请成员
const inviteDialogVisible = ref(false)
const inviteFormRef = ref()
const inviteForm = reactive({
  email: '',
  name: '',
  role: UserRole.HR_ASSISTANT
})

const inviteRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }]
}

// 修改角色
const roleDialogVisible = ref(false)
const roleForm = reactive({
  memberId: '',
  memberName: '',
  role: ''
})

// 可用角色列表
const availableRoles = computed(() => [
  { label: '超级管理员', value: UserRole.SUPER_ADMIN },
  { label: '企业管理员', value: UserRole.COMPANY_ADMIN },
  { label: 'HR经理', value: UserRole.HR_MANAGER },
  { label: 'HR助理', value: UserRole.HR_ASSISTANT },
  { label: '面试官', value: UserRole.INTERVIEWER }
])

// 权限分类
const permissionCategories = [
  {
    label: '岗位管理',
    name: 'job',
    permissions: [
      { label: '查看岗位', value: Permission.JOB_VIEW },
      { label: '创建岗位', value: Permission.JOB_CREATE },
      { label: '编辑岗位', value: Permission.JOB_EDIT },
      { label: '删除岗位', value: Permission.JOB_DELETE },
      { label: '发布岗位', value: Permission.JOB_PUBLISH }
    ]
  },
  {
    label: '申请管理',
    name: 'application',
    permissions: [
      { label: '查看申请', value: Permission.APPLICATION_VIEW },
      { label: '审核申请', value: Permission.APPLICATION_REVIEW },
      { label: '批准申请', value: Permission.APPLICATION_APPROVE },
      { label: '拒绝申请', value: Permission.APPLICATION_REJECT }
    ]
  },
  {
    label: '数据统计',
    name: 'analytics',
    permissions: [
      { label: '查看统计', value: Permission.ANALYTICS_VIEW },
      { label: '导出数据', value: Permission.ANALYTICS_EXPORT }
    ]
  },
  {
    label: '系统管理',
    name: 'system',
    permissions: [
      { label: '查看设置', value: Permission.SETTINGS_VIEW },
      { label: '编辑设置', value: Permission.SETTINGS_EDIT },
      { label: '管理成员', value: Permission.MEMBER_MANAGE },
      { label: '管理权限', value: Permission.PERMISSION_MANAGE }
    ]
  }
]

// 方法
const getRoleName = (role: string) => {
  const roleMap = {
    [UserRole.SUPER_ADMIN]: '超级管理员',
    [UserRole.COMPANY_ADMIN]: '企业管理员',
    [UserRole.HR_MANAGER]: 'HR经理',
    [UserRole.HR_ASSISTANT]: 'HR助理',
    [UserRole.INTERVIEWER]: '面试官'
  }
  return (roleMap as any)[role] || role
}

const getRoleTagType = (role: string) => {
  const typeMap = {
    [UserRole.SUPER_ADMIN]: 'danger',
    [UserRole.COMPANY_ADMIN]: 'warning',
    [UserRole.HR_MANAGER]: 'primary',
    [UserRole.HR_ASSISTANT]: 'success',
    [UserRole.INTERVIEWER]: 'info'
  }
  return (typeMap as any)[role] || 'info'
}

const formatDate = (dateString: string) => {
  if (!dateString) return '从未登录'
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 加载数据
const loadCompanyData = async () => {
  try {
    // 加载企业信息（这里需要从API获取）
    // 暂时使用用户信息中的企业信息
    if (userStore.user) {
      companyForm.name = userStore.user.companyName || ''
      companyForm.license = userStore.user.license || ''
    }
  } catch (error) {
    console.error('加载企业信息失败:', error)
    ElMessage.error('加载企业信息失败')
  }
}

const loadMembers = async () => {
  try {
    membersLoading.value = true
    members.value = await roleManagementService.getCompanyMembers()
  } catch (error) {
    console.error('加载成员列表失败:', error)
    ElMessage.error('加载成员列表失败: ' + error.message)
  } finally {
    membersLoading.value = false
  }
}

const loadRolePermissions = async () => {
  if (!selectedRole.value) return
  
  try {
    const permissions = await roleManagementService.getRolePermissions()
    // 设置当前角色的权限
    currentPermissions.value = (permissions.defaultPermissions as any)[selectedRole.value] || []
  } catch (error) {
    console.error('加载权限配置失败:', error)
    ElMessage.error('加载权限配置失败')
  }
}

// 对话框操作
const showInviteDialog = () => {
  inviteDialogVisible.value = true
  inviteForm.email = ''
  inviteForm.name = ''
  inviteForm.role = UserRole.HR_ASSISTANT
}

const sendInvitation = async () => {
  try {
    await inviteFormRef.value.validate()
    
    await roleManagementService.inviteMember(inviteForm)
    ElMessage.success('邀请已发送')
    inviteDialogVisible.value = false
    
    // 重新加载成员列表
    await loadMembers()
  } catch (error) {
    console.error('发送邀请失败:', error)
    ElMessage.error('发送邀请失败: ' + error.message)
  }
}

const editMemberRole = (member: any) => {
  roleForm.memberId = member.id
  roleForm.memberName = member.username
  roleForm.role = member.role
  roleDialogVisible.value = true
}

const updateMemberRole = async () => {
  try {
    await roleManagementService.updateMemberRole(roleForm.memberId, roleForm.role)
    ElMessage.success('角色修改成功')
    roleDialogVisible.value = false
    
    // 重新加载成员列表
    await loadMembers()
  } catch (error) {
    console.error('修改角色失败:', error)
    ElMessage.error('修改角色失败: ' + error.message)
  }
}

const removeMember = async (member: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要移除成员 ${member.username} 吗？此操作不可恢复。`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 这里调用移除成员的API
    await roleManagementService.removeMember(member.id)
    ElMessage.success('成员已移除')
    await loadMembers()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('移除成员失败:', error)
      ElMessage.error('移除成员失败: ' + error.message)
    }
  }
}

// 保存设置
const saveSettings = async () => {
  try {
    // 验证表单
    await companyFormRef.value.validate()
    
    // 保存企业信息（这里需要调用API）
    await roleManagementService.updateCompanyInfo(companyForm)
    ElMessage.success('设置保存成功')
  } catch (error) {
    console.error('保存设置失败:', error)
    ElMessage.error('保存设置失败: ' + error.message)
  }
}

// 生命周期
onMounted(async () => {
  // 检查权限 - 静默处理，不显示警告
  if (!userStore.user || userStore.user.role !== 'company') {
    // 静默跳转，不显示警告
    router.push('/')
    return
  }
  
  // 加载数据
  await Promise.all([
    loadCompanyData(),
    loadMembers()
  ])
})
</script>

<style scoped>
@import '@/assets/styles/common.css';
.company-settings {
  display: flex;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.company-main {
  flex: 1;
  margin-left: 240px;
  padding: 20px;
}

.settings-content {
  margin-top: 20px;
}

.setting-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.permission-config {
  padding: 20px;
}

.role-selector {
  margin-bottom: 30px;
}

.permission-category {
  margin-bottom: 30px;
}

.permission-category h5 {
  margin-bottom: 15px;
  color: #606266;
  font-weight: 600;
}

.permission-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.isolation-rules {
  margin-top: 20px;
}

.isolation-rules h4 {
  margin-bottom: 15px;
  color: #303133;
}
</style>