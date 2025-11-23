<template>
  <div class="rating-system">
    <div class="container">
      <!-- 页面头部 -->
      <div class="page-header">
        <h1>评价系统</h1>
        <p>查看和管理您的评价记录</p>
      </div>

      <div class="rating-content">
        <!-- 评价概览 -->
        <el-card class="overview-card">
          <div class="overview-content">
            <div class="rating-stats">
              <div class="stat-item">
                <div class="stat-value">{{ ratingStats.averageRating }}</div>
                <div class="stat-label">平均评分</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ ratingStats.totalRatings }}</div>
                <div class="stat-label">总评价数</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ ratingStats.positiveRatings }}</div>
                <div class="stat-label">好评数</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ ratingStats.responseRate }}%</div>
                <div class="stat-label">回复率</div>
              </div>
            </div>
            
            <div class="rating-breakdown">
              <h3>评分分布</h3>
              <div class="breakdown-list">
                <div 
                  v-for="item in ratingBreakdown" 
                  :key="item.rating"
                  class="breakdown-item"
                >
                  <span class="rating-label">{{ item.rating }}星</span>
                  <el-progress 
                    :percentage="item.percentage" 
                    :show-text="false"
                    :stroke-width="8"
                  />
                  <span class="rating-count">{{ item.count }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 评价列表 -->
        <el-card class="ratings-card">
          <template #header>
            <div class="card-header">
              <h3>评价记录</h3>
              <div class="filter-actions">
                <el-select v-model="filterType" placeholder="评价类型" style="width: 150px">
                  <el-option label="全部评价" value="all" />
                  <el-option label="收到的评价" value="received" />
                  <el-option label="给出的评价" value="given" />
                </el-select>
                <el-select v-model="filterRating" placeholder="评分" style="width: 120px">
                  <el-option label="全部" value="all" />
                  <el-option label="5星" value="5" />
                  <el-option label="4星" value="4" />
                  <el-option label="3星" value="3" />
                  <el-option label="2星" value="2" />
                  <el-option label="1星" value="1" />
                </el-select>
              </div>
            </div>
          </template>

          <div class="ratings-list">
            <div v-if="filteredRatings.length === 0" class="empty-state">
              <el-empty description="暂无评价记录" />
            </div>
            
            <div 
              v-for="rating in filteredRatings" 
              :key="rating.id"
              class="rating-item"
            >
              <div class="rating-header">
                <div class="user-info">
                  <el-avatar :size="40" :src="rating.avatar" />
                  <div class="user-details">
                    <div class="user-name">{{ rating.userName }}</div>
                    <div class="rating-meta">
                      <span class="rating-type">{{ rating.type === 'given' ? '我给出的评价' : '我收到的评价' }}</span>
                      <span class="rating-time">{{ rating.time }}</span>
                    </div>
                  </div>
                </div>
                
                <div class="rating-score">
                  <el-rate 
                    v-model="rating.score" 
                    disabled 
                    show-score 
                    text-color="#ff9900" 
                  />
                </div>
              </div>
              
              <div class="rating-content">
                <div class="rating-title">{{ rating.title }}</div>
                <p class="rating-comment">{{ rating.comment }}</p>
                
                <!-- 评价标签 -->
                <div v-if="rating.tags && rating.tags.length > 0" class="rating-tags">
                  <el-tag 
                    v-for="tag in rating.tags" 
                    :key="tag"
                    size="small"
                    type="info"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
                
                <!-- 关联岗位信息 -->
                <div v-if="rating.jobInfo" class="job-info">
                  <div class="job-title">关联岗位：{{ rating.jobInfo.title }}</div>
                  <div class="job-company">{{ rating.jobInfo.company }}</div>
                </div>
                
                <!-- 回复区域 -->
                <div v-if="rating.reply" class="rating-reply">
                  <div class="reply-header">
                    <span class="reply-label">回复：</span>
                    <span class="reply-time">{{ (rating.reply as any)?.time }}</span>
                  </div>
                  <p class="reply-content">{{ (rating.reply as any)?.content }}</p>
                </div>
                
                <!-- 回复按钮 -->
                <div v-if="rating.type === 'received' && !rating.reply" class="reply-actions">
                  <el-button 
                    type="text" 
                    size="small" 
                    @click="showReplyDialog(rating)"
                  >
                    回复评价
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <!-- 分页 -->
          <div class="pagination-section">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :total="filteredRatings.length"
              layout="prev, pager, next, jumper"
              @current-change="handlePageChange"
            />
          </div>
        </el-card>
      </div>
    </div>

    <!-- 回复评价弹窗 -->
    <el-dialog
      v-model="replyDialogVisible"
      :title="'回复评价 - ' + (replyingRating?.userName || '')"
      width="500px"
    >
      <el-form :model="replyForm" label-width="80px">
        <el-form-item label="回复内容">
          <el-input
            v-model="replyForm.content"
            type="textarea"
            :rows="4"
            placeholder="请输入回复内容"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="replyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReply" :loading="replying">
          提交回复
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../store'

const userStore = useUserStore()

// 评价统计数据
const ratingStats = reactive({
  averageRating: 4.8,
  totalRatings: 24,
  positiveRatings: 22,
  responseRate: 85
})

// 评分分布
const ratingBreakdown = ref([
  { rating: 5, count: 18, percentage: 75 },
  { rating: 4, count: 4, percentage: 17 },
  { rating: 3, count: 1, percentage: 4 },
  { rating: 2, count: 1, percentage: 4 },
  { rating: 1, count: 0, percentage: 0 }
])

// 评价列表数据
const ratings = ref([
  {
    id: '1',
    type: 'received',
    score: 5,
    title: '工作认真负责',
    comment: '这位同学工作非常认真负责，按时完成任务，沟通能力也很强。',
    userName: '张经理',
    avatar: 'https://via.placeholder.com/40x40/409EFF/ffffff?text=张',
    time: '2025-10-20',
    tags: ['认真负责', '沟通良好', '按时完成'],
    jobInfo: {
      title: '前端开发实习生',
      company: '腾讯科技'
    },
    reply: {
      content: '感谢您的认可，我会继续努力的！',
      time: '2025-10-21'
    }
  },
  {
    id: '2',
    type: 'given',
    score: 4,
    title: '公司环境不错',
    comment: '公司工作环境很好，同事都很友好，工作内容也很有挑战性。',
    userName: '美团外卖',
    avatar: 'https://via.placeholder.com/40x40/67C23A/ffffff?text=美',
    time: '2025-10-18',
    tags: ['环境好', '同事友好', '有挑战'],
    jobInfo: {
      title: '配送员',
      company: '美团外卖'
    }
  },
  {
    id: '3',
    type: 'received',
    score: 5,
    title: '学习能力很强',
    comment: '这位同学学习能力很强，能够快速掌握新技能，工作态度积极。',
    userName: '李主管',
    avatar: 'https://via.placeholder.com/40x40/E6A23C/ffffff?text=李',
    time: '2025-10-15',
    tags: ['学习能力强', '态度积极', '快速上手'],
    jobInfo: {
      title: 'Java开发实习生',
      company: '阿里巴巴'
    }
  }
])

// 筛选条件
const filterType = ref('all')
const filterRating = ref('all')
const currentPage = ref(1)
const pageSize = ref(10)

// 回复相关
const replyDialogVisible = ref(false)
const replying = ref(false)
const replyingRating = ref<any>(null)

const replyForm = reactive({
  content: ''
})

// 计算属性
const filteredRatings = computed(() => {
  let filtered = ratings.value
  
  // 按类型筛选
  if (filterType.value !== 'all') {
    filtered = filtered.filter(rating => rating.type === filterType.value)
  }
  
  // 按评分筛选
  if (filterRating.value !== 'all') {
    filtered = filtered.filter(rating => rating.score === parseInt(filterRating.value))
  }
  
  return filtered
})

// 分页数据
const paginatedRatings = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredRatings.value.slice(start, end)
})

