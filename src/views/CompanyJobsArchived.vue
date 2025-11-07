<template>
  <div class="company-layout">
    <CompanySidebar />
    
    <div class="company-main">
      <div class="company-header">
        <div class="header-left">
          <h1>已归档岗位</h1>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/company/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item :to="{ path: '/company/jobs' }">岗位管理</el-breadcrumb-item>
            <el-breadcrumb-item>已归档岗位</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
      </div>

      <div class="archived-container">
        <el-card>
          <template #header>
            <span>已归档岗位列表</span>
          </template>
          <div class="coming-soon">
            <el-icon><FolderDelete /></el-icon>
            <p>已归档岗位功能开发中...</p>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import CompanySidebar from '../components/CompanySidebar.vue'
import { FolderDelete } from '@element-plus/icons-vue'
</script>

<style scoped>
.archived-container {
  padding: 24px;
}

.coming-soon {
  text-align: center;
  padding: 60px 0;
  color: #909399;
}

.coming-soon .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.coming-soon p {
  font-size: 16px;
  margin: 0;
}
</style>