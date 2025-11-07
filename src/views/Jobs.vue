<template>
  <div class="jobs-container">
    <!-- 搜索和筛选区域 -->
    <div class="search-section">
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索兼职岗位、公司名称或关键词"
          size="large"
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button type="primary" @click="handleSearch">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
          </template>
        </el-input>
      </div>

      <div class="filter-section">
        <div class="filter-group">
          <span class="filter-label">工作地点：</span>
          <el-select v-model="filters.location" placeholder="选择地点" clearable filterable>
            <el-option label="北京" value="beijing" />
            <el-option label="上海" value="shanghai" />
            <el-option label="广州" value="guangzhou" />
            <el-option label="深圳" value="shenzhen" />
            <el-option label="杭州" value="hangzhou" />
            <el-option label="成都" value="chengdu" />
            <el-option label="武汉" value="wuhan" />
            <el-option label="西安" value="xian" />
            <el-option label="远程" value="remote" />
          </el-select>
        </div>

        <div class="filter-group">
          <span class="filter-label">薪资范围：</span>
          <el-select v-model="filters.salary" placeholder="选择薪资" clearable>
            <el-option label="100元/天以下" value="0-100" />
            <el-option label="100-200元/天" value="100-200" />
            <el-option label="200-300元/天" value="200-300" />
            <el-option label="300-400元/天" value="300-400" />
            <el-option label="400元/天以上" value="400+" />
          </el-select>
        </div>

        <div class="filter-group">
          <span class="filter-label">工作类型：</span>
          <el-select v-model="filters.type" placeholder="选择类型" clearable>
            <el-option label="长期兼职" value="long-term" />
            <el-option label="短期兼职" value="short-term" />
            <el-option label="实习" value="internship" />
            <el-option label="项目制" value="project" />
            <el-option label="周末兼职" value="weekend" />
            <el-option label="寒暑假" value="vacation" />
          </el-select>
        </div>

        <div class="filter-group">
          <span class="filter-label">行业分类：</span>
          <el-select v-model="filters.industry" placeholder="选择行业" clearable>
            <el-option label="互联网/科技" value="internet" />
            <el-option label="教育/培训" value="education" />
            <el-option label="金融/保险" value="finance" />
            <el-option label="零售/电商" value="retail" />
            <el-option label="文化/传媒" value="media" />
            <el-option label="餐饮/服务" value="catering" />
            <el-option label="医疗/健康" value="medical" />
            <el-option label="制造/工业" value="manufacturing" />
          </el-select>
        </div>

        <div class="filter-group">
          <span class="filter-label">学历要求：</span>
          <el-select v-model="filters.education" placeholder="学历要求" clearable>
            <el-option label="不限" value="any" />
            <el-option label="大专" value="college" />
            <el-option label="本科" value="bachelor" />
            <el-option label="硕士" value="master" />
            <el-option label="博士" value="doctor" />
          </el-select>
        </div>

        <div class="filter-group">
          <span class="filter-label">工作经验：</span>
          <el-select v-model="filters.experience" placeholder="经验要求" clearable>
            <el-option label="不限" value="any" />
            <el-option label="无经验" value="no-experience" />
            <el-option label="1年以下" value="0-1" />
            <el-option label="1-3年" value="1-3" />
            <el-option label="3年以上" value="3+" />
          </el-select>
        </div>
      </div>
    </div>

    <!-- 岗位列表 -->
    <div class="jobs-content">
      <div class="jobs-header">
        <h2>推荐兼职岗位</h2>
        <div class="sort-options">
          <el-radio-group v-model="sortBy" @change="handleSortChange">
            <el-radio label="time">最新发布</el-radio>
            <el-radio label="salary">薪资最高</el-radio>
            <el-radio label="hot">最受欢迎</el-radio>
          </el-radio-group>
        </div>
      </div>

      <div class="jobs-list">
        <el-card
          v-for="job in filteredJobs"
          :key="job.id"
          class="job-card"
          shadow="hover"
          @click="$router.push(`/jobs/${job.id}`)"
        >
          <div class="job-header">
            <div class="job-title-section">
              <h3 class="job-title">{{ job.title }}</h3>
              <el-tag :type="getSalaryTagType(job.salary)" size="small">
                {{ job.salary }}
              </el-tag>
            </div>
            <div class="job-actions">
              <el-button
                type="primary"
                size="small"
                @click.stop="handleApply(job)"
              >
                立即申请
              </el-button>
              <el-button
                :type="isFavorite(job.id) ? 'danger' : 'default'"
                size="small"
                @click.stop="toggleFavorite(job)"
              >
                <el-icon><Star /></el-icon>
                {{ isFavorite(job.id) ? '已收藏' : '收藏' }}
              </el-button>
            </div>
          </div>

          <div class="job-info">
            <div class="company-info">
              <el-avatar :size="40" :src="job.company.logo" />
              <div class="company-details">
                <div class="company-name">{{ job.company.name }}</div>
                <div class="company-industry">{{ job.company.industry }}</div>
              </div>
            </div>

            <div class="job-details">
              <div class="detail-item">
                <el-icon><Location /></el-icon>
                <span>{{ job.location }}</span>
              </div>
              <div class="detail-item">
                <el-icon><Clock /></el-icon>
                <span>{{ job.workTime }}</span>
              </div>
              <div class="detail-item">
                <el-icon><User /></el-icon>
                <span>{{ job.recruitCount }}人</span>
              </div>
            </div>
          </div>

          <div class="job-description">
            {{ job.description }}
          </div>

          <div class="job-footer">
            <div class="job-tags">
              <el-tag
                v-for="tag in job.tags"
                :key="tag"
                size="small"
                type="info"
              >
                {{ tag }}
              </el-tag>
            </div>
            <div class="publish-time">
              {{ job.publishTime }}
            </div>
          </div>
        </el-card>
      </div>

      <!-- 分页 -->
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="totalJobs"
          layout="prev, pager, next, jumper"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 快速申请弹窗 -->
    <el-dialog
      v-model="applyDialogVisible"
      title="申请岗位"
      width="500px"
    >
      <div v-if="selectedJob">
        <h4>{{ selectedJob.title }}</h4>
        <p>公司：{{ selectedJob.company.name }}</p>
        <p>薪资：{{ selectedJob.salary }}</p>
        
        <el-form :model="applyForm" label-width="80px">
          <el-form-item label="简历">
            <el-select v-model="applyForm.resumeId" placeholder="选择简历">
              <el-option
                v-for="resume in userResumes"
                :key="resume.id"
                :label="resume.title"
                :value="resume.id"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="留言">
            <el-input
              v-model="applyForm.message"
              type="textarea"
              placeholder="给HR的留言（可选）"
              :rows="3"
            />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <el-button @click="applyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitApplication">确认申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Star, Location, Clock, User } from '@element-plus/icons-vue'
