// 测试企业端通过申请后学生端接收通知的流程
const { createClient } = require('@supabase/supabase-js')

// 配置 Supabase 客户端
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testApplicationNotificationFlow() {
  console.log('=== 开始测试申请通知流程 ===')
  
  try {
    // 1. 模拟企业用户登录
    console.log('1. 模拟企业用户登录...')
    const { data: companyUser, error: companyLoginError } = await supabase.auth.signInWithPassword({
      email: 'company@test.com',
      password: 'password123'
    })
    
    if (companyLoginError) {
      console.error('企业用户登录失败:', companyLoginError.message)
      return
    }
    
    console.log('企业用户登录成功，用户ID:', companyUser.user.id)
    
    // 2. 获取一个待处理的申请
    console.log('2. 获取待处理的申请...')
    const { data: pendingApplications, error: appsError } = await supabase
      .from('applications')
      .select(`
        id,
        status,
        student:students(id, user_id, name),
        job:jobs(id, title, company:companies(id, company_name))
      `)
      .eq('status', 'reviewing')
      .limit(1)
    
    if (appsError) {
      console.error('获取申请失败:', appsError.message)
      return
    }
    
    if (!pendingApplications || pendingApplications.length === 0) {
      console.log('没有找到待处理的申请，测试结束')
      return
    }
    
    const application = pendingApplications[0]
    console.log('找到申请:', {
      id: application.id,
      student: application.student?.name,
      job: application.job?.title,
      company: application.job?.company?.company_name
    })
    
    // 3. 模拟通过申请
    console.log('3. 模拟通过申请...')
    
    // 更新申请状态
    const { error: updateError } = await supabase
      .from('applications')
      .update({ status: 'accepted' })
      .eq('id', application.id)
    
    if (updateError) {
      console.error('更新申请状态失败:', updateError.message)
      return
    }
    
    console.log('申请状态更新成功')
    
    // 4. 发送通知给学生
    console.log('4. 发送通知给学生...')
    
    const studentUserId = application.student?.user_id
    if (!studentUserId) {
      console.error('无法获取学生用户ID')
      return
    }
    
    const companyName = application.job?.company?.company_name || '企业'
    
    // 发送系统通知
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: studentUserId,
        type: 'application',
        title: '申请通过通知',
        description: `恭喜！您的申请已通过 ${companyName} 的审核。请查看消息详情。`,
        related_id: application.id,
        important: true
      })
    
    if (notificationError) {
      console.error('发送通知失败:', notificationError.message)
    } else {
      console.log('通知发送成功')
    }
    
    // 发送消息
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        sender_id: companyUser.user.id,
        receiver_id: studentUserId,
        content: `恭喜！您的申请已通过审核。${companyName} 已同意您的申请。请保持联系方式畅通，我们会尽快与您联系安排后续事宜。`,
        type: 'system'
      })
    
    if (messageError) {
      console.error('发送消息失败:', messageError.message)
    } else {
      console.log('消息发送成功')
    }
    
    // 5. 模拟学生用户登录并检查通知
    console.log('5. 模拟学生用户检查通知...')
    
    // 先登出企业用户
    await supabase.auth.signOut()
    
    // 模拟学生用户登录
    const { data: studentUser, error: studentLoginError } = await supabase.auth.signInWithPassword({
      email: 'student@test.com',
      password: 'password123'
    })
    
    if (studentLoginError) {
      console.error('学生用户登录失败:', studentLoginError.message)
      return
    }
    
    console.log('学生用户登录成功，用户ID:', studentUser.user.id)
    
    // 检查通知
    const { data: studentNotifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', studentUser.user.id)
      .order('created_at', { ascending: false })
    
    if (notifError) {
      console.error('获取学生通知失败:', notifError.message)
    } else {
      console.log('学生通知数量:', studentNotifications?.length || 0)
      if (studentNotifications && studentNotifications.length > 0) {
        console.log('最新通知:', studentNotifications[0])
      }
    }
    
    // 检查消息
    const { data: studentMessages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('receiver_id', studentUser.user.id)
      .order('created_at', { ascending: false })
    
    if (msgError) {
      console.error('获取学生消息失败:', msgError.message)
    } else {
      console.log('学生消息数量:', studentMessages?.length || 0)
      if (studentMessages && studentMessages.length > 0) {
        console.log('最新消息:', studentMessages[0])
      }
    }
    
    console.log('=== 测试完成 ===')
    
  } catch (error) {
    console.error('测试过程中出现错误:', error)
  }
}

// 运行测试
testApplicationNotificationFlow()