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
          <n-button type="primary" size="small" @click="showSaveTemplateDialog">
            保存为模板
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
            <div v-if="getTemplatesByCategory(category).length === 0" class="py-8">
              <n-empty description="暂无模板" />
            </div>
            <n-space v-else vertical :size="16">
              <n-card
                v-for="template in getTemplatesByCategory(category)"
                :key="template.id"
                size="small"
                hoverable
                class="min-w-0"
              >
                <!-- 标题行 -->
                <div class="flex items-center gap-2 mb-2">
                  <span 
                    class="font-semibold text-base flex-1"
                    :title="template.name"
                  >
                    {{ template.name }}
                  </span>
                  <n-tag v-if="template.isBuiltIn" type="success" size="small">
                    内置
                  </n-tag>
                </div>
                
                <!-- 描述 -->
                <div 
                  class="text-sm text-gray-600 mb-2 line-clamp-2 overflow-hidden"
                  :title="template.description"
                >
                  {{ template.description }}
                </div>
                
                <!-- 使用场景 -->
                <div v-if="template.scene" class="text-xs text-gray-500 mb-3">
                  <span class="font-medium">使用场景：</span>
                  {{ template.scene }}
                </div>
                
                <!-- 按钮组 -->
                <div class="grid gap-2" :class="template.isBuiltIn ? 'grid-cols-2' : 'grid-cols-4'">
                  <n-button
                    size="small"
                    type="primary"
                    @click="applyTemplate(template, 'current')"
                  >
                    插入本文
                  </n-button>
                  <n-button
                    size="small"
                    type="info"
                    @click="applyTemplate(template, 'new')"
                  >
                    新建文档
                  </n-button>
                  <n-button
                    v-if="!template.isBuiltIn"
                    size="small"
                    type="info"
                    @click="editTemplate(template)"
                  >
                    编辑
                  </n-button>
                  <n-popconfirm
                    v-if="!template.isBuiltIn"
                    @positive-click="deleteTemplate(template)"
                  >
                    <template #trigger>
                      <n-button
                        size="small"
                        type="error"
                        class="w-full"
                      >
                        删除
                      </n-button>
                    </template>
                    确定删除此模板吗？
                  </n-popconfirm>
                </div>
              </n-card>
            </n-space>
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
        <n-space vertical :size="12">
          <n-form-item label="选择现有模板（可选）" :show-feedback="false">
            <n-select 
              v-model:value="selectedTemplateId" 
              :options="customTemplateOptions"
              placeholder="选择要更新的模板，或留空创建新模板"
              clearable
              size="small"
              @update:value="handleTemplateSelect"
            />
          </n-form-item>
          
          <n-alert v-if="selectedTemplateId" type="info" :closable="false" show-icon size="small">
            将使用当前文档内容更新选中的模板
          </n-alert>

          <n-form-item label="模板名称" required :show-feedback="false">
            <n-input v-model:value="newTemplate.name" placeholder="请输入模板名称" size="small" />
          </n-form-item>
          <n-form-item label="模板分类" :show-feedback="false">
            <n-select 
              v-model:value="newTemplate.category" 
              :options="categoryOptions"
              placeholder="请选择分类"
              size="small"
            />
          </n-form-item>
          <n-form-item label="模板描述" :show-feedback="false">
            <n-input 
              v-model:value="newTemplate.description" 
              type="textarea" 
              placeholder="请输入模板描述（可选）"
              :rows="2"
              size="small"
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
import { ref, computed, onMounted } from 'vue'
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
  NPopconfirm
} from 'naive-ui'
import { templateManager } from '../utils/templateManager.js'

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
const builtInCategories = [
  '诉讼文书', 
  '合同模板', 
  '律师函', 
  '其他文书',
  '法律意见书',
  '公司治理文书',
  '知识产权文书',
  '劳动人事文书',
  '自定义'
]

