<template>
  <div class="performance-test">
    <div class="page-header">
      <h1>性能测试页面</h1>
      <div class="header-actions">
        <el-button @click="runPerformanceTest" type="primary">
          运行性能测试
        </el-button>
        <el-button @click="clearResults">
          清除结果
        </el-button>
      </div>
    </div>

    <!-- 性能指标 -->
    <div class="metrics-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon fps">
                <el-icon><VideoPlay /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ metrics.fps }} FPS</div>
                <div class="metric-label">帧率</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon memory">
                <el-icon><Cpu /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ metrics.memoryUsage }} MB</div>
                <div class="metric-label">内存使用</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon load">
                <el-icon><Timer /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ metrics.loadTime }} ms</div>
                <div class="metric-label">加载时间</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon render">
                <el-icon><MagicStick /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ metrics.renderTime }} ms</div>
                <div class="metric-label">渲染时间</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 测试结果 -->
    <div class="results-section">
      <el-card>
        <template #header>
          <h3>性能测试结果</h3>
        </template>

        <el-table :data="testResults" v-loading="testing">
          <el-table-column prop="name" label="测试项目" width="200" />
          <el-table-column prop="duration" label="耗时(ms)" width="120">
            <template #default="{ row }">
              <el-tag :type="getDurationType(row.duration)">
                {{ row.duration }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'success' ? 'success' : 'danger'">
                {{ row.status === 'success' ? '通过' : '失败' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="message" label="详细信息" />
        </el-table>
      </el-card>
    </div>

    <!-- 大数据量测试 -->
    <div class="stress-test-section">
      <el-card>
        <template #header>
          <h3>大数据量压力测试</h3>
        </template>

        <div class="stress-test-controls">
          <el-form :model="stressForm" label-width="120px">
            <el-form-item label="数据量">
              <el-input-number 
                v-model="stressForm.dataSize" 
                :min="100" 
                :max="100000" 
                :step="100" 
              />
              <span class="form-tip">条记录</span>
            </el-form-item>
            
            <el-form-item label="测试类型">
              <el-radio-group v-model="stressForm.testType">
                <el-radio label="render">渲染性能</el-radio>
                <el-radio label="filter">筛选性能</el-radio>
                <el-radio label="sort">排序性能</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item>
              <el-button 
                type="primary" 
                @click="runStressTest"
                :loading="stressTesting"
              >
                开始压力测试
              </el-button>
              <el-button @click="clearStressResults">
                清除结果
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="stress-results">
          <el-alert
            v-if="stressResult"
            :title="stressResult.title"
            :type="stressResult.type"
            :description="stressResult.description"
            show-icon
          />
        </div>
      </el-card>
    </div>

    <!-- 优化建议 -->
    <div class="recommendations-section">
      <el-card>
        <template #header>
          <h3>性能优化建议</h3>
        </template>

        <div class="recommendations-list">
          <el-alert
            v-for="(recommendation, index) in recommendations"
            :key="index"
            :title="recommendation.title"
            :type="recommendation.type"
            :description="recommendation.description"
            :closable="false"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { VideoPlay, Cpu, Timer, MagicStick } from '@element-plus/icons-vue'
import { 
  usePerformanceMonitor, 
  useMemoryMonitor,
  useVirtualScroll,
  usePagination 
} from '../utils/performance-optimizer'

// 性能监控
const { metrics: performanceMetrics } = usePerformanceMonitor()
const { memoryUsage } = useMemoryMonitor()

// 响应式数据
const testing = ref(false)
const stressTesting = ref(false)
const metrics = reactive({
  fps: 0,
  memoryUsage: 0,
  loadTime: 0,
  renderTime: 0
})

const testResults = ref<Array<{
  name: string
  duration: number
  status: 'success' | 'error'
  message: string
}>>([])

const stressForm = reactive({
  dataSize: 1000,
  testType: 'render'
})

const stressResult = ref<{
  title: string
  type: 'success' | 'warning' | 'error'
  description: string
} | null>(null)

// 优化建议
const recommendations = ref([
  {
    title: '虚拟滚动',
    type: 'success',
    description: '对于大数据量列表，建议使用虚拟滚动技术减少DOM节点数量'
  },
  {
    title: '数据分页',
    type: 'info',
    description: '超过1000条数据时建议使用分页加载，避免一次性加载过多数据'
  },
  {
    title: '防抖节流',
    type: 'warning',
    description: '频繁触发的事件（如搜索、滚动）应该使用防抖或节流优化'
  },
  {
    title: '图片懒加载',
    type: 'info',
    description: '大量图片时使用懒加载技术，提升页面加载速度'
  }
])

// 方法
const runPerformanceTest = async () => {
  testing.value = true
  testResults.value = []
  
  try {
    // 模拟各种性能测试
    const tests = [
      { name: 'DOM 渲染测试', func: testDOMRendering },
      { name: '数据筛选测试', func: testDataFiltering },
      { name: '排序性能测试', func: testSortingPerformance },
      { name: '内存使用测试', func: testMemoryUsage },
      { name: '网络请求测试', func: testNetworkRequests }
    ]
    
    for (const test of tests) {
      const startTime = performance.now()
      
      try {
        await test.func()
        const duration = performance.now() - startTime
        
        testResults.value.push({
          name: test.name,
          duration: Math.round(duration),
          status: 'success',
          message: `测试完成，耗时 ${Math.round(duration)}ms`
        })
      } catch (error) {
        testResults.value.push({
          name: test.name,
          duration: 0,
          status: 'error',
          message: `测试失败: ${error}`
        })
      }
    }
    
    ElMessage.success('性能测试完成')
  } catch (error) {
    ElMessage.error('性能测试失败')
  } finally {
    testing.value = false
  }
}

const runStressTest = async () => {
  stressTesting.value = true
  
  try {
    const startTime = performance.now()
    
    // 生成测试数据
    const testData = generateTestData(stressForm.dataSize)
    
    let resultMessage = ''
    
    switch (stressForm.testType) {
      case 'render':
        await testRenderingPerformance(testData)
        resultMessage = `渲染 ${stressForm.dataSize} 条数据`
        break
      case 'filter':
        await testFilteringPerformance(testData)
        resultMessage = `筛选 ${stressForm.dataSize} 条数据`
        break
      case 'sort':
        await testSortingPerformance(testData)
        resultMessage = `排序 ${stressForm.dataSize} 条数据`
        break
    }
    
    const duration = performance.now() - startTime
    
    stressResult.value = {
      title: '压力测试完成',
      type: duration > 1000 ? 'warning' : 'success',
      description: `${resultMessage}，耗时 ${Math.round(duration)}ms`
    }
    
  } catch (error) {
    stressResult.value = {
      title: '压力测试失败',
      type: 'error',
      description: `测试过程中出现错误: ${error}`
    }
  } finally {
    stressTesting.value = false
  }
}

const clearResults = () => {
  testResults.value = []
}

const clearStressResults = () => {
  stressResult.value = null
}

const getDurationType = (duration: number) => {
  if (duration < 100) return 'success'
  if (duration < 500) return 'warning'
  return 'danger'
}

// 测试函数
const testDOMRendering = async () => {
  // 模拟 DOM 渲染测试
  await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100))
}

const testDataFiltering = async () => {
  // 模拟数据筛选测试
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
}

const testSortingPerformance = async (data?: any[]) => {
  // 模拟排序性能测试
  if (data) {
    // 大数据量排序测试
    const sorted = [...data].sort(() => Math.random() - 0.5)
    return sorted
  }
  await new Promise(resolve => setTimeout(resolve, 80 + Math.random() * 150))
}

const testMemoryUsage = async () => {
  // 模拟内存使用测试
  const largeArray = new Array(10000).fill(null).map((_, i) => ({
    id: i,
    name: `Item ${i}`,
    value: Math.random()
  }))
  
  await new Promise(resolve => setTimeout(resolve, 200))
  
  // 清理内存
  largeArray.length = 0
}

const testNetworkRequests = async () => {
  // 模拟网络请求测试
  await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 250))
}

