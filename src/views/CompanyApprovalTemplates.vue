<template>
  <div class="company-layout">
    <CompanySidebar />
    
    <div class="company-main">
      <div class="company-header">
        <div class="header-left">
          <h1>审批模板管理</h1>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/company/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>审批流程</el-breadcrumb-item>
            <el-breadcrumb-item>审批模板</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="createTemplate">
            <el-icon><Plus /></el-icon>
            新建模板
          </el-button>
        </div>
      </div>

      <div class="templates-container">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>审批模板列表</span>
              <el-button type="text" @click="refreshList">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>
          
          <div class="template-grid">
            <el-card 
              v-for="template in templateList" 
              :key="template.id"
              class="template-card"
              :class="{ 'active': template.status === 'active' }"
            >
              <template #header>
                <div class="template-header">
                  <h4>{{ template.name }}</h4>
                  <el-tag :type="template.status === 'active' ? 'success' : 'info'">
                    {{ template.status === 'active' ? '启用' : '停用' }}
                  </el-tag>
                </div>
              </template>
              
              <div class="template-content">
                <p class="template-desc">{{ template.description }}</p>
                <div class="template-meta">
                  <span>类型: {{ getTypeText(template.type) }}</span>
                  <span>创建时间: {{ template.createdAt }}</span>
                </div>
              </div>
              
              <template #footer>
                <div class="template-actions">
                  <el-button size="small" @click="editTemplate(template)">编辑</el-button>
                  <el-button 
                    size="small" 
                    :type="template.status === 'active' ? 'warning' : 'success'"
                    @click="toggleTemplate(template)"
                  >
                    {{ template.status === 'active' ? '停用' : '启用' }}
                  </el-button>
                  <el-button size="small" type="danger" @click="deleteTemplate(template)">删除</el-button>
                </div>
              </template>
            </el-card>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import CompanySidebar from '../components/CompanySidebar.vue'
import { Plus, Refresh } from '@element-plus/icons-vue'

interface Template {
  id: string
  name: string
  description: string
  type: 'job_publish' | 'application_review' | 'payment_approval'
  status: 'active' | 'inactive'
  createdAt: string
}

const loading = ref(false)
const templateList = ref<Template[]>([])

const getTypeText = (type: string) => {
  const typeMap = {
    'job_publish': '岗位发布',
    'application_review': '申请审核',
    'payment_approval': '支付审批'
  }
  return typeMap[type as keyof typeof typeMap] || type
}

const loadTemplates = async () => {
  loading.value = true
  try {
    // 模拟数据
    templateList.value = [
      {
        id: '1',
        name: '标准岗位发布模板',
        description: '适用于一般岗位发布的审批流程模板',
        type: 'job_publish',
        status: 'active',
        createdAt: '2024-01-10'
      },
      {
        id: '2',
        name: '学生申请审核模板',
        description: '学生申请信息的审核流程模板',
        type: 'application_review',
        status: 'active',
        createdAt: '2024-01-12'
      },
      {
        id: '3',
        name: '薪资支付审批模板',
        description: '薪资支付的审批流程模板',
        type: 'payment_approval',
        status: 'inactive',
        createdAt: '2024-01-08'
      }
    ]
  } catch (error) {
    console.error('加载审批模板失败:', error)
  } finally {
    loading.value = false
  }
}

const createTemplate = () => {
  console.log('创建新审批模板')
}

const editTemplate = (template: Template) => {
  console.log('编辑审批模板:', template)
}

const toggleTemplate = (template: Template) => {
  console.log('切换模板状态:', template)
}

const deleteTemplate = (template: Template) => {
  console.log('删除模板:', template)
}

const refreshList = () => {
  loadTemplates()
}

onMounted(() => {
  loadTemplates()
})
</script>

<style scoped>
.templates-container {
  padding: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.template-card {
  transition: all 0.3s ease;
}

.template-card.active {
  border-color: #409eff;
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.template-header h4 {
  margin: 0;
  font-size: 16px;
}

.template-content {
  min-height: 80px;
}

.template-desc {
  color: #666;
  margin-bottom: 12px;
  line-height: 1.5;
}

.template-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #999;
}

.template-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>