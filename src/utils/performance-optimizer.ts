/**
 * 性能优化工具
 * 提供大数据量下的性能优化方案
 */

import { ref, reactive, watch, onUnmounted, computed } from 'vue'

interface PerformanceConfig {
  debounceDelay?: number
  throttleDelay?: number
  virtualScrollThreshold?: number
  lazyLoadThreshold?: number
  cacheSize?: number
}

interface CacheItem {
  data: any
  timestamp: number
  expireTime: number
}

export class PerformanceOptimizer {
  private static cache = new Map<string, CacheItem>()
  private static cacheSize = 100
  private static debounceTimers = new Map<string, NodeJS.Timeout>()
  private static throttleFlags = new Map<string, boolean>()

  /**
   * 防抖函数
   */
  static debounce<T extends (...args: any[]) => void>(
    func: T,
    delay: number = 300,
    key?: string
  ): (...args: Parameters<T>) => void {
    const timerKey = key || func.name || 'anonymous'
    
    return (...args: Parameters<T>) => {
      if (this.debounceTimers.has(timerKey)) {
        clearTimeout(this.debounceTimers.get(timerKey)!)
      }
      
      this.debounceTimers.set(timerKey, setTimeout(() => {
        func.apply(this, args)
        this.debounceTimers.delete(timerKey)
      }, delay))
    }
  }

  /**
   * 节流函数
   */
  static throttle<T extends (...args: any[]) => void>(
    func: T,
    delay: number = 300,
    key?: string
  ): (...args: Parameters<T>) => void {
    const timerKey = key || func.name || 'anonymous'
    
    return (...args: Parameters<T>) => {
      if (this.throttleFlags.get(timerKey)) {
        return
      }
      
      this.throttleFlags.set(timerKey, true)
      func.apply(this, args)
      
      setTimeout(() => {
        this.throttleFlags.set(timerKey, false)
      }, delay)
    }
  }

  /**
   * 虚拟滚动优化
   */
  static useVirtualScroll(
    data: any[],
    options: {
      itemHeight: number
      containerHeight: number
      overscan?: number
    }
  ) {
    const { itemHeight, containerHeight, overscan = 5 } = options
    
    const scrollTop = ref(0)
    const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2
    const startIndex = ref(0)
    const endIndex = ref(0)
    const visibleData = ref<any[]>([])
    
    const updateVisibleData = () => {
      startIndex.value = Math.max(0, Math.floor(scrollTop.value / itemHeight) - overscan)
      endIndex.value = Math.min(data.length, startIndex.value + visibleCount)
      visibleData.value = data.slice(startIndex.value, endIndex.value)
    }
    
    const handleScroll = (event: Event) => {
      const target = event.target as HTMLElement
      scrollTop.value = target.scrollTop
      updateVisibleData()
    }
    
    // 初始更新
    updateVisibleData()
    
    return {
      scrollTop,
      startIndex,
      endIndex,
      visibleData,
      handleScroll,
      totalHeight: data.length * itemHeight,
      offsetY: startIndex.value * itemHeight
    }
  }

