<template>
  <div class="ratings-container">
    <div class="ratings-header">
      <h2>评价管理</h2>
      <p>查看和管理您的评价记录</p>
    </div>

    <div class="ratings-content">
      <!-- 评价统计 -->
      <div class="stats-section">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-item">
                <div class="stat-value">{{ stats.totalRatings }}</div>
                <div class="stat-label">总评价数</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-item">
                <div class="stat-value">{{ stats.averageRating.toFixed(1) }}</div>
                <div class="stat-label">平均评分</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-item">
                <div class="stat-value">{{ stats.receivedRatings }}</div>
                <div class="stat-label">收到评价</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-item">
                <div class="stat-value">{{ stats.givenRatings }}</div>
                <div class="stat-label">给出评价</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 评价标签页 -->
      <div class="tabs-section">
        <el-tabs v-model="activeTab" @tab-click="handleTabChange">
          <el-tab-pane label="我给出的评价" name="given">
            <div class="ratings-list">
              <div v-if="givenRatings.length === 0" class="empty-state">
                <el-empty description="暂无评价记录" />
              </div>
              
              <el-card
                v-for="rating in givenRatings"
                :key="rating.id"
                class="rating-card"
              >
                <div class="rating-header">
                  <div class="rating-target">
                    <el-avatar :size="40" :src="rating.target.avatar" />
                    <div class="target-info">
                      <div class="target-name">{{ rating.target.name }}</div>
                      <div class="target-type">
                        <el-tag :type="rating.target.type === 'company' ? 'success' : 'primary'" size="small">
                          {{ rating.target.type === 'company' ? '企业' : '学生' }}
                        </el-tag>
                      </div>
                    </div>
                  </div>
                  
                  <div class="rating-meta">
                    <div class="rating-score">
                      <el-rate
                        v-model="rating.score"
                        disabled
                        show-score
                        text-color="#ff9900"
                        score-template="{value} 分"
                      />
                    </div>
                    <div class="rating-time">{{ rating.time }}</div>
                  </div>
                </div>
                
                <div class="rating-content">
                  <div class="rating-title">{{ rating.title }}</div>
                  <div class="rating-comment">{{ rating.comment }}</div>
                  
                  <div v-if="rating.tags.length > 0" class="rating-tags">
                    <el-tag
                      v-for="tag in rating.tags"
                      :key="tag"
                      size="small"
                      type="info"
                    >
                      {{ tag }}
                    </el-tag>
                  </div>
                </div>
                
                <div class="rating-footer">
                  <div class="job-info">
                    <span>相关岗位：{{ rating.jobTitle }}</span>
                  </div>
                  
                  <div class="rating-actions">
                    <el-button
                      type="text"
                      size="small"
                      @click="editRating(rating)"
                    >
                      编辑
                    </el-button>
                    <el-button
                      type="text"
                      size="small"
                      @click="deleteRating(rating)"
                    >
                      删除
                    </el-button>
                  </div>
                </div>
              </el-card>
            </div>
          </el-tab-pane>

          <el-tab-pane label="我收到的评价" name="received">
            <div class="ratings-list">
              <div v-if="receivedRatings.length === 0" class="empty-state">
                <el-empty description="暂无收到的评价" />
              </div>
              
              <el-card
                v-for="rating in receivedRatings"
                :key="rating.id"
                class="rating-card"
              >
                <div class="rating-header">
                  <div class="rating-target">
                    <el-avatar :size="40" :src="rating.from.avatar" />
                    <div class="target-info">
                      <div class="target-name">{{ rating.from.name }}</div>
                      <div class="target-type">
                        <el-tag :type="rating.from.type === 'company' ? 'success' : 'primary'" size="small">
                          {{ rating.from.type === 'company' ? '企业' : '学生' }}
                        </el-tag>
                      </div>
                    </div>
                  </div>
                  
                  <div class="rating-meta">
                    <div class="rating-score">
                      <el-rate
                        v-model="rating.score"
                        disabled
                        show-score
                        text-color="#ff9900"
                        score-template="{value} 分"
                      />
                    </div>
                    <div class="rating-time">{{ rating.time }}</div>
                  </div>
                </div>
                
                <div class="rating-content">
                  <div class="rating-title">{{ rating.title }}</div>
                  <div class="rating-comment">{{ rating.comment }}</div>
                  
                  <div v-if="rating.tags.length > 0" class="rating-tags">
                    <el-tag
                      v-for="tag in rating.tags"
                      :key="tag"
                      size="small"
                      type="info"
                    >
                      {{ tag }}
                    </el-tag>
                  </div>
                </div>
                
                <div class="rating-footer">
                  <div class="job-info">
                    <span>相关岗位：{{ rating.jobTitle }}</span>
                  </div>
                  
                  <div class="rating-actions">
                    <el-button
                      type="text"
                      size="small"
                      @click="replyToRating(rating)"
                    >
                      回复
                    </el-button>
                    <el-button
                      type="text"
                      size="small"
                      @click="reportRating(rating)"
                    >
                      举报
                    </el-button>
                  </div>
                </div>
              </el-card>
            </div>
          </el-tab-pane>

          <el-tab-pane label="待评价" name="pending">
            <div class="ratings-list">
              <div v-if="pendingRatings.length === 0" class="empty-state">
                <el-empty description="暂无待评价记录" />
              </div>
              
              <el-card
                v-for="item in pendingRatings"
                :key="item.id"
                class="pending-rating-card"
              >
                <div class="pending-header">
                  <div class="pending-info">
                    <el-avatar :size="50" :src="item.target.avatar" />
                    <div class="pending-details">
                      <div class="pending-title">{{ item.jobTitle }}</div>
                      <div class="pending-target">
                        评价对象：{{ item.target.name }}
                        <el-tag :type="item.target.type === 'company' ? 'success' : 'primary'" size="small">
                          {{ item.target.type === 'company' ? '企业' : '学生' }}
                        </el-tag>
                      </div>
                      <div class="pending-time">完成时间：{{ item.completeTime }}</div>
                    </div>
                  </div>
                  
                  <el-button
                    type="primary"
                    @click="createRating(item)"
                  >
                    立即评价
                  </el-button>
                </div>
              </el-card>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- 评价弹窗 -->
    <el-dialog
      v-model="ratingDialogVisible"
      :title="ratingDialogTitle"
      width="600px"
    >
      <el-form
        ref="ratingFormRef"
        :model="ratingForm"
        :rules="ratingRules"
        label-width="100px"
      >
        <el-form-item label="评分" prop="score">
          <el-rate
            v-model="ratingForm.score"
            :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
            show-score
            text-color="#ff9900"
          />
        </el-form-item>
        
        <el-form-item label="评价标题" prop="title">
          <el-input
            v-model="ratingForm.title"
            placeholder="请输入评价标题"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="评价内容" prop="comment">
          <el-input
            v-model="ratingForm.comment"
            type="textarea"
            :rows="4"
            placeholder="请输入详细的评价内容"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="评价标签">
          <el-select
            v-model="ratingForm.tags"
            multiple
            placeholder="选择评价标签"
            style="width: 100%"
          >
            <el-option
              v-for="tag in availableTags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="是否匿名">
          <el-switch v-model="ratingForm.anonymous" />
          <span class="anonymous-tip">匿名评价将不显示您的个人信息</span>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="ratingDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRating">提交评价</el-button>
      </template>
    </el-dialog>

    <!-- 回复弹窗 -->
    <el-dialog
      v-model="replyDialogVisible"
      title="回复评价"
      width="500px"
    >
      <el-form :model="replyForm" label-width="80px">
        <el-form-item label="回复内容">
          <el-input
            v-model="replyForm.content"
            type="textarea"
            :rows="3"
            placeholder="请输入回复内容"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="replyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReply">提交回复</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 评价统计
