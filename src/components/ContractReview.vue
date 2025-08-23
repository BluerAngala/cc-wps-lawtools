<template>
  <div class="contract-review">
    <el-card class="header-card" shadow="never">
      <h2>合同审查</h2>
      <p>陈恒律师独立开发的智能合同审查工具！😀</p>
    </el-card>

    <div class="content">
      <!-- 操作按钮 -->
      <div class="action-bar-center">
        <el-space size="large">
          <el-button type="primary" @click="showRuleDialog = true" :icon="Plus">
            新建规则
          </el-button>
          <el-button type="success" @click="() => saveConfigToLocal(true)" :icon="Document">
            保存配置
          </el-button>
          <el-button type="warning" @click="resetConfig" :icon="Refresh">
            重置配置
          </el-button>
        </el-space>
      </div>

      <!-- 常用规则列表 -->
      <el-card class="rules-card" shadow="hover">
        <template #header>
          <h3>常用审查规则</h3>
        </template>
        <el-collapse v-model="activeRules" accordion>
          <el-collapse-item v-for="rule in rules" :key="rule.name" :name="rule.name">
            <template #title>
              <div class="collapse-header">
                <span class="rule-title">{{ rule.icon }} {{ rule.title }}</span>
                <el-button type="primary" @click.stop="executeRule(rule.name)" size="small" :icon="VideoPlay">
                  执行
                </el-button>
              </div>
            </template>
            <div class="rule-content">

              <!-- 规则描述 -->
              <el-alert :title="rule.description" type="info" :closable="false" show-icon />
              <div class="rule-config" v-if="rule.configForm">

                <el-form label-width="80px" label-position="top">
                  <el-form-item v-for="(field, key) in rule.configForm" :key="key" :label="field.label">
                    <el-input v-if="field.type === 'text'" v-model="field.value" :placeholder="field.placeholder" />
                    <el-select v-else-if="field.type === 'select'" v-model="field.value" style="width: 100%">
                      <el-option v-for="option in field.options" :key="option" :label="option" :value="option" />
                    </el-select>
                    <el-input-number v-else-if="field.type === 'number'" v-model="field.value"
                      :placeholder="field.placeholder" />
                    <!-- 关键词列表配置 -->
                    <div v-else-if="field.type === 'keywordList'" class="keyword-list-config" style="margin-top: 10px;">
                      <div v-for="(item, index) in field.value" :key="index" class="keyword-item">
                        <div class="keyword-title">关键词</div>
                        <el-button type="danger" @click="removeKeyword(field, index)" size="small" :icon="Delete" circle
                          class="delete-btn" />
                        <div class="keyword-row">
                          <el-input v-model="item.keyword" placeholder="请输入关键词" size="small" class="keyword-input" />
                        </div>
                        <div class="comment-title">批注内容</div>
                        <el-input v-model="item.comment" placeholder="请输入批注内容" size="small" class="comment-input" />
                      </div>
                      <el-button type="primary" @click="addKeyword(field)" :icon="Plus" size="small"
                        class="add-keyword-btn">
                        添加关键词
                      </el-button>
                    </div>
                    <!-- 标签输入框配置 -->
                    <div v-else-if="field.type === 'tags'" class="tags-config">
                      <div class="tags-display">
                        <el-tag v-for="(tag, index) in field.value" :key="index" closable
                          @close="removeTag(field, index)" class="tag-item">
                          {{ tag }}
                        </el-tag>
                      </div>
                      <div class="tag-input-row">
                        <el-input v-model="field.inputValue" placeholder="输入数据要素" @keyup.enter="addTag(field)"
                          class="tag-input">
                        </el-input>
                        <el-button type="primary" @click="addTag(field)" :icon="Plus" size="small" class="add-tag-btn">
                          添加
                        </el-button>
                      </div>
                    </div>
                  </el-form-item>
                </el-form>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </el-card>
    </div>

    <!-- 新建规则对话框 -->
    <el-dialog v-model="showRuleDialog" title="新建审查规则" width="500px" :before-close="handleClose">
      <el-form :model="newRule" label-width="100px">
        <el-form-item label="规则名称" required>
          <el-input v-model="newRule.name" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="规则类型" required>
          <el-select v-model="newRule.type" placeholder="请选择规则类型" style="width: 100%">
            <el-option v-for="rule in rules" :key="rule.name" :value="rule.name"
              :label="`${rule.icon} ${rule.title}`" />
          </el-select>
        </el-form-item>
        <el-form-item label="规则描述">
          <el-input v-model="newRule.description" type="textarea" :rows="3" placeholder="请输入规则描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRuleDialog = false">取消</el-button>
        <el-button type="primary" @click="createRule">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Document, Refresh, VideoPlay, Delete } from '@element-plus/icons-vue'
import taskPane from '../backgroundjs/taskpane.js'

