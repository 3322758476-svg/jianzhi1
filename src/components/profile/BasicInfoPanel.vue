<template>
  <el-card>
    <template #header>
      <h3>基本信息</h3>
    </template>
    
    <div class="basic-info">
      <div class="avatar-section">
        <el-avatar :size="100" :src="form.avatar" />
        <div class="avatar-actions">
          <el-button type="primary" text>更换头像</el-button>
        </div>
      </div>
      
      <div class="info-form">
        <el-form :model="form" label-width="100px">
          <el-form-item label="用户名">
            <el-input v-model="form.username" />
          </el-form-item>
          
          <el-form-item label="邮箱">
            <el-input v-model="form.email" />
          </el-form-item>
          
          <el-form-item label="手机号">
            <el-input v-model="form.phone" />
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="saveInfo">保存修改</el-button>
            <el-button>取消</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store'

const userStore = useUserStore()
const form = ref({
  avatar: '',
  username: '',
  email: '',
  phone: ''
})

// 从用户存储加载数据
const loadUserInfo = () => {
  if (userStore.user) {
    form.value = {
      avatar: userStore.user.avatar || '',
      username: userStore.user.username || '',
      email: userStore.user.email || '',
      phone: userStore.user.phone || ''
    }
  }
}

const saveInfo = async () => {
  try {
    // 更新用户信息
    await userStore.updateProfile({
      avatar: form.value.avatar,
      username: form.value.username,
      email: form.value.email,
      phone: form.value.phone
    })
    
    ElMessage.success('基本信息保存成功')
  } catch (error) {
    ElMessage.error('保存失败，请重试')
  }
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
.basic-info {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 2rem;
}

.avatar-section {
  text-align: center;
}

.avatar-actions {
  margin-top: 1rem;
}

.info-form {
  max-width: 400px;
}
</style>