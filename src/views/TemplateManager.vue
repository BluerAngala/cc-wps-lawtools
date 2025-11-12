<template>
  <n-config-provider>
    <div class="p-2.5 h-screen overflow-y-auto scrollbar-none">
      <!-- 标题卡片 -->
      <div class="wps-card wps-section">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <span class="text-lg font-semibold">📄 文档模板管理</span>
            <n-tag type="info" size="small">{{ currentCategory }}</n-tag>
          </div>
          <n-button type="primary" @click="showSaveTemplateDialog">
            保存当前文档为模板
          </n-button>
        </div>

        <n-alert type="info" :closable="false" show-icon class="mb-4">
          <template #header>功能说明</template>
          <template #default>
            管理常用法律文书模板，支持快速应用模板到当前文档或新建文档。
          </template>
        </n-alert>
      </div>

      <!-- 分类标签 -->
      <div class="wps-card wps-section mt-4">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium text-gray-700">
            分类管理（{{ allCategories.length }}）
          </span>
          <n-button size="small" @click="showAddCategoryDialog = true">
            ➕ 新建分类
          </n-button>
        </div>
        
        <!-- 标签页 -->
        <n-tabs 
          v-model:value="currentCategory" 
          type="card" 
          animated
          pane-wrapper-style="padding-top: 10px"
        >
          <n-tab-pane 
            v-for="category in allCategories" 
            :key="category" 
            :name="category" 
            :tab="getCategoryIcon(category) + ' ' + category"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-gray-600">
                共 {{ getTemplatesByCategory(category).length }} 个模板
              </span>
              <n-button 
                v-if="!builtInCategories.includes(category)" 
                size="small" 
                type="error" 
                quaternary
                @click="deleteCategory(category)"
              >
                删除分类
              </n-button>
            </div>
            <TemplateList 
              :templates="getTemplatesByCategory(category)" 
              @apply="applyTemplate"
              @edit="editTemplate"
              @delete="deleteTemplate"
            />
          </n-tab-pane>
        </n-tabs>
      </div>

      <!-- 新建分类对话框 -->
      <n-modal v-model:show="showAddCategoryDialog" preset="dialog" title="新建分类">
        <n-form-item label="分类名称" required>
          <n-input 
            v-model:value="newCategoryName" 
            placeholder="请输入分类名称"
            @keyup.enter="addCategory"
          />
        </n-form-item>
        <template #action>
          <n-space>
            <n-button @click="showAddCategoryDialog = false">取消</n-button>
            <n-button type="primary" @click="addCategory">创建</n-button>
          </n-space>
        </template>
      </n-modal>

      <!-- 保存模板对话框 -->
      <n-modal 
        v-model:show="saveDialogVisible" 
        preset="dialog" 
        :title="selectedTemplateId ? '更新模板' : '保存为模板'"
        style="width: 800px"
      >
        <n-space vertical>
          <n-form-item label="选择现有模板（可选）">
            <n-select 
              v-model:value="selectedTemplateId" 
              :options="customTemplateOptions"
              placeholder="选择要更新的模板，或留空创建新模板"
              clearable
              @update:value="handleTemplateSelect"
            />
          </n-form-item>
          
          <n-alert v-if="selectedTemplateId" type="info" :closable="false" show-icon>
            将使用当前文档内容更新选中的模板
          </n-alert>
          
          <!-- 显示选中模板的内容预览 -->
          <n-card v-if="selectedTemplateId && previewContent" size="small" title="原模板内容预览">
            <n-scrollbar style="max-height: 200px">
              <pre class="text-xs whitespace-pre-wrap">{{ previewContent }}</pre>
            </n-scrollbar>
          </n-card>

          <n-form-item label="模板名称" required>
            <n-input v-model:value="newTemplate.name" placeholder="请输入模板名称" />
          </n-form-item>
          <n-form-item label="模板分类">
            <n-select 
              v-model:value="newTemplate.category" 
              :options="categoryOptions"
              placeholder="请选择分类"
            />
          </n-form-item>
          <n-form-item label="模板描述">
            <n-input 
              v-model:value="newTemplate.description" 
              type="textarea" 
              placeholder="请输入模板描述（可选）"
              :rows="3"
            />
          </n-form-item>
        </n-space>
        <template #action>
          <n-space>
            <n-button @click="saveDialogVisible = false">取消</n-button>
            <n-button type="primary" @click="saveTemplate">
              {{ selectedTemplateId ? '更新模板' : '保存新模板' }}
            </n-button>
          </n-space>
        </template>
      </n-modal>
    </div>
  </n-config-provider>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue'
