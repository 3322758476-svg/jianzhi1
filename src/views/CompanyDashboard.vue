<template>
  <div class="company-layout">
    <!-- 侧边栏 -->
    <CompanySidebar />
    
    <!-- 主内容区域 -->
    <div class="company-main">
      <!-- 顶部导航栏 -->
      <div class="company-header">
        <div class="header-left">
          <h1>企业控制台</h1>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/company/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>控制台</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="() => showJobForm('new')">
            <el-icon><Plus /></el-icon>
            发布新岗位
          </el-button>
          <el-button @click="refreshData">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
          <el-button @click="toggleFullscreen">
            <el-icon><FullScreen /></el-icon>
            全屏
          </el-button>
        </div>
      </div>

      <!-- 主要内容 -->
      <div class="company-dashboard">

    <!-- 数据统计卡片 -->
    <div class="stats-cards">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalJobs }}</div>
            <div class="stat-label">发布岗位</div>
            <div class="stat-trend" :class="{ positive: stats.jobsTrend > 0, negative: stats.jobsTrend < 0 }">
              <el-icon v-if="stats.jobsTrend > 0"><Top /></el-icon>
              <el-icon v-else-if="stats.jobsTrend < 0"><Bottom /></el-icon>
              {{ Math.abs(stats.jobsTrend) }}%
            </div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalApplications }}</div>
            <div class="stat-label">收到申请</div>
            <div class="stat-trend" :class="{ positive: stats.applicationsTrend > 0, negative: stats.applicationsTrend < 0 }">
              <el-icon v-if="stats.applicationsTrend > 0"><Top /></el-icon>
              <el-icon v-else-if="stats.applicationsTrend < 0"><Bottom /></el-icon>
              {{ Math.abs(stats.applicationsTrend) }}%
            </div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon><ChatDotRound /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.unreadMessages }}</div>
            <div class="stat-label">未读消息</div>
            <div class="stat-badge" :class="{ urgent: stats.unreadMessages > 5, normal: stats.unreadMessages <= 5 }">
              {{ stats.unreadMessages > 5 ? '需处理' : '正常' }}
            </div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon><Star /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.avgRating }}</div>
            <div class="stat-label">平均评分</div>
            <div class="rating-stars">
              <el-rate
                v-model="stats.avgRating"
                disabled
                show-score
                text-color="#ff9900"
                score-template="{value}"
              />
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 最近申请 -->
    <el-card class="recent-section">
      <template #header>
        <div class="section-header">
          <h3>最近申请</h3>
          <el-button type="text" @click="$router.push('/company/applications')">
            查看全部
          </el-button>
        </div>
      </template>

      <div class="applications-list">
        <div v-if="recentApplications.length === 0" class="empty-state">
          <el-empty description="暂无申请记录" />
        </div>

        <div 
          v-for="application in recentApplications" 
          :key="application.id"
          class="application-item"
        >
          <div class="application-info">
            <div class="student-info">
              <el-avatar :size="40" :src="application.student.avatar" />
              <div class="student-details">
                <div class="student-name">{{ application.student.name }}</div>
                <div class="student-school">{{ application.student.school }} · {{ application.student.major }}</div>
              </div>
            </div>
            
            <div class="job-info">
              <div class="job-title">{{ application.job.title }}</div>
              <div class="apply-time">{{ application.applyTime }}</div>
            </div>
          </div>

          <div class="application-actions">
            <el-tag :type="getStatusType(application.status)">
              {{ getStatusText(application.status) }}
            </el-tag>
            <el-button size="small" @click="viewApplication(application)">
              查看详情
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 岗位管理 -->
    <el-card class="jobs-section">
      <template #header>
        <div class="section-header">
          <h3>岗位管理</h3>
          <el-button type="text" @click="$router.push('/company/jobs')">
            管理全部
          </el-button>
        </div>
      </template>

      <div class="jobs-list">
        <div v-if="companyJobs.length === 0" class="empty-state">
          <el-empty description="暂无发布岗位" />
        </div>

        <div 
          v-for="job in companyJobs" 
          :key="job.id"
          class="job-item"
        >
          <div class="job-info">
            <h4 class="job-title">{{ job.title }}</h4>
            <div class="job-meta">
              <span class="salary">{{ job.salary }}</span>
              <span class="location">{{ job.location }}</span>
              <span class="work-time">{{ job.workTime }}</span>
            </div>
            <div class="job-stats">
              <span>申请人数: {{ job.applicationCount }}</span>
              <span>发布时间: {{ job.publishTime }}</span>
            </div>
          </div>

          <div class="job-actions">
            <el-button size="small" @click="editJob(job)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteJob(job)">删除</el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 发布岗位弹窗 -->
    <el-dialog
      v-model="jobFormVisible"
      :title="editingJob ? '编辑岗位' : '发布新岗位'"
      width="600px"
    >
      <el-form :model="jobForm" :rules="jobRules" ref="jobFormRef" label-width="100px">
        <el-form-item label="岗位标题" prop="title">
          <el-input v-model="jobForm.title" placeholder="请输入岗位标题" />
        </el-form-item>

        <el-form-item label="薪资范围" prop="salary">
          <el-input v-model="jobForm.salary" placeholder="例如：200-300元/天" />
        </el-form-item>

        <el-form-item label="工作地点" prop="location">
          <el-input v-model="jobForm.location" placeholder="请输入工作地点" />
        </el-form-item>

        <el-form-item label="工作时间" prop="workTime">
          <el-input v-model="jobForm.workTime" placeholder="例如：每周3-5天" />
        </el-form-item>

        <el-form-item label="招聘人数" prop="recruitCount">
          <el-input-number v-model="jobForm.recruitCount" :min="1" :max="50" />
        </el-form-item>

        <el-form-item label="岗位描述" prop="description">
          <el-input
            v-model="jobForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入详细的岗位描述和要求"
          />
        </el-form-item>

        <el-form-item label="岗位标签" prop="tags">
          <el-select
            v-model="jobForm.tags"
            multiple
            filterable
            allow-create
            placeholder="请选择或输入标签"
            style="width: 100%"
          >
            <el-option
              v-for="tag in commonTags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="jobFormVisible = false">取消</el-button>
        <el-button type="primary" @click="submitJobForm">
          {{ editingJob ? '更新岗位' : '发布岗位' }}
        </el-button>
      </template>
    </el-dialog>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '../store'
