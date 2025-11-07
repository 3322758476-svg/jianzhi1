<template>
  <div class="company-layout">
    <CompanySidebar />
    
    <div class="company-main">
      <div class="company-header">
        <div class="header-left">
          <h1>审核中申请</h1>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/company/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item :to="{ path: '/company/applications' }">申请管理</el-breadcrumb-item>
            <el-breadcrumb-item>审核中申请</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
      </div>

      <div class="reviewing-container">
        <CompanyApplicationsList :status-filter="'reviewing'" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import CompanySidebar from '../components/CompanySidebar.vue'
import CompanyApplicationsList from '../components/CompanyApplicationsList.vue'
</script>

<style scoped>
@import '@/assets/styles/common.css';

.company-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.company-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.company-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-left h1 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.reviewing-container {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
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