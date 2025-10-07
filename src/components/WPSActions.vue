<template>
  <div class="wps-section">
    <n-card title="WPS操作" size="small">
      <n-space wrap>
        <n-button size="small" @click="onbuttonclick('getDocName')">
          <template #icon><DocumentIcon /></template>
          获取文件名
        </n-button>
        <n-button size="small" @click="onbuttonclick('addString')">
          <template #icon><AddIcon /></template>
          添加字符串
        </n-button>
        <n-button size="small" @click="onbuttonclick('insertDateTime')">
          <template #icon><TimeIcon /></template>
          插入时间
        </n-button>
        <n-button size="small" @click="onbuttonclick('addHeader')">
          <template #icon><DocumentAddIcon /></template>
          添加页眉
        </n-button>
        <n-button size="small" @click="onbuttonclick('addComment')">
          <template #icon><ChatboxIcon /></template>
          添加批注
        </n-button>
        <n-button size="small" @click="onbuttonclick('extractText')">
          <template #icon><CopyIcon /></template>
          提取文本
        </n-button>
        <n-button size="small" @click="onbuttonclick('dockLeft')">
          <template #icon><ArrowBackIcon /></template>
          停靠左边
        </n-button>
        <n-button size="small" @click="onbuttonclick('dockRight')">
          <template #icon><ArrowForwardIcon /></template>
          停靠右边
        </n-button>
        <n-button size="small" @click="onbuttonclick('hideTaskPane')">
          <template #icon><EyeOffIcon /></template>
          隐藏窗格
        </n-button>
        <n-button size="small" @click="onbuttonclick('renameDoc')">
          <template #icon><CreateIcon /></template>
          重命名文档
        </n-button>
        <n-button size="small" @click="onbuttonclick('createTaskPane')">
          <template #icon><GridIcon /></template>
          创建任务窗格
        </n-button>
        <n-button size="small" @click="onbuttonclick('newDoc')">
          <template #icon><DocumentAddIcon /></template>
          新建文件
        </n-button>
        <n-button size="small" @click="onbuttonclick('closeDoc')">
          <template #icon><CloseIcon /></template>
          关闭文件
        </n-button>
      </n-space>

      <n-divider />

      <div class="flex items-center gap-2 mt-2">
        <n-text>当前文档：{{ docName || '未获取' }}</n-text>
        <n-button size="small" text @click="refreshDocName">
          <template #icon><RefreshIcon /></template>
          刷新
        </n-button>
      </div>
    </n-card>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { NCard, NButton, NSpace, NDivider, NText } from 'naive-ui'
import {
  DocumentOutline as DocumentIcon,
  Add as AddIcon,
  Time as TimeIcon,
  DocumentAdd as DocumentAddIcon,
  Chatbox as ChatboxIcon,
  Copy as CopyIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  EyeOff as EyeOffIcon,
  Create as CreateIcon,
  Grid as GridIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon
} from '@vicons/ionicons5'
import { wpsService } from '../wps/util.js'
import routeManager from '../wps/RouteManager.js'

export default {
  name: 'WPSActions',
  emits: ['action-result'],
  setup(props, { emit }) {
    const docName = ref('')

    const onbuttonclick = async (action) => {
      try {
        let result

        // 使用RouteManager处理任务窗格相关操作
        if (action === 'createTaskPane') {
          result = routeManager.openTaskPane('taskpane')
        } else if (action === 'dockLeft') {
          routeManager.dockTaskPane('taskpane', 'left')
          result = '已停靠到左边'
        } else if (action === 'dockRight') {
          routeManager.dockTaskPane('taskpane', 'right')
          result = '已停靠到右边'
        } else if (action === 'hideTaskPane') {
          routeManager.hideTaskPane('taskpane')
          result = '已隐藏任务窗格'
        } else {
          // 其他操作使用wpsService
          result = await wpsService[action]()
        }

        if (action === 'getDocName') {
          docName.value = result
        }
        emit('action-result', { action, result })
        return result
      } catch (error) {
        console.error(`WPS操作失败 [${action}]:`, error)
        emit('action-result', { action, error })
      }
    }

    const refreshDocName = () => {
      onbuttonclick('getDocName')
    }

    onMounted(() => {
      refreshDocName()
    })

    return {
      docName,
      onbuttonclick,
      refreshDocName,
      DocumentIcon,
      AddIcon,
      TimeIcon,
      DocumentAddIcon,
      ChatboxIcon,
      CopyIcon,
      ArrowBackIcon,
      ArrowForwardIcon,
      EyeOffIcon,
      CreateIcon,
      GridIcon,
      CloseIcon,
      RefreshIcon
    }
  }
}
</script>

<style scoped>
/* WPS操作组件样式已迁移到 UnoCSS 类 */
</style>
