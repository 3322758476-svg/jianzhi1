<template>
  <div class="company-layout">
    <CompanySidebar />
    
    <div class="company-main">
      <div class="company-header">
        <div class="header-left">
          <h1>审批历史记录</h1>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/company/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>审批流程</el-breadcrumb-item>
            <el-breadcrumb-item>审批历史</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-actions">
          <el-button @click="exportHistory">
            <el-icon><Download /></el-icon>
            导出记录
          </el-button>
        </div>
      </div>

      <div class="history-container">
        <!-- 筛选条件 -->
        <el-card class="filter-card">
          <el-form :model="filterForm" inline>
            <el-form-item label="审批类型">
              <el-select v-model="filterForm.type" placeholder="请选择类型" clearable>
                <el-option label="岗位审批" value="job_approval" />
                <el-option label="申请审批" value="application_approval" />
                <el-option label="支付审批" value="payment_approval" />
              </el-select>
            </el-form-item>
            <el-form-item label="审批状态">
              <el-select v-model="filterForm.status" placeholder="请选择状态" clearable>
                <el-option label="通过" value="approved" />
                <el-option label="拒绝" value="rejected" />
                <el-option label="待审批" value="pending" />
              </el-select>
            </el-form-item>
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="filterForm.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="searchHistory">查询</el-button>
              <el-button @click="resetFilter">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 审批历史列表 -->
        <el-card>
          <template #header>
            <div class="card-header">
              <span>审批历史记录</span>
              <el-button type="text" @click="refreshList">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>
          
          <el-table :data="historyList" v-loading="loading">
            <el-table-column prop="id" label="审批ID" width="100" />
            <el-table-column prop="type" label="审批类型" width="120">
              <template #default="{ row }">
                <el-tag :type="getTypeTag(row.type)">{{ getTypeText(row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="审批事项" min-width="200" />
            <el-table-column prop="applicant" label="申请人" width="120" />
            <el-table-column prop="approver" label="审批人" width="120" />
            <el-table-column prop="status" label="审批状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusTag(row.status)">{{ getStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="result" label="审批结果" width="100">
              <template #default="{ row }">
                <span :class="getResultClass(row.result)">{{ getResultText(row.result) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="申请时间" width="150" />
            <el-table-column prop="approvedAt" label="审批时间" width="150" />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button size="small" type="text" @click="viewDetail(row)">查看详情</el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="pagination.current"
              v-model:page-size="pagination.size"
              :page-sizes="[10, 20, 50, 100]"
              :total="pagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import CompanySidebar from '../components/CompanySidebar.vue'
import { Download, Refresh } from '@element-plus/icons-vue'

interface ApprovalHistory {
  id: string
  type: string
  title: string
  applicant: string
  approver: string
  status: string
  result: string
  createdAt: string
  approvedAt: string
}

const loading = ref(false)
const historyList = ref<ApprovalHistory[]>([])

const filterForm = reactive({
  type: '',
  status: '',
  dateRange: []
})

const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

const getTypeTag = (type: string) => {
  const typeMap = {
    'job_approval': 'primary',
    'application_approval': 'success',
    'payment_approval': 'warning'
  }
  return typeMap[type as keyof typeof typeMap] || 'info'
}

const getTypeText = (type: string) => {
  const typeMap = {
    'job_approval': '岗位审批',
    'application_approval': '申请审批',
    'payment_approval': '支付审批'
  }
  return typeMap[type as keyof typeof typeMap] || type
}

const getStatusTag = (status: string) => {
  const statusMap = {
    'approved': 'success',
    'rejected': 'danger',
    'pending': 'warning'
  }
  return statusMap[status as keyof typeof statusMap] || 'info'
}

const getStatusText = (status: string) => {
  const statusMap = {
    'approved': '已通过',
    'rejected': '已拒绝',
    'pending': '待审批'
  }
  return statusMap[status as keyof typeof statusMap] || status
}

const getResultClass = (result: string) => {
  return result === 'approved' ? 'text-success' : result === 'rejected' ? 'text-danger' : 'text-warning'
}

const getResultText = (result: string) => {
  const resultMap = {
    'approved': '通过',
    'rejected': '拒绝',
    'pending': '待审批'
  }
  return resultMap[result as keyof typeof resultMap] || result
}

const loadHistory = async () => {
  loading.value = true
  try {
    // 模拟数据
    historyList.value = [
      {
        id: 'APP001',
        type: 'job_approval',
        title: '前端开发工程师岗位发布',
        applicant: '张三',
        approver: '李四',
        status: 'approved',
        result: 'approved',
        createdAt: '2024-01-15 09:30:00',
        approvedAt: '2024-01-15 14:20:00'
      },
      {
        id: 'APP002',
        type: 'application_approval',
        title: '学生王五的实习申请',
        applicant: '王五',
        approver: '赵六',
        status: 'rejected',
        result: 'rejected',
        createdAt: '2024-01-14 16:45:00',
        approvedAt: '2024-01-15 10:15:00'
      }
    ]
    pagination.total = historyList.value.length
  } catch (error) {
    console.error('加载审批历史失败:', error)
  } finally {
    loading.value = false
  }
}

const searchHistory = () => {
  console.log('查询审批历史:', filterForm)
  loadHistory()
}

const resetFilter = () => {
  Object.assign(filterForm, {
    type: '',
    status: '',
    dateRange: []
  })
  loadHistory()
}

const viewDetail = (history: ApprovalHistory) => {
  console.log('查看审批详情:', history)
}

const exportHistory = () => {
  console.log('导出审批历史')
}

const refreshList = () => {
  loadHistory()
}

const handleSizeChange = (size: number) => {
  pagination.size = size
  loadHistory()
}

const handleCurrentChange = (current: number) => {
  pagination.current = current
  loadHistory()
}

onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.history-container {
  padding: 24px;
}

.filter-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.text-success {
  color: #67c23a;
}

.text-danger {
  color: #f56c6c;
}

.text-warning {
  color: #e6a23c;
}
</style>