import {
  NConfigProvider,
  NButton,
  NSpace,
  NTag,
  NAlert,
  NTabs,
  NTabPane,
  NModal,
  NFormItem,
  NInput,
  NSelect,
  NCard,
  NEmpty,
  NPopconfirm,
  NScrollbar
} from 'naive-ui'

console.log('文档模板管理页面已加载')

// 响应式数据
const currentCategory = ref('诉讼文书')
const saveDialogVisible = ref(false)
const templates = ref([])
const selectedTemplateId = ref(null)
const previewContent = ref('')
const customCategories = ref([]) // 自定义分类
const showAddCategoryDialog = ref(false)
const newCategoryName = ref('')
const newTemplate = ref({
  name: '',
  category: '自定义',
  description: '',
  content: ''
})

// 内置分类
const builtInCategories = ['诉讼文书', '合同模板', '律师函', '自定义']

// 分类选项（内置 + 自定义）
const categoryOptions = computed(() => {
  const options = [
    { label: '诉讼文书', value: '诉讼文书' },
    { label: '合同模板', value: '合同模板' },
    { label: '律师函', value: '律师函' },
    { label: '自定义', value: '自定义' }
  ]
  
  // 添加自定义分类
  customCategories.value.forEach(cat => {
    options.push({ label: cat, value: cat })
  })
  
  return options
})

// 所有分类（用于标签页）
const allCategories = computed(() => {
  return [...builtInCategories, ...customCategories.value]
})

// 自定义模板选项（用于更新）
const customTemplateOptions = computed(() => {
  const options = templates.value
    .filter(t => !t.isBuiltIn)
    .map(t => ({
      label: `${t.name} (${t.category})`,
      value: t.id
    }))
  console.log('自定义模板选项:', options)
  return options
})

// 从配置文件加载模板配置
const loadTemplateConfig = async () => {
  try {
    const response = await fetch('/templates/templates.json')
    if (!response.ok) {
      throw new Error('模板配置文件加载失败')
    }
    const data = await response.json()
    return data.templates || []
  } catch (error) {
    console.error('加载模板配置失败:', error)
    window.$message?.error('加载模板配置失败')
    return []
  }
}

// 获取模板文件的完整路径
const getTemplateFilePath = (fileName) => {
  // 开发环境和生产环境都使用相对路径
  const baseUrl = window.location.origin
  return `${baseUrl}/templates/${fileName}`
}

// 加载所有内置模板（只加载配置，不加载内容）
const loadBuiltInTemplates = async () => {
  const configs = await loadTemplateConfig()
  const templates = []
  
  for (const config of configs) {
    templates.push({
      id: config.id,
      name: config.name,
      category: config.category,
      description: config.description,
      scene: config.scene,
      fileName: config.fileName,
      isBuiltIn: config.isBuiltIn,
      content: '' // 内容按需加载
    })
  }
  
  console.log(`成功加载 ${templates.length} 个内置模板配置`)
  return templates
}

