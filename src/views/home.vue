<template>
  <div class="flex-center min-h-screen">
    <h1 class="wps-title text-center">{{ msg }}</h1>
  </div>
</template>

<script>
export default {
  name: 'HelloWps',
  data() {
    return {
      msg: '欢迎来到wps加载项的世界!'
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>