import CompanySidebar from '../components/CompanySidebar.vue'
import { companyDataService } from '../services/companyDataService'
import {
  Plus,
  Refresh,
  Document,
  User,
  ChatDotRound,
  Star,
  FullScreen,
  Top,
  Bottom
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

// 数据统计
const stats = reactive({
  totalJobs: 0,
  totalApplications: 0,
  unreadMessages: 0,
  avgRating: 0,
  jobsTrend: 0,
  applicationsTrend: 0
})

const recentApplications = ref([])
const companyJobs = ref([])
const loading = ref(false)

// 检查企业用户权限
const checkCompanyPermission = () => {
  if (!userStore.user) {
    // 静默跳转到登录页，不显示警告
    router.push('/login')
    return false
  }
  
  if (userStore.user.role !== 'company') {
    // 静默跳转到首页，不显示警告
    router.push('/')
    return false
  }
  
  if (!userStore.user.companyId) {
    // 静默处理企业信息不完整的情况
    return false
  }
  
  return true
}

// 加载公司仪表盘数据
const loadDashboardData = async () => {
  try {
    loading.value = true
    
    // 检查权限
    if (!checkCompanyPermission()) {
      return
    }
    
    // 使用真实数据服务加载数据
    const [dashboardStats, jobsData, applicationsData] = await Promise.all([
      companyDataService.getDashboardStats(),
      companyDataService.getCompanyJobs({ page: 1, pageSize: 5 }),
      companyDataService.getCompanyApplications({ page: 1, pageSize: 5 })
    ])
    
    // 更新统计数据
    stats.totalJobs = dashboardStats.totalJobs
    stats.totalApplications = dashboardStats.totalApplications
    stats.unreadMessages = 0 // 暂时设为0，后续可以从消息服务获取
    stats.avgRating = 4.5 // 暂时设为固定值，后续可以从评价服务获取
    
    // 更新岗位数据
    companyJobs.value = jobsData.jobs.map(job => ({
      id: job.id,
      title: job.title,
      salary: job.salary_range,
      location: job.work_location,
      workTime: job.work_hours,
      recruitCount: job.recruit_count,
      applicationCount: 0, // 暂时设为0，后续可以从申请统计获取
      publishTime: job.created_at,
      description: job.description,
      tags: job.skills_required || []
    }))
    
    // 更新最近申请数据
    recentApplications.value = applicationsData.applications.map(app => ({
      id: app.id,
      student: {
        name: app.profiles?.name || '未知用户',
        avatar: app.profiles?.avatar_url || '',
        school: app.profiles?.university || '未知学校',
        major: app.profiles?.major || '未知专业'
      },
      job: {
        title: app.jobs?.title || '未知岗位'
      },
      status: app.status,
      applyTime: formatTimeAgo(app.applied_at)
    }))
    
  } catch (error) {
    console.error('加载仪表盘数据失败:', error)
    ElMessage.error('加载仪表盘数据失败: ' + (error as any).message)
  } finally {
    loading.value = false
  }
}

// 格式化时间
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) {
    return `${diffMins}分钟前`
  } else if (diffHours < 24) {
    return `${diffHours}小时前`
  } else {
    return `${diffDays}天前`
  }
}