const stats = reactive({
  totalRatings: 15,
  averageRating: 4.5,
  receivedRatings: 8,
  givenRatings: 7
})

// 标签页
const activeTab = ref('given')

// 评价数据
const givenRatings = ref([
  {
    id: '1',
    score: 5,
    title: '非常专业的企业',
    comment: '工作环境很好，同事都很友好，学到了很多实用的技能。',
    tags: ['专业', '友好', '成长'],
    time: '2024-10-20',
    jobTitle: '前端开发实习生',
    target: {
      name: '字节跳动',
      type: 'company',
      avatar: ''
    }
  },
  {
    id: '2',
    score: 4,
    title: '不错的实习经历',
    comment: '项目很有挑战性，导师指导很耐心。',
    tags: ['挑战', '指导'],
    time: '2024-09-15',
    jobTitle: '数据分析实习生',
    target: {
      name: '阿里巴巴',
      type: 'company',
      avatar: ''
    }
  }
])

const receivedRatings = ref([
  {
    id: '3',
    score: 5,
    title: '优秀的学生',
    comment: '工作认真负责，学习能力强，能够快速适应工作环境。',
    tags: ['认真', '学习能力强', '适应快'],
    time: '2024-10-18',
    jobTitle: '前端开发实习生',
    from: {
      name: '张经理',
      type: 'company',
      avatar: ''
    }
  },
  {
    id: '4',
    score: 4,
    title: '表现良好',
    comment: '沟通能力不错，能够按时完成任务。',
    tags: ['沟通好', '守时'],
    time: '2024-09-10',
    jobTitle: '新媒体运营',
    from: {
      name: '李总监',
      type: 'company',
      avatar: ''
    }
  }
])

