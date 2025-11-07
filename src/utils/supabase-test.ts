import { supabase } from '@/lib/supabase'

// Supabase 连接测试工具
export async function testSupabaseConnection() {
  console.log('🔍 开始测试 Supabase 连接...')
  
  try {
    // 1. 测试基础连接
    console.log('📡 测试基础连接...')
    const { error } = await supabase.from('messages').select('count').limit(1)
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('✅ 连接成功 - 表可能不存在（这是正常的）')
      } else {
        console.error('❌ 连接失败:', error.message)
        return false
      }
    } else {
      console.log('✅ 连接成功')
    }
    
    // 2. 测试认证
    console.log('🔐 测试认证...')
    const { error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.log('⚠️ 认证测试:', authError.message)
    } else {
      console.log('✅ 认证配置正常')
    }
    
    // 3. 测试实时订阅
    console.log('📢 测试实时订阅...')
    const channel = supabase.channel('test')
    const subscription = channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ 实时订阅正常')
        channel.unsubscribe()
      }
    })
    
    // 4. 测试存储
    console.log('💾 测试存储连接...')
    const { data: storageData, error: storageError } = await supabase.storage.listBuckets()
    
    if (storageError) {
      console.log('⚠️ 存储连接:', storageError.message)
    } else {
      console.log('✅ 存储连接正常')
    }
    
    console.log('🎉 Supabase 连接测试完成!')
    return true
    
  } catch (error) {
    console.error('❌ 测试过程中出错:', error)
    return false
  }
}

// 环境变量检查
export function checkEnvironment() {
  console.log('🔧 检查环境变量...')
  
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  
  console.log('📋 环境变量状态:')
  console.log(`   VITE_SUPABASE_URL: ${url ? '✅ 已配置' : '❌ 未配置'}`)
  console.log(`   VITE_SUPABASE_ANON_KEY: ${key ? '✅ 已配置' : '❌ 未配置'}`)
  
  if (url && key) {
    console.log('✅ 环境变量配置完整')
    return true
  } else {
    console.log('❌ 环境变量配置不完整')
    return false
  }
}