// 分类选项（内置 + 自定义）
const categoryOptions = computed(() => {
  const options = [
    { label: '诉讼文书', value: '诉讼文书' },
    { label: '合同模板', value: '合同模板' },
    { label: '律师函', value: '律师函' },
    { label: '其他文书', value: '其他文书' },
    { label: '法律意见书', value: '法律意见书' },
    { label: '公司治理文书', value: '公司治理文书' },
    { label: '知识产权文书', value: '知识产权文书' },
    { label: '劳动人事文书', value: '劳动人事文书' },
    { label: '自定义', value: '自定义' }
  ]
  
  // 添加自定义分类
  customCategories.value.forEach(cat => {
    if (!options.find(opt => opt.value === cat)) {
      options.push({ label: cat, value: cat })
    }
  })
  
  return options
})

// 所有分类（用于标签页）
const allCategories = computed(() => {
  return [...builtInCategories, ...customCategories.value]
})

// 所有模板选项（用于更新）- 包括内置模板和自定义模板
const customTemplateOptions = computed(() => {
  const options = templates.value.map(t => ({
    label: `${t.name} (${t.category})${t.isBuiltIn ? ' [内置]' : ''}`,
    value: t.id
  }))
  console.log('可选模板数量:', options.length)
  return options
})

// 获取模板文件的完整路径
const getTemplateFilePath = (template) => {
  // 优先使用 fileUrl（完整 URL）
  if (template.fileUrl) {
    return template.fileUrl
  }
  // 如果有 filePath，判断是否为完整 URL
  if (template.filePath) {
    // 如果是完整 URL（以 http:// 或 https:// 开头），直接使用
    if (template.filePath.startsWith('http://') || template.filePath.startsWith('https://')) {
      return template.filePath
    }
    // 如果是相对路径，转换为完整 URL
    if (template.filePath.startsWith('/')) {
      return window.location.origin + template.filePath
    }
    // 其他情况直接返回
    return template.filePath
  }
  // 否则使用相对路径（兼容旧版本）
  const fileName = template.fileName || `${template.name}.docx`
  const baseUrl = window.location.origin
  return `${baseUrl}/templates/${fileName}`
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
    其他文书: '📄',
    法律意见书: '⚖️',
    公司治理文书: '🏢',
    知识产权文书: '💡',
    劳动人事文书: '👔',
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
const saveTemplate = async () => {
  if (!newTemplate.value.name.trim()) {
    window.$message?.warning('请输入模板名称')
    return
  }

  if (typeof window.Application === 'undefined') {
    window.$message?.error('请在 WPS 环境中使用此功能')
    return
  }

  try {
    const doc = window.Application.ActiveDocument
    if (!doc) {
      window.$message?.error('未找到活动文档')
      return
    }

    const templateName = newTemplate.value.name.trim()
    const fileName = `${templateName}.docx`
    const fs = window.Application.FileSystem
    
    // 获取配置目录（使用与 appConfig 相同的目录）
    const homeDir = window.Application.Env.GetHomePath()
    if (!homeDir) {
      window.$message?.error('无法获取用户主目录')
      return
    }
    
    const configDir = homeDir.replace(/\\/g, '/').replace(/\/+$/, '') + '/wps_addon_config'
    const templatesDir = configDir + '/templates'
    
    // 确保目录存在
    if (!fs.Exists(configDir)) {
      fs.Mkdir(configDir)
    }
    if (!fs.Exists(templatesDir)) {
      fs.Mkdir(templatesDir)
    }
    
    // 保存文档到配置目录
    const templatePath = templatesDir + '/' + fileName
    
    try {
      // 使用 SaveAs2 保存文档
      doc.SaveAs2(templatePath, 16) // 16 = wdFormatDocumentDefault (.docx)
      console.log('模板文件已保存到:', templatePath)
      
      // 创建模板配置
      const template = {
        id: selectedTemplateId.value || templateName.replace(/\s+/g, '_') + '_' + Date.now(),
        name: templateName,
        category: newTemplate.value.category,
        description: newTemplate.value.description,
        fileName: fileName,
        filePath: templatePath, // 保存完整路径
        scene: newTemplate.value.scene || '',
        isBuiltIn: false, // 用户保存的模板标记为自定义
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      if (selectedTemplateId.value) {
        // 更新现有模板
        const index = templates.value.findIndex(t => t.id === selectedTemplateId.value)
        if (index !== -1) {
          templates.value[index] = {
            ...templates.value[index],
            ...template,
            updatedAt: new Date().toISOString()
          }
        }
      } else {
        // 添加新模板
        templates.value.push(template)
      }

      // 保存配置到文件系统
      const saveResult = templateManager.saveTemplates(templates.value)
      
      if (saveResult) {
        window.$message?.success(`模板"${templateName}"已保存`)
        saveDialogVisible.value = false
      } else {
        window.$message?.error('保存模板配置失败')
      }
    } catch (saveError) {
      console.error('保存文件失败:', saveError)
      window.$message?.error('保存文件失败: ' + saveError.message)
    }
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
      const filePath = getTemplateFilePath(template)
      
      if (target === 'new') {
        // 新建文档：直接打开模板文件
        window.Application.Documents.Open(filePath)
        window.$message?.success('已在新文档中打开模板')
      } else {
        // 应用到当前文档：清空原文后粘贴模板（保留模板格式）
        const doc = window.Application.ActiveDocument
        if (!doc) {
          window.$message?.error('未找到活动文档')
          return
        }

        // 打开模板文件并复制内容（包含格式）
        const tempDoc = window.Application.Documents.Open(filePath, false, true)
        const templateRange = tempDoc.Range()
        templateRange.Copy()
        tempDoc.Close(false)

        // 激活当前文档并清空全部内容
        doc.Activate()
        doc.Range().Select()
        let selection = window.Application.Selection
        if (!selection) {
          window.$message?.error('无法获取文档选区，请重试')
          return
        }
        selection.WholeStory()
        selection.Delete()
        selection.Collapse(0)

        // 粘贴模板内容，完整保留格式
        selection.Paste()

        window.$message?.success('已应用模板到当前文档')
      }
    } else {
      // 自定义模板：使用保存的 docx 文件
      const filePath = getTemplateFilePath(template)
      
      if (target === 'new') {
        // 新建文档：直接打开模板文件
        window.Application.Documents.Open(filePath)
        window.$message?.success('已在新文档中打开模板')
      } else {
        // 应用到当前文档：清空后复制模板格式
        const doc = window.Application.ActiveDocument
        if (!doc) {
          window.$message?.error('未找到活动文档')
          return
        }
        
        // 清空当前文档内容
        const docRange = doc.Range()
        docRange.Delete()
        
        // 打开模板文件
        const tempDoc = window.Application.Documents.Open(filePath, false, true)
        const templateRange = tempDoc.Range()
        
        // 复制模板内容（包含格式）
        templateRange.Copy()
        tempDoc.Close(false)
        
        // 粘贴到当前文档（保留格式）
        docRange.Paste()
        
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

// 保存模板配置
const saveTemplatesToStorage = () => {
  try {
    const saveResult = templateManager.saveTemplates(templates.value)
    if (saveResult) {
      console.log('模板配置已保存')
    } else {
      console.error('保存模板配置失败')
    }
  } catch (error) {
    console.error('保存模板失败:', error)
  }
}

// 保存分类到 WPS 持久化存储
const saveCategoriesToStorage = () => {
  try {
    const dataToSave = JSON.stringify(customCategories.value)
    
    window.Application.PluginStorage.setItem('law_categories', dataToSave)
    console.log('分类已保存到 WPS PluginStorage')
  } catch (error) {
    console.error('保存分类失败:', error)
    window.$message?.error('保存分类失败: ' + error.message)
  }
}

// 从 WPS 持久化存储加载分类
const loadCategoriesFromStorage = () => {
  try {
    const stored = window.Application.PluginStorage.getItem('law_categories')
    
    if (stored) {
      customCategories.value = JSON.parse(stored)
      console.log('已加载自定义分类:', customCategories.value.length, '个')
    }
  } catch (error) {
    console.error('加载分类失败:', error)
    customCategories.value = []
  }
}

// 从配置目录加载所有模板
const loadTemplatesFromStorage = async () => {
  try {
    // 使用 templateManager 加载模板
    const allTemplates = await templateManager.loadTemplates()
    templates.value = allTemplates
    
    console.log('已加载模板:', templates.value.length, '个')
  } catch (error) {
    console.error('加载模板失败:', error)
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
</style>

