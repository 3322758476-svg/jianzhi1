<template>
  <div class="company-jobs">
    <div class="page-header">
      <h1>岗位管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="goToNewJobPage">
          <el-icon><Plus /></el-icon>
          发布新岗位
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="filter-card">
      <div class="filter-content">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索岗位标题或描述"
          prefix-icon="Search"
          style="width: 300px"
          clearable
        />
        
        <div class="filter-actions">
          <el-select v-model="filterStatus" placeholder="岗位状态" clearable>
            <el-option label="招聘中" value="active" />
            <el-option label="已结束" value="inactive" />
          </el-select>
          
          <el-button @click="resetFilters">重置</el-button>
        </div>
      </div>
    </el-card>

    <!-- 岗位列表 -->
    <el-card>
      <template #header>
        <div class="table-header">
          <span>岗位列表</span>
          <span class="total-count">共 {{ filteredJobs.length }} 个岗位</span>
        </div>
      </template>

      <el-table :data="paginatedJobs" v-loading="loading">
        <el-table-column prop="title" label="岗位标题" min-width="200">
          <template #default="{ row }">
            <div class="job-title-cell">
              <div class="title">{{ row.title }}</div>
              <div class="tags">
                <el-tag
                  v-for="tag in row.tags.slice(0, 3)"
                  :key="tag"
                  size="small"
                  type="info"
                >
                  {{ tag }}
                </el-tag>
                <el-tag v-if="row.tags.length > 3" size="small" type="info">
                  +{{ row.tags.length - 3 }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="salary" label="薪资" width="120" />
        <el-table-column prop="location" label="地点" width="120" />
        <el-table-column prop="workTime" label="工作时间" width="120" />
        
        <el-table-column prop="applicationCount" label="申请人数" width="100">
          <template #default="{ row }">
            <span :class="{ 'highlight-count': row.applicationCount > 0 }">
              {{ row.applicationCount }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="publishTime" label="发布时间" width="120" />
        
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '招聘中' : '已结束' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewApplications(row)">
              查看申请
            </el-button>
            <el-button size="small" type="primary" @click="editJob(row)">
              编辑
            </el-button>
            <el-button size="small" type="danger" @click="deleteJob(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="filteredJobs.length"
          layout="prev, pager, next, jumper"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>


  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useUserStore } from '../store'
import { supabase } from '../lib/supabase'

import { companyDataService } from '../services/companyDataService'

const router = useRouter()

// 搜索和筛选
const searchKeyword = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)

// 表单相关状态
const jobFormVisible = ref(false)
const editingJob = ref(null)

const jobs = ref([])

// 加载公司岗位数据
const loadCompanyJobs = async () => {
  try {
    loading.value = true
    
    // 使用公司数据服务获取岗位数据
    const result = await companyDataService.getCompanyJobs({
      page: 1,
      pageSize: 100 // 获取所有岗位，不进行分页
    })
    
    jobs.value = result.jobs.map(job => ({
      id: job.id,
      title: job.title,
      salary: job.salary_range,
      location: job.work_location,
      workTime: job.work_hours,
      recruitCount: job.recruit_count || 1,
      applicationCount: 0, // 暂时设为0，后续可以从申请统计获取
      publishTime: job.created_at ? new Date(job.created_at).toLocaleDateString('zh-CN') : '',
      status: job.status,
      description: job.description,
      tags: job.skills_required || []
    }))
  } catch (error) {
    console.error('加载公司岗位失败:', error)
    ElMessage.error('加载公司岗位失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 从 Supabase 获取公司岗位数据
const fetchCompanyJobs = async (companyId: string) => {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data.map(job => ({
    id: job.id,
    title: job.title,
    salary: job.salary_range,
    location: job.work_location,
    workTime: job.work_hours,
    recruitCount: job.recruit_count,
    applicationCount: job.applications_count || 0,
    publishTime: job.created_at.split('T')[0],
    status: job.status,
    description: job.description,
    tags: job.skills_required || []
  }))
}

// 计算属性
const filteredJobs = computed(() => {
  let filtered = jobs.value
    // 搜索筛选
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(job => 
      job.title.toLowerCase().includes(keyword) ||
      job.description.toLowerCase().includes(keyword) ||
      job.tags.some(tag => tag.toLowerCase().includes(keyword))
    )
  }
  
  // 状态筛选
  if (filterStatus.value) {
    filtered = filtered.filter(job => job.status === filterStatus.value)
  }
  
  return filtered
})

// 分页数据
const paginatedJobs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredJobs.value.slice(start, end)
})



