<template>
  <el-card>
    <template #header>
      <h3>求职偏好设置</h3>
    </template>
    
    <div class="preferences-content">
      <el-form :model="form" label-width="120px">
        <el-form-item label="期望薪资">
          <el-select v-model="form.expectedSalary" placeholder="选择期望薪资" style="width: 100%">
            <el-option label="100元/天以下" value="0-100" />
            <el-option label="100-200元/天" value="100-200" />
            <el-option label="200-300元/天" value="200-300" />
            <el-option label="300元/天以上" value="300+" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="工作地点">
          <el-select v-model="form.workLocation" placeholder="选择工作地点" style="width: 100%" multiple>
            <el-option label="北京" value="beijing" />
            <el-option label="上海" value="shanghai" />
            <el-option label="广州" value="guangzhou" />
            <el-option label="深圳" value="shenzhen" />
            <el-option label="杭州" value="hangzhou" />
            <el-option label="远程" value="remote" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="工作类型">
          <el-select v-model="form.jobType" placeholder="选择工作类型" style="width: 100%" multiple>
            <el-option label="长期兼职" value="long-term" />
            <el-option label="短期兼职" value="short-term" />
            <el-option label="实习" value="internship" />
            <el-option label="项目制" value="project" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="每周工作时间">
          <el-select v-model="form.workHours" placeholder="选择工作时间" style="width: 100%">
            <el-option label="1-2天/周" value="1-2" />
            <el-option label="3-4天/周" value="3-4" />
            <el-option label="5天/周" value="5" />
            <el-option label="灵活安排" value="flexible" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="期望行业">
          <el-select v-model="form.industry" placeholder="选择期望行业" style="width: 100%" multiple>
            <el-option label="互联网/IT" value="internet" />
            <el-option label="教育/培训" value="education" />
            <el-option label="金融/银行" value="finance" />
            <el-option label="医疗/健康" value="medical" />
            <el-option label="文化/传媒" value="media" />
            <el-option label="零售/服务" value="retail" />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="savePreferences">保存偏好设置</el-button>
        </el-form-item>
      </el-form>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const form = ref({
  expectedSalary: '100-200',
  workLocation: ['beijing', 'remote'],
  jobType: ['internship', 'short-term'],
  workHours: 'flexible',
  industry: ['internet', 'education']
})

const savePreferences = () => {
  ElMessage.success('求职偏好保存成功')
}
</script>

<style scoped>
.preferences-content {
  max-width: 600px;
}
</style>