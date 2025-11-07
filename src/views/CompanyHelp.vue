<template>
  <div class="company-help">
    <div class="page-header">
      <h1>帮助中心</h1>
      <p>获取使用指南和常见问题解答</p>
    </div>

    <div class="help-container">
      <!-- 搜索区域 -->
      <div class="search-section">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索帮助内容..."
          size="large"
          clearable
          @input="searchHelp"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <!-- 主要内容 -->
      <div class="main-content">
        <!-- 侧边导航 -->
        <div class="help-sidebar">
          <div class="help-categories">
            <div 
              v-for="category in helpCategories" 
              :key="category.id"
              :class="['category-item', { active: activeCategory === category.id }]"
              @click="setActiveCategory(category.id)"
            >
              <el-icon><component :is="category.icon" /></el-icon>
              <span>{{ category.name }}</span>
            </div>
          </div>

          <!-- 快速链接 -->
          <div class="quick-links">
            <h3>快速链接</h3>
            <div class="link-item" @click="contactSupport">
              <el-icon><Phone /></el-icon>
              <span>联系客服</span>
            </div>
            <div class="link-item" @click="submitFeedback">
              <el-icon><ChatDotSquare /></el-icon>
              <span>提交反馈</span>
            </div>
            <div class="link-item" @click="viewTutorials">
              <el-icon><VideoPlay /></el-icon>
              <span>视频教程</span>
            </div>
          </div>
        </div>

        <!-- 帮助内容 -->
        <div class="help-content">
          <!-- 常见问题 -->
          <div v-if="activeCategory === 'faq'" class="faq-section">
            <h2>常见问题</h2>
            <el-collapse v-model="activeFaqs">
              <el-collapse-item 
                v-for="faq in faqs" 
                :key="faq.id"
                :title="faq.question"
                :name="faq.id"
              >
                <div>{{ faq.answer }}</div>
              </el-collapse-item>
            </el-collapse>
          </div>

          <!-- 使用指南 -->
          <div v-else-if="activeCategory === 'guide'" class="guide-section">
            <h2>使用指南</h2>
            <div class="guide-steps">
              <div 
                v-for="step in guideSteps" 
                :key="step.id"
                class="guide-step"
              >
                <div class="step-number">{{ step.id }}</div>
                <div class="step-content">
                  <h3>{{ step.title }}</h3>
                  <p>{{ step.description }}</p>
                  <div v-if="step.details" class="step-details">
                    <p>{{ step.details }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 故障排除 -->
          <div v-else-if="activeCategory === 'troubleshooting'" class="troubleshooting-section">
            <h2>故障排除</h2>
            <div class="troubleshooting-list">
              <div 
                v-for="issue in troubleshootingIssues" 
                :key="issue.id"
                class="issue-item"
              >
                <h3>{{ issue.problem }}</h3>
                <div class="solution">
                  <strong>解决方案：</strong>
                  <p>{{ issue.solution }}</p>
                </div>
                <div v-if="issue.steps" class="solution-steps">
                  <ol>
                    <li v-for="step in issue.steps" :key="step">{{ step }}</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <!-- 搜索结果 -->
          <div v-else-if="searchResults.length > 0" class="search-results">
            <h2>搜索结果 ({{ searchResults.length }})</h2>
            <div class="results-list">
              <div 
                v-for="result in searchResults" 
                :key="result.id"
                class="result-item"
                @click="viewResult(result)"
              >
                <h3>{{ result.title }}</h3>
                <p>{{ result.preview }}</p>
                <div class="result-meta">
                  <el-tag size="small">{{ result.category }}</el-tag>
                </div>
              </div>
            </div>
          </div>

          <!-- 默认内容 -->
          <div v-else class="welcome-section">
            <h2>欢迎使用帮助中心</h2>
            <p>选择左侧分类开始浏览帮助内容，或使用搜索功能快速找到您需要的信息。</p>
            
            <div class="feature-cards">
              <el-card class="feature-card">
                <template #header>
                  <div class="card-header">
                    <el-icon><QuestionFilled /></el-icon>
                    <span>常见问题</span>
                  </div>
                </template>
                <p>查看其他用户经常遇到的问题和解决方案。</p>
              </el-card>
              
              <el-card class="feature-card">
                <template #header>
                  <div class="card-header">
                    <el-icon><Document /></el-icon>
                    <span>使用指南</span>
                  </div>
                </template>
                <p>详细了解系统的各项功能和操作步骤。</p>
              </el-card>
              
              <el-card class="feature-card">
                <template #header>
                  <div class="card-header">
                    <el-icon><Tools /></el-icon>
                    <span>故障排除</span>
                  </div>
                </template>
                <p>遇到问题时，查看相关的故障排除方法。</p>
              </el-card>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search, Phone, ChatDotSquare, VideoPlay, QuestionFilled, Document, Tools } from '@element-plus/icons-vue'

