// 安全验证功能使用示例

import { enhancedApi } from './index'

// 示例1: 增强的用户登录
async function exampleEnhancedLogin() {
  try {
    const loginResult = await enhancedApi.auth.login({
      email: 'user@example.com',
      password: 'securePassword123',
      type: 'student',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })

    if (loginResult.error) {
      console.error('登录失败:', loginResult.error)
      
      // 安全检查信息
      console.log('安全检查结果:', loginResult.securityCheck)
      
      if (loginResult.securityCheck.requires_2fa) {
        console.log('需要双重认证')
      }
      
      return
    }

    console.log('登录成功:', loginResult.user)
    console.log('安全级别:', loginResult.securityCheck.risk_level)
    
  } catch (error) {
    console.error('登录异常:', error)
  }
}

// 示例2: 增强的用户注册
async function exampleEnhancedRegistration() {
  try {
    const registerResult = await enhancedApi.auth.register({
      email: 'newuser@example.com',
      password: 'StrongPassword123!',
      confirmPassword: 'StrongPassword123!',
      username: 'newuser',
      type: 'student',
      ipAddress: '192.168.1.100',
      additionalData: {
        school: '清华大学',
        major: '计算机科学'
      }
    })

    if (registerResult.error) {
      console.error('注册失败:', registerResult.error)
      console.log('安全检查结果:', registerResult.securityCheck)
      return
    }

    console.log('注册成功:', registerResult.user)
    console.log('安全级别:', registerResult.securityCheck.risk_level)
    
  } catch (error) {
    console.error('注册异常:', error)
  }
}

// 示例3: 权限验证
async function examplePermissionCheck() {
  try {
    const currentUser = { id: 'user-uuid', role: 'student' as const }
    
    // 检查创建岗位的权限
    const permission = await enhancedApi.security.validatePermission(
      { userId: currentUser.id, userRole: currentUser.role },
      'job',
      'write'
    )

    if (!permission.allowed) {
      console.log('权限不足:', permission.error)
      return
    }

    console.log('有权限创建岗位')
    
  } catch (error) {
    console.error('权限检查异常:', error)
  }
}

// 示例4: 输入数据验证
async function exampleInputValidation() {
  try {
    const jobData = {
      title: '前端开发工程师',
      description: '负责前端开发工作',
      salary_range: '8000-12000',
      work_location: '北京',
      category: '技术'
    }

    const validation = await enhancedApi.security.validateInput(jobData, [
      { field: 'title', type: 'string', required: true, maxLength: 100 },
      { field: 'description', type: 'string', required: true, maxLength: 1000 },
      { field: 'salary_range', type: 'string', required: true },
      { field: 'work_location', type: 'string', required: true },
      { field: 'category', type: 'string', required: true }
    ])

    if (!validation.valid) {
      console.log('数据验证失败:', validation.errors)
      return
    }

    console.log('数据验证通过')
    
  } catch (error) {
    console.error('验证异常:', error)
  }
}

// 示例5: 获取用户安全状态
async function exampleSecurityStatus() {
  try {
    const userId = 'user-uuid'
    
    const securityStatus = await enhancedApi.auth.getSecurityStatus(userId)
    
    console.log('安全状态:', {
      安全级别: securityStatus.security_level,
      最后登录: securityStatus.last_login,
      登录次数: securityStatus.login_count,
      风险评估: securityStatus.risk_assessment,
      建议: securityStatus.recommendations
    })
    
  } catch (error) {
    console.error('获取安全状态异常:', error)
  }
}

// 示例6: 渐进式集成 - 在现有登录组件中使用增强API
async function exampleProgressiveIntegration() {
  try {
    // 原有登录逻辑
    const originalLogin = async (email: string, password: string) => {
      // 原有的登录逻辑...
      return { user: null, error: null }
    }

    // 渐进式集成：先进行安全验证，再执行原有逻辑
    const enhancedLogin = async (email: string, password: string, userType: string) => {
      // 1. 安全验证
      const securityCheck = await enhancedApi.auth.login({
        email,
        password,
        type: userType as 'student' | 'company'
      })

      // 2. 如果安全验证失败，直接返回
      if (securityCheck.error || !securityCheck.securityCheck.allowed) {
        return securityCheck
      }

      // 3. 安全验证通过，执行原有登录逻辑
      const originalResult = await originalLogin(email, password)
      
      // 4. 返回合并结果
      return {
        ...originalResult,
        securityCheck: securityCheck.securityCheck
      }
    }

    // 使用增强登录
    const result = await enhancedLogin('user@example.com', 'password', 'student')
    console.log('增强登录结果:', result)
    
  } catch (error) {
    console.error('集成异常:', error)
  }
}

// 导出示例函数供测试使用
export {
  exampleEnhancedLogin,
  exampleEnhancedRegistration,
  examplePermissionCheck,
  exampleInputValidation,
  exampleSecurityStatus,
  exampleProgressiveIntegration
}

// 测试函数
async function runExamples() {
  console.log('=== 安全验证功能示例 ===')
  
  await exampleEnhancedLogin()
  await exampleEnhancedRegistration()
  await examplePermissionCheck()
  await exampleInputValidation()
  await exampleSecurityStatus()
  await exampleProgressiveIntegration()
  
  console.log('=== 示例执行完成 ===')
}

// 如果直接运行此文件，执行示例
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples()
}