<template>
  <el-card>
    <template #header>
      <h3>技能标签设置</h3>
    </template>
    
    <div class="skills-content">
      <div class="skills-section">
        <h4>我的技能标签</h4>
        <div class="skills-tags">
          <el-tag 
            v-for="skill in skills" 
            :key="skill"
            closable
            @close="removeSkill(skill)"
            type="primary"
            class="skill-tag"
          >
            {{ skill }}
          </el-tag>
          <div v-if="skills.length === 0" class="empty-skills">
            暂无技能标签
          </div>
        </div>
      </div>
      
      <div class="add-skill-section">
        <h4>添加技能标签</h4>
        <div class="add-skill-form">
          <el-input 
            v-model="newSkill" 
            placeholder="输入技能名称" 
            style="width: 200px; margin-right: 10px;"
          />
          <el-button type="primary" @click="addSkill">添加</el-button>
        </div>
        
        <div class="common-skills">
          <h5>常用技能标签</h5>
          <div class="common-tags">
            <el-tag 
              v-for="skill in commonSkills" 
              :key="skill"
              @click="addCommonSkill(skill)"
              type="info"
              class="common-tag"
            >
              {{ skill }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store'

const userStore = useUserStore()
const skills = ref<string[]>([])
const newSkill = ref('')

const commonSkills = [
  'JavaScript', 'Vue.js', 'React', 'TypeScript', 'HTML/CSS',
  'Node.js', 'Python', 'Java', 'Spring Boot', 'MySQL',
  'MongoDB', 'Git', 'Docker', 'Linux', 'UI设计',
  '产品经理', '运营', '市场推广', '数据分析', '英语'
]

const addSkill = () => {
  if (!newSkill.value.trim()) {
    ElMessage.warning('请输入技能名称')
    return
  }
  
  if (skills.value.includes(newSkill.value.trim())) {
    ElMessage.warning('该技能已存在')
    return
  }
  
  skills.value.push(newSkill.value.trim())
  newSkill.value = ''
  ElMessage.success('技能添加成功')
  saveSkills()
}

const addCommonSkill = (skill: string) => {
  if (skills.value.includes(skill)) {
    ElMessage.warning('该技能已存在')
    return
  }
  
  skills.value.push(skill)
  ElMessage.success('技能添加成功')
  saveSkills()
}

const removeSkill = (skill: string) => {
  const index = skills.value.indexOf(skill)
  if (index > -1) {
    skills.value.splice(index, 1)
    ElMessage.success('技能删除成功')
    saveSkills()
  }
}

// 从用户存储加载技能数据
const loadSkills = () => {
  if (userStore.user && (userStore.user as any).skills) {
    skills.value = [...(userStore.user as any).skills]
  }
}

// 保存技能到用户存储
const saveSkills = async () => {
  try {
    await userStore.updateProfile({
      skills: skills.value
    })
    ElMessage.success('技能保存成功')
  } catch (error) {
    ElMessage.error('保存失败，请重试')
  }
}

// 生命周期
onMounted(() => {
  loadSkills()
})
</script>

<style scoped>
.skills-content {
  display: grid;
  gap: 2rem;
}

.skills-section h4,
.add-skill-section h4 {
  margin-bottom: 1rem;
  color: #303133;
}

.skills-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  min-height: 40px;
}

.skill-tag {
  margin-bottom: 0.5rem;
}

.empty-skills {
  color: #909399;
  font-style: italic;
}

.add-skill-form {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.common-skills h5 {
  margin-bottom: 0.5rem;
  color: #606266;
}

.common-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.common-tag {
  cursor: pointer;
  margin-bottom: 0.5rem;
}

.common-tag:hover {
  opacity: 0.8;
}
</style>