// 帮助分类
const helpCategories = ref([
  { id: 'welcome', name: '欢迎使用', icon: 'House' },
  { id: 'faq', name: '常见问题', icon: 'QuestionFilled' },
  { id: 'guide', name: '使用指南', icon: 'Document' },
  { id: 'troubleshooting', name: '故障排除', icon: 'Tools' },
  { id: 'api', name: 'API文档', icon: 'Connection' },
  { id: 'policy', name: '政策条款', icon: 'Notebook' }
])

// 常见问题
const faqs = ref([
  {
    id: 1,
    question: '如何发布新的兼职岗位？',
    answer: '在企业控制台点击"岗位管理" -> "发布新岗位"，填写岗位信息并提交审核即可。'
  },
  {
    id: 2,
    question: '岗位审核需要多长时间？',
    answer: '一般情况下，岗位审核会在24小时内完成。如有特殊情况，我们会通过消息中心通知您。'
  },
  {
    id: 3,
    question: '如何查看申请者的简历？',
    answer: '在"申请管理"页面，点击申请记录即可查看申请者的完整信息和简历。'
  }
])

// 使用指南步骤
const guideSteps = ref([
  {
    id: 1,
    title: '企业认证',
    description: '完成企业基本信息认证，获得发布岗位的权限。',
    details: '需要准备营业执照、法人身份证等材料。'
  },
  {
    id: 2,
    title: '发布岗位',
    description: '创建并发布兼职岗位，设置岗位要求和薪资。',
    details: '岗位信息需要详细准确，便于求职者了解工作内容。'
  },
  {
    id: 3,
    title: '管理申请',
    description: '查看和处理岗位申请，与申请者沟通。',
    details: '及时处理申请可以提高招聘效率。'
  }
])

// 故障排除问题
const troubleshootingIssues = ref([
  {
    id: 1,
    problem: '岗位搜索不显示',
    solution: '检查岗位状态是否为"active"，确认岗位信息完整且通过审核。',
    steps: [
      '登录企业控制台',
      '检查岗位状态',
      '确认岗位信息完整',
      '联系客服寻求帮助'
    ]
  },
  {
    id: 2,
    problem: '无法接收申请通知',
    solution: '检查消息设置和网络连接，确保通知功能已开启。'
  }
])

const activeCategory = ref('welcome')
const searchKeyword = ref('')
const activeFaqs = ref([])
const searchResults = ref([])

