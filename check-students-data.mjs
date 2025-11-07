import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少环境变量')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkStudentsData() {
  console.log('🔍 检查学生数据...\n')
  
  // 1. 检查所有学生数据
  console.log('1️⃣ 检查所有学生数据:')
  const { data: allStudents, error: allError } = await supabase
    .from('students')
    .select('*')
    .limit(10)
  
  if (allError) {
    console.error('❌ 查询学生数据失败:', allError)
  } else {
    console.log(`✅ 找到 ${allStudents?.length || 0} 个学生记录`)
    if (allStudents && allStudents.length > 0) {
      allStudents.forEach((student, index) => {
        console.log(`   ${index + 1}. ID: ${student.id}, 姓名: ${student.name || '未设置'}, 用户ID: ${student.user_id || '未设置'}`)
      })
    }
  }
  
  console.log('\n2️⃣ 检查特定学生ID: 41a8c56c-6cf7-42c2-8924-33ef954949ad')
  const { data: specificStudent, error: specificError } = await supabase
    .from('students')
    .select('*')
    .eq('id', '41a8c56c-6cf7-42c2-8924-33ef954949ad')
    .single()
  
  if (specificError) {
    console.error('❌ 查询特定学生失败:', specificError)
  } else if (specificStudent) {
    console.log('✅ 找到特定学生:')
    console.log('   ID:', specificStudent.id)
    console.log('   姓名:', specificStudent.name || '未设置')
    console.log('   用户ID:', specificStudent.user_id || '未设置')
    console.log('   邮箱:', specificStudent.email || '未设置')
  } else {
    console.log('⚠️ 未找到ID为 41a8c56c-6cf7-42c2-8924-33ef954949ad 的学生')
  }
  
  console.log('\n3️⃣ 检查学生表结构:')
  const { data: columns, error: columnsError } = await supabase
    .from('students')
    .select('*')
    .limit(1)
  
  if (columnsError) {
    console.error('❌ 检查表结构失败:', columnsError)
  } else if (columns && columns.length > 0) {
    console.log('✅ 表结构字段:')
    Object.keys(columns[0]).forEach(key => {
      console.log(`   - ${key}`)
    })
  }
}

checkStudentsData().catch(console.error)