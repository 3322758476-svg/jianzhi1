<template>
  <div class="profile-page">
    <div class="profile-header">
      <h2>个人中心</h2>
      <el-tabs v-model="activeTab" type="card">
        <el-tab-pane label="基本信息" name="basic">
          <BasicInfoPanel />
        </el-tab-pane>
        <el-tab-pane label="简历管理" name="resume">
          <ResumePanel />
        </el-tab-pane>
        <el-tab-pane label="技能标签" name="skills">
          <SkillsPanel />
        </el-tab-pane>
        <el-tab-pane label="求职偏好" name="preferences">
          <PreferencesPanel />
        </el-tab-pane>
        <el-tab-pane label="隐私设置" name="privacy">
          <PrivacyPanel />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BasicInfoPanel from '@/components/profile/BasicInfoPanel.vue'
import ResumePanel from '@/components/profile/ResumePanel.vue'
import SkillsPanel from '@/components/profile/SkillsPanel.vue'
import PreferencesPanel from '@/components/profile/PreferencesPanel.vue'
import PrivacyPanel from '@/components/profile/PrivacyPanel.vue'

const activeTab = ref('basic')
</script>

<style scoped>
.profile-page {
  padding: 20px;
  min-height: calc(100vh - 100px);
}

.profile-header {
  margin-bottom: 20px;
}

.profile-header h2 {
  margin: 0 0 20px 0;
  color: #303133;
  font-size: 24px;
}
</style>