<template>
  <PageLayout>
    <!-- 标题卡片 -->
    <PageHeader
      title="文档模板管理"
      icon="📄"
      description="管理常用法律文书模板，支持快速应用模板到当前文档或新建文档。"
    >
      <template #tag>
        <n-tag type="info" size="small">{{ currentCategory }}</n-tag>
      </template>
      <template #actions>
        <n-button type="primary" size="small" @click="showSaveTemplateDialog">
          保存为模板
        </n-button>
      </template>
    </PageHeader>

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
                v-if="!builtInCategories.includes(category) && category !== '自定义'" 
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
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { NButton, NSpace, NTag, NAlert, NTabs, NTabPane, NModal, NFormItem, NInput, NSelect, NCard, NEmpty, NPopconfirm } from '../components/naive-components.js'
import { PageLayout, PageHeader } from '../components/common'
import { templateManager } from '../utils/templateManager.js'
import { pathManager } from '../utils/pathManager.js'
import unifiedLogger from '../utils/unifiedLogger.js'

unifiedLogger.info('文档模板管理页面已加载', {
  component: 'TemplateManager',
  timestamp: new Date().toISOString()
})

// 响应式数据
const currentCategory = ref('')
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

// 从模板数据中提取所有分类（动态，保持配置文件顺序）
const builtInCategories = computed(() => {
  // 使用数组保持顺序，而不是 Set
  const categories = []
  const seen = new Set()
  let hasOtherDocs = false // 记录是否有"其他文书"分类
  
  templates.value.forEach(template => {
    if (template.isBuiltIn && template.category && !seen.has(template.category)) {
      // "其他文书"分类暂不添加，留到最后
      if (template.category === '其他文书') {
        hasOtherDocs = true
      } else {
        categories.push(template.category)
        seen.add(template.category)
      }
    }
  })
  
  // 添加"其他文书"分类（在"自定义"之前）
  if (hasOtherDocs) {
    categories.push('其他文书')
    seen.add('其他文书')
  }
  
  // 确保"自定义"分类始终存在（放在最后）
  if (!seen.has('自定义')) {
    categories.push('自定义')
  }
  
  return categories
})

// 分类选项（从模板数据动态生成 + 自定义分类，保持配置文件顺序）
const categoryOptions = computed(() => {
  const options = []
  const seen = new Set()
  let hasOtherDocs = false // 记录是否有"其他文书"分类
  
  // 从模板数据中提取所有分类（保持顺序，但"其他文书"暂不添加）
  templates.value.forEach(template => {
    if (template.category && !seen.has(template.category)) {
      // "其他文书"分类暂不添加，留到最后
      if (template.category === '其他文书') {
        hasOtherDocs = true
      } else {
        options.push({ label: template.category, value: template.category })
        seen.add(template.category)
      }
    }
  })
  
  // 添加自定义分类（在模板分类之后，"其他文书"之前）
  customCategories.value.forEach(cat => {
    if (!seen.has(cat) && cat !== '其他文书') {
      options.push({ label: cat, value: cat })
      seen.add(cat)
    }
  })
  
  // 添加"其他文书"分类（在"自定义"之前）
  if (hasOtherDocs) {
    options.push({ label: '其他文书', value: '其他文书' })
    seen.add('其他文书')
  }
  
  // 确保"自定义"分类存在（放在最后）
  if (!seen.has('自定义')) {
    options.push({ label: '自定义', value: '自定义' })
  }
  
  return options
})

// 所有分类（用于标签页）- 从模板数据动态提取，保持配置文件顺序
const allCategories = computed(() => {
  const categories = []
  const seen = new Set()
  let hasOtherDocs = false // 记录是否有"其他文书"分类
  
  // 从模板中提取所有分类（保持配置文件中的出现顺序，但"其他文书"暂不添加）
  templates.value.forEach(template => {
    if (template.category && !seen.has(template.category)) {
      // "其他文书"分类暂不添加，留到最后
      if (template.category === '其他文书') {
        hasOtherDocs = true
      } else {
        categories.push(template.category)
        seen.add(template.category)
      }
    }
  })
  
  // 添加自定义分类（在模板分类之后，"其他文书"之前）
  customCategories.value.forEach(cat => {
    if (!seen.has(cat) && cat !== '其他文书') {
      categories.push(cat)
      seen.add(cat)
    }
  })
  
  // 添加"其他文书"分类（在"自定义"之前）
  if (hasOtherDocs) {
    categories.push('其他文书')
    seen.add('其他文书')
  }
  
  // 确保"自定义"分类存在（放在最后）
  if (!seen.has('自定义')) {
    categories.push('自定义')
  }
  
  return categories
})

