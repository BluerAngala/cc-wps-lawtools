<template>
  <div class="wps-section">
    <el-card shadow="never">
      <template #header>
        <div class="wps-header">
          <span class="wps-title">WPS操作</span>
        </div>
      </template>

      <el-space wrap>
        <el-button size="small" @click="onbuttonclick('getDocName')" :icon="Document">
          获取文件名
        </el-button>
        <el-button size="small" @click="onbuttonclick('addString')" :icon="Plus">
          添加字符串
        </el-button>
        <el-button size="small" @click="onbuttonclick('insertDateTime')" :icon="Clock">
          插入时间
        </el-button>
        <el-button size="small" @click="onbuttonclick('addHeader')" :icon="DocumentAdd">
          添加页眉
        </el-button>
        <el-button size="small" @click="onbuttonclick('addComment')" :icon="ChatDotRound">
          添加批注
        </el-button>
        <el-button size="small" @click="onbuttonclick('extractText')" :icon="DocumentCopy">
          提取文本
        </el-button>
        <el-button size="small" @click="onbuttonclick('dockLeft')" :icon="Back">
          停靠左边
        </el-button>
        <el-button size="small" @click="onbuttonclick('dockRight')" :icon="Right">
          停靠右边
        </el-button>
        <el-button size="small" @click="onbuttonclick('hideTaskPane')" :icon="Hide">
          隐藏窗格
        </el-button>
        <el-button size="small" @click="onbuttonclick('renameDoc')" :icon="Edit">
          重命名文档
        </el-button>
        <el-button size="small" @click="onbuttonclick('createTaskPane')" :icon="Grid">
          创建任务窗格
        </el-button>
        <el-button size="small" @click="onbuttonclick('newDoc')" :icon="DocumentAdd">
          新建文件
        </el-button>
        <el-button size="small" @click="onbuttonclick('closeDoc')" :icon="Close">
          关闭文件
        </el-button>
      </el-space>

      <el-divider />

      <div class="flex items-center gap-2 mt-2">
        <el-text>当前文档：{{ docName || '未获取' }}</el-text>
        <el-button size="small" type="text" @click="refreshDocName" :icon="Refresh">
          刷新
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import {
  Document,
  Plus,
  Clock,
  DocumentAdd,
  ChatDotRound,
  DocumentCopy,
  Back,
  Right,
  Hide,
  Edit,
  Grid,
  Close,
  Refresh
} from '@element-plus/icons-vue'
import { wpsService } from '../../wps/util.js'
import routeManager from '../../wps/RouteManager.js'

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
      Document,
      Plus,
      Clock,
      DocumentAdd,
      ChatDotRound,
      DocumentCopy,
      Back,
      Right,
      Hide,
      Edit,
      Grid,
      Close,
      Refresh
    }
  }
}
</script>

<style scoped>
/* WPS操作组件样式已迁移到 UnoCSS 类 */
</style>
