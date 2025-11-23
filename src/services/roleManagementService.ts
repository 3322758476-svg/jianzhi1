import { supabase } from '../lib/supabase'
import { useUserStore } from '../store'
import { permissionService, Permission, UserRole } from './permissionService'

/**
 * 企业角色管理服务
 */
export class RoleManagementService {
  
  /**
   * 获取当前用户所在公司的ID
   */
  private async getCurrentCompanyId(): Promise<string | null> {
    const userStore = useUserStore()
    const user = userStore.user
    
    if (!user || user.role !== 'company') {
      return null
    }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()
      
      if (error) {
        console.warn('获取公司ID失败:', error)
        return null
      }
      
      return data.company_id
    } catch (error) {
      console.error('获取公司ID异常:', error)
      return null
    }
  }

  /**
   * 获取公司所有成员及其角色
   */
  async getCompanyMembers() {
    const companyId = await this.getCurrentCompanyId()
    if (!companyId) {
      throw new Error('未找到公司信息')
    }

    // 检查权限
    if (!(await permissionService.hasPermission(Permission.MEMBER_MANAGE))) {
      throw new Error('无权限查看成员信息')
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          email,
          role,
          avatar_url,
          phone,
          created_at,
          last_login_at
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('获取公司成员失败:', error)
      throw error
    }
  }

  /**
   * 更新成员角色
   */
  async updateMemberRole(memberId: string, newRole: UserRole) {
    const companyId = await this.getCurrentCompanyId()
    if (!companyId) {
      throw new Error('未找到公司信息')
    }

    // 检查权限
    if (!(await permissionService.hasPermission(Permission.PERMISSION_MANAGE))) {
      throw new Error('无权限修改成员角色')
    }

    try {
      // 验证成员属于当前公司
      const { data: memberData, error: checkError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', memberId)
        .single()

      if (checkError || memberData.company_id !== companyId) {
        throw new Error('无权修改此成员角色')
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', memberId)
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('更新成员角色失败:', error)
      throw error
    }
  }

  /**
   * 编辑成员信息
   */
  async editMember(memberId: string, memberData: any) {
    const companyId = await this.getCurrentCompanyId()
    if (!companyId) {
      throw new Error('未找到公司信息')
    }

    // 检查权限
    if (!(await permissionService.hasPermission(Permission.MEMBER_MANAGE))) {
      throw new Error('无权限编辑成员信息')
    }

    try {
      // 验证成员属于当前公司
      const { data: memberData, error: checkError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', memberId)
        .single()

      if (checkError || memberData.company_id !== companyId) {
        throw new Error('无权编辑此成员信息')
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(memberData)
        .eq('id', memberId)
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('编辑成员信息失败:', error)
      throw error
    }
  }

  /**
   * 移除成员
   */
  async removeMember(memberId: string) {
    const companyId = await this.getCurrentCompanyId()
    if (!companyId) {
      throw new Error('未找到公司信息')
    }

    // 检查权限
    if (!(await permissionService.hasPermission(Permission.MEMBER_MANAGE))) {
      throw new Error('无权限移除成员')
    }

    try {
      // 验证成员属于当前公司
      const { data: memberData, error: checkError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', memberId)
        .single()

      if (checkError || memberData.company_id !== companyId) {
        throw new Error('无权移除此成员')
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          company_id: null,
          role: 'student' // 重置为默认角色
        })
        .eq('id', memberId)
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('移除成员失败:', error)
      throw error
    }
  }

  /**
   * 更新公司信息
   */
  async updateCompanyInfo(companyData: any) {
    const companyId = await this.getCurrentCompanyId()
    if (!companyId) {
      throw new Error('未找到公司信息')
    }

    // 检查权限
    if (!(await permissionService.hasPermission(Permission.SETTINGS_EDIT))) {
      throw new Error('无权限编辑公司信息')
    }

    try {
      const { data, error } = await supabase
        .from('companies')
        .update(companyData)
        .eq('id', companyId)
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('更新公司信息失败:', error)
      throw error
    }
  }

  /**
   * 邀请新成员
   */
  async inviteMember(inviteData: {
    email: string
    role: UserRole
    name: string
  }) {
    const companyId = await this.getCurrentCompanyId()
    if (!companyId) {
      throw new Error('未找到公司信息')
    }

    // 检查权限
    if (!(await permissionService.hasPermission(Permission.MEMBER_MANAGE))) {
      throw new Error('无权限邀请新成员')
    }

    try {
      // 检查邮箱是否已存在
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', inviteData.email)
        .single()

      if (!checkError && existingUser) {
        throw new Error('该邮箱已被注册')
      }

      // 发送邀请（这里可以集成邮件服务）
      // 暂时返回成功信息
      return {
        success: true,
        message: '邀请已发送',
        invitationId: Date.now().toString()
      }
    } catch (error) {
      console.error('邀请成员失败:', error)
      throw error
    }
  }

  /**
   * 获取角色权限配置
   */
  async getRolePermissions() {
    const companyId = await this.getCurrentCompanyId()
    if (!companyId) {
      throw new Error('未找到公司信息')
    }

    // 检查权限
    if (!(await permissionService.hasPermission(Permission.PERMISSION_MANAGE))) {
      throw new Error('无权限查看权限配置')
    }

    try {
      // 获取公司自定义权限配置（如果有）
      const { data, error } = await supabase
        .from('company_permissions')
        .select('*')
        .eq('company_id', companyId)

      if (error) throw error

      // 返回默认权限配置，可以合并自定义配置
      return {
        defaultPermissions: this.getDefaultRolePermissions(),
        customPermissions: data || []
      }
    } catch (error) {
      console.error('获取权限配置失败:', error)
      throw error
    }
  }

  /**
   * 获取默认角色权限配置
   */
  private getDefaultRolePermissions() {
    return {
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
  }

  /**
   * 数据隔离检查 - 确保用户只能访问自己公司的数据
   */
  async validateDataAccess(data: any, dataType: 'job' | 'application' | 'company'): Promise<boolean> {
    const companyId = await this.getCurrentCompanyId()
    if (!companyId) {
      return false
    }

    try {
      switch (dataType) {
        case 'job':
          return data.company_id === companyId
        
        case 'application':
          // 检查申请关联的岗位是否属于当前公司
          const { data: jobData, error } = await supabase
            .from('jobs')
            .select('company_id')
            .eq('id', data.job_id)
            .single()
          
          if (error) return false
          return jobData.company_id === companyId
        
        case 'company':
          return data.id === companyId
        
        default:
          return false
      }
    } catch (error) {
      console.error('数据访问验证失败:', error)
      return false
    }
  }

  /**
   * 批量数据隔离过滤
   */
  async filterDataByCompany(dataList: any[], dataType: 'job' | 'application'): Promise<any[]> {
    const companyId = await this.getCurrentCompanyId()
    if (!companyId) {
      return []
    }

    try {
      const filteredData: any[] = []

      for (const data of dataList) {
        if (await this.validateDataAccess(data, dataType)) {
          filteredData.push(data)
        }
      }

      return filteredData
    } catch (error) {
      console.error('数据过滤失败:', error)
      return []
    }
  }

  /**
   * 获取用户可操作的数据范围
   */
  async getUserDataScope(userId: string): Promise<{
    canViewAll: boolean
    canEditAll: boolean
    canDelete: boolean
    dataFilters: any
  }> {
    const userRole = await permissionService.getUserRole({ id: userId } as any)
    
    switch (userRole) {
      case UserRole.SUPER_ADMIN:
        return {
          canViewAll: true,
          canEditAll: true,
          canDelete: true,
          dataFilters: {}
        }
      
      case UserRole.COMPANY_ADMIN:
        return {
          canViewAll: true,
          canEditAll: true,
          canDelete: true,
          dataFilters: { company_id: await this.getCurrentCompanyId() }
        }
      
      case UserRole.HR_MANAGER:
        return {
          canViewAll: true,
          canEditAll: true,
          canDelete: false,
          dataFilters: { company_id: await this.getCurrentCompanyId() }
        }
      
      case UserRole.HR_ASSISTANT:
        return {
          canViewAll: false,
          canEditAll: false,
          canDelete: false,
          dataFilters: { 
            company_id: await this.getCurrentCompanyId(),
            status: ['active', 'draft']
          }
        }
      
      case UserRole.INTERVIEWER:
        return {
          canViewAll: false,
          canEditAll: false,
          canDelete: false,
          dataFilters: { 
            company_id: await this.getCurrentCompanyId(),
            status: 'active'
          }
        }
      
      default:
        return {
          canViewAll: false,
          canEditAll: false,
          canDelete: false,
          dataFilters: {}
        }
    }
  }
}

// 创建单例实例
export const roleManagementService = new RoleManagementService()