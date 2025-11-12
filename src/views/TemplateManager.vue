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
        <n-tabs v-model:value="currentCategory" type="segment" animated>
          <n-tab-pane name="诉讼文书" tab="📋 诉讼文书">
            <TemplateList 
              :templates="getTemplatesByCategory('诉讼文书')" 
              @apply="applyTemplate"
              @delete="deleteTemplate"
            />
          </n-tab-pane>
          <n-tab-pane name="合同模板" tab="📝 合同模板">
            <TemplateList 
              :templates="getTemplatesByCategory('合同模板')" 
              @apply="applyTemplate"
              @delete="deleteTemplate"
            />
          </n-tab-pane>
          <n-tab-pane name="律师函" tab="✉️ 律师函">
            <TemplateList 
              :templates="getTemplatesByCategory('律师函')" 
              @apply="applyTemplate"
              @delete="deleteTemplate"
            />
          </n-tab-pane>
          <n-tab-pane name="自定义" tab="⭐ 自定义">
            <TemplateList 
              :templates="getTemplatesByCategory('自定义')" 
              @apply="applyTemplate"
              @delete="deleteTemplate"
            />
          </n-tab-pane>
        </n-tabs>
      </div>

      <!-- 保存模板对话框 -->
      <n-modal v-model:show="saveDialogVisible" preset="dialog" title="保存为模板">
        <n-space vertical>
          <n-form-item label="模板名称">
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
              placeholder="请输入模板描述"
              :rows="3"
            />
          </n-form-item>
        </n-space>
        <template #action>
          <n-space>
            <n-button @click="saveDialogVisible = false">取消</n-button>
            <n-button type="primary" @click="saveTemplate">保存</n-button>
          </n-space>
        </template>
      </n-modal>
    </div>
  </n-config-provider>
</template>

<script setup>
import { ref, onMounted, h } from 'vue'
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

console.log('文档模板管理页面已加载')

// 响应式数据
const currentCategory = ref('诉讼文书')
const saveDialogVisible = ref(false)
const templates = ref([])
const newTemplate = ref({
  name: '',
  category: '自定义',
  description: '',
  content: ''
})

// 分类选项
const categoryOptions = [
  { label: '诉讼文书', value: '诉讼文书' },
  { label: '合同模板', value: '合同模板' },
  { label: '律师函', value: '律师函' },
  { label: '自定义', value: '自定义' }
]

// 内置模板数据
const builtInTemplates = [
  {
    id: 'template_001',
    name: '民事起诉状',
    category: '诉讼文书',
    description: '适用于一般民事案件的起诉状模板',
    isBuiltIn: true,
    content: `民事起诉状

原告：{{原告姓名}}，性别，{{出生日期}}出生，民族，住址：{{原告住址}}，联系电话：{{原告电话}}。

被告：{{被告姓名}}，性别，{{出生日期}}出生，民族，住址：{{被告住址}}，联系电话：{{被告电话}}。

诉讼请求：
1. {{诉讼请求1}}；
2. {{诉讼请求2}}；
3. 本案诉讼费用由被告承担。

事实与理由：
{{事实与理由}}

此致
{{法院名称}}

起诉人：{{原告姓名}}
{{日期}}
`
  },
  {
    id: 'template_002',
    name: '民事答辩状',
    category: '诉讼文书',
    description: '适用于民事案件的答辩状模板',
    isBuiltIn: true,
    content: `民事答辩状

答辩人：{{答辩人姓名}}，性别，{{出生日期}}出生，民族，住址：{{答辩人住址}}，联系电话：{{答辩人电话}}。

针对原告{{原告姓名}}诉{{案由}}一案，答辩人提出如下答辩意见：

一、答辩意见
{{答辩意见}}

二、事实与理由
{{事实与理由}}

综上所述，答辩人认为原告的诉讼请求缺乏事实和法律依据，请求人民法院依法驳回原告的诉讼请求。

此致
{{法院名称}}

答辩人：{{答辩人姓名}}
{{日期}}
`
  },
  {
    id: 'template_003',
    name: '代理词',
    category: '诉讼文书',
    description: '适用于民事案件的代理词模板',
    isBuiltIn: true,
    content: `代理词

审判长、审判员：

{{律师事务所名称}}接受{{委托人姓名}}的委托，指派我作为其诉讼代理人，参加本案诉讼活动。现根据庭审查明的事实和相关法律规定，发表如下代理意见：

一、{{观点1}}
{{论述1}}

二、{{观点2}}
{{论述2}}

三、{{观点3}}
{{论述3}}

综上所述，代理人认为{{总结观点}}，请求人民法院依法支持{{委托人姓名}}的诉讼请求。

代理人：{{代理人姓名}}
{{律师事务所名称}}
{{日期}}
`
  },
  {
    id: 'template_004',
    name: '劳动合同',
    category: '合同模板',
    description: '标准劳动合同模板',
    isBuiltIn: true,
    content: `劳动合同

甲方（用人单位）：{{公司名称}}
地址：{{公司地址}}
法定代表人：{{法定代表人}}

乙方（劳动者）：{{员工姓名}}
身份证号：{{身份证号}}
住址：{{员工住址}}

根据《中华人民共和国劳动合同法》及有关法律法规的规定，甲乙双方遵循合法、公平、平等自愿、协商一致、诚实信用的原则，订立本劳动合同。

一、合同期限
本合同为{{合同类型}}劳动合同，期限自{{开始日期}}起至{{结束日期}}止。

二、工作内容和工作地点
1. 乙方同意根据甲方工作需要，担任{{岗位名称}}岗位工作。
2. 工作地点：{{工作地点}}。

三、工作时间和休息休假
{{工作时间安排}}

四、劳动报酬
1. 乙方月工资为人民币{{工资金额}}元。
2. 工资发放时间：{{发放时间}}。

五、社会保险
甲方依法为乙方办理社会保险，乙方应缴纳的社会保险费由甲方从乙方工资中代扣代缴。

六、劳动保护、劳动条件和职业危害防护
{{劳动保护条款}}

七、其他约定事项
{{其他约定}}

本合同一式两份，甲乙双方各执一份，具有同等法律效力。

甲方（盖章）：                    乙方（签字）：
法定代表人（签字）：
日期：                            日期：
`
  },
  {
    id: 'template_005',
    name: '律师函',
    category: '律师函',
    description: '通用律师函模板',
    isBuiltIn: true,
    content: `律师函

{{收件人姓名/公司名称}}：

{{律师事务所名称}}接受{{委托人姓名/公司名称}}的委托，就{{事由}}一事，特致函如下：

一、基本事实
{{基本事实描述}}

二、法律分析
{{法律分析}}

三、律师意见
{{律师意见}}

鉴于上述事实和法律规定，本律师郑重函告贵方：
{{具体要求}}

请贵方在收到本函后{{期限}}内，{{具体行动要求}}。逾期未履行，我方将依法采取进一步法律措施，由此产生的一切法律后果由贵方承担。

特此函告！

{{律师事务所名称}}
律师：{{律师姓名}}
联系电话：{{联系电话}}
日期：{{日期}}
`
  }
]

