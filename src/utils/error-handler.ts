/**
 * 错误处理工具类
 * 提供统一的错误处理和用户反馈机制
 */

import { ElMessage, ElNotification } from 'element-plus'

export interface ErrorInfo {
  code?: string
  message: string
  details?: any
  severity?: 'error' | 'warning' | 'info'
}

export class ErrorHandler {
  /**
   * 处理 API 错误
   */
  static handleApiError(error: any, defaultMessage = '操作失败'): void {
    console.error('API Error:', error)
    
    let message = defaultMessage
    let type: 'error' | 'warning' | 'info' = 'error'
    
    if (error?.response?.data?.message) {
      message = error.response.data.message
    } else if (error?.message) {
      message = error.message
    } else if (typeof error === 'string') {
      message = error
    }
    
    // 根据错误类型设置不同的提示类型
    if (error?.code === 'NETWORK_ERROR') {
      type = 'warning'
      message = '网络连接失败，请检查网络设置'
    } else if (error?.code === 'TIMEOUT_ERROR') {
      type = 'warning'
      message = '请求超时，请稍后重试'
    } else if (error?.code === 'AUTH_ERROR') {
      type = 'warning'
      message = '登录已过期，请重新登录'
    }
    
    ElMessage({
      message,
      type,
      duration: 5000,
      showClose: true
    })
  }
  
  /**
   * 处理表单验证错误
   */
  static handleValidationError(errors: any[]): void {
    const firstError = errors[0]
    if (firstError?.message) {
      ElMessage.warning(firstError.message)
    }
  }
  
  /**
   * 处理权限错误
   */
  static handlePermissionError(permission: string): void {
    ElNotification({
      title: '权限不足',
      message: `您没有 ${permission} 权限，请联系管理员`,
      type: 'warning',
      duration: 5000
    })
  }
  
  /**
   * 处理网络错误
   */
  static handleNetworkError(): void {
    ElNotification({
      title: '网络错误',
      message: '网络连接失败，请检查网络设置后重试',
      type: 'error',
      duration: 0, // 不自动关闭
      showClose: true
    })
  }
  
  /**
   * 处理数据加载错误
   */
  static handleDataLoadError(resource: string): void {
    ElMessage.error(`加载${resource}失败，请刷新页面重试`)
  }
  
  /**
   * 处理文件上传错误
   */
  static handleUploadError(error: any): void {
    let message = '文件上传失败'
    
    if (error?.message?.includes('size')) {
      message = '文件大小超过限制'
    } else if (error?.message?.includes('type')) {
      message = '文件类型不支持'
    } else if (error?.message?.includes('network')) {
      message = '网络错误，上传失败'
    }
    
    ElMessage.error(message)
  }
  
  /**
   * 处理数据库错误
   */
  static handleDatabaseError(error: any, operation: string): void {
    console.error(`Database ${operation} Error:`, error)
    
    let message = `${operation}失败`
    
    if (error?.code === '23505') {
      message = '数据已存在，请勿重复操作'
    } else if (error?.code === '23503') {
      message = '关联数据不存在，请检查输入'
    } else if (error?.code === '23514') {
      message = '数据验证失败，请检查输入格式'
    }
    
    ElMessage.error(message)
  }
  
  /**
   * 通用错误处理
   */
  static handle(error: any, context?: string): void {
    console.error(`Error in ${context || 'unknown context'}:`, error)
    
    // 如果是用户取消操作，不显示错误
    if (error === 'cancel' || error?.message === 'cancel') {
      return
    }
    
    const message = error?.message || error?.toString() || '发生未知错误'
    
    ElMessage({
      message: context ? `${context}: ${message}` : message,
      type: 'error',
      duration: 5000,
      showClose: true
    })
  }
  
  /**
   * 静默处理错误（不显示用户提示）
   */
  static handleSilently(error: any): void {
    console.error('Silent Error:', error)
    // 只记录到控制台，不显示给用户
  }
  
  /**
   * 检查是否为特定类型的错误
   */
  static isSpecificError(error: any, errorCode: string): boolean {
    return error?.code === errorCode || error?.response?.data?.code === errorCode
  }
  
  /**
   * 获取错误详情（用于调试）
   */
  static getErrorDetails(error: any): string {
    if (typeof error === 'string') return error
    if (error?.message) return error.message
    if (error?.response?.data?.message) return error.response.data.message
    return '未知错误'
  }
}