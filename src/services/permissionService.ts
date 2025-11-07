import { useUserStore } from '../store'
import { supabase } from '../lib/supabase'

/**
 * 权限类型定义
 */
export enum Permission {
  // 岗位管理权限
  JOB_VIEW = 'job:view',
  JOB_CREATE = 'job:create',
  JOB_EDIT = 'job:edit',
  JOB_DELETE = 'job:delete',
  JOB_PUBLISH = 'job:publish',
  
  // 申请管理权限
  APPLICATION_VIEW = 'application:view',
  APPLICATION_REVIEW = 'application:review',
  APPLICATION_APPROVE = 'application:approve',
  APPLICATION_REJECT = 'application:reject',
  APPLICATION_EXPORT = 'application:export',
  
  // 数据统计权限
  ANALYTICS_VIEW = 'analytics:view',
  ANALYTICS_EXPORT = 'analytics:export',
  
  // 系统管理权限
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_EDIT = 'settings:edit',
  MEMBER_MANAGE = 'member:manage',
  PERMISSION_MANAGE = 'permission:manage'
}

/**
 * 用户角色定义
 */
export enum UserRole {
  SUPER_ADMIN = 'super_admin',      // 超级管理员
  COMPANY_ADMIN = 'company_admin',  // 企业管理员
  HR_MANAGER = 'hr_manager',        // HR经理
  HR_ASSISTANT = 'hr_assistant',    // HR助理
  INTERVIEWER = 'interviewer'       // 面试官
}

/**
 * 角色权限映射
 */
const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    Permission.JOB_VIEW,
    Permission.JOB_CREATE,
    Permission.JOB_EDIT,
    Permission.JOB_DELETE,
    Permission.JOB_PUBLISH,
    Permission.APPLICATION_VIEW,
    Permission.APPLICATION_REVIEW,
    Permission.APPLICATION_APPROVE,
    Permission.APPLICATION_REJECT,
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_EXPORT,
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_EDIT,
    Permission.MEMBER_MANAGE,
    Permission.PERMISSION_MANAGE
  ],
  
  [UserRole.COMPANY_ADMIN]: [
    Permission.JOB_VIEW,
    Permission.JOB_CREATE,
    Permission.JOB_EDIT,
    Permission.JOB_DELETE,
    Permission.JOB_PUBLISH,
    Permission.APPLICATION_VIEW,
    Permission.APPLICATION_REVIEW,
    Permission.APPLICATION_APPROVE,
    Permission.APPLICATION_REJECT,
    Permission.APPLICATION_EXPORT,
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_EXPORT,
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_EDIT,
    Permission.MEMBER_MANAGE
  ],
  
  [UserRole.HR_MANAGER]: [
    Permission.JOB_VIEW,
    Permission.JOB_CREATE,
    Permission.JOB_EDIT,
    Permission.JOB_PUBLISH,
    Permission.APPLICATION_VIEW,
    Permission.APPLICATION_REVIEW,
    Permission.APPLICATION_APPROVE,
    Permission.APPLICATION_REJECT,
    Permission.ANALYTICS_VIEW
  ],
  
  [UserRole.HR_ASSISTANT]: [
    Permission.JOB_VIEW,
    Permission.APPLICATION_VIEW,
    Permission.APPLICATION_REVIEW
  ],
  
  [UserRole.INTERVIEWER]: [
    Permission.APPLICATION_VIEW,
    Permission.APPLICATION_REVIEW
  ]
}

/**
 * 权限服务类
 */
class PermissionService {
  /**
   * 检查用户是否具有指定权限
   */
  async hasPermission(permission: Permission): Promise<boolean> {
    const userStore = useUserStore()
    const user = userStore.user
    
    if (!user) {
      console.warn('用户未登录，无权限')
      return false
    }
    
    // 获取用户角色（异步获取）
    const userRole = await this.getUserRole(user)
    
    // 检查权限
    const permissions = rolePermissions[userRole] || []
    const hasPerm = permissions.includes(permission)
    console.log(`权限检查: 用户角色=${userRole}, 权限=${permission}, 结果=${hasPerm}`)
    return hasPerm
  }
  
  /**
   * 检查用户是否具有任一权限
   */
  async hasAnyPermission(permissions: Permission[]): Promise<boolean> {
    for (const permission of permissions) {
      if (await this.hasPermission(permission)) {
        return true
      }
    }
    return false
  }
  
  /**
   * 检查用户是否具有所有权限
   */
  async hasAllPermissions(permissions: Permission[]): Promise<boolean> {
    for (const permission of permissions) {
      if (!(await this.hasPermission(permission))) {
        return false
      }
    }
    return true
  }
  
