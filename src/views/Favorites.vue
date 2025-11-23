<template>
  <div class="favorites">
    <div class="page-header">
      <h1>我的收藏</h1>
      <p>查看您收藏的兼职岗位</p>
    </div>

    <div class="favorites-content">
      <el-card class="favorites-card">
        <template #header>
          <div class="card-header">
            <span>收藏列表</span>
            <el-button type="primary" size="small" @click="clearAllFavorites">
              清空收藏
            </el-button>
          </div>
        </template>

        <div v-if="favorites.length === 0" class="empty-state">
          <el-icon size="48" color="#C0C4CC"><Star /></el-icon>
          <p>暂无收藏的岗位</p>
          <el-button type="primary" @click="$router.push('/jobs')">
            去浏览岗位
          </el-button>
        </div>

        <div v-else class="favorites-list">
          <div 
            v-for="job in favorites" 
            :key="job.id"
            class="favorite-item"
          >
            <div class="job-info">
              <h3 @click="viewJobDetail(job.id)" class="job-title">
                {{ job.title }}
              </h3>
              <div class="job-meta">
                <span class="company">{{ job.company }}</span>
                <span class="salary">{{ job.salary }}</span>
                <span class="location">{{ job.location }}</span>
              </div>
              <p class="job-description">{{ job.description }}</p>
            </div>
            
            <div class="actions">
              <el-button 
                type="danger" 
                size="small" 
                @click="removeFromFavorites(job.id)"
              >
                取消收藏
              </el-button>
              <el-button 
                type="primary" 
                size="small" 
                @click="applyJob(job.id)"
              >
                立即申请
              </el-button>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Star } from '@element-plus/icons-vue'

const router = useRouter()

interface FavoriteJob {
  id: string
  title: string
  company: string
  salary: string
  location: string
  description: string
  addedAt: string
}

const favorites = ref<FavoriteJob[]>([])
const loading = ref(false)

// 加载收藏数据
const loadFavorites = async () => {
  try {
    const loading = ref(true)
    // 模拟数据加载
    await new Promise(resolve => setTimeout(resolve, 500))
    
    favorites.value = [
      {
        id: '1',
        title: '前端开发实习生',
        company: '腾讯科技',
        salary: '200-300元/天',
        location: '深圳·南山区',
        description: '负责公司产品的前端开发工作，参与需求讨论和技术方案设计。',
        addedAt: '2025-10-28'
      },
      {
        id: '2',
        title: '新媒体运营助理',
        company: '字节跳动',
        salary: '150-200元/天',
        location: '北京·海淀区',
        description: '负责社交媒体内容创作和运营，协助品牌推广活动。',
        addedAt: '2025-10-27'
      },
      {
        id: '3',
        title: '产品助理实习生',
        company: '阿里巴巴',
        salary: '180-250元/天',
        location: '杭州·西湖区',
        description: '协助产品经理进行需求分析、原型设计和用户调研工作。',
        addedAt: '2025-10-26'
      }
    ]
  } catch (error) {
    console.error('加载收藏失败:', error)
    ElMessage.error('加载收藏失败')
  } finally {
    loading.value = false
  }
}

const viewJobDetail = (jobId: string) => {
  router.push(`/jobs/${jobId}`)
}

const removeFromFavorites = (jobId: string) => {
  const index = favorites.value.findIndex(job => job.id === jobId)
  if (index !== -1) {
    favorites.value.splice(index, 1)
    ElMessage.success('已取消收藏')
  }
}

const applyJob = (jobId: string) => {
  ElMessage.success('申请成功！')
  // 实际应用中这里会调用API
}

const clearAllFavorites = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有收藏吗？此操作不可撤销。',
      '确认清空',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    favorites.value = []
    ElMessage.success('收藏已清空')
  } catch {
    // 用户取消操作
  }
}

onMounted(() => {
  // 可以在这里加载用户的收藏数据
})
</script>

<style scoped>
.favorites {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h1 {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 10px;
}

.page-header p {
  color: #666;
  font-size: 1.1rem;
}

.favorites-card {
  min-height: 400px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-state p {
  margin: 20px 0;
  font-size: 1.1rem;
}

.favorite-item {
  display: flex;
  justify-content: space-between;
  align-items: start;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.3s;
}

.favorite-item:hover {
  background-color: #f8f9fa;
}

.favorite-item:last-child {
  border-bottom: none;
}

.job-info {
  flex: 1;
  margin-right: 20px;
}

.job-title {
  font-size: 1.2rem;
  color: #333;
  margin: 0 0 10px 0;
  cursor: pointer;
  transition: color 0.3s;
}

.job-title:hover {
  color: #409EFF;
}

.job-meta {
  display: flex;
  gap: 20px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.job-meta span {
  color: #666;
  font-size: 0.9rem;
}

.salary {
  color: #E6A23C !important;
  font-weight: 600;
}

.job-description {
  color: #666;
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 120px;
}

@media (max-width: 768px) {
  .favorite-item {
    flex-direction: column;
    gap: 15px;
  }
  
  .job-info {
    margin-right: 0;
  }
  
  .actions {
    flex-direction: row;
    justify-content: flex-end;
    width: 100%;
  }
  
  .job-meta {
    gap: 10px;
  }
}
</style>