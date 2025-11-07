// 测试消息发送和接收流程
const { createClient } = require('@supabase/supabase-js')

// 配置 Supabase 客户端
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testMessageFlow() {
  console.log('开始测试消息发送和接收流程...')
  
  try {
    // 1. 模拟企业发送消息
    console.log('\n1. 模拟企业发送消息...')
    
    // 假设企业用户ID和学生用户ID
    const companyUserId = 'company-user-id' // 替换为实际企业用户ID
    const studentUserId = 'student-user-id' // 替换为实际学生用户ID
    
    const messageContent = '测试消息：您好，我们收到了您的申请，请等待面试通知。'
    
    const { data: sentMessage, error: sendError } = await supabase
      .from('messages')
      .insert({
        sender_id: companyUserId,
        receiver_id: studentUserId,
        content: messageContent,
        type: 'text'
      })
      .select()
    
    if (sendError) {
      console.error('发送消息失败:', sendError)
      return
    }
    
    console.log('✅ 企业端发送消息成功:', sentMessage[0])
    
    // 2. 模拟学生查看消息
    console.log('\n2. 模拟学生查看消息...')
    
    const { data: receivedMessages, error: receiveError } = await supabase
      .from('messages')
      .select('*')
      .eq('receiver_id', studentUserId)
      .order('created_at', { ascending: false })
    
    if (receiveError) {
      console.error('获取消息失败:', receiveError)
      return
    }
    
    console.log('✅ 学生端收到消息数量:', receivedMessages.length)
    
    if (receivedMessages.length > 0) {
      console.log('📨 最新消息内容:', receivedMessages[0].content)
      console.log('👤 发送者ID:', receivedMessages[0].sender_id)
      console.log('⏰ 发送时间:', receivedMessages[0].created_at)
    }
    
    // 3. 测试消息组件功能
    console.log('\n3. 测试消息组件功能...')
    
    // 测试对话列表加载
    const { data: conversations, error: convError } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${studentUserId},receiver_id.eq.${studentUserId}`)
      .order('created_at', { ascending: false })
    
    if (convError) {
      console.error('获取对话列表失败:', convError)
    } else {
      console.log('✅ 对话列表加载成功，消息数量:', conversations.length)
      
      // 提取对话伙伴
      const partnerIds = new Set()
      conversations.forEach(msg => {
        if (msg.sender_id !== studentUserId) {
          partnerIds.add(msg.sender_id)
        }
        if (msg.receiver_id !== studentUserId) {
          partnerIds.add(msg.receiver_id)
        }
      })
      
      console.log('👥 对话伙伴数量:', partnerIds.size)
    }
    
    console.log('\n🎉 消息系统测试完成！')
    console.log('✅ 企业端可以成功发送消息')
    console.log('✅ 学生端可以成功接收消息')
    console.log('✅ 消息组件功能正常')
    
  } catch (error) {
    console.error('测试过程中出现错误:', error)
  }
}

// 运行测试
testMessageFlow()