const pendingRatings = ref([
  {
    id: '5',
    jobTitle: '英语家教',
    completeTime: '2024-10-22',
    target: {
      name: '王同学',
      type: 'student',
      avatar: ''
    }
  },
  {
    id: '6',
    jobTitle: '餐厅服务员',
    completeTime: '2024-10-21',
    target: {
      name: '海底捞',
      type: 'company',
      avatar: ''
    }
  }
])

// 弹窗相关
const ratingDialogVisible = ref(false)
const replyDialogVisible = ref(false)
const ratingFormRef = ref()

const ratingForm = reactive({
  score: 0,
  title: '',
  comment: '',
  tags: [],
  anonymous: false
})

const replyForm = reactive({
  content: ''
})

const currentRating = ref<any>(null)
const dialogMode = ref('create') // 'create' | 'edit'

// 可用标签
const availableTags = [
  '专业', '友好', '耐心', '认真', '守时', '沟通好', '学习能力强',
  '成长', '挑战', '指导', '环境好', '待遇优', '灵活'
]

// 验证规则
const ratingRules = {
  score: [
    { required: true, message: '请选择评分', trigger: 'change' }
  ],
  title: [
    { required: true, message: '请输入评价标题', trigger: 'blur' },
    { min: 5, max: 50, message: '标题长度在 5 到 50 个字符', trigger: 'blur' }
  ],
  comment: [
    { required: true, message: '请输入评价内容', trigger: 'blur' },
    { min: 10, max: 500, message: '内容长度在 10 到 500 个字符', trigger: 'blur' }
  ]
}

// 计算属性
const ratingDialogTitle = computed(() => {
  return dialogMode.value === 'create' ? '创建评价' : '编辑评价'
})

// 方法
const handleTabChange = (tab: any) => {
  activeTab.value = tab.paneName
}

const createRating = (item: any) => {
  currentRating.value = item
  dialogMode.value = 'create'
  
  // 重置表单
  Object.assign(ratingForm, {
    score: 0,
    title: '',
    comment: '',
    tags: [],
    anonymous: false
  })
  
  ratingDialogVisible.value = true
}

const editRating = (rating: any) => {
  currentRating.value = rating
  dialogMode.value = 'edit'
  
  // 填充表单
  Object.assign(ratingForm, {
    score: rating.score,
    title: rating.title,
    comment: rating.comment,
    tags: [...rating.tags],
    anonymous: false
  })
  
  ratingDialogVisible.value = true
}

const deleteRating = async (rating: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这条评价吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const index = givenRatings.value.findIndex(r => r.id === rating.id)
    if (index > -1) {
      givenRatings.value.splice(index, 1)
      ElMessage.success('评价删除成功')
    }
  } catch {
    // 用户取消操作
  }
}

