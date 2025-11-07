<template>
  <div class="company-layout">
    <!-- 侧边栏 -->
    <CompanySidebar />
    
    <!-- 主内容区域 -->
    <div class="company-main">
      <!-- 顶部导航栏 -->
      <div class="company-header">
        <div class="header-left">
          <h1>发布新岗位</h1>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/company/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item :to="{ path: '/company/jobs' }">岗位管理</el-breadcrumb-item>
            <el-breadcrumb-item>发布新岗位</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-actions">
          <el-button @click="$router.go(-1)">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
        </div>
      </div>

      <!-- 主要内容 -->
      <div class="job-form-container">
        <el-card class="job-form-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">岗位信息</span>
              <el-button type="primary" @click="submitJobForm" :loading="loading">
                <el-icon><Check /></el-icon>
                发布岗位
              </el-button>
            </div>
          </template>

          <el-form
            ref="jobFormRef"
            :model="jobForm"
            :rules="jobRules"
            label-width="120px"
            label-position="left"
          >
            <el-form-item label="岗位标题" prop="title">
              <el-input
                v-model="jobForm.title"
                placeholder="请输入岗位标题"
                maxlength="50"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="薪资范围" prop="salary">
              <el-input
                v-model="jobForm.salary"
                placeholder="例如：5k-10k/月"
                maxlength="20"
              />
            </el-form-item>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="工作地点" prop="location">
                  <el-input
                    v-model="jobForm.location"
                    placeholder="例如：北京市朝阳区"
                    maxlength="50"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="工作时间" prop="workTime">
                  <el-input
                    v-model="jobForm.workTime"
                    placeholder="例如：9:00-18:00"
                    maxlength="20"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="招聘人数" prop="recruitCount">
              <el-input-number
                v-model="jobForm.recruitCount"
                :min="1"
                :max="100"
                controls-position="right"
              />
            </el-form-item>

            <el-form-item label="岗位描述" prop="description">
              <el-input
                v-model="jobForm.description"
                type="textarea"
                :rows="6"
                placeholder="请输入详细的岗位描述，包括工作职责、任职要求等"
                maxlength="1000"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="技能标签">
              <el-select
                v-model="jobForm.tags"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="请选择或输入技能标签"
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

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="岗位分类" prop="category">
                  <el-select v-model="jobForm.category" placeholder="请选择分类" style="width: 100%">
                    <el-option label="技术类" value="技术" />
                    <el-option label="产品类" value="产品" />
                    <el-option label="设计类" value="设计" />
                    <el-option label="运营类" value="运营" />
                    <el-option label="市场类" value="市场" />
                    <el-option label="销售类" value="销售" />
                    <el-option label="职能类" value="职能" />
                    <el-option label="其他" value="其他" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="工作类型" prop="jobType">
                  <el-select v-model="jobForm.jobType" placeholder="请选择类型" style="width: 100%">
                    <el-option label="实习" value="实习" />
                    <el-option label="兼职" value="兼职" />
                    <el-option label="全职" value="全职" />
                    <el-option label="远程" value="远程" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Check } from '@element-plus/icons-vue'
import CompanySidebar from '../components/CompanySidebar.vue'
import { companyDataService } from '../services/companyDataService'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const jobFormRef = ref()

const jobForm = reactive({
  title: '',
  salary: '',
  location: '',
  workTime: '',
  recruitCount: 1,
  description: '',
  tags: [],
  category: '技术',
  jobType: '实习'
})

const jobRules = {
  title: [{ required: true, message: '请输入岗位标题', trigger: 'blur' }],
  salary: [{ required: true, message: '请输入薪资范围', trigger: 'blur' }],
  location: [{ required: true, message: '请输入工作地点', trigger: 'blur' }],
  workTime: [{ required: true, message: '请输入工作时间', trigger: 'blur' }],
  description: [{ required: true, message: '请输入岗位描述', trigger: 'blur' }],
  category: [{ required: true, message: '请选择岗位分类', trigger: 'change' }],
  jobType: [{ required: true, message: '请选择工作类型', trigger: 'change' }]
}

const commonTags = [
  '前端开发', '后端开发', '移动端', 'UI设计', '产品经理',
  '运营', '市场', '销售', '客服', '行政', '财务',
  'React', 'Vue', 'Angular', 'Node.js', 'Python', 'Java'
]

// 提交岗位表单
const submitJobForm = async () => {
  if (!jobFormRef.value) return

  try {
    await jobFormRef.value.validate()
    
    loading.value = true
    
    // 映射岗位类型到数据库接受的英文值
    const jobTypeMapping = {
      '全职': 'full_time',
      '兼职': 'part_time',
      '实习': 'internship',
      '远程': 'remote'
    }
    
    // 使用真实数据服务创建岗位
    await companyDataService.createJob({
      title: jobForm.title,
      description: jobForm.description,
      salary_range: jobForm.salary,
      work_location: jobForm.location,
      work_hours: jobForm.workTime,
      recruit_count: jobForm.recruitCount,
      skills_required: jobForm.tags,
      category: jobForm.category,
      job_type: jobTypeMapping[jobForm.jobType] || 'full_time',
      status: 'active' // 设置默认状态为active，符合数据库约束
    })
    
    ElMessage.success('岗位发布成功')
    
    // 返回岗位列表
    router.push('/company/jobs')
  } catch (error) {
    console.error('发布岗位失败 - 详细错误信息:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      originalError: error
    })
    
    // 更详细的错误处理
    let errorMessage = '发布失败'
    if (error && error.message) {
      errorMessage = error.message
    } else if (error && typeof error === 'object') {
      errorMessage = JSON.stringify(error, null, 2)
    }
    
    ElMessage.error('发布失败: ' + errorMessage)
  } finally {
    loading.value = false
  }
}
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

.job-form-container {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.job-form-card {
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-textarea__inner) {
  resize: vertical;
  min-height: 120px;
}
</style>