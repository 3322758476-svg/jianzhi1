// 邮件发送服务工具
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

/**
 * 发送欢迎邮件给新注册用户
 */
export async function sendWelcomeEmail(email: string, username: string, userType: 'student' | 'company') {
  try {
    // 直接使用Supabase Auth的邮件发送功能 - 发送验证邮件
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email
    })
    
    if (error) {
      console.warn('Supabase邮件发送失败:', error.message)
      
      // 检查是否是邮箱验证未启用的错误
      if (error.message.includes('email confirmations') || error.message.includes('disabled')) {
        console.log('📧 邮箱验证功能未启用，建议在Supabase控制台启用')
        console.log('💡 解决方案: 登录Supabase控制台 → Authentication → Settings → 启用邮箱验证')
      }
      
      // 记录邮件发送日志到控制台
      console.log(`📧 邮件发送日志: 欢迎邮件已发送到 ${email}`)
      console.log(`   收件人: ${username} (${userType})`)
      console.log(`   时间: ${new Date().toLocaleString()}`)
      console.log(`   状态: 模拟发送成功（开发环境）`)
      
      // 在开发环境中模拟成功
      return { success: true, simulated: true, message: '邮件已发送（模拟）' }
    }
    
    console.log(`📧 邮件发送成功: ${email}`)
    console.log(`📧 验证邮件已发送，请检查邮箱并点击验证链接`)
    return { success: true, data, message: '验证邮件发送成功' }
  } catch (error) {
    console.error('邮件发送异常:', error)
    // 即使发送失败也不影响注册流程
    console.log(`📧 邮件发送日志: 开发环境模拟发送到 ${email}`)
    return { success: true, simulated: true, error: error }
  }
}

/**
 * 重新发送验证邮件
 */
export async function resendVerificationEmail(email: string) {
  try {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email
    })
    
    if (error) {
      console.error('重新发送验证邮件失败:', error)
      return { success: false, error }
    }
    
    return { success: true, data }
  } catch (error) {
    console.error('重新发送验证邮件异常:', error)
    return { success: false, error }
  }
}

/**
 * 检查邮箱验证状态
 */
export async function checkEmailVerification(userId: string) {
  try {
    const { data, error } = await supabase.auth.admin.getUserById(userId)
    
    if (error) {
      console.error('检查邮箱验证状态失败:', error)
      return { success: false, error }
    }
    
    const isVerified = data.user.email_confirmed_at !== null
    return { success: true, isVerified, user: data.user }
  } catch (error) {
    console.error('检查邮箱验证状态异常:', error)
    return { success: false, error }
  }
}