// 模板列表组件
const TemplateList = {
  props: ['templates'],
  emits: ['apply', 'delete'],
  setup(props, { emit }) {
    const applyToCurrentDoc = (template) => {
      emit('apply', template, 'current')
    }

    const applyToNewDoc = (template) => {
      emit('apply', template, 'new')
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
                  )
                ]),
                h('div', { class: 'text-sm text-gray-600' }, template.description)
              ]
            }
          )
        )
      )
    }
  }
}

// 获取指定分类的模板
const getTemplatesByCategory = (category) => {
  return templates.value.filter(t => t.category === category)
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
  if (!newTemplate.value.name) {
    window.$message?.warning('请输入模板名称')
    return
  }

  try {
    const doc = window.Application.ActiveDocument
    const content = doc.Range().Text

    const template = {
      id: 'custom_' + Date.now(),
      name: newTemplate.value.name,
      category: newTemplate.value.category,
      description: newTemplate.value.description,
      content: content,
      isBuiltIn: false,
      createdAt: new Date().toISOString()
    }

    templates.value.push(template)
    saveTemplatesToStorage()

    window.$message?.success('模板保存成功')
    saveDialogVisible.value = false
  } catch (error) {
    console.error('保存模板失败:', error)
    window.$message?.error('保存失败: ' + error.message)
  }
}

// 应用模板
const applyTemplate = (template, target) => {
  if (typeof window.Application === 'undefined') {
    window.$message?.error('请在 WPS 环境中使用此功能')
    return
  }

  try {
    if (target === 'new') {
      // 新建文档
      const newDoc = window.Application.Documents.Add()
      newDoc.Range().Text = template.content
      window.$message?.success('已在新文档中应用模板')
    } else {
      // 应用到当前文档
      const doc = window.Application.ActiveDocument
      if (!doc) {
        window.$message?.error('未找到活动文档')
        return
      }
      doc.Range().Text = template.content
      window.$message?.success('已应用模板到当前文档')
    }
  } catch (error) {
    console.error('应用模板失败:', error)
    window.$message?.error('应用失败: ' + error.message)
  }
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

// 从本地存储加载模板
const loadTemplatesFromStorage = () => {
  try {
    const stored = localStorage.getItem('law_templates')
    if (stored) {
      const customTemplates = JSON.parse(stored)
      templates.value = [...builtInTemplates, ...customTemplates]
    } else {
      templates.value = [...builtInTemplates]
    }
  } catch (error) {
    console.error('从本地存储加载模板失败:', error)
    templates.value = [...builtInTemplates]
  }
}

// 组件挂载时加载模板
onMounted(() => {
  loadTemplatesFromStorage()
  console.log('已加载模板:', templates.value.length)
})
</script>

<style scoped>
.template-card {
  transition: all 0.3s ease;
}

.template-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>

