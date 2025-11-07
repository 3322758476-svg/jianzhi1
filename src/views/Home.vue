<template>
  <div class="home">
    <!-- 顶部搜索区域 -->
    <div class="hero-section">
      <div class="hero-content">
        <h1>大学生兼职平台</h1>
        <p class="subtitle">连接优秀大学生与优质企业</p>
        
        <div class="search-box">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索兼职岗位、公司名称..."
            size="large"
            class="search-input"
          >
            <template #append>
              <el-button type="primary" @click="handleSearch">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
            </template>
          </el-input>
        </div>
        
        <div class="quick-filters">
          <el-tag 
            v-for="tag in quickTags" 
            :key="tag"
            type="info"
            class="filter-tag"
            @click="handleTagClick(tag)"
          >
            {{ tag }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 特色功能区域 -->
    <div class="features-section">
      <div class="container">
        <h2>平台特色</h2>
        <div class="features-grid">
          <div class="feature-card">
            <el-icon size="48" color="#409EFF"><User /></el-icon>
            <h3>学生认证</h3>
            <p>严格的学籍认证，确保学生身份真实可靠</p>
          </div>
          <div class="feature-card">
            <el-icon size="48" color="#67C23A"><OfficeBuilding /></el-icon>
            <h3>企业认证</h3>
            <p>企业资质审核，保障工作环境安全正规</p>
          </div>
          <div class="feature-card">
            <el-icon size="48" color="#E6A23C"><ChatDotRound /></el-icon>
            <h3>实时沟通</h3>
            <p>内置聊天系统，方便学生与企业直接交流</p>
          </div>
          <div class="feature-card">
            <el-icon size="48" color="#F56C6C"><Star /></el-icon>
            <h3>信用评价</h3>
            <p>双向评价体系，建立可靠的信用记录</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 热门岗位区域 -->
    <div class="jobs-section">
      <div class="container">
        <div class="section-header">
          <h2>热门兼职岗位</h2>
          <el-button type="primary" text @click="$router.push('/jobs')">
            查看全部
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
        
        <div class="jobs-grid" v-loading="isLoading">
          <el-card 
            v-for="job in featuredJobs" 
            :key="job.id"
            class="job-card"
            shadow="hover"
          >
            <template #header>
              <div class="job-header">
                <h3>{{ job.title }}</h3>
                <el-tag type="success">{{ job.salary }}</el-tag>
              </div>
            </template>
            
            <div class="job-info">
              <div class="company-info">
                <el-icon><OfficeBuilding /></el-icon>
                <span>{{ job.company }}</span>
              </div>
              <div class="location-info">
                <el-icon><Location /></el-icon>
                <span>{{ job.location }}</span>
              </div>
            </div>
            
            <p class="job-desc">{{ job.description }}</p>
            
            <template #footer>
              <div class="job-footer">
                <span class="create-time">{{ job.createdAt }}</span>
                <el-button type="primary" size="small" @click="viewJobDetail(job.id)">
                  查看详情
                </el-button>
              </div>
            </template>
          </el-card>
        </div>
      </div>
    </div>

    <!-- 统计数据区域 -->
    <div class="stats-section">
      <div class="container">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number">5000+</div>
            <div class="stat-label">注册学生</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">1000+</div>
            <div class="stat-label">合作企业</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">20000+</div>
            <div class="stat-label">兼职岗位</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">95%</div>
            <div class="stat-label">满意度</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store'
import { supabase } from '@/lib/supabase'
import {
  Search,
  User,
  OfficeBuilding,
  ChatDotRound,
  Star,
  ArrowRight,
  Location
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const searchKeyword = ref('')
const isLoading = ref(false)
const featuredJobs = ref([])
const quickTags = ref(['前端开发', '新媒体运营', '产品助理', '数据分析', '设计美工', '内容创作'])

// 加载推荐职位
const loadFeaturedJobs = async () => {
  try {
    isLoading.value = true
    
    // 使用真实API数据替换模拟数据
    const { data: jobsData, error } = await supabase
      .from('jobs')
      .select(`
        id,
        title,
        salary_range,
        work_location,
        description,
        created_at,
        company_id
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(6)
    
    if (error) throw error
    
    if (jobsData && jobsData.length > 0) {
      // 获取公司信息（如果失败则使用默认公司名）
      let companiesMap = new Map()
      try {
        const companyIds = [...new Set(jobsData.map(job => job.company_id))]
        const { data: companiesData } = await supabase
          .from('companies')
          .select('id, company_name')
          .in('id', companyIds)
        
        companiesMap = new Map(companiesData?.map(c => [c.id, c.company_name]) || [])
      } catch (companiesError) {
        console.warn('获取公司信息失败，使用默认公司名:', companiesError)
      }
      
      featuredJobs.value = jobsData.map(job => ({
        id: job.id,
        title: job.title,
        company: companiesMap.get(job.company_id) || '招聘公司',
        salary: job.salary_range,
        location: job.work_location,
        description: job.description,
        createdAt: formatTimeAgo(job.created_at)
      }))
    } else {
      // 降级处理：使用静态数据
      featuredJobs.value = getFallbackJobs()
    }
    
  } catch (error) {
    console.error('加载推荐职位失败:', error)
    // 降级处理：使用静态数据
    featuredJobs.value = getFallbackJobs()
  } finally {
    isLoading.value = false
  }
}

// 格式化时间显示
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  
  if (diffHours < 1) return '刚刚'
  if (diffHours < 24) return `${diffHours}小时前`
  return `${Math.floor(diffHours / 24)}天前`
}

// 降级数据
const getFallbackJobs = () => [
  {
    id: '1',
    title: '前端开发实习生',
    company: '腾讯科技',
    salary: '200-300元/天',
    location: '深圳·南山区',
    description: '负责公司产品的前端开发工作，参与需求讨论和技术方案设计。',
    createdAt: '2小时前'
  },
  {
    id: '2',
    title: '新媒体运营助理',
    company: '字节跳动',
    salary: '150-200元/天',
    location: '北京·海淀区',
    description: '负责社交媒体内容创作和运营，协助品牌推广活动。',
    createdAt: '1天前'
  },
  {
    id: '3',
    title: '产品助理实习生',
    company: '阿里巴巴',
    salary: '180-250元/天',
    location: '杭州·西湖区',
    description: '协助产品经理进行需求分析、原型设计和用户调研工作。',
    createdAt: '3小时前'
  }
]

// 格式化时间（虚拟数据不需要此函数）
// 已移除重复的函数声明

const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push(`/jobs?keyword=${encodeURIComponent(searchKeyword.value)}`)
  }
}

const handleTagClick = (tag: string) => {
  searchKeyword.value = tag
  handleSearch()
}

const viewJobDetail = (jobId: string) => {
  router.push(`/jobs/${jobId}`)
}

onMounted(() => {
  loadFeaturedJobs()
})
</script>

<style scoped>
.home {
  min-height: 100vh;
}

.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 80px 0;
  text-align: center;
}

.hero-content h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  font-weight: 700;
}

.subtitle {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.search-box {
  max-width: 600px;
  margin: 0 auto 2rem;
}

.search-input {
  width: 100%;
}

.quick-filters {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-tag {
  cursor: pointer;
  transition: all 0.3s;
}

.filter-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.features-section {
  padding: 80px 0;
  background: #f8f9fa;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.features-section h2 {
  text-align: center;
  margin-bottom: 3rem;
  font-size: 2.5rem;
  color: #333;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-card h3 {
  margin: 1rem 0 0.5rem;
  color: #333;
}

.feature-card p {
  color: #666;
  line-height: 1.6;
}

.jobs-section {
  padding: 80px 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.section-header h2 {
  font-size: 2.5rem;
  color: #333;
}

.jobs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
}

.job-card {
  transition: transform 0.3s;
}

.job-card:hover {
  transform: translateY(-2px);
}

.job-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
}

.job-header h3 {
  margin: 0;
  color: #333;
  flex: 1;
  margin-right: 1rem;
}

.job-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 1rem 0;
}

.company-info,
.location-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
}

.job-desc {
  color: #666;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.job-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.create-time {
  color: #999;
  font-size: 0.9rem;
}

.stats-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 60px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  text-align: center;
}

.stat-number {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 1.1rem;
  opacity: 0.9;
}

@media (max-width: 768px) {
  .hero-content h1 {
    font-size: 2rem;
  }
  
  .section-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .jobs-grid {
    grid-template-columns: 1fr;
  }
}
</style>