const replyToRating = (rating: any) => {
  currentRating.value = rating
  replyForm.content = ''
  replyDialogVisible.value = true
}

const reportRating = async (rating: any) => {
  try {
    await ElMessageBox.confirm('确定要举报这条评价吗？', '举报评价', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    ElMessage.success('举报已提交，我们会尽快处理')
  } catch {
    // 用户取消操作
  }
}

const submitRating = async () => {
  if (!ratingFormRef.value) return
  
  try {
    await ratingFormRef.value.validate()
    
    if (dialogMode.value === 'create') {
      // 创建新评价
      const newRating = {
        id: Date.now().toString(),
        score: ratingForm.score,
        title: ratingForm.title,
        comment: ratingForm.comment,
        tags: ratingForm.tags,
        time: new Date().toLocaleDateString('zh-CN'),
        jobTitle: currentRating.value.jobTitle,
        target: currentRating.value.target
      }
      
      givenRatings.value.unshift(newRating)
      
      // 从待评价列表中移除
      const pendingIndex = pendingRatings.value.findIndex(
        item => item.id === currentRating.value.id
      )
      if (pendingIndex > -1) {
        pendingRatings.value.splice(pendingIndex, 1)
      }
      
      ElMessage.success('评价提交成功')
    } else {
      // 更新评价
      const rating = givenRatings.value.find(r => r.id === currentRating.value.id)
      if (rating) {
        Object.assign(rating, {
          score: ratingForm.score,
          title: ratingForm.title,
          comment: ratingForm.comment,
          tags: ratingForm.tags
        })
        ElMessage.success('评价更新成功')
      }
    }
    
    ratingDialogVisible.value = false
  } catch (error) {
    ElMessage.error('请完善评价信息')
  }
}

const submitReply = () => {
  if (!replyForm.content.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }
  
  ElMessage.success('回复提交成功')
  replyDialogVisible.value = false
  replyForm.content = ''
}

onMounted(() => {
  // 初始化数据
})
</script>

<style scoped>
.ratings-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.ratings-header {
  text-align: center;
  margin-bottom: 40px;
}

.ratings-header h2 {
  color: #333;
  margin-bottom: 10px;
  font-size: 28px;
}

.ratings-header p {
  color: #666;
  font-size: 16px;
}

.stats-section {
  margin-bottom: 30px;
}

.stat-card {
  text-align: center;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-item {
  padding: 20px;
}

.stat-value {
  font-size: 36px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.tabs-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.ratings-list {
  padding: 20px;
}

.empty-state {
  padding: 60px 0;
}

.rating-card {
  margin-bottom: 16px;
  border: none;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.rating-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.rating-target {
  display: flex;
  align-items: center;
  gap: 12px;
}

.target-info {
  display: flex;
  flex-direction: column;
}

.target-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.rating-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.rating-time {
  color: #999;
  font-size: 12px;
}

.rating-content {
  margin-bottom: 16px;
}

.rating-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  font-size: 16px;
}

.rating-comment {
  color: #666;
  line-height: 1.6;
  margin-bottom: 12px;
}

.rating-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.rating-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.job-info {
  color: #999;
  font-size: 14px;
}

.rating-actions {
  display: flex;
  gap: 8px;
}

.pending-rating-card {
  margin-bottom: 16px;
  border: none;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.pending-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pending-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.pending-details {
  display: flex;
  flex-direction: column;
}

.pending-title {
  font-weight: 600;
  color: #333;
  font-size: 16px;
  margin-bottom: 4px;
}

.pending-target {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  margin-bottom: 4px;
}

.pending-time {
  color: #999;
  font-size: 14px;
}

.anonymous-tip {
  margin-left: 8px;
  color: #999;
  font-size: 12px;
}

@media (max-width: 768px) {
  .ratings-container {
    padding: 10px;
  }
  
  .rating-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .rating-meta {
    align-items: flex-start;
  }
  
  .rating-footer {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .pending-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
}
</style>