// 所有模板选项（用于更新）- 包括内置模板和自定义模板
const customTemplateOptions = computed(() => {
  const options = templates.value.map(t => ({
    label: `${t.name} (${t.category})${t.isBuiltIn ? ' [内置]' : ''}`,
    value: t.id
  }))
  unifiedLogger.debug('可选模板数量', { count: options.length })
  return options
})

/**
 * 获取当前页面的基础路径（兼容调试和生产环境）
 * 打包后插件在 %ProgramData%\...\jsaddons\插件名\，需要基于 location.href 构建绝对路径
 */
const getBasePath = () => {
  try {
    const url = new URL(window.location.href)
    // 去掉路径中的文件名和 hash
    const pathname = url.pathname.replace(/\/[^/]+$/, '') || '/'
    
    // 处理 file:// 协议（host 为空）
    if (url.protocol === 'file:') {
      return `${url.protocol}//${pathname}/`
    }
    
    // 处理 http/https 协议
    return `${url.protocol}//${url.host}${pathname}/`
  } catch (error) {
    // 如果 URL 解析失败，使用简单方法
    const href = window.location.href
    const base = href.replace(/\/[^/]+$/, '/').replace(/#.*$/, '')
    unifiedLogger.warn('URL 解析失败，使用备用方法', { href, base })
    return base
  }
}

// 获取模板文件的路径（本地文件）
const getTemplateFilePath = (template) => {
  unifiedLogger.debug('开始获取模板文件路径', {
    templateId: template.id,
    templateName: template.name,
    hasFilePath: !!template.filePath,
    hasFileName: !!template.fileName
  })
  
  // 优先使用 filePath（本地文件路径）
  if (template.filePath) {
    unifiedLogger.logPath('info', '使用 filePath 作为模板路径', {
      templateId: template.id,
      templateName: template.name,
      filePath: template.filePath
    })
    return template.filePath
  }
  
  // 如果没有 filePath，使用 fileName 构建基于 location.href 的绝对路径
  // 确保打包后也能正确读取（public/templates 会被原样拷贝）
  const fileName = template.fileName || `${template.name}.docx`
  const basePath = getBasePath()
  const fallbackPath = `${basePath}templates/${fileName}`
  
  unifiedLogger.logPath('info', '使用默认路径构建模板路径', {
    templateId: template.id,
    templateName: template.name,
    fileName,
    fallbackPath,
    basePath,
    locationHref: window.location.href
  })
  
  return fallbackPath
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
  
  // 检查是否已存在（包括从模板中提取的分类）
  const allExistingCategories = new Set([
    ...builtInCategories.value,
    ...customCategories.value
  ])
  
  if (allExistingCategories.has(name)) {
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
      const firstCategory = allCategories.value.length > 0 ? allCategories.value[0] : '自定义'
      currentCategory.value = firstCategory
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
  unifiedLogger.info('开始保存模板', {
    templateName: newTemplate.value.name,
    category: newTemplate.value.category,
    isUpdate: !!selectedTemplateId.value
  })
  
  if (!newTemplate.value.name.trim()) {
    unifiedLogger.warn('模板名称为空，无法保存')
    window.$message?.warning('请输入模板名称')
    return
  }

  if (typeof window.Application === 'undefined') {
    unifiedLogger.error('WPS 环境不可用，无法保存模板')
    window.$message?.error('请在 WPS 环境中使用此功能')
    return
  }

  try {
    const doc = window.Application.ActiveDocument
    if (!doc) {
      unifiedLogger.error('未找到活动文档，无法保存模板')
      window.$message?.error('未找到活动文档')
      return
    }

    const templateName = newTemplate.value.name.trim()
    const fileName = `${templateName}.docx`
    
    // 使用统一路径管理器获取模板目录
    const templatesDir = pathManager.getTemplatesDir()
    
    unifiedLogger.logPath('info', '获取模板目录', {
      templatesDir,
      fileName,
      method: 'saveTemplate'
    })
    
    if (!templatesDir) {
      unifiedLogger.error('无法获取模板目录', {
        method: 'saveTemplate'
      })
      window.$message?.error('无法获取模板目录')
      return
    }
    
    // 确保目录存在
    if (!pathManager.ensureDir(templatesDir)) {
      unifiedLogger.error('创建模板目录失败', { templatesDir })
      window.$message?.error('创建模板目录失败')
      return
    }
    
    unifiedLogger.logPath('info', '模板目录已就绪', { templatesDir })
    
    // 保存文档到配置目录
    const templatePath = templatesDir + '/' + fileName
    
    unifiedLogger.logPath('info', '准备保存模板文件', {
      templatePath,
      fileName,
      templateName
    })
    
    try {
      // 使用 SaveAs2 保存文档
      doc.SaveAs2(templatePath, 16) // 16 = wdFormatDocumentDefault (.docx)
      unifiedLogger.logFileOperation('save', templatePath, 'success', null)
      unifiedLogger.info('模板文件已保存', {
        templatePath,
        fileName,
        templateName
      })
      
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

      unifiedLogger.logTemplate('create', {
        templateId: template.id,
        templateName: template.name,
        filePath: template.filePath,
        isUpdate: !!selectedTemplateId.value
      })

      if (selectedTemplateId.value) {
        // 更新现有模板
        unifiedLogger.info('更新现有模板', {
          templateId: selectedTemplateId.value,
          templateName: templateName
        })
        const index = templates.value.findIndex(t => t.id === selectedTemplateId.value)
        if (index !== -1) {
          templates.value[index] = {
            ...templates.value[index],
            ...template,
            updatedAt: new Date().toISOString()
          }
          unifiedLogger.info('模板已更新', {
            templateId: template.id,
            templateName: template.name
          })
        } else {
          unifiedLogger.warn('未找到要更新的模板', {
            templateId: selectedTemplateId.value
          })
        }
      } else {
        // 添加新模板
        unifiedLogger.info('添加新模板', {
          templateId: template.id,
          templateName: template.name
        })
        templates.value.push(template)
      }

      // 保存配置到文件系统
      unifiedLogger.debug('保存模板配置到文件系统')
      const saveResult = templateManager.saveTemplates(templates.value)
      
      if (saveResult) {
        unifiedLogger.info(`模板"${templateName}"已保存成功`, {
          templateId: template.id,
          templateName: template.name
        })
        window.$message?.success(`模板"${templateName}"已保存`)
        saveDialogVisible.value = false
      } else {
        unifiedLogger.error('保存模板配置失败', {
          templateId: template.id,
          templateName: template.name
        })
        window.$message?.error('保存模板配置失败')
      }
    } catch (saveError) {
      unifiedLogger.error('保存文件失败', {
        templateName,
        templatePath,
        error: saveError.message,
        stack: saveError.stack
      })
      window.$message?.error('保存文件失败: ' + saveError.message)
    }
  } catch (error) {
    unifiedLogger.error('保存模板失败', {
      templateName: newTemplate.value.name,
      error: error.message,
      stack: error.stack
    })
    window.$message?.error('保存失败: ' + error.message)
  }
}


// 应用模板
const applyTemplate = async (template, target) => {
  unifiedLogger.logTemplate('apply', {
    templateId: template.id,
    templateName: template.name,
    isBuiltIn: template.isBuiltIn,
    target
  })
  
  if (typeof window.Application === 'undefined') {
    unifiedLogger.error('WPS 环境不可用，无法应用模板', {
      templateId: template.id,
      templateName: template.name
    })
    window.$message?.error('请在 WPS 环境中使用此功能')
    return
  }

  try {
    const filePath = getTemplateFilePath(template)
    
    unifiedLogger.logPath('info', '准备应用模板', {
      templateId: template.id,
      templateName: template.name,
      filePath,
      target,
      isBuiltIn: template.isBuiltIn
    })
    
    if (template.isBuiltIn) {
      // 内置模板：直接打开 docx 文件
      if (target === 'new') {
        // 新建文档：直接打开模板文件
        unifiedLogger.info('在新文档中打开内置模板', {
          templateId: template.id,
          templateName: template.name,
          filePath
        })
        window.Application.Documents.Open(filePath)
        window.$message?.success('已在新文档中打开模板')
      } else {
        // 应用到当前文档：清空原文后粘贴模板（保留模板格式）
        const doc = window.Application.ActiveDocument
        if (!doc) {
          unifiedLogger.error('未找到活动文档', {
            templateId: template.id,
            templateName: template.name
          })
          window.$message?.error('未找到活动文档')
          return
        }

        unifiedLogger.info('在当前文档中应用内置模板', {
          templateId: template.id,
          templateName: template.name,
          filePath
        })

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
          unifiedLogger.error('无法获取文档选区', {
            templateId: template.id,
            templateName: template.name
          })
          window.$message?.error('无法获取文档选区，请重试')
          return
        }
        selection.WholeStory()
        selection.Delete()
        selection.Collapse(0)

        // 粘贴模板内容，完整保留格式
        selection.Paste()

        unifiedLogger.info('内置模板已应用到当前文档', {
          templateId: template.id,
          templateName: template.name
        })
        window.$message?.success('已应用模板到当前文档')
      }
    } else {
      // 自定义模板：使用保存的 docx 文件
      if (target === 'new') {
        // 新建文档：直接打开模板文件
        unifiedLogger.info('在新文档中打开自定义模板', {
          templateId: template.id,
          templateName: template.name,
          filePath
        })
        window.Application.Documents.Open(filePath)
        window.$message?.success('已在新文档中打开模板')
      } else {
        // 应用到当前文档：清空后复制模板格式
        const doc = window.Application.ActiveDocument
        if (!doc) {
          unifiedLogger.error('未找到活动文档', {
            templateId: template.id,
            templateName: template.name
          })
          window.$message?.error('未找到活动文档')
          return
        }
        
        unifiedLogger.info('在当前文档中应用自定义模板', {
          templateId: template.id,
          templateName: template.name,
          filePath
        })
        
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
        
        unifiedLogger.info('自定义模板已应用到当前文档', {
          templateId: template.id,
          templateName: template.name
        })
        window.$message?.success('已应用模板到当前文档')
      }
    }
  } catch (error) {
    unifiedLogger.error('应用模板失败', {
      templateId: template.id,
      templateName: template.name,
      target,
      error: error.message,
      stack: error.stack
    })
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
      unifiedLogger.info('模板配置已保存', {
        templateCount: templates.value.length
      })
    } else {
      unifiedLogger.error('保存模板配置失败', {
        templateCount: templates.value.length
      })
    }
  } catch (error) {
    unifiedLogger.error('保存模板失败', {
      error: error.message,
      stack: error.stack
    })
  }
}