console.log('合同审查组件已加载')

// 响应式数据
const showRuleDialog = ref(false)
const activeRules = ref('')
const newRule = ref({
  name: '',
  type: 'header',
  description: ''
})

// 默认规则配置
const DEFAULT_RULES = [
  {
    name: 'extractText',
    icon: '🤖',
    title: 'AI抽取合同信息',
    description: '使用AI智能提取合同关键信息',
    configForm: {
      extractTags: {
        label: '提取数据要素',
        type: 'tags',
        value: ['甲方名称', '乙方名称', '合同金额'],
        inputValue: ''
      }
    }
  },
  {
    name: 'contractReview',
    icon: '⚖️',
    title: 'AI合同预审',
    description: 'AI预审合同，使用自定义规则更灵活',
    configForm: {
      reviewRules: {
        label: '规则名称',
        type: 'text',
        value: '审查争议解决条款',
        placeholder: '请输入预审规则名称'
      },
      reviewRequirements: {
        label: '审查要求',
        type: 'text',
        value: '审查合同是否存在争议解决条款，约定纠纷处理是仲裁还是法院，争议解决条款是否有效？',
        placeholder: '请输入具体的审查要求'
      },
      actionType: {
        label: '执行动作',
        type: 'select',
        value: '批注',
        options: ['批注', '修订']
      }
    }
  },
  {
    name: 'addHeader',
    icon: '📄',
    title: '添加页眉',
    description: '为文档添加标准页眉信息',
    configForm: {
      headerText: {
        label: '页眉文本',
        type: 'text',
        value: '合同编号',
        placeholder: '请输入页眉文本'
      },
      fontSize: {
        label: '字体大小',
        type: 'select',
        value: '12pt',
        options: ['10pt', '12pt', '14pt', '16pt']
      },
      alignment: {
        label: '对齐方式',
        type: 'select',
        value: '右对齐',
        options: ['左对齐', '居中', '右对齐']
      }
    }
  },
  {
    name: 'keywordComment',
    icon: '🔍',
    title: '关键词批注',
    description: '识别关键词并添加批注',
    configForm: {
      keywordList: {
        type: 'keywordList',
        value: [
          { keyword: '违约', comment: '此处涉及违约条款，需重点关注' },
          { keyword: '责任', comment: '责任条款，请仔细审查' },
          { keyword: '赔偿', comment: '赔偿相关条款，注意金额和条件' },
          { keyword: '终止', comment: '合同终止条件，需明确约定' }
        ]
      }
    }
  },
  {
    name: 'analyzeDocStructure',
    icon: '📋',
    title: '分析文档内容结构',
    description: '自动抽取出文档的一级标题、二级标题、三级标题',
    configForm: {
      // 不需要配置具体内容，保持为空对象
    }
  }

]

// 规则配置
const rules = ref(JSON.parse(JSON.stringify(DEFAULT_RULES)))

// 执行结果映射
const resultMessages = {
  addHeader: '页眉添加成功！',
  keywordComment: '关键词批注添加完成！',
  extractText: 'AI合同信息抽取完成！',
  contractReview: 'AI合同预审完成！',
  analyzeDocStructure: '文档内容结构分析完成！'
}