// 岗位表单
const jobFormVisible = ref(false)
const editingJob = ref(null)
const jobFormRef = ref()

const jobForm = reactive({
  title: '',
  salary: '',
  location: '',
  workTime: '',
  recruitCount: 1,
  description: '',
  tags: []
})

const jobRules = {
  title: [{ required: true, message: '请输入岗位标题', trigger: 'blur' }],
  salary: [{ required: true, message: '请输入薪资范围', trigger: 'blur' }],
  location: [{ required: true, message: '请输入工作地点', trigger: 'blur' }],
  workTime: [{ required: true, message: '请输入工作时间', trigger: 'blur' }],
  description: [{ required: true, message: '请输入岗位描述', trigger: 'blur' }]
}

const commonTags = [
  '前端开发', '后端开发', '移动端', 'UI设计', '产品经理',
  '运营', '市场', '销售', '客服', '行政', '财务',
  'React', 'Vue', 'Angular', 'Node.js', 'Python', 'Java'
]

// 方法
const showJobForm = (job: any = null) => {
  console.log('showJobForm被调用，参数类型:', typeof job)
  console.log('showJobForm参数详情:', job)
  
  if (job && typeof job === 'object' && !(job instanceof PointerEvent)) {
    // 调试：查看job对象结构
    console.log('编辑岗位 - job对象:', job)
    console.log('job.id:', job.id)
    console.log('job.title:', job.title)
    
    // 编辑岗位 - 使用对话框
    editingJob.value = job
    // 正确映射数据库字段到表单字段
    Object.assign(jobForm, {
      title: job.title || '',
      salary: job.salary_range || '',
      location: job.work_location || '',
      workTime: job.work_hours || '',
      recruitCount: job.recruit_count || 1,
      description: job.description || '',
      tags: job.skills_required || []
    })
    jobFormVisible.value = true
  } else {
    console.log('发布新岗位或参数无效，参数:', job)
    // 发布新岗位 - 导航到新页面
    router.push('/company/jobs/new')
  }
}

// const resetJobForm = () => {
//   Object.assign(jobForm, {
//     title: '',
//     salary: '',
//     location: '',
//     workTime: '',
//     recruitCount: 1,
//     description: '',
//     tags: []
//   })
// }

const submitJobForm = async () => {
  if (!jobFormRef.value) return

  try {
    await jobFormRef.value.validate()
    
    if (editingJob.value) {
      // 验证岗位ID
      if (!editingJob.value.id || editingJob.value.id === 'undefined') {
        throw new Error('岗位ID无效，无法更新岗位')
      }
      
      // 更新岗位 - 使用真实数据服务
      await companyDataService.updateJob(editingJob.value.id, {
        title: jobForm.title,
        description: jobForm.description,
        salary_range: jobForm.salary,
        work_location: jobForm.location,
        work_hours: jobForm.workTime,
        recruit_count: jobForm.recruitCount,
        skills_required: jobForm.tags,
        category: '技术', // 确保包含必需字段
        job_type: '实习'   // 确保包含必需字段
      })
      
      ElMessage.success('岗位更新成功')
    } else {
      // 新增岗位 - 使用真实数据服务
      await companyDataService.createJob({
        title: jobForm.title,
        description: jobForm.description,
        salary_range: jobForm.salary,
        work_location: jobForm.location,
        work_hours: jobForm.workTime,
        recruit_count: jobForm.recruitCount,
        skills_required: jobForm.tags,
        category: '技术', // 默认分类
        job_type: '实习'  // 默认类型
      })
      
      ElMessage.success('岗位创建成功')
    }
    
    jobFormVisible.value = false
    // 重新加载数据
    await loadDashboardData()
  } catch (error) {
    console.error('操作岗位失败:', error)
    ElMessage.error('操作失败: ' + (error as any).message)
  }
}