// 保存分类到 WPS 持久化存储
const saveCategoriesToStorage = () => {
  try {
    const dataToSave = JSON.stringify(customCategories.value)
    
    unifiedLogger.debug('保存分类到 WPS PluginStorage', {
      categoryCount: customCategories.value.length,
      categories: customCategories.value
    })
    
    window.Application.PluginStorage.setItem('law_categories', dataToSave)
    unifiedLogger.info('分类已保存到 WPS PluginStorage', {
      categoryCount: customCategories.value.length
    })
  } catch (error) {
    unifiedLogger.error('保存分类失败', {
      error: error.message,
      stack: error.stack
    })
    window.$message?.error('保存分类失败: ' + error.message)
  }
}

// 从 WPS 持久化存储加载分类
const loadCategoriesFromStorage = () => {
  try {
    unifiedLogger.debug('从 WPS PluginStorage 加载分类')
    const stored = window.Application.PluginStorage.getItem('law_categories')
    
    if (stored) {
      customCategories.value = JSON.parse(stored)
      unifiedLogger.info('已加载自定义分类', {
        categoryCount: customCategories.value.length,
        categories: customCategories.value
      })
    } else {
      unifiedLogger.debug('未找到存储的分类数据')
    }
  } catch (error) {
    unifiedLogger.error('加载分类失败', {
      error: error.message,
      stack: error.stack
    })
    customCategories.value = []
  }
}