// 模板列表组件
const TemplateList = {
  props: ['templates'],
  emits: ['apply', 'delete', 'edit'],
  setup(props, { emit }) {
    const applyToCurrentDoc = (template) => {
      emit('apply', template, 'current')
    }

    const applyToNewDoc = (template) => {
      emit('apply', template, 'new')
    }

    const editTemplate = (template) => {
      emit('edit', template)
    }

    const deleteTemplate = (template) => {
      emit('delete', template)
    }

    return () => {
      if (!props.templates || props.templates.length === 0) {
        return h(NEmpty, { description: '暂无模板' })
      }

      return h(
        NSpace,
        { vertical: true, size: 'medium' },
        {
          default: () =>
            props.templates.map(template =>
              h(
                NCard,
                {
                  size: 'small',
                  hoverable: true,
                  class: 'template-card'
                },
                {
                  default: () => [
                h('div', { class: 'flex items-center justify-between mb-2' }, [
                  h('div', { class: 'flex items-center gap-2' }, [
                    h('span', { class: 'font-semibold' }, template.name),
                    template.isBuiltIn
                      ? h(NTag, { type: 'success', size: 'small' }, { default: () => '内置' })
                      : null
                  ]),
                  h(
                    NSpace,
                    { size: 'small' },
                    {
                      default: () =>
                        [
                          h(
                            NButton,
                            {
                              size: 'small',
                              type: 'primary',
                              onClick: () => applyToCurrentDoc(template)
                            },
                            { default: () => '应用到当前文档' }
                          ),
                          h(
                            NButton,
                            {
                              size: 'small',
                              onClick: () => applyToNewDoc(template)
                            },
                            { default: () => '新建文档' }
                          ),
                          !template.isBuiltIn
                            ? h(
                                NButton,
                                {
                                  size: 'small',
                                  type: 'info',
                                  quaternary: true,
                                  onClick: () => editTemplate(template)
                                },
                                { default: () => '编辑' }
                              )
                            : null,
                          !template.isBuiltIn
                            ? h(
                                NPopconfirm,
                                {
                                  onPositiveClick: () => deleteTemplate(template)
                                },
                                {
                                  trigger: () =>
                                    h(
                                      NButton,
                                      {
                                        size: 'small',
                                        type: 'error',
                                        quaternary: true
                                      },
                                      { default: () => '删除' }
                                    ),
                                  default: () => '确定删除此模板吗？'
                                }
                              )
                            : null
                        ].filter(Boolean)
                    }
                  )
                ]),
                    h('div', { class: 'text-sm text-gray-600 mb-1' }, template.description),
                    template.scene
                      ? h('div', { class: 'text-xs text-gray-500' }, [
                          h('span', { class: 'font-medium' }, '使用场景：'),
                          template.scene
                        ])
                      : null
                  ]
                }
              )
            )
        }
      )
    }
  }
}

// 获取指定分类的模板
const getTemplatesByCategory = (category) => {
  return templates.value.filter(t => t.category === category)
}

// 获取分类图标
const getCategoryIcon = (category) => {
  const icons = {
    诉讼文书: '📋',
    合同模板: '📝',
    律师函: '✉️',
    自定义: '⭐'
  }
  return icons[category] || '📁'
}


// 新建分类
const addCategory = () => {
  const name = newCategoryName.value.trim()
  
  if (!name) {
    window.$message?.warning('请输入分类名称')
    return
  }
  
  // 检查是否已存在
  if (builtInCategories.includes(name) || customCategories.value.includes(name)) {
    window.$message?.warning('该分类已存在')
    return
  }
  
  customCategories.value.push(name)
  saveCategoriesToStorage()
  currentCategory.value = name
  newCategoryName.value = ''
  showAddCategoryDialog.value = false
  window.$message?.success(`分类"${name}"已创建`)
}

