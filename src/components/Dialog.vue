<template>
  <div class="p-4">
    <div class="text-base min-h-95%">
      <div class="ml-1 mb-18 text-base break-words">
        这是一个网页，按<span class="font-bold">"F12"</span>可以打开调试器。
      </div>
      <div class="ml-1 mb-18 text-base break-words">
        这个示例展示了wps加载项的相关基础能力，与B/S业务系统的交互，请用浏览器打开：
        <span class="font-bold text-slate-600 cursor-pointer" @click="onOpenWeb()">{{
          DemoSpan
        }}</span>
      </div>
      <div class="ml-1 mb-18 text-base break-words">
        开发文档:
        <span class="font-bold text-slate-600">https://open.wps.cn/docs/office</span>
      </div>
      <hr class="wps-divider" />
      <div class="ml-1 mb-18 text-base break-words">
        <button class="btn-secondary m-1" @click="onDocNameClick()">取文件名</button>
        <button class="btn-secondary m-1" @click="onbuttonclick('createTaskPane')">
          创建任务窗格
        </button>
        <button class="btn-secondary m-1" @click="onbuttonclick('newDoc')">新建文件</button>
        <button class="btn-secondary m-1" @click="onbuttonclick('addString')">
          文档开头添加字符串
        </button>
        <button class="btn-secondary m-1" @click="onbuttonclick('closeDoc')">关闭文件</button>
      </div>
      <hr class="wps-divider" />
      <div class="ml-1 mb-18 text-base break-words">
        文档文件名为：<span class="font-medium">{{ docName }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted } from 'vue'
import dlgFunc from '../wps/dialog.js'
import axios from 'axios'
export default {
  name: 'DemoDialog',
  data() {
    return {
      DemoSpan: '',
      docName: ''
    }
  },
  methods: {
    onbuttonclick(id) {
      return dlgFunc.onbuttonclick(id)
    },
    onDocNameClick() {
      this.docName = dlgFunc.onbuttonclick('getDocName')
    },
    onOpenWeb() {
      dlgFunc.onbuttonclick('openWeb', this.DemoSpan)
    }
  }
}
onMounted(() => {
  axios.get('/.debugTemp/NotifyDemoUrl').then((res) => {
    this.DemoSpan = res.data
  })
})
</script>

<!-- 样式已迁移到 UnoCSS 类 -->
<style scoped>
/* 自定义样式保留在这里，其他使用 UnoCSS 类 */
</style>