// 从配置目录加载所有模板
const loadTemplatesFromStorage = async () => {
  unifiedLogger.info('开始从存储加载模板')
  
  try {
    // 使用 templateManager 加载模板
    unifiedLogger.debug('调用 templateManager.loadTemplates()')
    const allTemplates = await templateManager.loadTemplates()
    templates.value = allTemplates
    
    // 如果当前分类为空，设置为第一个分类
    if (!currentCategory.value && allCategories.value.length > 0) {
      currentCategory.value = allCategories.value[0]
      unifiedLogger.debug('设置初始分类', { category: currentCategory.value })
    }
    
    unifiedLogger.info(`模板加载完成: ${templates.value.length} 个模板`, {
      templateCount: templates.value.length,
      templateNames: templates.value.map(t => t.name),
      categories: [...new Set(templates.value.map(t => t.category))],
      currentCategory: currentCategory.value
    })
  } catch (error) {
    unifiedLogger.error('加载模板失败', {
      method: 'loadTemplatesFromStorage',
      error: error.message,
      stack: error.stack
    })
    window.$message?.error('加载模板失败')
    templates.value = []
    // 设置默认分类
    if (!currentCategory.value) {
      currentCategory.value = '自定义'
    }
  }
}

// 组件挂载时加载数据
onMounted(async () => {
  unifiedLogger.info('TemplateManager 组件已挂载，开始加载数据')
  // 打印一下当前路径
  unifiedLogger.info('当前路径', window.location.href)
  
  unifiedLogger.debug('加载分类数据')
  loadCategoriesFromStorage()
  
  unifiedLogger.debug('加载模板数据')
  await loadTemplatesFromStorage()
  
  unifiedLogger.info('TemplateManager 数据加载完成', {
    categoryCount: customCategories.value.length,
    templateCount: templates.value.length
  })
})
</script>

<style scoped>
</style>

