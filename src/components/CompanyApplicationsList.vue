<template>
  <div class="company-applications-list">
    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <div class="filter-content">
        <div class="filter-group">
          <el-select v-model="filterJob" placeholder="选择岗位" clearable style="width: 200px">
            <el-option
              v-for="job in jobs"
              :key="job.id"
              :label="job.title"
              :value="job.id"
            />
          </el-select>
          
          <el-date-picker
            v-model="filterDate"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
          />
        </div>
        
        <div class="filter-actions">
          <el-button @click="resetFilters">重置</el-button>
          <el-button type="primary" @click="applyFilters">筛选</el-button>
        </div>
      </div>
    </el-card>

    <!-- 申请列表 -->
    <el-card>
      <template #header>
        <div class="table-header">
          <span>{{ getStatusText(statusFilter) }}申请列表</span>
          <span class="total-count">共 {{ totalApplications }} 条申请</span>
        </div>
      </template>

      <el-table :data="applications" v-loading="loading">
        <el-table-column label="学生信息" min-width="200">
          <template #default="{ row }">
            <div class="student-info">
              <el-avatar :size="40" :src="row.student.avatar" />
              <div class="student-details">
                <div class="name">{{ row.student.name }}</div>
                <div class="meta">
                  {{ row.student.school }} · {{ row.student.major }} · {{ row.student.grade }}
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="job.title" label="申请岗位" width="180" />
        
        <el-table-column label="申请时间" width="140">
          <template #default="{ row }">
            {{ formatDate(row.applyTime) }}
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewApplication(row)">
              查看详情
            </el-button>
            <el-button 
              v-if="row.status === 'pending'" 
              size="small" 
              type="primary"
              @click="handleApplication(row, 'reviewing')"
            >
              开始审核
            </el-button>
            <el-button 
              v-else-if="row.status === 'reviewing'" 
              size="small" 
              type="success"
              @click="handleApplication(row, 'accepted')"
            >
              通过
            </el-button>
            <el-button 
              v-else-if="row.status === 'reviewing'" 
              size="small" 
              type="danger"
              @click="handleApplication(row, 'rejected')"
            >
              拒绝
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="totalApplications"
          layout="prev, pager, next, jumper"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 申请详情弹窗 -->
    <ApplicationDetailDialog
      v-model:visible="detailVisible"
      :application="currentApplication"
      @status-change="handleStatusChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { companyDataService } from '../services/companyDataService'
import ApplicationDetailDialog from './ApplicationDetailDialog.vue'

interface Props {
  statusFilter?: string
}

const props = withDefaults(defineProps<Props>(), {
  statusFilter: ''
})

// 筛选条件
const filterJob = ref('')
const filterStatus = ref(props.statusFilter)
const filterDate = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const totalApplications = ref(0)

const jobs = ref([])
const applications = ref([])

// 详情弹窗
const detailVisible = ref(false)
const currentApplication = ref(null)

// 监听状态筛选变化
watch(() => props.statusFilter, (newStatus) => {
  filterStatus.value = newStatus
  currentPage.value = 1
  loadCompanyApplications()
})

// 加载公司申请数据
const loadCompanyApplications = async () => {
  try {
    loading.value = true
    
    // 加载公司岗位
    const jobsResult = await companyDataService.getCompanyJobs({
      page: 1,
      pageSize: 100
    })
    jobs.value = jobsResult.jobs.map(job => ({
      id: job.id,
      title: job.title
    }))
    
    // 加载申请记录
    const applicationsResult = await companyDataService.getCompanyApplications({
      status: filterStatus.value || undefined,
      jobId: filterJob.value || undefined,
      page: currentPage.value,
      pageSize: pageSize.value
    })
    
    applications.value = applicationsResult.applications.map(app => ({
      id: app.id,
      student: {
        id: app.student_id, // 添加学生ID
        name: app.profiles?.real_name || '未知学生',
        avatar: app.profiles?.avatar_url || '',
        school: app.profiles?.school || '',
        major: app.profiles?.major || '',
        grade: app.profiles?.grade || '',
        phone: app.profiles?.phone || '',
        email: app.profiles?.email || ''
      },
      job: { 
        id: app.job_id, 
        title: app.jobs?.title || '未知职位' 
      },
      applyTime: app.created_at || app.applied_at,
      status: app.status,
      message: app.cover_letter || '',
      resume: {
        education: app.profiles?.bio || '',
        skills: app.profiles?.skills || [],
        experiences: []
      }
    }))
    
    totalApplications.value = applicationsResult.total
  } catch (error) {
    console.error('加载申请记录失败:', error)
    ElMessage.error('加载申请记录失败')
  } finally {
    loading.value = false
  }
}

// 方法
const viewApplication = (application: any) => {
  currentApplication.value = application
  detailVisible.value = true
}

const handleApplication = async (application: any, status: string) => {
  try {
    let message = ''
    let confirmText = '确定'
    
    switch (status) {
      case 'reviewing':
        message = '确定开始审核此申请吗？'
        break
      case 'accepted':
        message = '确定通过此申请吗？通过后系统将自动发送面试通知给学生'
        confirmText = '通过申请'
        break
      case 'rejected':
        message = '确定拒绝此申请吗？拒绝后学生将收到通知'
        confirmText = '拒绝申请'
        break
    }
    
    await ElMessageBox.confirm(message, '确认操作', {
      confirmButtonText: confirmText,
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 调用服务更新申请状态
    await companyDataService.updateApplicationStatus(application.id, status)
    
    // 更新本地状态
    application.status = status
    ElMessage.success('操作成功')
    
    if (status === 'accepted') {
      // 发送通知给学生
      await companyDataService.sendInterviewNotification(application.id)
      ElMessage.success('已发送面试通知给学生')
    } else if (status === 'rejected') {
      // 发送拒绝通知
      await companyDataService.sendRejectionNotification(application.id)
      ElMessage.info('已发送拒绝通知给学生')
    }
    
    // 重新加载数据
    await loadCompanyApplications()
  } catch (error) {
    console.error('处理申请失败:', error)
    ElMessage.error('操作失败，请重试')
  }
}

const handleStatusChange = (applicationId: string, newStatus: string) => {
  const application = applications.value.find(app => app.id === applicationId)
  if (application) {
    application.status = newStatus
  }
}

const applyFilters = async () => {
  currentPage.value = 1
  await loadCompanyApplications()
  ElMessage.success('筛选条件已应用')
}

const resetFilters = async () => {
  filterJob.value = ''
  filterDate.value = []
  currentPage.value = 1
  await loadCompanyApplications()
  ElMessage.success('筛选条件已重置')
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
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

const handlePageChange = async (page: number) => {
  currentPage.value = page
  await loadCompanyApplications()
}

onMounted(async () => {
  await loadCompanyApplications()
})
</script>

<style scoped>
.company-applications-list {
  padding: 0;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.filter-group {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-actions {
  display: flex;
  gap: 12px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-count {
  color: #909399;
  font-size: 14px;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.student-details .name {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.student-details .meta {
  font-size: 12px;
  color: #909399;
}

.pagination-section {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .filter-content {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .filter-group {
    flex-direction: column;
  }
  
  .filter-group .el-select,
  .filter-group .el-date-picker {
    width: 100% !important;
  }
  
  .filter-actions {
    justify-content: center;
  }
}
</style>