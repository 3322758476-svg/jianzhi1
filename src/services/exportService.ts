/**
 * 数据导出服务
 * 提供各种数据导出功能，包括 Excel、PDF、CSV 等格式
 */

import { ElMessage, ElLoading } from 'element-plus'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Job = Database['public']['Tables']['jobs']['Row']
type Application = Database['public']['Tables']['applications']['Row']
type Company = Database['public']['Tables']['companies']['Row']

export interface ExportOptions {
  format: 'excel' | 'csv' | 'pdf'
  includeHeaders?: boolean
  fileName?: string
  filters?: Record<string, any>
}

export interface ExportResult {
  success: boolean
  message: string
  data?: Blob
  fileName?: string
}

export class ExportService {
  /**
   * 导出岗位数据
   */
  static async exportJobs(options: ExportOptions): Promise<ExportResult> {
    const loading = ElLoading.service({
      lock: true,
      text: '正在导出岗位数据...',
      background: 'rgba(0, 0, 0, 0.7)'
    })

    try {
      // 获取岗位数据
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select(`
          *,
          companies!inner (
            company_name,
            industry,
            scale
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // 处理数据
      const processedData = jobs?.map(job => ({
        '岗位ID': job.id,
        '岗位标题': job.title,
        '公司名称': job.companies?.company_name,
        '行业': job.companies?.industry,
        '薪资范围': job.salary_range,
        '工作地点': job.work_location,
        '招聘人数': job.recruit_count,
        '申请人数': job.applications_count || 0,
        '岗位状态': this.getJobStatusText(job.status),
        '发布时间': new Date(job.created_at).toLocaleDateString('zh-CN'),
        '截止时间': job.application_deadline ? new Date(job.application_deadline).toLocaleDateString('zh-CN') : '无'
      })) || []

      // 生成文件
      const result = await this.generateFile(processedData, {
        ...options,
        fileName: options.fileName || `岗位数据_${new Date().toLocaleDateString('zh-CN')}`
      })

      ElMessage.success('岗位数据导出成功')
      return result

    } catch (error: any) {
      console.error('导出岗位数据失败:', error)
      ElMessage.error('导出岗位数据失败: ' + error.message)
      return {
        success: false,
        message: error.message
      }
    } finally {
      loading.close()
    }
  }

  /**
   * 导出申请数据
   */
  static async exportApplications(options: ExportOptions): Promise<ExportResult> {
    const loading = ElLoading.service({
      lock: true,
      text: '正在导出申请数据...',
      background: 'rgba(0, 0, 0, 0.7)'
    })

    try {
      // 获取申请数据
      const { data: applications, error } = await supabase
        .from('applications')
        .select(`
          *,
          jobs!inner (
            title,
            salary_range,
            work_location,
            companies!inner (
              company_name
            )
          ),
          students!inner (
            real_name,
            school,
            major,
            grade
          )
        `)
        .order('applied_at', { ascending: false })

      if (error) throw error

      // 处理数据
      const processedData = applications?.map(app => ({
        '申请ID': app.id,
        '学生姓名': app.students?.real_name,
        '学校': app.students?.school,
        '专业': app.students?.major,
        '年级': app.students?.grade || '未知',
        '岗位名称': app.jobs?.title,
        '公司名称': app.jobs?.companies?.company_name,
        '薪资范围': app.jobs?.salary_range,
        '工作地点': app.jobs?.work_location,
        '申请时间': new Date(app.applied_at).toLocaleString('zh-CN'),
        '申请状态': this.getApplicationStatusText(app.status),
        '处理时间': app.reviewed_at ? new Date(app.reviewed_at).toLocaleString('zh-CN') : '未处理',
        '反馈': app.feedback || '无'
      })) || []

      // 生成文件
      const result = await this.generateFile(processedData, {
        ...options,
        fileName: options.fileName || `申请数据_${new Date().toLocaleDateString('zh-CN')}`
      })

      ElMessage.success('申请数据导出成功')
      return result

    } catch (error: any) {
      console.error('导出申请数据失败:', error)
      ElMessage.error('导出申请数据失败: ' + error.message)
      return {
        success: false,
        message: error.message
      }
    } finally {
      loading.close()
    }
  }

  /**
   * 导出企业统计数据
   */
  static async exportCompanyStats(options: ExportOptions): Promise<ExportResult> {
    const loading = ElLoading.service({
      lock: true,
      text: '正在导出统计数据...',
      background: 'rgba(0, 0, 0, 0.7)'
    })

    try {
      // 获取统计数据
      const [jobsResult, appsResult] = await Promise.all([
        supabase.from('jobs').select('id, status, company_id'),
        supabase.from('applications').select('id, status, job_id')
      ])

      if (jobsResult.error) throw jobsResult.error
      if (appsResult.error) throw appsResult.error

      // 计算统计信息
      const stats = {
        totalJobs: jobsResult.data?.length || 0,
        activeJobs: jobsResult.data?.filter(job => job.status === 'active').length || 0,
        totalApplications: appsResult.data?.length || 0,
        pendingApplications: appsResult.data?.filter(app => app.status === 'pending').length || 0,
        acceptedApplications: appsResult.data?.filter(app => app.status === 'accepted').length || 0,
        exportTime: new Date().toLocaleString('zh-CN')
      }

      const processedData = [{
        '统计项目': '总岗位数',
        '数值': stats.totalJobs
      }, {
        '统计项目': '活跃岗位数',
        '数值': stats.activeJobs
      }, {
        '统计项目': '总申请数',
        '数值': stats.totalApplications
      }, {
        '统计项目': '待处理申请',
        '数值': stats.pendingApplications
      }, {
        '统计项目': '已通过申请',
        '数值': stats.acceptedApplications
      }, {
        '统计项目': '导出时间',
        '数值': stats.exportTime
      }]

      // 生成文件
      const result = await this.generateFile(processedData, {
        ...options,
        fileName: options.fileName || `平台统计_${new Date().toLocaleDateString('zh-CN')}`
      })

      ElMessage.success('统计数据导出成功')
      return result

    } catch (error: any) {
      console.error('导出统计数据失败:', error)
      ElMessage.error('导出统计数据失败: ' + error.message)
      return {
        success: false,
        message: error.message
      }
    } finally {
      loading.close()
    }
  }

  /**
   * 生成文件
   */
  private static async generateFile(data: any[], options: ExportOptions): Promise<ExportResult> {
    try {
      switch (options.format) {
        case 'csv':
          return await this.generateCSV(data, options)
        case 'excel':
          return await this.generateExcel(data, options)
        case 'pdf':
          return await this.generatePDF(data, options)
        default:
          throw new Error('不支持的导出格式')
      }
    } catch (error: any) {
      throw new Error(`生成文件失败: ${error.message}`)
    }
  }

  /**
   * 生成 CSV 文件
   */
  private static async generateCSV(data: any[], options: ExportOptions): Promise<ExportResult> {
    if (!data.length) {
      throw new Error('没有数据可导出')
    }

    const headers = Object.keys(data[0])
    const csvContent = [
      options.includeHeaders !== false ? headers.join(',') : null,
      ...data.map(row => headers.map(header => {
        const value = row[header]
        // 处理包含逗号的值
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      }).join(','))
    ].filter(Boolean).join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    
    return {
      success: true,
      message: 'CSV 文件生成成功',
      data: blob,
      fileName: `${options.fileName}.csv`
    }
  }

  /**
   * 生成 Excel 文件（简化实现）
   */
  private static async generateExcel(data: any[], options: ExportOptions): Promise<ExportResult> {
    // 这里使用简化的实现，实际项目中可以使用 SheetJS 等库
    // 生成 CSV 格式，让用户用 Excel 打开
    const csvResult = await this.generateCSV(data, options)
    
    return {
      ...csvResult,
      fileName: `${options.fileName}.xlsx`,
      message: 'Excel 文件生成成功（CSV格式）'
    }
  }

  /**
   * 生成 PDF 文件（简化实现）
   */
  private static async generatePDF(data: any[], options: ExportOptions): Promise<ExportResult> {
    // 这里使用简化的实现，实际项目中可以使用 jsPDF 等库
    // 生成文本格式的 PDF 内容
    const textContent = data.map(row => 
      Object.entries(row).map(([key, value]) => `${key}: ${value}`).join(' | ')
    ).join('\n')

    const blob = new Blob([textContent], { type: 'application/pdf' })
    
    return {
      success: true,
      message: 'PDF 文件生成成功（文本格式）',
      data: blob,
      fileName: `${options.fileName}.pdf`
    }
  }

  /**
   * 下载文件
   */
  static downloadFile(result: ExportResult): void {
    if (!result.success || !result.data) {
      ElMessage.error('文件生成失败，无法下载')
      return
    }

    const url = URL.createObjectURL(result.data)
    const link = document.createElement('a')
    link.href = url
    link.download = result.fileName || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * 获取岗位状态文本
   */
  private static getJobStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'active': '活跃',
      'inactive': '已停用',
      'draft': '草稿',
      'expired': '已过期'
    }
    return statusMap[status] || status
  }

  /**
   * 获取申请状态文本
   */
  private static getApplicationStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': '待处理',
      'reviewing': '审核中',
      'accepted': '已通过',
      'rejected': '已拒绝',
      'cancelled': '已取消'
    }
    return statusMap[status] || status
  }

  /**
   * 批量导出多种数据
   */
  static async batchExport(exports: Array<{type: 'jobs' | 'applications' | 'stats', options: ExportOptions}>): Promise<ExportResult[]> {
    const results: ExportResult[] = []
    
    for (const exportConfig of exports) {
      try {
        let result: ExportResult
        
        switch (exportConfig.type) {
          case 'jobs':
            result = await this.exportJobs(exportConfig.options)
            break
          case 'applications':
            result = await this.exportApplications(exportConfig.options)
            break
          case 'stats':
            result = await this.exportCompanyStats(exportConfig.options)
            break
          default:
            result = { success: false, message: '未知的导出类型' }
        }
        
        results.push(result)
      } catch (error: any) {
        results.push({
          success: false,
          message: error.message
        })
      }
    }
    
    return results
  }
}