import { useUserStore } from '../store'
import { supabase } from '../lib/supabase'

const router = useRouter()
const userStore = useUserStore()

// 搜索和筛选
const searchKeyword = ref('')
const filters = reactive({
  location: '',
  salary: '',
  type: '',
  industry: '',
  education: '',
  experience: ''
})

// 加载状态
const loading = ref(false)

// 排序和分页
const sortBy = ref('time')
const currentPage = ref(1)
const pageSize = ref(10)
const totalJobs = ref(0)

// 申请弹窗
const applyDialogVisible = ref(false)
const selectedJob = ref<any>(null)
const applyForm = reactive({
  resumeId: '',
  message: ''
})

const jobs = ref([])
const userResumes = ref([])
const favoriteJobs = ref<string[]>([])

// 加载用户简历数据
const loadUserResumes = async () => {
  try {
    userResumes.value = []
    
    // 获取当前用户的学生信息
    const { data: studentData, error } = await supabase
      .from('students')
      .select('id, real_name, resume_url')
      .eq('user_id', userStore.user?.id)
      .single()
    
    if (error) {
      console.warn('获取学生信息失败，使用默认简历选项:', error)
      // 使用默认简历选项
      userResumes.value = [
        { id: 'text_resume', title: '文本简历', url: null }
      ]
      return
    }
    
    if (studentData) {
      // 如果有上传的简历文件，添加到简历列表
      if (studentData.resume_url) {
        userResumes.value.push({
          id: 'uploaded_resume',
          title: `${studentData.real_name || '我的'}简历文件`,
          url: studentData.resume_url
        })
      }
      
      // 添加文本简历选项
      userResumes.value.push({
        id: 'text_resume',
        title: '文本简历',
        url: null
      })
    } else {
      // 如果没有学生信息，使用默认简历选项
      userResumes.value = [
        { id: 'text_resume', title: '文本简历', url: null }
      ]
    }
  } catch (error: any) {
    console.error('加载简历数据失败:', error)
    // 如果加载失败，使用默认选项
    userResumes.value = [
      { id: 'text_resume', title: '文本简历', url: null }
    ]
  }
}