  /**
   * 获取用户角色
   */
  async getUserRole(user: any): Promise<UserRole> {
    try {
      // 验证用户对象和用户ID
      if (!user || !user.id) {
        console.warn('用户对象无效，使用默认角色')
        return UserRole.HR_MANAGER
      }
      
      // 从 Supabase 获取用户角色信息
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()
      
      if (error || !data) {
        console.warn('user_roles表中未找到用户角色记录，使用默认角色:', error?.message || '无数据')
        // 根据用户类型返回默认角色
        if (user.role === 'company') {
          return UserRole.COMPANY_ADMIN
        }
        return UserRole.HR_MANAGER
      }
      
      // 映射数据库角色到应用角色
      const roleMapping: Record<string, UserRole> = {
        'super_admin': UserRole.SUPER_ADMIN,
        'company_admin': UserRole.COMPANY_ADMIN,
        'hr_manager': UserRole.HR_MANAGER,
        'hr_assistant': UserRole.HR_ASSISTANT,
        'interviewer': UserRole.INTERVIEWER,
        'student': UserRole.HR_MANAGER // 学生用户默认使用HR_MANAGER权限
      }
      
      const userRole = roleMapping[data.role] || UserRole.HR_MANAGER
      console.log('获取用户角色成功:', userRole)
      return userRole
    } catch (error) {
      console.error('获取用户角色异常:', error)
      return UserRole.HR_MANAGER
    }
  }
  
  /**
   * 获取用户可访问的路由
   */
  async getAccessibleRoutes(): Promise<string[]> {
    const routes = ['/company/dashboard'] // 控制台首页总是可访问
    
    if (await this.hasPermission(Permission.JOB_VIEW)) {
      routes.push('/company/jobs', '/company/jobs/new')
    }
    
    if (await this.hasPermission(Permission.APPLICATION_VIEW)) {
      routes.push('/company/applications')
    }
    
    if (await this.hasPermission(Permission.ANALYTICS_VIEW)) {
      routes.push('/company/analytics')
    }
    
    if (await this.hasPermission(Permission.SETTINGS_VIEW)) {
      routes.push('/company/settings')
    }
    
    return routes
  }
  
  /**
   * 检查数据访问权限（数据隔离）
   */
  async canAccessData(data: any): Promise<boolean> {
    const userStore = useUserStore()
    const user = userStore.user
    
    if (!user || user.role !== 'company') {
      return false
    }
    
    // 超级管理员可以访问所有数据
    const userRole = await this.getUserRole(user)
    if (userRole === UserRole.SUPER_ADMIN) {
      return true
    }
    
    // 获取当前用户所在公司ID
    const companyId = await this.getCurrentCompanyId(user)
    if (!companyId) {
      return false
    }
    
    // 检查数据是否属于当前用户所在公司
    return data.companyId === companyId || 
           data.company_id === companyId ||
           data.company_id === companyId
  }
  
  /**
   * 过滤数据（数据隔离）
   */
  async filterDataByPermission(dataList: any[]): Promise<any[]> {
    const filteredData: any[] = []
    
    for (const data of dataList) {
      if (await this.canAccessData(data)) {
        filteredData.push(data)
      }
    }
    
    return filteredData
  }
  
  /**
   * 获取当前用户所在公司ID
   */
  private async getCurrentCompanyId(user: any): Promise<string | null> {
    try {
      // 从 companies 表获取公司ID
      const { data, error } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      
      if (error || !data) {
        console.warn('获取公司ID失败:', error)
        return null
      }
      
      return data.id
    } catch (error) {
      console.error('获取公司ID异常:', error)
      return null
    }
  }
}

// 创建单例实例
export const permissionService = new PermissionService()

/**
 * 获取 Supabase 客户端实例
 */
export function getSupabaseClient() {
  return supabase
}

/**
 * 权限指令（用于模板中的权限控制）
 */
export const permissionDirective = {
  async mounted(el: HTMLElement, binding: any) {
    const { value } = binding
    
    if (value && typeof value === 'string') {
      if (!(await permissionService.hasPermission(value as Permission))) {
        el.style.display = 'none'
      }
    } else if (Array.isArray(value)) {
      if (!(await permissionService.hasAnyPermission(value))) {
        el.style.display = 'none'
      }
    }
  }
}

/**
 * 权限守卫（用于路由守卫）
 */
export const permissionGuard = async (to: any, _from: any, next: any) => {
  const userStore = useUserStore()
  
  // 检查是否是企业用户
  if (!userStore.isAuthenticated || !userStore.isCompany) {
    next('/login')
    return
  }
  
  // 检查路由权限
  const accessibleRoutes = await permissionService.getAccessibleRoutes()
  const hasAccess = accessibleRoutes.some(route => 
    to.path.startsWith(route)
  )
  
  if (!hasAccess) {
    next('/company/dashboard') // 无权限时重定向到控制台首页
    return
  }
  
  next()
}