<template>
  <el-dialog
    v-model="visible"
    title="数据导出"
    width="600px"
    :before-close="handleClose"
  >
    <el-form :model="form" label-width="100px">
      <!-- 导出类型选择 -->
      <el-form-item label="导出类型">
        <el-radio-group v-model="form.exportType">
          <el-radio label="jobs">岗位数据</el-radio>
          <el-radio label="applications">申请数据</el-radio>
          <el-radio label="stats">统计数据</el-radio>
          <el-radio label="custom">自定义导出</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 导出格式选择 -->
      <el-form-item label="导出格式">
        <el-select v-model="form.format" placeholder="请选择导出格式">
          <el-option label="Excel (.xlsx)" value="excel" />
          <el-option label="CSV (.csv)" value="csv" />
          <el-option label="PDF (.pdf)" value="pdf" />
        </el-select>
      </el-form-item>

      <!-- 文件名设置 -->
      <el-form-item label="文件名">
        <el-input
          v-model="form.fileName"
          placeholder="请输入文件名（不含扩展名）"
        />
      </el-form-item>

      <!-- 包含表头 -->
      <el-form-item label="包含表头">
        <el-switch v-model="form.includeHeaders" />
      </el-form-item>

      <!-- 时间范围筛选 -->
      <el-form-item v-if="form.exportType !== 'stats'" label="时间范围">
        <el-date-picker
          v-model="form.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>

      <!-- 状态筛选 -->
      <el-form-item v-if="form.exportType === 'applications'" label="申请状态">
        <el-select v-model="form.statusFilter" multiple placeholder="请选择状态">
          <el-option label="待处理" value="pending" />
          <el-option label="审核中" value="reviewing" />
          <el-option label="已通过" value="accepted" />
          <el-option label="已拒绝" value="rejected" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
      </el-form-item>

      <!-- 岗位状态筛选 -->
      <el-form-item v-if="form.exportType === 'jobs'" label="岗位状态">
        <el-select v-model="form.jobStatusFilter" multiple placeholder="请选择状态">
          <el-option label="活跃" value="active" />
          <el-option label="已停用" value="inactive" />
          <el-option label="草稿" value="draft" />
          <el-option label="已过期" value="expired" />
        </el-select>
      </el-form-item>

      <!-- 预览区域 -->
      <el-form-item label="数据预览">
        <div class="preview-section">
          <div class="preview-info">
            <el-icon><InfoFilled /></el-icon>
            <span>预计导出 {{ estimatedCount }} 条记录</span>
          </div>
          
          <div class="preview-table">
            <el-table :data="previewData" height="200" border>
              <el-table-column
                v-for="column in previewColumns"
                :key="column.prop"
                :prop="column.prop"
                :label="column.label"
                :width="column.width"
              />
            </el-table>
          </div>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleExport" :loading="exporting">
        开始导出
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import { ExportService, type ExportOptions } from '../services/exportService'

const emit = defineEmits(['update:visible', 'export-complete'])

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

// 响应式数据
const exporting = ref(false)
const form = reactive({
  exportType: 'jobs',
  format: 'excel',
  fileName: '',
  includeHeaders: true,
  dateRange: [],
  statusFilter: [],
  jobStatusFilter: []
})

// 预览数据
const previewData = ref([])
const previewColumns = ref([])

// 计算属性
const estimatedCount = computed(() => {
  // 这里可以根据实际数据量进行估算
  const baseCounts = {
    jobs: 150,
    applications: 500,
    stats: 10
  }
  return baseCounts[form.exportType] || 0
})

// 方法
const handleClose = () => {
  emit('update:visible', false)
}

const handleExport = async () => {
  try {
    exporting.value = true
    
    const options: ExportOptions = {
      format: form.format as 'excel' | 'csv' | 'pdf',
      includeHeaders: form.includeHeaders,
      fileName: form.fileName || getDefaultFileName(),
      filters: {
        dateRange: form.dateRange,
        status: form.statusFilter,
        jobStatus: form.jobStatusFilter
      }
    }

    let result
    
    switch (form.exportType) {
      case 'jobs':
        result = await ExportService.exportJobs(options)
        break
      case 'applications':
        result = await ExportService.exportApplications(options)
        break
      case 'stats':
        result = await ExportService.exportCompanyStats(options)
        break
      default:
        throw new Error('不支持的导出类型')
    }

    if (result.success) {
      ExportService.downloadFile(result)
      emit('export-complete', result)
      handleClose()
    } else {
      ElMessage.error(result.message)
    }
    
  } catch (error: any) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败: ' + error.message)
  } finally {
    exporting.value = false
  }
}

const getDefaultFileName = (): string => {
  const typeNames = {
    jobs: '岗位数据',
    applications: '申请数据',
    stats: '平台统计'
  }
  
  const typeName = typeNames[form.exportType] || '数据'
  return `${typeName}_${new Date().toLocaleDateString('zh-CN')}`
}

// 监听导出类型变化，更新预览数据
watch(() => form.exportType, async (newType) => {
  await updatePreviewData(newType)
}, { immediate: true })

const updatePreviewData = async (type: string) => {
  // 模拟预览数据
  const previewConfigs = {
    jobs: {
      columns: [
        { prop: '岗位标题', label: '岗位标题', width: 200 },
        { prop: '公司名称', label: '公司名称', width: 150 },
        { prop: '薪资范围', label: '薪资范围', width: 120 },
        { prop: '岗位状态', label: '状态', width: 80 }
      ],
      data: [
        { '岗位标题': '前端开发实习生', '公司名称': '示例公司', '薪资范围': '200-300元/天', '岗位状态': '活跃' },
        { '岗位标题': '市场推广专员', '公司名称': '测试企业', '薪资范围': '150-250元/天', '岗位状态': '活跃' }
      ]
    },
    applications: {
      columns: [
        { prop: '学生姓名', label: '学生姓名', width: 100 },
        { prop: '岗位名称', label: '岗位名称', width: 150 },
        { prop: '申请时间', label: '申请时间', width: 120 },
        { prop: '申请状态', label: '状态', width: 80 }
      ],
      data: [
        { '学生姓名': '张三', '岗位名称': '前端开发实习生', '申请时间': '2024-01-15', '申请状态': '待处理' },
        { '学生姓名': '李四', '岗位名称': '市场推广专员', '申请时间': '2024-01-14', '申请状态': '已通过' }
      ]
    },
    stats: {
      columns: [
        { prop: '统计项目', label: '统计项目', width: 120 },
        { prop: '数值', label: '数值', width: 100 }
      ],
      data: [
        { '统计项目': '总岗位数', '数值': '150' },
        { '统计项目': '活跃岗位数', '数值': '120' }
      ]
    }
  }

  const config = previewConfigs[type] || previewConfigs.jobs
  previewColumns.value = config.columns
  previewData.value = config.data
}

// 监听 visible 变化
watch(() => props.visible, (newVal) => {
  if (newVal) {
    // 对话框打开时重置表单
    Object.assign(form, {
      exportType: 'jobs',
      format: 'excel',
      fileName: '',
      includeHeaders: true,
      dateRange: [],
      statusFilter: [],
      jobStatusFilter: []
    })
  }
})
</script>

<style scoped>
.preview-section {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px;
}

.preview-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #606266;
  font-size: 14px;
}

.preview-table {
  max-height: 200px;
  overflow: auto;
}

:deep(.el-table) {
  font-size: 12px;
}

:deep(.el-table .cell) {
  padding: 4px 8px;
}
</style>