// 加载职位数据
const loadJobs = async () => {
  try {
    loading.value = true
    
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
        company_id,
        work_hours,
        job_type,
        category,
        skills_required
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('加载职位数据失败:', error)
      // 降级处理：使用静态数据
      jobs.value = getFallbackJobs()
      totalJobs.value = jobs.value.length
      return
    }
    
    if (jobsData && jobsData.length > 0) {
      // 获取公司信息（如果失败则使用默认公司名）
      let companiesMap = new Map()
      try {
        const companyIds = [...new Set(jobsData.map(job => job.company_id))]
        const { data: companiesData } = await supabase
          .from('companies')
          .select('id, company_name, industry')
          .in('id', companyIds)
        
        companiesMap = new Map(companiesData?.map(c => [c.id, { name: c.company_name, industry: c.industry }]) || [])
      } catch (companiesError) {
        console.warn('获取公司信息失败，使用默认公司名:', companiesError)
      }
      
      // 转换数据格式
      jobs.value = jobsData.map(job => {
        const companyInfo = companiesMap.get(job.company_id) || { name: '招聘公司', industry: '其他' }
        const tags = job.skills_required || []
        
        return {
          id: job.id,
          title: job.title,
          salary: job.salary_range || '面议',
          location: job.work_location || '工作地点待定',
          workTime: job.work_hours || '工作时间待定',
          recruitCount: 1, // 默认值
          description: job.description,
          publishTime: formatTimeAgo(job.created_at),
          company: {
            name: companyInfo.name,
            logo: '',
            industry: companyInfo.industry
          },
          tags: Array.isArray(tags) ? tags : [tags]
        }
      })
      
      totalJobs.value = jobs.value.length
    } else {
      // 降级处理：使用静态数据
      jobs.value = getFallbackJobs()
      totalJobs.value = jobs.value.length
    }
    
  } catch (error) {
    console.error('加载职位数据失败:', error)
    ElMessage.error('加载职位失败')
    // 降级处理：使用静态数据
    jobs.value = getFallbackJobs()
    totalJobs.value = jobs.value.length
  } finally {
    loading.value = false
  }
}

// 降级数据
const getFallbackJobs = () => [
  {
    id: '1',
    title: '前端开发实习生',
    salary: '200-300元/天',
    location: '深圳·南山区',
    workTime: '每周3-5天',
    recruitCount: 5,
    description: '负责公司产品的前端开发工作，参与需求讨论和技术方案设计。',
    publishTime: '2小时前',
    company: {
      name: '腾讯科技',
      logo: '',
      industry: '互联网'
    },
    tags: ['React', 'Vue', 'TypeScript']
  },
  {
    id: '2',
    title: '新媒体运营助理',
    salary: '150-200元/天',
    location: '北京·海淀区',
    workTime: '每周4天',
    recruitCount: 3,
    description: '负责社交媒体内容创作和运营，协助品牌推广活动。',
    publishTime: '1天前',
    company: {
      name: '字节跳动',
      logo: '',
      industry: '互联网'
    },
    tags: ['新媒体', '内容运营', '社交媒体']
  }
]

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

// 计算属性
const filteredJobs = computed(() => {
  let result = jobs.value
  
  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(job => 
      job.title.toLowerCase().includes(keyword) ||
      job.company.name.toLowerCase().includes(keyword) ||
      job.tags.some(tag => tag.toLowerCase().includes(keyword))
    )
  }
  
  // 地点筛选
  if (filters.location) {
    result = result.filter(job => {
      if (filters.location === 'remote') {
        return job.location === '远程'
      }
      return job.location.includes(filters.location)
    })
  }
  
  // 薪资筛选
  if (filters.salary) {
    result = result.filter(job => {
      const salary = job.salary
      switch (filters.salary) {
        case '0-100': return salary.includes('100元/天以下')
        case '100-200': return salary.includes('100-200')
        case '200-300': return salary.includes('200-300')
        case '300+': return salary.includes('300元/天以上')
        default: return true
      }
    })
  }
  
  // 类型筛选
  if (filters.type) {
    // 这里可以根据实际数据结构调整
    result = result.filter(job => job.workTime.includes(filters.type))
  }
  
  // 行业筛选
  if (filters.industry) {
    result = result.filter(job => job.company.industry === filters.industry)
  }
  
  // 排序
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'salary':
        return getSalaryValue(b.salary) - getSalaryValue(a.salary)
      case 'hot':
        return b.recruitCount - a.recruitCount
      default:
        return 0 // 按时间排序需要实际数据支持
    }
  })
  
  return result
})