const testRenderingPerformance = async (data: any[]) => {
  // 模拟渲染性能测试
  await new Promise(resolve => {
    const chunkSize = 100
    let processed = 0
    
    const processChunk = () => {
      const chunk = data.slice(processed, processed + chunkSize)
      processed += chunkSize
      
      if (processed < data.length) {
        setTimeout(processChunk, 0)
      } else {
        resolve(null)
      }
    }
    
    processChunk()
  })
}

const testFilteringPerformance = async (data: any[]) => {
  // 模拟筛选性能测试
  const filtered = data.filter(item => item.value > 0.5)
  return filtered
}

const generateTestData = (size: number) => {
  return new Array(size).fill(null).map((_, i) => ({
    id: i,
    name: `测试项目 ${i}`,
    value: Math.random(),
    category: `分类 ${i % 10}`,
    timestamp: Date.now() - Math.random() * 1000000000
  }))
}

// 更新性能指标
const updateMetrics = () => {
  metrics.fps = performanceMetrics.fps
  metrics.memoryUsage = memoryUsage.value.used
  metrics.loadTime = performanceMetrics.loadTime
  metrics.renderTime = performanceMetrics.renderTime
}

// 定时更新指标
onMounted(() => {
  setInterval(updateMetrics, 1000)
  updateMetrics()
})
</script>

<style scoped>
.performance-test {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.metrics-section {
  margin-bottom: 24px;
}

.metric-card {
  .metric-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .metric-icon {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: white;
    
    &.fps { background: #67c23a; }
    &.memory { background: #409eff; }
    &.load { background: #e6a23c; }
    &.render { background: #f56c6c; }
  }
  
  .metric-value {
    font-size: 20px;
    font-weight: 600;
    color: #303133;
  }
  
  .metric-label {
    font-size: 14px;
    color: #909399;
  }
}

.results-section,
.stress-test-section,
.recommendations-section {
  margin-bottom: 24px;
}

.stress-test-controls {
  margin-bottom: 20px;
}

.form-tip {
  margin-left: 8px;
  color: #909399;
  font-size: 14px;
}

.stress-results {
  margin-top: 20px;
}

.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

:deep(.el-alert) {
  margin-bottom: 0;
}
</style>