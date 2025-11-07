<template>
  <div class="company-layout">
    <CompanySidebar />
    
    <div class="company-main">
      <div class="company-header">
        <div class="header-left">
          <h1>权限管理</h1>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/company/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item :to="{ path: '/company/settings' }">企业设置</el-breadcrumb-item>
            <el-breadcrumb-item>权限管理</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="savePermissions">
            <el-icon><Check /></el-icon>
            保存权限设置
          </el-button>
        </div>
      </div>

      <div class="permissions-container">
        <el-card>
          <template #header>
            <span>角色权限配置</span>
          </template>
          
          <el-tabs v-model="activeRole" type="border-card">
            <el-tab-pane label="管理员" name="admin">
              <div class="permission-section">
                <h4>岗位管理权限</h4>
                <el-checkbox-group v-model="adminPermissions.job">
                  <el-checkbox label="job:view">查看岗位</el-checkbox>
                  <el-checkbox label="job:create">创建岗位</el-checkbox>
                  <el-checkbox label="job:edit">编辑岗位</el-checkbox>
                  <el-checkbox label="job:delete">删除岗位</el-checkbox>
                  <el-checkbox label="job:publish">发布岗位</el-checkbox>
                </el-checkbox-group>
              </div>
              
              <div class="permission-section">
                <h4>申请管理权限</h4>
                <el-checkbox-group v-model="adminPermissions.application">
                  <el-checkbox label="application:view">查看申请</el-checkbox>
                  <el-checkbox label="application:review">审核申请</el-checkbox>
                  <el-checkbox label="application:approve">批准申请</el-checkbox>
                  <el-checkbox label="application:reject">拒绝申请</el-checkbox>
                </el-checkbox-group>
              </div>
              
              <div class="permission-section">
                <h4>数据统计权限</h4>
                <el-checkbox-group v-model="adminPermissions.analytics">
                  <el-checkbox label="analytics:view">查看统计</el-checkbox>
                  <el-checkbox label="analytics:export">导出数据</el-checkbox>
                </el-checkbox-group>
              </div>
              
              <div class="permission-section">
                <h4>系统设置权限</h4>
                <el-checkbox-group v-model="adminPermissions.settings">
                  <el-checkbox label="settings:view">查看设置</el-checkbox>
                  <el-checkbox label="settings:edit">编辑设置</el-checkbox>
                  <el-checkbox label="settings:members">管理成员</el-checkbox>
                  <el-checkbox label="settings:permissions">管理权限</el-checkbox>
                </el-checkbox-group>
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="普通成员" name="member">
              <div class="permission-section">
                <h4>岗位管理权限</h4>
                <el-checkbox-group v-model="memberPermissions.job">
                  <el-checkbox label="job:view">查看岗位</el-checkbox>
                  <el-checkbox label="job:create">创建岗位</el-checkbox>
                  <el-checkbox label="job:edit">编辑岗位</el-checkbox>
                </el-checkbox-group>
              </div>
              
              <div class="permission-section">
                <h4>申请管理权限</h4>
                <el-checkbox-group v-model="memberPermissions.application">
                  <el-checkbox label="application:view">查看申请</el-checkbox>
                  <el-checkbox label="application:review">审核申请</el-checkbox>
                </el-checkbox-group>
              </div>
              
              <div class="permission-section">
                <h4>数据统计权限</h4>
                <el-checkbox-group v-model="memberPermissions.analytics">
                  <el-checkbox label="analytics:view">查看统计</el-checkbox>
                </el-checkbox-group>
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="观察者" name="viewer">
              <div class="permission-section">
                <h4>岗位管理权限</h4>
                <el-checkbox-group v-model="viewerPermissions.job">
                  <el-checkbox label="job:view">查看岗位</el-checkbox>
                </el-checkbox-group>
              </div>
              
              <div class="permission-section">
                <h4>申请管理权限</h4>
                <el-checkbox-group v-model="viewerPermissions.application">
                  <el-checkbox label="application:view">查看申请</el-checkbox>
                </el-checkbox-group>
              </div>
              
              <div class="permission-section">
                <h4>数据统计权限</h4>
                <el-checkbox-group v-model="viewerPermissions.analytics">
                  <el-checkbox label="analytics:view">查看统计</el-checkbox>
                </el-checkbox-group>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import CompanySidebar from '../components/CompanySidebar.vue'
import { Check } from '@element-plus/icons-vue'

interface Permissions {
  job: string[]
  application: string[]
  analytics: string[]
  settings: string[]
}

const activeRole = ref('admin')

const adminPermissions = reactive<Permissions>({
  job: ['job:view', 'job:create', 'job:edit', 'job:delete', 'job:publish'],
  application: ['application:view', 'application:review', 'application:approve', 'application:reject'],
  analytics: ['analytics:view', 'analytics:export'],
  settings: ['settings:view', 'settings:edit', 'settings:members', 'settings:permissions']
})

const memberPermissions = reactive<Permissions>({
  job: ['job:view', 'job:create', 'job:edit'],
  application: ['application:view', 'application:review'],
  analytics: ['analytics:view'],
  settings: []
})

const viewerPermissions = reactive<Permissions>({
  job: ['job:view'],
  application: ['application:view'],
  analytics: ['analytics:view'],
  settings: []
})

const loadPermissions = async () => {
  try {
    // 模拟加载权限配置
    console.log('加载权限配置')
  } catch (error) {
    console.error('加载权限配置失败:', error)
  }
}

const savePermissions = async () => {
  try {
    console.log('保存权限配置:', {
      admin: adminPermissions,
      member: memberPermissions,
      viewer: viewerPermissions
    })
    // 这里应该调用API保存权限配置
  } catch (error) {
    console.error('保存权限配置失败:', error)
  }
}

onMounted(() => {
  loadPermissions()
})
</script>

<style scoped>
.permissions-container {
  padding: 24px;
}

.permission-section {
  margin-bottom: 24px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.permission-section h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-weight: 500;
}

.el-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.el-checkbox {
  margin-right: 16px;
}
</style>