const editJob = (job: any) => {
  console.log('editJob被调用，参数类型:', typeof job)
  console.log('editJob参数详情:', job)
  console.log('job.id:', job?.id)
  console.log('job.title:', job?.title)
  
  // 检查是否是有效的工作对象
  if (job && typeof job === 'object' && job.id) {
    showJobForm(job)
  } else {
    console.error('无效的岗位对象:', job)
    ElMessage.error('无法编辑该岗位，数据异常')
  }
}

const deleteJob = async (job: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这个岗位吗？此操作不可恢复。', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 使用真实数据服务删除岗位
    await companyDataService.updateJob(job.id, { status: 'closed' })
    
    ElMessage.success('岗位已关闭')
    // 重新加载数据
    await loadDashboardData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除岗位失败:', error)
      ElMessage.error('删除失败: ' + error.message)
    }
  }
}

const viewApplication = (application: any) => {
  router.push(`/company/applications/${application.id}`)
}

const getStatusType = (status: string) => {
  const types: Record<string, any> = {
    pending: 'warning',
    reviewing: 'info',
    accepted: 'success',
    rejected: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: '待处理',
    reviewing: '审核中',
    accepted: '已通过',
    rejected: '已拒绝'
  }
  return texts[status] || '未知'
}

const refreshData = async () => {
  try {
    await loadDashboardData()
    ElMessage.success('数据已刷新')
  } catch (error) {
    ElMessage.error('刷新数据失败')
  }
}

// 全屏切换功能
const toggleFullscreen = () => {
  const element = document.documentElement
  
  if (!document.fullscreenElement) {
    // 进入全屏
    if (element.requestFullscreen) {
      element.requestFullscreen()
    } else if ((element as any).webkitRequestFullscreen) {
      (element as any).webkitRequestFullscreen()
    } else if ((element as any).msRequestFullscreen) {
      (element as any).msRequestFullscreen()
    }
  } else {
    // 退出全屏
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen()
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen()
    }
  }
}

// const updateStats = () => {
//   // 统计数据现在直接从API获取，此方法保留为空
// }

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
@import '@/assets/styles/common.css';
.company-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.company-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.company-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-left h1 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.company-dashboard {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  border-radius: 12px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  font-size: 48px;
  color: #409EFF;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.recent-section, .jobs-section {
  margin-bottom: 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.applications-list, .jobs-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.application-item, .job-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: white;
  transition: all 0.2s;
}

.application-item:hover, .job-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.application-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.student-details {
  display: flex;
  flex-direction: column;
}

.student-name {
  font-weight: 600;
  color: #303133;
}

.student-school {
  font-size: 12px;
  color: #909399;
}

.job-info {
  margin-left: 40px;
}

.job-title {
  font-weight: 600;
  color: #303133;
}

.apply-time {
  font-size: 12px;
  color: #909399;
}

.application-actions, .job-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.job-item {
  align-items: flex-start;
}

.job-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
}

.job-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}

.job-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .stats-cards {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
}

@media (max-width: 768px) {
  .company-layout {
    flex-direction: column;
  }
  
  .company-header {
    padding: 12px 16px;
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .company-dashboard {
    padding: 16px;
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .application-item, .job-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .application-actions, .job-actions {
    align-self: stretch;
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .company-dashboard {
    padding: 12px;
  }
  
  .stat-content {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .stat-icon {
    font-size: 36px;
  }
  
  .stat-value {
    font-size: 28px;
  }
}
</style>