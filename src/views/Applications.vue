<template>
  <div class="applications-page">
    <el-card class="page-card">
      <template #header>
        <div class="page-header">
          <h2>申请记录</h2>
          <div class="header-actions">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索职位名称或公司"
              style="width: 200px; margin-right: 10px;"
              clearable
            />
            <el-select v-model="filterStatus" placeholder="筛选状态" clearable>
              <el-option label="全部" value="" />
              <el-option label="待处理" value="pending" />
              <el-option label="已查看" value="viewed" />
              <el-option label="已通过" value="approved" />
              <el-option label="已拒绝" value="rejected" />
              <el-option label="已取消" value="cancelled" />
            </el-select>
          </div>
        </div>
      </template>

      <div class="applications-content">
        <!-- 申请列表 -->
        <div v-if="filteredApplications.length > 0" class="applications-list">
          <el-timeline>
            <el-timeline-item
              v-for="application in filteredApplications"
              :key="application.id"
              :timestamp="formatDate(application.createdAt)"
              placement="top"
            >
              <el-card class="application-card" shadow="hover">
                <div class="application-header">
                  <div class="job-info">
                    <h3 class="job-title">{{ application.jobTitle }}</h3>
                    <p class="company-name">{{ application.companyName }}</p>
                    <p class="apply-time">申请时间：{{ formatDateTime(application.createdAt) }}</p>
                  </div>
                  <div class="status-info">
                    <el-tag :type="getStatusType(application.status)">
                      {{ getStatusText(application.status) }}
                    </el-tag>
                    <p class="update-time">
                      最后更新：{{ formatDateTime(application.updatedAt) }}
                    </p>
                  </div>
                </div>
                
                <div class="application-details">
                  <div class="detail-item">
                    <span class="label">申请职位：</span>
                    <span class="value">{{ application.jobTitle }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">期望薪资：</span>
                    <span class="value">{{ application.expectedSalary || '面议' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">申请留言：</span>
                    <span class="value">{{ application.message || '无' }}</span>
                  </div>
                  <div v-if="application.feedback" class="detail-item">
                    <span class="label">公司反馈：</span>
                    <span class="value feedback">{{ application.feedback }}</span>
                  </div>
                </div>

                <div class="application-actions">
                  <el-button
                    type="primary"
                    size="small"
                    @click="viewJobDetail(application.jobId)"
                  >
                    查看职位
                  </el-button>
                  <el-button
                    v-if="application.status === 'pending'"
                    type="danger"
                    size="small"
                    @click="cancelApplication(application.id)"
                  >
                    取消申请
                  </el-button>
                  <el-button
                    v-if="application.status === 'approved'"
                    type="success"
                    size="small"
                    @click="contactCompany(application.companyId)"
                  >
                    联系公司
                  </el-button>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <el-empty description="暂无申请记录">
            <el-button type="primary" @click="$router.push('/jobs')">
              去申请职位
            </el-button>
          </el-empty>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const searchKeyword = ref('')
const filterStatus = ref('')
const loading = ref(false)

const applications = ref([])

// 加载申请数据
const loadApplications = async () => {
  try {
    loading.value = true
    // 模拟数据加载
    await new Promise(resolve => setTimeout(resolve, 500))
    
    applications.value = [
      {
        id: '1',
        jobId: '1',
        jobTitle: '前端开发实习生',
        companyId: '1',
        companyName: '腾讯科技',
        status: 'pending',
        expectedSalary: '200-300元/天',
        message: '我对前端开发有浓厚兴趣，熟练掌握React和Vue框架。',
        feedback: '',
        createdAt: '2025-10-25 10:30:00',
        updatedAt: '2025-10-25 10:30:00'
      },
      {
        id: '2',
        jobId: '2',
        jobTitle: '新媒体运营助理',
        companyId: '2',
        companyName: '字节跳动',
        status: 'reviewing',
        expectedSalary: '150-200元/天',
        message: '有新媒体运营经验，熟悉抖音、小红书等平台。',
        feedback: '简历已收到，正在审核中',
        createdAt: '2025-10-24 14:20:00',
        updatedAt: '2025-10-24 16:45:00'
      },
      {
        id: '3',
        jobId: '3',
        jobTitle: '产品助理实习生',
        companyId: '3',
        companyName: '阿里巴巴',
        status: 'accepted',
        expectedSalary: '180-250元/天',
        message: '对产品设计有浓厚兴趣，希望学习产品管理知识。',
        feedback: '恭喜！您已通过面试，请等待后续通知',
        createdAt: '2025-10-23 09:15:00',
        updatedAt: '2025-10-24 11:30:00'
      },
      {
        id: '4',
        jobId: '4',
        jobTitle: 'UI设计实习生',
        companyId: '4',
        companyName: '百度',
        status: 'rejected',
        expectedSalary: '160-220元/天',
        message: '有UI设计经验，熟练使用Figma和Sketch。',
        feedback: '感谢您的申请，但该岗位已招满',
        createdAt: '2025-10-22 16:40:00',
        updatedAt: '2025-10-23 10:20:00'
      }
    ]
  } catch (error) {
    console.error('加载申请记录失败:', error)
    ElMessage.error('加载申请记录失败')
  } finally {
    loading.value = false
  }
}

// 过滤后的申请列表
const filteredApplications = computed(() => {
  return applications.value.filter(app => {
    const matchesSearch = !searchKeyword.value || 
      app.jobTitle.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      app.companyName.toLowerCase().includes(searchKeyword.value.toLowerCase())
    
    const matchesStatus = !filterStatus.value || app.status === filterStatus.value
    
    return matchesSearch && matchesStatus
  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
})

// 状态类型映射
const getStatusType = (status: string) => {
  const types: Record<string, any> = {
    pending: 'warning',
    viewed: 'info',
    approved: 'success',
    rejected: 'danger',
    cancelled: 'info'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: '待处理',
    viewed: '已查看',
    approved: '已通过',
    rejected: '已拒绝',
    cancelled: '已取消'
  }
  return texts[status] || status
}

// 日期格式化
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 查看职位详情
const viewJobDetail = (jobId: string) => {
  router.push(`/jobs/${jobId}`)
}

// 取消申请
const cancelApplication = async (applicationId: string) => {
  try {
    await ElMessageBox.confirm('确定要取消这个申请吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 模拟取消申请
    const index = applications.value.findIndex(app => app.id === applicationId)
    if (index !== -1) {
      applications.value[index].status = 'cancelled'
      applications.value[index].updatedAt = new Date().toISOString()
    }
    
    ElMessage.success('申请已取消')
  } catch (error) {
    // 用户取消操作
  }
}

// 联系公司
const contactCompany = (companyId: string) => {
  ElMessage.info('联系公司功能开发中')
}

onMounted(() => {
  // 可以在这里加载真实的申请数据
})
</script>

<style scoped>
.applications-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.applications-content {
  margin-top: 20px;
}

.application-card {
  margin-bottom: 20px;
}

.application-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.job-info .job-title {
  margin: 0 0 5px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.company-name {
  margin: 0 0 5px 0;
  color: #606266;
}

.apply-time {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.status-info {
  text-align: right;
}

.update-time {
  margin: 5px 0 0 0;
  font-size: 12px;
  color: #909399;
}

.application-details {
  margin-bottom: 15px;
}

.detail-item {
  margin-bottom: 8px;
  display: flex;
}

.detail-item .label {
  font-weight: 500;
  color: #606266;
  min-width: 80px;
}

.detail-item .value {
  color: #303133;
  flex: 1;
}

.detail-item .feedback {
  color: #67c23a;
  font-style: italic;
}

.application-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.empty-state {
  text-align: center;
  padding: 60px 0;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .application-header {
    flex-direction: column;
    gap: 10px;
  }
  
  .status-info {
    text-align: left;
  }
}
</style>

<style scoped>
.applications-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.coming-soon {
  text-align: center;
  padding: 60px 0;
}
</style>