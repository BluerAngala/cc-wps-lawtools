<template>
  <RouterView />
</template>

<style scoped></style>

<script>
import { ref, onMounted } from 'vue'

// 引入ribbon.js 主要的逻辑
import ribbon from './components/ribbon.js'
export default {
  setup() {
    const message = ref('你好，wps加载项')
    onMounted(() => {
      window.ribbon = ribbon
    })

    return {
      message
    }
  }
}
</script>