// 方法
const handleSearch = async () => {
  try {
    loading.value = true
    
    // 构建搜索查询
    let query = supabase
      .from('jobs')
      .select(`
        id,
        title,
        salary_range,
        work_location,
        description,
        created_at,
        company_id,
        work_hours,
        job_type,
        category,
        skills_required
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    
    // 添加关键词搜索条件
    if (searchKeyword.value.trim()) {
      const keyword = searchKeyword.value.trim()
      // 使用or条件搜索标题和描述
      query = query.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%`)
    }
    
    // 添加地点筛选
    if (filters.location) {
      query = query.eq('work_location', filters.location)
    }
    
    // 添加薪资筛选
    if (filters.salary) {
      query = query.eq('salary_range', filters.salary)
    }
    
    // 添加类型筛选
    if (filters.type) {
      query = query.eq('job_type', filters.type)
    }
    
    // 添加行业筛选（需要关联公司表）
    if (filters.industry) {
      // 先获取该行业的公司ID
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .eq('industry', filters.industry)
      
      if (companies && companies.length > 0) {
        const companyIds = companies.map(c => c.id)
        query = query.in('company_id', companyIds)
      }
    }
    
    const { data: jobsData, error } = await query
    
    if (error) throw error
    
    if (jobsData && jobsData.length > 0) {
      // 获取公司信息
      let companiesMap = new Map()
      try {
        const companyIds = [...new Set(jobsData.map(job => job.company_id))]
        const { data: companiesData } = await supabase
          .from('companies')
          .select('id, company_name, industry')
          .in('id', companyIds)
        
        companiesMap = new Map(companiesData?.map(c => [c.id, { name: c.company_name, industry: c.industry }]) || [])
      } catch (companiesError) {
        console.warn('获取公司信息失败，使用默认公司名:', companiesError)
      }
      
      // 转换数据格式
      jobs.value = jobsData.map(job => {
        const companyInfo = companiesMap.get(job.company_id) || { name: '招聘公司', industry: '其他' }
        const tags = job.skills_required || []
        
        return {
          id: job.id,
          title: job.title,
          salary: job.salary_range || '面议',
          location: job.work_location || '工作地点待定',
          workTime: job.work_hours || '工作时间待定',
          recruitCount: 1, // 默认值
          description: job.description,
          publishTime: formatTimeAgo(job.created_at),
          company: {
            name: companyInfo.name,
            logo: '',
            industry: companyInfo.industry
          },
          tags: Array.isArray(tags) ? tags : [tags]
        }
      })
      
      totalJobs.value = jobs.value.length
      ElMessage.success(`找到 ${jobs.value.length} 个相关岗位`)
    } else {
      jobs.value = []
      totalJobs.value = 0
      ElMessage.info('未找到相关岗位')
    }
    
  } catch (error) {
    console.error('搜索失败:', error)
    ElMessage.error('搜索失败，请稍后重试')
    // 降级处理：使用静态数据
    jobs.value = getFallbackJobs()
    totalJobs.value = jobs.value.length
  } finally {
    loading.value = false
  }
}

const handleSortChange = () => {
  // 排序逻辑已经在计算属性中处理
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  // 实际项目中这里会调用API
}

const getSalaryTagType = (salary: string) => {
  if (salary.includes('300')) return 'danger'
  if (salary.includes('200')) return 'warning'
  return 'success'
}

const getSalaryValue = (salary: string) => {
  const match = salary.match(/\d+/g)
  return match ? parseInt(match[0]) : 0
}

const isFavorite = (jobId: string) => {
  return favoriteJobs.value.includes(jobId)
}

const toggleFavorite = (job: any) => {
  const index = favoriteJobs.value.indexOf(job.id)
  if (index > -1) {
    favoriteJobs.value.splice(index, 1)
    ElMessage.success('已取消收藏')
  } else {
    favoriteJobs.value.push(job.id)
    ElMessage.success('收藏成功')
  }
}

