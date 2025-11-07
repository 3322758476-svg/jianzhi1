<template>
  <el-card>
    <template #header>
      <h3>隐私设置</h3>
    </template>
    
    <div class="privacy-content">
      <el-form :model="form" label-width="150px">
        <el-form-item label="个人信息可见性">
          <el-radio-group v-model="form.profileVisibility">
            <el-radio label="public">公开</el-radio>
            <el-radio label="friends">仅好友可见</el-radio>
            <el-radio label="private">仅自己可见</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="联系方式保护">
          <el-switch v-model="form.contactProtection" />
          <span class="switch-label">隐藏联系方式，仅通过平台消息联系</span>
        </el-form-item>
        
        <el-form-item label="简历可见性">
          <el-radio-group v-model="form.resumeVisibility">
            <el-radio label="public">对所有企业可见</el-radio>
            <el-radio label="selected">仅投递的企业可见</el-radio>
            <el-radio label="private">不对外公开</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="申请记录可见性">
          <el-switch v-model="form.applicationHistoryVisible" />
          <span class="switch-label">允许企业查看我的申请记录</span>
        </el-form-item>
        
        <el-form-item label="消息通知">
          <el-checkbox-group v-model="form.notifications">
            <el-checkbox label="email">邮件通知</el-checkbox>
            <el-checkbox label="sms">短信通知</el-checkbox>
            <el-checkbox label="push">推送通知</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="savePrivacySettings">保存设置</el-button>
        </el-form-item>
      </el-form>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const form = ref({
  profileVisibility: 'friends',
  contactProtection: true,
  resumeVisibility: 'selected',
  applicationHistoryVisible: false,
  notifications: ['email', 'push']
})

const savePrivacySettings = () => {
  ElMessage.success('隐私设置保存成功')
}
</script>

<style scoped>
.privacy-content {
  max-width: 700px;
}

.switch-label {
  margin-left: 10px;
  color: #606266;
}

.el-checkbox-group {
  display: flex;
  gap: 20px;
}
</style>