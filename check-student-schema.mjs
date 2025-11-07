import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少环境变量')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkStudentSchema() {
  console.log('🔍 检查学生表结构...\n')
  
  // 检查学生表是否存在
  console.log('1️⃣ 检查学生表是否存在:')
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', 'students')
  
  if (tablesError) {
    console.error('❌ 检查表失败:', tablesError)
  } else if (tables && tables.length > 0) {
    console.log('✅ 学生表存在')
  } else {
    console.log('❌ 学生表不存在')
    return
  }
  
  // 检查学生表字段
  console.log('\n2️⃣ 检查学生表字段:')
  const { data: columns, error: columnsError } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, is_nullable')
    .eq('table_schema', 'public')
    .eq('table_name', 'students')
    .order('ordinal_position')
  
  if (columnsError) {
    console.error('❌ 检查字段失败:', columnsError)
  } else if (columns && columns.length > 0) {
    console.log('✅ 学生表字段:')
    columns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? '可空' : '非空'})`)
    })
  } else {
    console.log('❌ 学生表没有字段')
  }
  
  // 尝试查询一条记录来查看实际结构
  console.log('\n3️⃣ 尝试查询学生数据:')
  const { data: sampleData, error: sampleError } = await supabase
    .from('students')
    .select('*')
    .limit(1)
  
  if (sampleError) {
    console.error('❌ 查询样本数据失败:', sampleError)
  } else if (sampleData && sampleData.length > 0) {
    console.log('✅ 样本数据字段:')
    Object.keys(sampleData[0]).forEach(key => {
      console.log(`   - ${key}: ${sampleData[0][key]}`)
    })
  } else {
    console.log('⚠️ 学生表为空')
  }
}

checkStudentSchema().catch(console.error)