  /**
   * 数据分页优化
   */
  static usePagination<T>(
    data: T[],
    options: {
      pageSize: number
      currentPage?: number
      maxPages?: number
    }
  ) {
    const { pageSize, currentPage = 1, maxPages = 10 } = options
    
    const currentPageRef = ref(currentPage)
    const totalPages = Math.ceil(data.length / pageSize)
    
    const paginatedData = computed(() => {
      const start = (currentPageRef.value - 1) * pageSize
      const end = start + pageSize
      return data.slice(start, end)
    })
    
    const pageNumbers = computed(() => {
      const pages: number[] = []
      const half = Math.floor(maxPages / 2)
      let start = Math.max(1, currentPageRef.value - half)
      let end = Math.min(totalPages, start + maxPages - 1)
      
      if (end - start + 1 < maxPages) {
        start = Math.max(1, end - maxPages + 1)
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      return pages
    })
    
    const goToPage = (page: number) => {
      if (page >= 1 && page <= totalPages) {
        currentPageRef.value = page
      }
    }
    
    const nextPage = () => {
      if (currentPageRef.value < totalPages) {
        currentPageRef.value++
      }
    }
    
    const prevPage = () => {
      if (currentPageRef.value > 1) {
        currentPageRef.value--
      }
    }
    
    return {
      currentPage: currentPageRef,
      totalPages,
      paginatedData,
      pageNumbers,
      goToPage,
      nextPage,
      prevPage,
      hasNext: computed(() => currentPageRef.value < totalPages),
      hasPrev: computed(() => currentPageRef.value > 1)
    }
  }

  /**
   * 懒加载优化
   */
  static useLazyLoad(options: {
    root?: Element | null
    rootMargin?: string
    threshold?: number
  } = {}) {
    const { root = null, rootMargin = '0px', threshold = 0.1 } = options
    
    const isVisible = ref(false)
    const observer = ref<IntersectionObserver | null>(null)
    
    const observe = (element: Element) => {
      if (observer.value) {
        observer.value.disconnect()
      }
      
      observer.value = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            isVisible.value = entry.isIntersecting
          })
        },
        { root, rootMargin, threshold }
      )
      
      observer.value.observe(element)
    }
    
    onUnmounted(() => {
      if (observer.value) {
        observer.value.disconnect()
      }
    })
    
    return {
      isVisible,
      observe
    }
  }

  /**
   * 数据缓存
   */
  static setCache(key: string, data: any, expireTime: number = 5 * 60 * 1000) {
    if (this.cache.size >= this.cacheSize) {
      // 清理过期缓存
      this.cleanExpiredCache()
      
      // 如果还是满的，删除最旧的
      if (this.cache.size >= this.cacheSize) {
        const oldestKey = Array.from(this.cache.entries())
          .reduce((oldest: string, [key, item]) => 
            item.timestamp < this.cache.get(oldest)!.timestamp ? key : oldest
          , Array.from(this.cache.keys())[0])
        this.cache.delete(oldestKey)
      }
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expireTime
    })
  }

  /**
   * 获取缓存数据
   */
  static getCache<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }
    
    if (Date.now() - item.timestamp > item.expireTime) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }

  /**
   * 清理过期缓存
   */
  static cleanExpiredCache() {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.expireTime) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 批量操作优化
   */
  static useBatchOperation<T>(
    operations: (() => Promise<T>)[],
    options: {
      batchSize?: number
      delay?: number
    } = {}
  ) {
    const { batchSize = 5, delay = 100 } = options
    
    const results: T[] = []
    const errors: Error[] = []
    
    const executeBatch = async (): Promise<{ results: T[]; errors: Error[] }> => {
      for (let i = 0; i < operations.length; i += batchSize) {
        const batch = operations.slice(i, i + batchSize)
        
        try {
          const batchResults = await Promise.all(
            batch.map(op => op().catch(e => {
              errors.push(e)
              return null
            }))
          )
          
          results.push(...batchResults.filter(Boolean))
          
          // 批次间延迟
          if (i + batchSize < operations.length) {
            await new Promise(resolve => setTimeout(resolve, delay))
          }
        } catch (error) {
          errors.push(error as Error)
        }
      }
      
      return { results, errors }
    }
    
    return { executeBatch }
  }

  /**
   * 内存使用监控
   */
  static useMemoryMonitor() {
    const memoryUsage = ref({
      used: 0,
      total: 0,
      percentage: 0
    })
    
    const updateMemoryUsage = () => {
      if ('memory' in performance && performance.memory) {
        const memory = performance.memory as any
        const used = memory.usedJSHeapSize
        const total = memory.totalJSHeapSize
        
        memoryUsage.value = {
          used: Math.round(used / 1024 / 1024), // MB
          total: Math.round(total / 1024 / 1024), // MB
          percentage: Math.round((used / total) * 100)
        }
      }
    }
    
    const interval = setInterval(updateMemoryUsage, 5000)
    
    onUnmounted(() => {
      clearInterval(interval)
    })
    
    return {
      memoryUsage,
      updateMemoryUsage
    }
  }

  /**
   * 性能监控
   */
  static usePerformanceMonitor() {
    const metrics = reactive({
      fps: 0,
      loadTime: 0,
      renderTime: 0,
      memoryUsage: 0
    })
    
    let frameCount = 0
    let lastTime = performance.now()
    
    const updateFPS = () => {
      frameCount++
      const currentTime = performance.now()
      
      if (currentTime - lastTime >= 1000) {
        metrics.fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
        frameCount = 0
        lastTime = currentTime
      }
      
      requestAnimationFrame(updateFPS)
    }
    
    updateFPS()
    
    // 页面加载时间
    if (window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        metrics.loadTime = navigation.loadEventEnd - navigation.fetchStart
      }
    }
    
    return {
      metrics,
      logMetric: (name: string, value: number) => {
        console.log(`[Performance] ${name}: ${value}ms`)
      }
    }
  }
}

// Vue 组合式函数封装
export function useDebounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number = 300
) {
  return PerformanceOptimizer.debounce(func, delay)
}

export function useThrottle<T extends (...args: any[]) => void>(
  func: T,
  delay: number = 300
) {
  return PerformanceOptimizer.throttle(func, delay)
}

export function useVirtualScroll(
  data: any[],
  options: { itemHeight: number; containerHeight: number; overscan?: number }
) {
  return PerformanceOptimizer.useVirtualScroll(data, options)
}

export function usePagination<T>(
  data: T[],
  options: { pageSize: number; currentPage?: number; maxPages?: number }
) {
  return PerformanceOptimizer.usePagination(data, options)
}

export function useLazyLoad(options?: { root?: Element | null; rootMargin?: string; threshold?: number }) {
  return PerformanceOptimizer.useLazyLoad(options)
}

export function useMemoryMonitor() {
  return PerformanceOptimizer.useMemoryMonitor()
}

export function usePerformanceMonitor() {
  return PerformanceOptimizer.usePerformanceMonitor()
}

// 工具函数
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  resolver?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>()
  
  return ((...args: Parameters<T>) => {
    const key = resolver ? resolver(...args) : JSON.stringify(args)
    
    if (cache.has(key)) {
      return cache.get(key)!
    }
    
    const result = func.apply(this, args)
    cache.set(key, result)
    
    return result
  }) as T
}

export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as any
  }
  
  if (typeof obj === 'object') {
    const cloned = {} as T
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key])
      }
    }
    return cloned
  }
  
  return obj
}