// 搜索帮助内容
const searchHelp = () => {
  if (!searchKeyword.value.trim()) {
    searchResults.value = []
    return
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  const results = []
  
  // 搜索FAQ
  faqs.value.forEach(faq => {
    if (faq.question.toLowerCase().includes(keyword) || faq.answer.toLowerCase().includes(keyword)) {
      results.push({
        id: `faq-${faq.id}`,
        title: faq.question,
        preview: faq.answer.substring(0, 100) + '...',
        category: '常见问题'
      })
    }
  })
  
  // 搜索使用指南
  guideSteps.value.forEach(step => {
    if (step.title.toLowerCase().includes(keyword) || step.description.toLowerCase().includes(keyword)) {
      results.push({
        id: `guide-${step.id}`,
        title: step.title,
        preview: step.description,
        category: '使用指南'
      })
    }
  })
  
  searchResults.value = results
}

// 设置活动分类
const setActiveCategory = (category: string) => {
  activeCategory.value = category
  searchResults.value = []
}

// 查看搜索结果
const viewResult = (result: any) => {
  // 根据结果类型跳转到相应分类
  if (result.category === '常见问题') {
    activeCategory.value = 'faq'
    const faqId = parseInt(result.id.split('-')[1])
    activeFaqs.value = [faqId]
  } else if (result.category === '使用指南') {
    activeCategory.value = 'guide'
  }
  
  searchKeyword.value = ''
  searchResults.value = []
}

// 快速链接功能
const contactSupport = () => {
  ElMessage.info('客服功能开发中')
}

const submitFeedback = () => {
  ElMessage.info('反馈功能开发中')
}

const viewTutorials = () => {
  ElMessage.info('视频教程功能开发中')
}

onMounted(() => {
  console.log('帮助中心初始化完成')
})
</script>

<style scoped>
.company-help {
  padding: 20px;
  min-height: 100vh;
  background: #f5f7fa;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 28px;
  color: #303133;
  margin: 0;
}

.page-header p {
  color: #909399;
  margin: 5px 0 0 0;
}

.search-section {
  margin-bottom: 30px;
}

.search-section .el-input {
  max-width: 500px;
}

.main-content {
  display: flex;
  gap: 30px;
}

.help-sidebar {
  width: 250px;
  flex-shrink: 0;
}

.help-categories {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.category-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-bottom: 8px;
}

.category-item:last-child {
  margin-bottom: 0;
}

.category-item:hover {
  background-color: #f5f7fa;
}

.category-item.active {
  background-color: #ecf5ff;
  color: #409eff;
}

.category-item .el-icon {
  margin-right: 12px;
  font-size: 16px;
}

.quick-links {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.quick-links h3 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
}

.link-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.link-item:hover {
  background-color: #f5f7fa;
}

.link-item .el-icon {
  margin-right: 10px;
  font-size: 14px;
}

.help-content {
  flex: 1;
  background: white;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.help-content h2 {
  margin: 0 0 20px 0;
  color: #303133;
  font-size: 22px;
}

.faq-section .el-collapse {
  border: none;
}

.guide-steps {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.guide-step {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.step-number {
  width: 40px;
  height: 40px;
  background: #409eff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 18px;
  flex-shrink: 0;
}

.step-content h3 {
  margin: 0 0 8px 0;
  color: #303133;
}

.step-content p {
  margin: 0;
  color: #606266;
  line-height: 1.6;
}

.step-details {
  margin-top: 8px;
  padding: 12px;
  background: #e8f4ff;
  border-radius: 4px;
  border-left: 3px solid #409eff;
}

.troubleshooting-list {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.issue-item {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.issue-item h3 {
  margin: 0 0 12px 0;
  color: #303133;
}

.solution {
  margin-bottom: 12px;
}

.solution-steps ol {
  margin: 8px 0 0 0;
  padding-left: 20px;
}

.solution-steps li {
  margin-bottom: 4px;
  color: #606266;
}

.search-results {
  min-height: 400px;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-item {
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.result-item:hover {
  border-color: #409eff;
  background: #f0f9ff;
}

.result-item h3 {
  margin: 0 0 8px 0;
  color: #303133;
}

.result-item p {
  margin: 0 0 8px 0;
  color: #606266;
  line-height: 1.5;
}

.result-meta {
  display: flex;
  justify-content: flex-end;
}

.welcome-section p {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 30px;
}

.feature-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.feature-card {
  height: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.card-header .el-icon {
  color: #409eff;
}
</style>