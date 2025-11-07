<template>
  <div v-if="showMonitor" class="performance-monitor">
    <div class="monitor-card">
      <h4>性能监控</h4>
      <div class="metrics">
        <div class="metric">
          <span class="label">页面加载:</span>
          <span class="value" :class="{ good: loadTime < 1000, warning: loadTime >= 1000 && loadTime < 3000, danger: loadTime >= 3000 }">
            {{ loadTime }}ms
          </span>
        </div>
        <div class="metric">
          <span class="label">内存使用:</span>
          <span class="value" :class="{ good: memoryUsage < 50, warning: memoryUsage >= 50 && memoryUsage < 80, danger: memoryUsage >= 80 }">
            {{ memoryUsage }}MB
          </span>
        </div>
        <div class="metric">
          <span class="label">FPS:</span>
          <span class="value" :class="{ good: fps > 50, warning: fps >= 30 && fps <= 50, danger: fps < 30 }">
            {{ fps }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const showMonitor = ref(false)
const loadTime = ref(0)
const memoryUsage = ref(0)
const fps = ref(0)

// 只在开发环境显示性能监控
if (import.meta.env.DEV) {
  showMonitor.value = true
}

// 计算页面加载时间
const calculateLoadTime = () => {
  if (performance.timing.loadEventEnd > 0) {
    loadTime.value = performance.timing.loadEventEnd - performance.timing.navigationStart
  }
}

// 监控内存使用（如果浏览器支持）
const monitorMemory = () => {
  if ('memory' in performance) {
    // @ts-ignore
    memoryUsage.value = Math.round(performance.memory.usedJSHeapSize / 1048576)
  }
}

// 监控FPS
let frameCount = 0
let lastTime = performance.now()
let frameId: number

const calculateFPS = () => {
  const currentTime = performance.now()
  frameCount++
  
  if (currentTime > lastTime + 1000) {
    fps.value = Math.round((frameCount * 1000) / (currentTime - lastTime))
    frameCount = 0
    lastTime = currentTime
  }
  
  frameId = requestAnimationFrame(calculateFPS)
}

onMounted(() => {
  if (showMonitor.value) {
    calculateLoadTime()
    monitorMemory()
    calculateFPS()
    
    // 定期更新内存使用情况
    setInterval(monitorMemory, 5000)
  }
})

onUnmounted(() => {
  if (frameId) {
    cancelAnimationFrame(frameId)
  }
})
</script>

<style scoped>
.performance-monitor {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
}

.monitor-card {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 15px;
  border-radius: 8px;
  font-size: 12px;
  min-width: 200px;
}

.monitor-card h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
}

.metrics {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  opacity: 0.8;
}

.value {
  font-weight: bold;
}

.value.good {
  color: #67c23a;
}

.value.warning {
  color: #e6a23c;
}

.value.danger {
  color: #f56c6c;
}

@media (max-width: 768px) {
  .performance-monitor {
    top: 10px;
    right: 10px;
  }
  
  .monitor-card {
    padding: 10px;
    min-width: 150px;
  }
}
</style>