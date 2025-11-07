<template>
  <div class="company-layout">
    <CompanySidebar />
    
    <div class="company-main">
      <div class="company-header">
        <div class="header-left">
          <h1>数据统计</h1>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/company/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>数据统计</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
      </div>

      <div class="analytics-container">
        <el-card>
          <template #header>
            <span>数据概览</span>
          </template>
          <div class="coming-soon">
            <el-icon><DataAnalysis /></el-icon>
            <p>数据统计功能开发中...</p>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import CompanySidebar from '../components/CompanySidebar.vue'
import { DataAnalysis } from '@element-plus/icons-vue'
</script>

<style scoped>
@import '@/assets/styles/common.css';
.analytics-container {
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