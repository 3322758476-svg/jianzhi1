<template>
  <div class="messages-page">
    <MessageList ref="messageListRef" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MessageList from '@/components/MessageList.vue'

const messageListRef = ref()

// 页面刷新方法
const refreshPage = () => {
  if (messageListRef.value) {
    messageListRef.value.refreshContent()
  }
}

// 暴露方法给父组件
defineExpose({
  refreshPage
})
</script>

<style scoped>
.messages-page {
  padding: 20px;
  min-height: calc(100vh - 100px);
}
</style>