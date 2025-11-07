import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少环境变量')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestStudent() {
  console.log('🧪 创建测试学生数据...\n')
  
  // 首先检查是否已经有学生数据
  console.log('1️⃣ 检查现有学生数据:')
  const { data: existingStudents, error: checkError } = await supabase
    .from('students')
    .select('*')
    .limit(5)
  
  if (checkError) {
    console.error('❌ 检查学生数据失败:', checkError)
  } else {
    console.log(`📊 现有学生数量: ${existingStudents?.length || 0}`)
  }
  
  // 创建测试学生数据
  console.log('\n2️⃣ 创建测试学生:')
  const testStudent = {
    id: '41a8c56c-6cf7-42c2-8924-33ef954949ad',
    real_name: '测试学生',
    student_id: 'test001',
    phone: '13800138000',
    school: '测试大学',
    major: '计算机科学',
    grade: '大三',
    user_id: '41a8c56c-6cf7-42c2-8924-33ef954949ad', // 使用相同的ID作为用户ID
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  const { data: insertedStudent, error: insertError } = await supabase
    .from('students')
    .insert(testStudent)
    .select()
    .single()
  
  if (insertError) {
    console.error('❌ 创建学生数据失败:', insertError)
    
    // 如果是因为学生已存在，尝试更新
    if (insertError.code === '23505') { // 唯一约束冲突
      console.log('🔄 学生已存在，尝试更新数据...')
      const { data: updatedStudent, error: updateError } = await supabase
        .from('students')
        .update(testStudent)
        .eq('id', testStudent.id)
        .select()
        .single()
      
      if (updateError) {
        console.error('❌ 更新学生数据失败:', updateError)
      } else {
        console.log('✅ 学生数据更新成功:', updatedStudent)
      }
    }
  } else {
    console.log('✅ 学生数据创建成功:', insertedStudent)
  }
  
  // 验证学生数据
  console.log('\n3️⃣ 验证学生数据:')
  const { data: verifiedStudent, error: verifyError } = await supabase
    .from('students')
    .select('*')
    .eq('id', '41a8c56c-6cf7-42c2-8924-33ef954949ad')
    .single()
  
  if (verifyError) {
    console.error('❌ 验证学生数据失败:', verifyError)
  } else {
    console.log('✅ 学生数据验证成功:')
    console.log('   ID:', verifiedStudent.id)
    console.log('   姓名:', verifiedStudent.real_name)
    console.log('   用户ID:', verifiedStudent.user_id)
    console.log('   学号:', verifiedStudent.student_id)
  }
  
  console.log('\n🎉 测试学生数据创建完成')
}

createTestStudent().catch(console.error)