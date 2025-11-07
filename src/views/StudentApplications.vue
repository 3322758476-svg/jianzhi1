<template>
  <div class="student-applications">
    <!-- 顶部导航栏 -->
    <div class="page-header">
      <h1>我的申请</h1>
      <div class="header-actions">
        <el-button type="primary" @click="refreshApplications">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon total">
                <el-icon><Document /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.total }}</div>
                <div class="stat-label">总申请数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon pending">
                <el-icon><Clock /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.pending }}</div>
                <div class="stat-label">待处理</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon accepted">
                <el-icon><SuccessFilled /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.accepted }}</div>
                <div class="stat-label">已通过</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon rejected">
                <el-icon><CloseBold /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.rejected }}</div>
                <div class="stat-label">已拒绝</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 筛选和搜索 -->
    <el-card class="filter-card">
      <div class="filter-content">
        <div class="filter-left">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索岗位名称或公司名称"
            style="width: 300px"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          
          <el-select v-model="filterStatus" placeholder="申请状态" clearable>
            <el-option label="全部" value="" />
            <el-option label="待处理" value="pending" />
            <el-option label="审核中" value="reviewing" />
            <el-option label="已通过" value="accepted" />
            <el-option label="已拒绝" value="rejected" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </div>
        
        <div class="filter-right">
          <el-button @click="resetFilters">重置</el-button>
        </div>
      </div>
    </el-card>

    <!-- 申请列表 -->
    <el-card class="applications-card">
      <template #header>
        <div class="table-header">
          <span>申请列表</span>
          <span class="total-count">共 {{ filteredApplications.length }} 条记录</span>
        </div>
      </template>

      <el-table :data="paginatedApplications" v-loading="loading" style="width: 100%">
        <el-table-column label="岗位信息" min-width="300">
          <template #default="{ row }">
            <div class="job-info">
              <div class="job-title">{{ row.job?.title }}</div>
              <div class="company-info">
                <el-avatar :size="24" :src="row.job?.companies?.logo_url" />
                <span class="company-name">{{ row.job?.companies?.company_name }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="薪资" prop="job.salary" width="120" />
        
        <el-table-column label="申请时间" width="150">
          <template #default="{ row }">
            {{ formatDate(row.applied_at) }}
          </template>
        </el-table-column>

        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewApplicationDetail(row)">
              查看详情
            </el-button>
            <el-button 
              v-if="row.status === 'pending'" 
              size="small" 
              type="danger" 
              @click="cancelApplication(row)"
            >
              取消申请
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="filteredApplications.length"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 申请详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="selectedApplication?.job?.title || '申请详情'"
      width="600px"
    >
      <div v-if="selectedApplication" class="application-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="岗位名称">
            {{ selectedApplication.job?.title }}
          </el-descriptions-item>
          <el-descriptions-item label="公司名称">
            {{ selectedApplication.job?.companies?.company_name }}
          </el-descriptions-item>
          <el-descriptions-item label="薪资范围">
            {{ selectedApplication.job?.salary }}
          </el-descriptions-item>
          <el-descriptions-item label="工作地点">
            {{ selectedApplication.job?.work_location }}
          </el-descriptions-item>
          <el-descriptions-item label="申请时间">
            {{ formatDate(selectedApplication.applied_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="getStatusTagType(selectedApplication.status)">
              {{ getStatusText(selectedApplication.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="申请说明" :span="2">
            {{ selectedApplication.message || '无' }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedApplication.feedback" label="企业反馈" :span="2">
            {{ selectedApplication.feedback }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh,
  Document,
  Clock,
  SuccessFilled,
  CloseBold,
  Search
} from '@element-plus/icons-vue'
import { useUserStore } from '../store'
import { ApplicationsApi } from '../api/applications'

const userStore = useUserStore()

// 响应式数据
const loading = ref(false)
const searchKeyword = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const detailDialogVisible = ref(false)
const selectedApplication = ref<any>(null)

const applications = ref<any[]>([])
const stats = reactive({
  total: 0,
  pending: 0,
  accepted: 0,
  rejected: 0
})

// 计算属性
const filteredApplications = computed(() => {
  let filtered = applications.value
  
  // 搜索筛选
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(app => 
      app.job?.title?.toLowerCase().includes(keyword) ||
      app.job?.companies?.company_name?.toLowerCase().includes(keyword)
    )
  }
  
  // 状态筛选
  if (filterStatus.value) {
    filtered = filtered.filter(app => app.status === filterStatus.value)
  }
  
  return filtered
})

const paginatedApplications = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredApplications.value.slice(start, end)
})

// 方法
const loadApplications = async () => {
  if (!userStore.user?.id) {
    ElMessage.warning('请先登录')
    return
  }

  try {
    loading.value = true
    
    // 获取申请列表
    const { applications: appList, error } = await ApplicationsApi.getApplications({
      student_id: userStore.user.id
    })
    
    if (error) {
      throw new Error(error)
    }
    
    applications.value = appList
    
    // 获取统计信息
    const { stats: statsData } = await ApplicationsApi.getApplicationStats(
      userStore.user.id,
      'student'
    )
    
    Object.assign(stats, statsData)
    
  } catch (error: any) {
    console.error('加载申请列表失败:', error)
    ElMessage.error('加载申请列表失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const refreshApplications = () => {
  currentPage.value = 1
  loadApplications()
}

const viewApplicationDetail = (application: any) => {
  selectedApplication.value = application
  detailDialogVisible.value = true
}

const cancelApplication = async (application: any) => {
  try {
    await ElMessageBox.confirm(
      '确定要取消这个申请吗？取消后无法恢复。',
      '确认取消',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const { error } = await ApplicationsApi.cancelApplication(application.id)
    
    if (error) {
      throw new Error(error)
    }
    
    ElMessage.success('申请已取消')
    await loadApplications() // 重新加载数据
    
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('取消申请失败:', error)
      ElMessage.error('取消申请失败: ' + error.message)
    }
  }
}

const resetFilters = () => {
  searchKeyword.value = ''
  filterStatus.value = ''
  currentPage.value = 1
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handlePageChange = (page: number) => {
  currentPage.value = page
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const getStatusTagType = (status: string) => {
  const types: Record<string, any> = {
    pending: 'warning',
    reviewing: 'info',
    accepted: 'success',
    rejected: 'danger',
    cancelled: 'info'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: '待处理',
    reviewing: '审核中',
    accepted: '已通过',
    rejected: '已拒绝',
    cancelled: '已取消'
  }
  return texts[status] || status
}

onMounted(() => {
  loadApplications()
})
</script>

<style scoped>
.student-applications {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
  color: #303133;
  font-size: 28px;
  font-weight: 600;
}

.stats-cards {
  margin-bottom: 24px;
}

.stat-card {
  .stat-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .stat-icon {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: white;
    
    &.total { background: #409eff; }
    &.pending { background: #e6a23c; }
    &.accepted { background: #67c23a; }
    &.rejected { background: #f56c6c; }
  }
  
  .stat-value {
    font-size: 24px;
    font-weight: 600;
    color: #303133;
  }
  
  .stat-label {
    font-size: 14px;
    color: #909399;
  }
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

.filter-left {
  display: flex;
  gap: 16px;
  align-items: center;
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

.job-info {
  .job-title {
    font-weight: 600;
    margin-bottom: 8px;
  }
  
  .company-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .company-name {
    color: #606266;
  }
}

.pagination-section {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.application-detail {
  line-height: 1.6;
}

@media (max-width: 768px) {
  .student-applications {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .filter-content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-left {
    flex-direction: column;
    gap: 12px;
  }
  
  .filter-left .el-input,
  .filter-left .el-select {
    width: 100% !important;
  }
}
</style>