// 方法
const showReplyDialog = (rating: any) => {
  replyingRating.value = rating
  replyForm.content = ''
  replyDialogVisible.value = true
}

const submitReply = async () => {
  if (!replyForm.content.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }
  
  replying.value = true
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 更新评价的回复
    if (replyingRating.value) {
      replyingRating.value.reply = {
        content: replyForm.content,
        time: new Date().toLocaleDateString()
      }
    }
    
    ElMessage.success('回复成功')
    replyDialogVisible.value = false
    replyForm.content = ''
  } catch (error) {
    ElMessage.error('回复失败')
  } finally {
    replying.value = false
  }
}

const handlePageChange = (page: number) => {
  currentPage.value = page
}

onMounted(() => {
  // 初始化数据
  console.log('评价系统页面加载完成')
})
</script>

<style scoped>
.rating-system {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 28px;
  color: #303133;
  margin-bottom: 8px;
}

.page-header p {
  color: #909399;
  font-size: 16px;
}

.overview-card {
  margin-bottom: 30px;
}

.overview-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
}

.rating-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 30px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  color: #409EFF;
  margin-bottom: 8px;
}

.stat-label {
  color: #606266;
  font-size: 14px;
}

.rating-breakdown h3 {
  margin-bottom: 20px;
  color: #303133;
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.breakdown-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.rating-label {
  min-width: 40px;
  color: #606266;
}

.rating-count {
  min-width: 30px;
  text-align: right;
  color: #909399;
  font-size: 14px;
}

.ratings-card {
  min-height: 500px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-actions {
  display: flex;
  gap: 12px;
}

.ratings-list {
  min-height: 400px;
}

.rating-item {
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 16px;
  background: white;
}

.rating-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.user-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.rating-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

.rating-type {
  background: #f0f2f5;
  padding: 2px 8px;
  border-radius: 4px;
}

.rating-content {
  margin-left: 52px;
}

.rating-title {
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  font-size: 16px;
}

.rating-comment {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 12px;
}

.rating-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.job-info {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 12px;
}

.job-title {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.job-company {
  color: #606266;
  font-size: 14px;
}

.rating-reply {
  background: #f0f7ff;
  border-left: 4px solid #409EFF;
  padding: 12px 16px;
  margin-top: 12px;
  border-radius: 0 6px 6px 0;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.reply-label {
  font-weight: 500;
  color: #409EFF;
}

.reply-time {
  color: #909399;
  font-size: 12px;
}

.reply-content {
  color: #606266;
  line-height: 1.5;
}

.reply-actions {
  margin-top: 12px;
}

.pagination-section {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.empty-state {
  padding: 60px 0;
}

@media (max-width: 768px) {
  .overview-content {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .rating-stats {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .card-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .filter-actions {
    justify-content: space-between;
  }
  
  .rating-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .rating-content {
    margin-left: 0;
  }
}
</style>