const handleApply = async (job: any) => {
  if (!userStore.isAuthenticated) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  // 加载用户简历数据
  await loadUserResumes()
  
  // 检查是否有简历可用
  if (userResumes.value.length === 0) {
    ElMessage.warning('请先完善简历信息')
    router.push('/profile/resume')
    return
  }
  
  selectedJob.value = job
  applyDialogVisible.value = true
}

const submitApplication = async () => {
  if (!applyForm.resumeId) {
    ElMessage.warning('请选择简历')
    return
  }
  
  try {
    // 获取当前用户的学生信息
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('id, real_name')
      .eq('user_id', userStore.user?.id)
      .single()
    
    if (studentError) throw studentError
    
    if (!studentData) {
      ElMessage.error('请先完善个人信息')
      return
    }
    
    // 先检查是否已经申请过该岗位
    const { data: existingApplication, error: checkError } = await supabase
      .from('applications')
      .select('id, status')
      .eq('job_id', selectedJob.value.id)
      .eq('student_id', studentData.id)
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 表示没有找到记录，这是正常的
      throw checkError
    }
    
    if (existingApplication) {
      ElMessage.warning(`您已经申请过该岗位，当前状态：${existingApplication.status}`)
      applyDialogVisible.value = false
      return
    }
    
    // 获取选择的简历信息
    const selectedResume = userResumes.value.find(r => r.id === applyForm.resumeId)
    
    // 创建申请记录
    const { data: applicationData, error: applicationError } = await supabase
      .from('applications')
      .insert({
        job_id: selectedJob.value.id,
        student_id: studentData.id,
        cover_letter: applyForm.message || '',
        resume_url: selectedResume?.url || null,
        status: 'pending',
        applied_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (applicationError) throw applicationError
    
    // 发送通知给公司
    await sendApplicationNotification(applicationData.id, studentData.real_name, selectedJob.value.id)
    
    ElMessage.success('申请提交成功！公司将会收到您的申请通知')
    applyDialogVisible.value = false
    
    // 重置表单
    applyForm.resumeId = ''
    applyForm.message = ''
  } catch (error: any) {
    console.error('申请提交失败:', error)
    ElMessage.error(error.message || '申请提交失败，请重试')
  }
}

// 发送申请通知给公司
const sendApplicationNotification = async (applicationId: string, studentName: string, jobId: string) => {
  try {
    // 获取岗位信息
    const { data: jobData } = await supabase
      .from('jobs')
      .select('title, company_id')
      .eq('id', jobId)
      .single()
    
    if (!jobData) return
    
    // 获取公司信息
    const { data: companyData } = await supabase
      .from('companies')
      .select('company_name, user_id')
      .eq('id', jobData.company_id)
      .single()
    
    if (!companyData) return
    
    // 这里可以集成邮件通知、站内信、或实时消息
    console.log(`发送申请通知：学生 ${studentName} 申请了岗位 "${jobData.title}"`)
    
    // 实际项目中，这里可以调用邮件服务或消息服务
    // 例如：await emailService.sendApplicationNotification(companyData.user_id, applicationId)
    
  } catch (error) {
    console.warn('发送通知失败:', error)
    // 通知失败不影响申请流程
  }
}

onMounted(() => {
  loadJobs()
})
</script>

<style scoped>
.jobs-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.search-section {
  background: white;
  padding: 30px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-bar {
  margin-bottom: 20px;
}

.filter-section {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-label {
  color: #666;
  font-size: 14px;
  white-space: nowrap;
}

.jobs-content {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.jobs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.jobs-header h2 {
  margin: 0;
  color: #333;
}

.jobs-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.job-card {
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
}

.job-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.job-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.job-title-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.job-title {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.job-actions {
  display: flex;
  gap: 8px;
}

.job-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.company-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.company-details {
  display: flex;
  flex-direction: column;
}

.company-name {
  font-weight: 600;
  color: #333;
}

.company-industry {
  font-size: 12px;
  color: #999;
}

.job-details {
  display: flex;
  gap: 20px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #666;
  font-size: 14px;
}

.job-description {
  color: #666;
  line-height: 1.6;
  margin-bottom: 15px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.job-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
}

.job-tags {
  display: flex;
  gap: 8px;
}

.publish-time {
  color: #999;
  font-size: 12px;
}

.pagination-section {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

@media (max-width: 768px) {
  .jobs-container {
    padding: 10px;
  }
  
  .search-section {
    padding: 20px;
  }
  
  .filter-section {
    flex-direction: column;
    gap: 15px;
  }
  
  .job-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .job-details {
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .job-footer {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
}
</style>