// 方法
const goToNewJobPage = () => {
  router.push('/company/jobs/new')
}



const handleJobSubmit = async (jobData: any) => {
  try {
    if (editingJob.value) {
      // 更新岗位 - 使用真实数据服务
      await companyDataService.updateJob(editingJob.value.id, {
        title: jobData.title,
        description: jobData.description,
        salary_range: jobData.salary,
        work_location: jobData.location,
        work_hours: jobData.workTime,
        recruit_count: jobData.recruitCount,
        skills_required: jobData.tags,
        category: jobData.category || '技术',
        job_type: jobData.job_type || 'internship'
      })
      
      ElMessage.success('岗位更新成功')
    } else {
      // 新增岗位 - 使用真实数据服务
      await companyDataService.createJob({
        title: jobData.title,
        description: jobData.description,
        salary_range: jobData.salary,
        work_location: jobData.location,
        work_hours: jobData.workTime,
        recruit_count: jobData.recruitCount,
        skills_required: jobData.tags,
        category: jobData.category || '技术',
        job_type: jobData.job_type || 'internship'
      })
      
      ElMessage.success('岗位发布成功')
    }
    
    // 重新加载数据
    await loadCompanyJobs()
    jobFormVisible.value = false
  } catch (error) {
    console.error('操作岗位失败:', error)
    ElMessage.error('操作失败: ' + (error.message || '未知错误'))
  }
}

const editJob = (job: any) => {
  console.log('editJob被调用，参数类型:', typeof job)
  console.log('editJob参数详情:', job)
  
  // 检查是否是有效的工作对象
  if (job && typeof job === 'object' && job.id) {
    editingJob.value = job
    jobFormVisible.value = true
  } else {
    console.error('无效的岗位对象:', job)
    ElMessage.error('无法编辑该岗位，数据异常')
  }
}

const deleteJob = async (job: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这个岗位吗？此操作不可恢复。', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 使用真实数据服务删除岗位
    await companyDataService.deleteJob(job.id)
    
    // 重新加载数据
    await loadCompanyJobs()
    ElMessage.success('岗位删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除岗位失败:', error)
      ElMessage.error('删除失败: ' + (error.message || '未知错误'))
    }
  }
}

const viewApplications = (job: any) => {
  router.push(`/company/applications?jobId=${job.id}`)
}

const resetFilters = () => {
  searchKeyword.value = ''
  filterStatus.value = ''
  currentPage.value = 1
}

const handlePageChange = (page: number) => {
  currentPage.value = page
}

onMounted(async () => {
  // 加载数据
  await loadCompanyJobs()
})
</script>

<style scoped>
@import '@/assets/styles/common.css';
.company-jobs {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-header h1 {
  margin: 0;
  color: #303133;
  font-size: 28px;
  font-weight: 600;
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

.filter-actions {
  display: flex;
  gap: 12px;
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

.job-title-cell .title {
  font-weight: 600;
  margin-bottom: 8px;
}

.job-title-cell .tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.highlight-count {
  color: #f56c6c;
  font-weight: 600;
}

.pagination-section {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .company-jobs {
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
  
  .filter-content .el-input {
    width: 100% !important;
  }
  
  .filter-actions {
    justify-content: space-between;
  }
}
</style>