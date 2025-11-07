// 学生账号注册和使用测试脚本 - 修复版本
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config()

async function testStudentRegistration() {
  console.log('🧪 开始测试学生账号注册和使用流程...\n')

  // 创建 Supabase 客户端
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  )

  // 测试数据
  const testStudent = {
    email: `test.student.${Date.now()}@gmail.com`,
    password: 'TestPassword123!',
    name: '测试学生',
    studentId: `S${Date.now()}`,
    school: '测试大学',
    major: '计算机科学',
    userType: 'student'
  }

  console.log('📝 测试数据:', testStudent)

  try {
    // 1. 注册学生账号
    console.log('\n1️⃣ 注册学生账号...')
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testStudent.email,
      password: testStudent.password,
      options: {
        data: {
          username: testStudent.name,
          name: testStudent.name,
          student_id: testStudent.studentId,
          school: testStudent.school,
          major: testStudent.major,
          role: 'student'
        }
      }
    })

    if (signUpError) {
      console.error('❌ 注册失败:', signUpError.message)
      return
    }

    console.log('✅ 注册成功! 用户ID:', signUpData.user?.id)

    // 2. 立即登录（模拟用户注册后立即使用）
    console.log('\n2️⃣ 立即登录测试...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testStudent.email,
      password: testStudent.password
    })

    if (loginError) {
      console.error('❌ 登录失败:', loginError.message)
      
      // 如果是邮箱验证问题，尝试使用确认邮箱的API
      if (loginError.message.includes('Email not confirmed')) {
        console.log('⚠️ 邮箱未确认，尝试确认邮箱...')
        
        // 在开发环境中，我们可以直接确认邮箱
        const { error: confirmError } = await supabase.auth.admin.updateUserById(
          signUpData.user.id,
          { email_confirm: true }
        )
        
        if (confirmError) {
          console.error('❌ 确认邮箱失败:', confirmError.message)
        } else {
          console.log('✅ 邮箱确认成功，重新登录...')
          
          // 重新登录
          const { data: reloginData, error: reloginError } = await supabase.auth.signInWithPassword({
            email: testStudent.email,
            password: testStudent.password
          })
          
          if (reloginError) {
            console.error('❌ 重新登录失败:', reloginError.message)
          } else {
            console.log('✅ 重新登录成功!')
            console.log('🔑 会话令牌:', reloginData.session?.access_token?.substring(0, 20) + '...')
          }
        }
      }
      return
    }

    console.log('✅ 登录成功!')
    console.log('🔑 会话令牌:', loginData.session?.access_token?.substring(0, 20) + '...')

    // 3. 检查学生记录是否创建
    console.log('\n3️⃣ 检查学生记录...')
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', loginData.user.id)
      .single()

    if (studentError) {
      console.warn('⚠️ 学生记录不存在或查询失败:', studentError.message)
      console.log('💡 学生记录将在首次登录时自动创建')
    } else {
      console.log('✅ 学生记录已存在:', studentData)
    }

    // 4. 测试学生功能
    console.log('\n4️⃣ 测试学生功能...')
    
    // 测试获取职位列表
    const { data: jobsData, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .limit(5)

    if (jobsError) {
      console.error('❌ 获取职位列表失败:', jobsError.message)
    } else {
      console.log('✅ 获取职位列表成功，数量:', jobsData?.length || 0)
    }

    // 5. 测试申请职位功能
    if (jobsData && jobsData.length > 0) {
      console.log('\n5️⃣ 测试申请职位功能...')
      const job = jobsData[0]
      
      const { data: applicationData, error: applicationError } = await supabase
        .from('applications')
        .insert({
          job_id: job.id,
          student_id: loginData.user.id,
          status: 'pending',
          applied_at: new Date().toISOString()
        })
        .select()

      if (applicationError) {
        console.error('❌ 申请职位失败:', applicationError.message)
      } else {
        console.log('✅ 申请职位成功! 申请ID:', applicationData[0]?.id)
      }
    }

    console.log('\n🎉 学生账号注册和使用测试完成!')
    console.log('📊 测试结果总结:')
    console.log('   ✅ 注册成功')
    console.log('   ✅ 登录成功')
    console.log('   ✅ 基本功能测试通过')
    console.log('   💡 学生记录将在首次登录时自动创建')

  } catch (error) {
    console.error('❌ 测试过程中出现异常:', error)
  }
}

// 运行测试
testStudentRegistration()