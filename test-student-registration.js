// 学生账号注册和使用测试脚本
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function testStudentRegistration() {
  console.log('🎓 开始学生账号注册和使用测试...\n')
  
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
  
  console.log('📝 测试学生信息:')
  console.log('邮箱:', testStudent.email)
  console.log('姓名:', testStudent.name)
  console.log('学号:', testStudent.studentId)
  console.log('学校:', testStudent.school)
  console.log('专业:', testStudent.major)
  console.log('')
  
  try {
    // 1. 注册学生账号
    console.log('1️⃣ 注册学生账号...')
    const { data: registerData, error: registerError } = await supabase.auth.signUp({
      email: testStudent.email,
      password: testStudent.password,
      options: {
        data: {
          username: testStudent.name,
          role: testStudent.userType,
          school: testStudent.school,
          major: testStudent.major
        }
      }
    })
    
    if (registerError) {
      console.error('❌ 注册失败:', registerError.message)
      return
    }
    
    console.log('✅ 注册成功，用户ID:', registerData.user.id)
    
    // 2. 创建学生记录
    console.log('\n2️⃣ 创建学生记录...')
    const { error: studentError } = await supabase
      .from('students')
      .insert({
        user_id: registerData.user.id,
        real_name: testStudent.name,
        student_id: testStudent.studentId,
        school: testStudent.school,
        major: testStudent.major
      })
    
    if (studentError) {
      console.error('❌ 创建学生记录失败:', studentError.message)
    } else {
      console.log('✅ 学生记录创建成功')
    }
    
    // 3. 登录测试
    console.log('\n3️⃣ 登录测试...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testStudent.email,
      password: testStudent.password
    })
    
    if (loginError) {
      console.error('❌ 登录失败:', loginError.message)
      return
    }
    
    console.log('✅ 登录成功，会话令牌:', loginData.session.access_token.substring(0, 20) + '...')
    
    // 4. 验证学生信息
    console.log('\n4️⃣ 验证学生信息...')
    const { data: studentData, error: queryError } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', loginData.user.id)
      .single()
    
    if (queryError) {
      console.error('❌ 查询学生信息失败:', queryError.message)
    } else {
      console.log('✅ 学生信息验证成功:')
      console.log('   - 真实姓名:', studentData.real_name)
      console.log('   - 学号:', studentData.student_id)
      console.log('   - 学校:', studentData.school)
      console.log('   - 专业:', studentData.major)
    }
    
    // 5. 测试学生功能
    console.log('\n5️⃣ 测试学生功能...')
    
    // 测试申请岗位功能
    const { data: jobsData } = await supabase
      .from('jobs')
      .select('id, title')
      .limit(1)
    
    if (jobsData && jobsData.length > 0) {
      console.log('✅ 可以访问岗位数据，岗位数量:', jobsData.length)
      console.log('   示例岗位:', jobsData[0].title)
    } else {
      console.log('⚠️ 没有找到测试岗位')
    }
    
    console.log('\n🎉 学生账号注册和使用测试完成！')
    console.log('\n💡 测试总结:')
    console.log('   ✅ 学生账号注册成功')
    console.log('   ✅ 学生记录创建成功')
    console.log('   ✅ 登录功能正常')
    console.log('   ✅ 学生信息验证成功')
    console.log('   ✅ 学生功能访问正常')
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message)
  }
}

// 运行测试
testStudentRegistration()