// 删除分类
const deleteCategory = (category) => {
  // 检查是否有模板使用该分类
  const templatesInCategory = templates.value.filter(t => t.category === category)
  
  if (templatesInCategory.length > 0) {
    window.$message?.warning(`该分类下还有 ${templatesInCategory.length} 个模板，请先删除或移动模板`)
    return
  }
  
  const index = customCategories.value.indexOf(category)
  if (index !== -1) {
    customCategories.value.splice(index, 1)
    saveCategoriesToStorage()
    
    // 切换到第一个分类
    if (currentCategory.value === category) {
      currentCategory.value = builtInCategories[0]
    }
    
    window.$message?.success(`分类"${category}"已删除`)
  }
}

// 处理模板选择
const handleTemplateSelect = async (templateId) => {
  if (!templateId) {
    // 清空选择，创建新模板
    previewContent.value = ''
    newTemplate.value = {
      name: '',
      category: '自定义',
      description: '',
      content: ''
    }
    return
  }

  // 选择了现有模板，填充信息
  const template = templates.value.find(t => t.id === templateId)
  if (template) {
    // 显示原模板内容预览
    if (template.content) {
      previewContent.value = template.content
    } else {
      previewContent.value = '（模板内容为空）'
    }
    
    // 填充模板信息到表单
    newTemplate.value = {
      name: template.name,
      category: template.category,
      description: template.description,
      content: template.content
    }
  }
}

// 显示保存模板对话框
const showSaveTemplateDialog = () => {
  if (typeof window.Application === 'undefined') {
    window.$message?.error('请在 WPS 环境中使用此功能')
    return
  }

  const doc = window.Application.ActiveDocument
  if (!doc) {
    window.$message?.error('未找到活动文档')
    return
  }

  // 重置状态
  selectedTemplateId.value = null
  previewContent.value = ''
  newTemplate.value = {
    name: '',
    category: '自定义',
    description: '',
    content: ''
  }
  saveDialogVisible.value = true
}

// 保存模板
const saveTemplate = () => {
  if (!newTemplate.value.name.trim()) {
    window.$message?.warning('请输入模板名称')
    return
  }

  try {
    const doc = window.Application.ActiveDocument
    const content = doc.Range().Text

    if (selectedTemplateId.value) {
      // 选择了现有模板，直接更新
      const index = templates.value.findIndex(t => t.id === selectedTemplateId.value)
      if (index !== -1) {
        templates.value[index] = {
          ...templates.value[index],
          name: newTemplate.value.name.trim(),
          category: newTemplate.value.category,
          description: newTemplate.value.description,
          content: content,
          updatedAt: new Date().toISOString()
        }
        saveTemplatesToStorage()
        window.$message?.success(`模板"${newTemplate.value.name}"已更新`)
      }
    } else {
      // 没有选择模板，创建新模板
      const template = {
        id: 'custom_' + Date.now(),
        name: newTemplate.value.name.trim(),
        category: newTemplate.value.category,
        description: newTemplate.value.description,
        content: content,
        isBuiltIn: false,
        createdAt: new Date().toISOString()
      }
      templates.value.push(template)
      saveTemplatesToStorage()
      window.$message?.success(`模板"${newTemplate.value.name}"已保存`)
    }

    saveDialogVisible.value = false
  } catch (error) {
    console.error('保存模板失败:', error)
    window.$message?.error('保存失败: ' + error.message)
  }
}

