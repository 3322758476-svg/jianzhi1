<template>
  <el-dialog
    v-model="visible"
    :title="job ? '编辑岗位' : '发布新岗位'"
    width="600px"
    :before-close="handleClose"
  >
    <el-form 
      :model="form" 
      :rules="rules" 
      ref="formRef" 
      label-width="100px"
      label-position="top"
    >
      <!-- 基本信息 -->
      <el-form-item label="岗位标题" prop="title">
        <el-input 
          v-model="form.title" 
          placeholder="请输入岗位标题，如：前端开发实习生"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="薪资范围" prop="salary">
        <el-input 
          v-model="form.salary" 
          placeholder="例如：200-300元/天 或 面议"
        />
      </el-form-item>

      <el-form-item label="工作地点" prop="location">
        <el-input 
          v-model="form.location" 
          placeholder="请输入详细的工作地点"
        />
      </el-form-item>

      <el-form-item label="工作时间" prop="workTime">
        <el-input 
          v-model="form.workTime" 
          placeholder="例如：每周3-5天，9:00-18:00"
        />
      </el-form-item>

      <el-form-item label="招聘人数" prop="recruitCount">
        <el-input-number 
          v-model="form.recruitCount" 
          :min="1" 
          :max="50" 
          controls-position="right"
        />
        <div class="form-tip">请输入需要招聘的人数</div>
      </el-form-item>

      <!-- 岗位描述 -->
      <el-form-item label="岗位描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="6"
          placeholder="请详细描述岗位职责、任职要求、工作内容等"
          maxlength="1000"
          show-word-limit
        />
      </el-form-item>

      <!-- 岗位标签 -->
      <el-form-item label="岗位标签" prop="tags">
        <el-select
          v-model="form.tags"
          multiple
          filterable
          allow-create
          placeholder="请选择或输入标签"
          style="width: 100%"
        >
          <el-option
            v-for="tag in commonTags"
            :key="tag"
            :label="tag"
            :value="tag"
          />
        </el-select>
        <div class="form-tip">标签有助于学生更好地了解岗位要求</div>
      </el-form-item>

      <!-- 其他信息 -->
      <el-form-item label="岗位类型" prop="jobType">
        <el-radio-group v-model="form.jobType">
          <el-radio label="实习">实习</el-radio>
          <el-radio label="兼职">兼职</el-radio>
          <el-radio label="全职">全职</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="学历要求" prop="education">
        <el-select v-model="form.education" placeholder="请选择学历要求">
          <el-option label="不限" value="不限" />
          <el-option label="高中及以上" value="高中及以上" />
          <el-option label="大专及以上" value="大专及以上" />
          <el-option label="本科及以上" value="本科及以上" />
          <el-option label="硕士及以上" value="硕士及以上" />
        </el-select>
      </el-form-item>

      <el-form-item label="截止日期" prop="deadline">
        <el-date-picker
          v-model="form.deadline"
          type="date"
          placeholder="选择截止日期"
          :disabled-date="disabledDate"
        />
      </el-form-item>

      <!-- 福利待遇 -->
      <el-form-item label="福利待遇" prop="benefits">
        <el-checkbox-group v-model="form.benefits">
          <el-checkbox label="五险一金">五险一金</el-checkbox>
          <el-checkbox label="带薪年假">带薪年假</el-checkbox>
          <el-checkbox label="餐补">餐补</el-checkbox>
          <el-checkbox label="交通补贴">交通补贴</el-checkbox>
          <el-checkbox label="节日福利">节日福利</el-checkbox>
          <el-checkbox label="定期体检">定期体检</el-checkbox>
          <el-checkbox label="团建活动">团建活动</el-checkbox>
          <el-checkbox label="技能培训">技能培训</el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <!-- 联系方式 -->
      <el-form-item label="联系人" prop="contactPerson">
        <el-input 
          v-model="form.contactPerson" 
          placeholder="请输入联系人姓名"
        />
      </el-form-item>

      <el-form-item label="联系电话" prop="contactPhone">
        <el-input 
          v-model="form.contactPhone" 
          placeholder="请输入联系电话"
        />
      </el-form-item>

      <el-form-item label="联系邮箱" prop="contactEmail">
        <el-input 
          v-model="form.contactEmail" 
          placeholder="请输入联系邮箱"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          {{ job ? '更新岗位' : '发布岗位' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'

interface Props {
  visible: boolean
  job?: any
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'submit', jobData: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = ref(props.visible)
const loading = ref(false)
const formRef = ref()

// 表单数据
const form = reactive({
  title: '',
  salary: '',
  location: '',
  workTime: '',
  recruitCount: 1,
  description: '',
  tags: [],
  jobType: '实习',
  education: '不限',
  deadline: '',
  benefits: [],
  contactPerson: '',
  contactPhone: '',
  contactEmail: ''
})

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入岗位标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  salary: [
    { required: true, message: '请输入薪资范围', trigger: 'blur' }
  ],
  location: [
    { required: true, message: '请输入工作地点', trigger: 'blur' }
  ],
  workTime: [
    { required: true, message: '请输入工作时间', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入岗位描述', trigger: 'blur' },
    { min: 10, max: 1000, message: '描述长度在 10 到 1000 个字符', trigger: 'blur' }
  ],
  contactPerson: [
    { required: true, message: '请输入联系人', trigger: 'blur' }
  ],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  contactEmail: [
    { required: true, message: '请输入联系邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

// 常用标签
const commonTags = [
  '前端开发', '后端开发', '移动端', 'UI设计', '产品经理', '运营', '市场', 
  '销售', '客服', '行政', '财务', 'React', 'Vue', 'Angular', 'Node.js', 
  'Python', 'Java', 'Spring Boot', 'MySQL', 'Redis', 'Docker', 'Linux',
  '数据分析', '机器学习', '人工智能', '大数据', '云计算', '物联网'
]

// 监听可见性变化
watch(() => props.visible, (newVal) => {
  visible.value = newVal
  if (newVal) {
    nextTick(() => {
      resetForm()
      if (props.job) {
        // 编辑模式，填充数据
        Object.assign(form, props.job)
      }
    })
  }
})

// 监听visible变化
watch(visible, (newVal) => {
  emit('update:visible', newVal)
})

// 禁用过去的日期
const disabledDate = (time: Date) => {
  return time.getTime() < Date.now() - 8.64e7
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(form, {
    title: '',
    salary: '',
    location: '',
    workTime: '',
    recruitCount: 1,
    description: '',
    tags: [],
    jobType: '实习',
    education: '不限',
    deadline: '',
    benefits: [],
    contactPerson: '',
    contactPhone: '',
    contactEmail: ''
  })
}

// 关闭对话框
const handleClose = () => {
  visible.value = false
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    loading.value = true
    
    // 验证表单
    await formRef.value.validate()
    
    // 准备提交数据 - 只保留数据库表中存在的字段
    const jobData = {
      title: form.title,
      description: form.description,
      salary_range: form.salary,
      work_location: form.location,
      work_hours: form.workTime,
      recruit_count: form.recruitCount,
      skills_required: form.tags,
      category: form.jobType,
      job_type: form.jobType === '实习' ? 'internship' : 
                form.jobType === '兼职' ? 'part_time' : 'full_time',
      application_deadline: form.deadline ? new Date(form.deadline).toISOString() : null
    }
    
    // 触发提交事件
    emit('submit', jobData)
    
    // 关闭对话框
    handleClose()
    
    ElMessage.success(props.job ? '岗位更新成功' : '岗位发布成功')
  } catch (error) {
    ElMessage.error('请检查表单输入')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: #303133;
}

:deep(.el-checkbox-group) {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

@media (max-width: 768px) {
  :deep(.el-checkbox-group) {
    grid-template-columns: 1fr;
  }
}
</style>