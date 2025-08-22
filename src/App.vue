<template>
  <RouterView />
</template>

<style scoped></style>

<script>
import { ref, onMounted } from 'vue'

// 引入ribbon.js 主要的逻辑
import ribbon from './backgroundjs/ribbon.js'



export default {
  setup() {
    const message = ref('你好，wps加载项')
    console.log(message.value)

    console.log("window" , window)

    
    onMounted(() => {
      window.ribbon = ribbon
    })

    console.log('App组件已加载')

    return {
      message
    }
  }
}
</script>

