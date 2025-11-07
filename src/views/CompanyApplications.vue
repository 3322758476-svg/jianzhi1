<template>
  <div class="company-layout">
    <CompanySidebar />
    
    <div class="company-main">
      <div class="company-header">
        <div class="header-left">
          <h1>申请管理</h1>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/company/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>申请管理</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-actions">
          <el-button @click="exportApplications">
            <el-icon><Download /></el-icon>
            导出数据
          </el-button>
        </div>
      </div>

      <div class="applications-container">
        <CompanyApplicationsList />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import CompanySidebar from '../components/CompanySidebar.vue'
import CompanyApplicationsList from '../components/CompanyApplicationsList.vue'
import { companyDataService } from '../services/companyDataService'

const exportApplications = async () => {
  try {
    const csvData = await companyDataService.exportApplicationsToCSV()
    
    // 创建下载链接
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `申请记录_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请重试')
  }
}
</script>

<style scoped>
.company-layout {
  display: flex;
  min-height: 100vh;
  background-color: #ffffff;
}

.company-sidebar {
  width: 240px;
  flex-shrink: 0;
  background-color: #ffffff;
  border-right: 1px solid #ebeef5;
}

.company-main {
  flex: 1;
  padding: 20px 24px;
  background-color: #ffffff;
}

.applications-container {
  padding: 16px 0;
}

.company-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.header-left h1 {
  margin: 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

@media (max-width: 1024px) {
  .company-main {
    padding: 12px;
  }
  
  .company-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>