<template>
  <el-card>
    <template #header>
      <div class="resume-header">
        <h3>简历管理</h3>
        <el-button type="primary" @click="editResume">
          编辑简历
        </el-button>
      </div>
    </template>
    
    <div class="resume-preview" v-if="resume">
      <div class="resume-section">
        <h4>基本信息</h4>
        <div class="resume-info">
          <div class="info-item">
            <span class="label">姓名：</span>
            <span class="value">{{ resume.name || '未填写' }}</span>
          </div>
          <div class="info-item">
            <span class="label">专业：</span>
            <span class="value">{{ resume.major || '未填写' }}</span>
          </div>
          <div class="info-item">
            <span class="label">联系电话：</span>
            <span class="value">{{ resume.phone || '未填写' }}</span>
          </div>
        </div>
      </div>
      
      <div class="resume-section">
        <h4>教育背景</h4>
        <div class="education-list">
          <div v-for="edu in resume.education" :key="edu.id" class="education-item">
            <div class="edu-school">{{ edu.school }}</div>
            <div class="edu-major">{{ edu.major }} · {{ edu.degree }}</div>
            <div class="edu-time">{{ edu.startTime }} - {{ edu.endTime }}</div>
          </div>
        </div>
      </div>
      
      <div class="resume-section">
        <h4>工作/项目经验</h4>
        <div class="experience-list">
          <div v-for="exp in resume.experience" :key="exp.id" class="experience-item">
            <div class="exp-title">{{ exp.title }}</div>
            <div class="exp-company">{{ exp.company }}</div>
            <div class="exp-time">{{ exp.startTime }} - {{ exp.endTime }}</div>
            <div class="exp-desc">{{ exp.description }}</div>
          </div>
        </div>
      </div>
      
      <div class="resume-section">
        <h4>技能标签</h4>
        <div class="skills-tags">
          <el-tag 
            v-for="skill in resume.skills" 
            :key="skill"
            type="info"
            class="skill-tag"
          >
            {{ skill }}
          </el-tag>
        </div>
      </div>
    </div>
    
    <div v-else class="empty-resume">
      <el-empty description="暂无简历信息">
        <el-button type="primary" @click="createResume">创建简历</el-button>
      </el-empty>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store'

const userStore = useUserStore()
const resume = ref({
  name: '',
  major: '',
  phone: '',
  education: [],
  experience: [],
  skills: []
})

// 从用户存储加载简历数据
const loadResumeData = () => {
  if (userStore.user) {
    resume.value = {
      name: (userStore.user as any).realName || userStore.user.username || '',
      major: userStore.user.major || '',
      phone: userStore.user.phone || '',
      education: (userStore.user as any).education || [],
      experience: (userStore.user as any).experience || [],
      skills: (userStore.user as any).skills || []
    }
  }
}

const editResume = () => {
  // 跳转到简历编辑页面
  window.open('/profile/resume', '_self')
}

const createResume = () => {
  // 跳转到简历编辑页面
  window.open('/profile/resume', '_self')
}

// 生命周期
onMounted(() => {
  loadResumeData()
})
</script>

<style scoped>
.resume-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.resume-section {
  margin-bottom: 2rem;
}

.resume-section h4 {
  color: #333;
  margin-bottom: 1rem;
  border-left: 4px solid #409EFF;
  padding-left: 1rem;
}

.resume-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  gap: 0.5rem;
}

.label {
  color: #666;
  min-width: 80px;
}

.value {
  color: #333;
  font-weight: 500;
}

.education-item,
.experience-item {
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.edu-school,
.exp-title {
  font-weight: 500;
  color: #333;
}

.edu-major,
.exp-company {
  color: #666;
  font-size: 0.9rem;
}

.edu-time,
.exp-time {
  color: #999;
  font-size: 0.8rem;
}

.exp-desc {
  color: #666;
  margin-top: 0.5rem;
  line-height: 1.4;
}

.skills-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.skill-tag {
  margin-bottom: 0.5rem;
}

.empty-resume {
  text-align: center;
  padding: 3rem 0;
}
</style>