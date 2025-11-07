// API统一入口文件
import { AuthApi } from './auth'
import { JobsApi } from './jobs'
import { ApplicationsApi } from './applications'
import { messageApi } from './message'
import { notificationApi } from './notification'
import enhancedApi from './enhanced'

// 导出所有API模块
export {
  AuthApi,
  JobsApi,
  ApplicationsApi,
  messageApi,
  notificationApi,
  enhancedApi
}

// 默认导出增强API
export default enhancedApi