<template>
  <div class="company-layout">
    <CompanySidebar />
    
    <div class="company-main">
      <div class="company-header">
        <div class="header-left">
          <h1>审批流程配置</h1>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/company/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>审批流程</el-breadcrumb-item>
            <el-breadcrumb-item>流程配置</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="createWorkflow">
            <el-icon><Plus /></el-icon>
            新建流程
          </el-button>
        </div>
      </div>

      <div class="approval-container">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>审批流程列表</span>
              <el-button type="text" @click="refreshList">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>
          
          <el-table :data="workflowList" v-loading="loading">
            <el-table-column prop="name" label="流程名称" min-width="150" />
            <el-table-column prop="type" label="流程类型" min-width="100">
              <template #default="{ row }">
                <el-tag :type="getTypeTag(row.type)">{{ getTypeText(row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="steps" label="审批步骤" min-width="80">
              <template #default="{ row }">
                <span>{{ row.steps?.length || 0 }} 步</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" min-width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'info'">
                  {{ row.status === 'active' ? '启用' : '停用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="updatedAt" label="更新时间" min-width="120" />
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="editWorkflow(row)">编辑</el-button>
                <el-button 
                  size="small" 
                  :type="row.status === 'active' ? 'warning' : 'success'"
                  @click="toggleWorkflow(row)"
                >
                  {{ row.status === 'active' ? '停用' : '启用' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import CompanySidebar from '../components/CompanySidebar.vue'
import { Plus, Refresh } from '@element-plus/icons-vue'

interface Workflow {
  id: string
  name: string
  type: 'job_approval' | 'application_approval' | 'payment_approval'
  steps: any[]
  status: 'active' | 'inactive'
  updatedAt: string
}

const loading = ref(false)
const workflowList = ref<Workflow[]>([])

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

const loadWorkflows = async () => {
  loading.value = true
  try {
    // 模拟数据
    workflowList.value = [
      {
        id: '1',
        name: '岗位发布审批',
        type: 'job_approval',
        steps: [{}, {}],
        status: 'active',
        updatedAt: '2024-01-15 10:30:00'
      },
      {
        id: '2',
        name: '学生申请审批',
        type: 'application_approval',
        steps: [{}],
        status: 'active',
        updatedAt: '2024-01-14 16:20:00'
      }
    ]
  } catch (error) {
    console.error('加载审批流程失败:', error)
  } finally {
    loading.value = false
  }
}

const createWorkflow = () => {
  console.log('创建新审批流程')
}

const editWorkflow = (workflow: Workflow) => {
  console.log('编辑审批流程:', workflow)
}

const toggleWorkflow = (workflow: Workflow) => {
  console.log('切换审批流程状态:', workflow)
}

const refreshList = () => {
  loadWorkflows()
}

onMounted(() => {
  loadWorkflows()
})
</script>

<style scoped>
.approval-container {
  padding: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>