// 应用模板
const applyTemplate = async (template, target) => {
  if (typeof window.Application === 'undefined') {
    window.$message?.error('请在 WPS 环境中使用此功能')
    return
  }

  try {
    if (template.isBuiltIn) {
      // 内置模板：直接打开 docx 文件
      const filePath = getTemplateFilePath(template.fileName || `${template.name}.docx`)
      
      if (target === 'new') {
        // 新建文档：直接打开模板文件
        window.Application.Documents.Open(filePath)
        window.$message?.success('已在新文档中打开模板')
      } else {
        // 应用到当前文档：先打开模板，复制内容，再粘贴到当前文档
        const doc = window.Application.ActiveDocument
        if (!doc) {
          window.$message?.error('未找到活动文档')
          return
        }
        
        const tempDoc = window.Application.Documents.Open(filePath, false, true)
        const content = tempDoc.Range().Text
        tempDoc.Close(false)
        
        doc.Range().Text = content
        window.$message?.success('已应用模板到当前文档')
      }
    } else {
      // 自定义模板：使用保存的文本内容
      if (target === 'new') {
        const newDoc = window.Application.Documents.Add()
        newDoc.Range().Text = template.content
        window.$message?.success('已在新文档中应用模板')
      } else {
        const doc = window.Application.ActiveDocument
        if (!doc) {
          window.$message?.error('未找到活动文档')
          return
        }
        doc.Range().Text = template.content
        window.$message?.success('已应用模板到当前文档')
      }
    }
  } catch (error) {
    console.error('应用模板失败:', error)
    window.$message?.error('应用失败: ' + error.message)
  }
}

// 编辑模板
const editTemplate = (template) => {
  selectedTemplateId.value = template.id
  previewContent.value = template.content || '（模板内容为空）'
  newTemplate.value = {
    name: template.name,
    category: template.category,
    description: template.description,
    content: template.content
  }
  saveDialogVisible.value = true
}

// 删除模板
const deleteTemplate = (template) => {
  const index = templates.value.findIndex(t => t.id === template.id)
  if (index !== -1) {
    templates.value.splice(index, 1)
    saveTemplatesToStorage()
    window.$message?.success('模板已删除')
  }
}

// 保存模板到本地存储
const saveTemplatesToStorage = () => {
  try {
    const customTemplates = templates.value.filter(t => !t.isBuiltIn)
    localStorage.setItem('law_templates', JSON.stringify(customTemplates))
  } catch (error) {
    console.error('保存模板到本地存储失败:', error)
  }
}

// 保存分类到本地存储
const saveCategoriesToStorage = () => {
  try {
    localStorage.setItem('law_categories', JSON.stringify(customCategories.value))
  } catch (error) {
    console.error('保存分类到本地存储失败:', error)
  }
}

// 从本地存储加载分类
const loadCategoriesFromStorage = () => {
  try {
    const stored = localStorage.getItem('law_categories')
    if (stored) {
      customCategories.value = JSON.parse(stored)
      console.log('已加载自定义分类:', customCategories.value.length, '个')
    }
  } catch (error) {
    console.error('从本地存储加载分类失败:', error)
    customCategories.value = []
  }
}

// 从本地存储加载模板
const loadTemplatesFromStorage = async () => {
  try {
    // 先加载内置模板
    const builtInTemplates = await loadBuiltInTemplates()
    
    // 再加载自定义模板
    const stored = localStorage.getItem('law_templates')
    if (stored) {
      const customTemplates = JSON.parse(stored)
      templates.value = [...builtInTemplates, ...customTemplates]
    } else {
      templates.value = [...builtInTemplates]
    }
    
    console.log('已加载模板:', templates.value.length, '个')
  } catch (error) {
    console.error('从本地存储加载模板失败:', error)
    window.$message?.error('加载模板失败')
    templates.value = []
  }
}

// 组件挂载时加载数据
onMounted(async () => {
  loadCategoriesFromStorage()
  await loadTemplatesFromStorage()
})
</script>

<style scoped>
/* 标签页滚动优化 */
:deep(.n-tabs-nav-scroll-content) {
  display: flex;
  gap: 4px;
}

:deep(.n-tabs-tab) {
  padding: 8px 16px !important;
  min-width: auto !important;
  white-space: nowrap;
}

:deep(.n-tabs-nav-scroll-wrapper) {
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
  scroll-behavior: smooth;
}

:deep(.n-tabs-nav-scroll-wrapper)::-webkit-scrollbar {
  height: 6px;
}

:deep(.n-tabs-nav-scroll-wrapper)::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

:deep(.n-tabs-nav-scroll-wrapper)::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

:deep(.n-tabs-nav-scroll-wrapper)::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>

