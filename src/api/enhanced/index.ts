// 增强API集成入口文件
import { SecurityService } from './security'
import { EnhancedJobService } from './jobService'
import { EnhancedApplicationService } from './applicationService'
import { EnhancedAuthService } from './authService'

// 导出增强服务
export const enhancedApi = {
  security: SecurityService,
  jobs: EnhancedJobService,
  applications: EnhancedApplicationService,
  auth: EnhancedAuthService
}

// 向后兼容的API导出
export { JobsApi } from '../jobs'
export { AuthApi } from '../auth'

// 默认导出增强API
export default enhancedApi