// 执行规则
const executeRule = async (ruleType) => {
  console.log('执行规则:', ruleType)
  const loadingMessage = ElMessage.info('正在执行中...')

  try {
    // 获取当前规则的配置参数
    const currentRule = rules.value.find(rule => rule.name === ruleType)
    const config = currentRule?.configForm || {}

    // 提取配置参数的值
    const params = {}
    Object.keys(config).forEach(key => {
      params[key] = config[key].value
    })

    console.log('执行参数:', params)

    // 根据规则类型调用相应的任务面板方法
    const actionMap = {
      addHeader: () => taskPane.onbuttonclick('addHeader', {
        headerText: params.headerText,
        fontSize: params.fontSize,
        alignment: params.alignment
      }),
      keywordComment: () => taskPane.onbuttonclick('addComment', {
        keywordList: params.keywordList
      }),
      extractText: () => taskPane.onbuttonclick('extractText', {
        extractContent: params.extractTags || []
      }),
      contractReview: () => taskPane.onbuttonclick('contractReview', {
        reviewRules: params.reviewRules,
        reviewRequirements: params.reviewRequirements,
        actionType: params.actionType === '批注' ? 'comment' : 'revision'
      }),
      analyzeDocStructure: () => taskPane.onbuttonclick('analyzeDocStructure', {})
    }

    if (actionMap[ruleType]) {
      // 等待WPS API执行完成
      await actionMap[ruleType]()

      // 额外等待一小段时间确保WPS完成渲染
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    loadingMessage.close()
    ElMessage.success(resultMessages[ruleType] || '规则执行完成！')
  } catch (error) {
    console.error('规则执行失败:', error)
    loadingMessage.close()
    ElMessage.error('规则执行失败，请检查文档状态。')
  }
}

// 创建新规则
const createRule = () => {
  if (!newRule.value.name.trim()) {
    ElMessage.warning('请输入规则名称')
    return
  }

  console.log('创建新规则:', newRule.value)

  // 这里可以将规则保存到本地存储或发送到服务器
  ElMessage.success(`新规则 "${newRule.value.name}" 创建成功！`)

  // 重置表单
  newRule.value = {
    name: '',
    type: 'addHeader',
    description: ''
  }

  showRuleDialog.value = false
}

// 处理对话框关闭
const handleClose = (done) => {
  done()
}

// 添加关键词
const addKeyword = (field) => {
  field.value.push({ keyword: '', comment: '' })
}

// 删除关键词
const removeKeyword = (field, index) => {
  field.value.splice(index, 1)
}

// 添加标签
const addTag = (field) => {
  const inputValue = field.inputValue?.trim()
  if (inputValue && !field.value.includes(inputValue)) {
    field.value.push(inputValue)
    field.inputValue = ''
  }
}

// 删除标签
const removeTag = (field, index) => {
  field.value.splice(index, 1)
}

// 重置配置到默认值
const resetConfig = () => {
  rules.value = JSON.parse(JSON.stringify(DEFAULT_RULES))
  localStorage.removeItem(STORAGE_KEY)
  ElMessage.success('配置已重置为默认值')
}

// 本地存储键名
const STORAGE_KEY = 'contract_review_rules_config'

// 保存配置到本地存储
const saveConfigToLocal = (showMessage = false) => {
  try {
    const configData = {
      rules: rules.value,
      timestamp: Date.now()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configData))
    console.log('配置已保存到本地存储')
    if (showMessage) {
      ElMessage.success('配置已保存到本地存储')
    }
  } catch (error) {
    console.error('保存配置失败:', error)
    if (showMessage) {
      ElMessage.error('保存配置失败')
    }
  }
}

// 从本地存储加载配置
const loadConfigFromLocal = () => {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY)
    if (savedData) {
      const configData = JSON.parse(savedData)
      if (configData.rules && Array.isArray(configData.rules)) {
        rules.value = configData.rules
        console.log('已从本地存储加载配置')
        ElMessage.success('已加载上次保存的配置')
        return true
      }
    }
  } catch (error) {
    console.error('加载配置失败:', error)
  }
  return false
}

// 监听规则配置变化，自动保存
watch(rules, () => {
  saveConfigToLocal()
}, { deep: true })

// 组件挂载时的初始化
onMounted(() => {
  console.log('合同审查组件已挂载')
  // 加载本地保存的配置
  loadConfigFromLocal()
})
</script>

<style scoped>
.contract-review {
  padding: 10px;
  height: 100vh;
  overflow-y: auto;
  /* 隐藏滚动条但保持滚动功能 */
  scrollbar-width: none;
  /* Firefox */
  -ms-overflow-style: none;
  /* IE and Edge */
}

.contract-review::-webkit-scrollbar {
  display: none;
  /* Chrome, Safari and Opera */
}

.header-card {
  margin-bottom: 20px;
}

.header-card h2 {
  color: #333;
  margin: 0 0 10px 0;
  font-size: 24px;
}

.header-card p {
  color: #666;
  margin: 0;
  font-size: 14px;
}

.action-bar {
  margin-bottom: 20px;
}

.rules-card {
  margin-bottom: 20px;
}

.rules-card h3 {
  color: #333;
  margin: 0;
  font-size: 18px;
}

.collapse-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding-right: 10px;
}

.rule-title {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.rule-content {
  padding: 16px 0;
}

.rule-config {
  margin-top: 16px;
}

.keyword-list-config {
  width: 100%;
}

.keyword-item {
  margin-bottom: 8px;
  padding: 8px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  position: relative;
}

.keyword-item:last-child {
  margin-bottom: 0;
}

.keyword-title,
.comment-title {
  font-size: 11px;
  color: #606266;
  margin-bottom: 2px;
  font-weight: 500;
}

.keyword-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.keyword-input {
  flex: 1;
  margin-right: 30px;
}

.delete-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  padding: 0;
}

.comment-input {
  width: 100%;
  margin-top: 2px;
}

.add-keyword-btn {
  margin-top: 12px;
  width: 100%;
}

.tags-config {
  width: 100%;
}

.tags-display {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px;
  min-height: 40px;
  background: #f8f9fa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  margin-bottom: 8px;
  align-items: flex-start;
  align-content: flex-start;
}

.tags-display:empty {
  display: none;
}

.tag-input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.tag-input {
  flex: 1;
}

.add-tag-btn {
  flex-shrink: 0;
}

.tag-item {
  margin: 2px;
  font-size: 12px;
}

.action-bar-center {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}
</style>