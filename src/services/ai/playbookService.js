const STORAGE_KEY = 'playbook_config'

const DEFAULT_PLAYBOOK = {
  positions: [
    {
      id: 'liability-cap',
      category: '赔偿责任限制',
      standardPosition: '双方赔偿上限为12个月费用',
      acceptableRange: '6-24个月费用',
      escalationTrigger: '无上限赔偿、包含间接损失赔偿',
      severity: 'high'
    },
    {
      id: 'indemnification',
      category: '赔偿条款',
      standardPosition: '双方互赔知识产权侵权和数据泄露',
      acceptableRange: '仅限第三方索赔',
      escalationTrigger: '单方赔偿义务、无上限赔偿',
      severity: 'high'
    },
    {
      id: 'ip-ownership',
      category: '知识产权归属',
      standardPosition: '各方保留原有知识产权，客户拥有客户数据',
      acceptableRange: '有限许可授权',
      escalationTrigger: '宽泛知识产权转让条款、既有IP的雇佣作品条款',
      severity: 'high'
    },
    {
      id: 'data-protection',
      category: '数据保护',
      standardPosition: '涉及个人信息处理须签署DPA',
      acceptableRange: '标准DPA条款',
      escalationTrigger: '无DPA、跨境传输无保障措施',
      severity: 'medium'
    },
    {
      id: 'term-termination',
      category: '期限与终止',
      standardPosition: '年度期限，30天提前通知可无理由终止',
      acceptableRange: '多年期但初始期限后可无理由终止',
      escalationTrigger: '无通知期自动续签、无无理由终止权',
      severity: 'medium'
    },
    {
      id: 'governing-law',
      category: '管辖法律',
      standardPosition: '中华人民共和国法律',
      acceptableRange: '中国大陆主要仲裁机构',
      escalationTrigger: '外国管辖权、不利仲裁地强制仲裁',
      severity: 'medium'
    },
    {
      id: 'confidentiality',
      category: '保密条款',
      standardPosition: '双方互负保密义务，保密期2-3年',
      acceptableRange: '商业秘密5年保密期',
      escalationTrigger: '单方保密义务、无例外条款',
      severity: 'medium'
    },
    {
      id: 'force-majeure',
      category: '不可抗力',
      standardPosition: '含自然灾害、战争、政府行为等标准不可抗力条款',
      acceptableRange: '合理范围内的扩展定义',
      escalationTrigger: '过度宽泛的不可抗力定义、单方解约权',
      severity: 'low'
    }
  ],
  ndaDefaults: {
    mutualRequired: true,
    standardTerm: '2-3年',
    tradeSecretTerm: '5年',
    standardCarveouts: true,
    residualsClause: 'narrowly-scoped'
  },
  responseTemplates: [
    {
      id: 'data-subject-request',
      name: '数据主体请求回复',
      category: 'compliance',
      template:
        '感谢您的请求。根据适用的数据保护法律，我们确认收到您的请求，并将在法定期限内处理。我们可能需要验证您的身份以确保数据安全。请提供以下信息以便我们处理您的请求：\n1. 身份验证信息\n2. 具体请求内容\n3. 相关数据范围'
    },
    {
      id: 'nda-request',
      name: 'NDA签署请求',
      category: 'nda',
      template:
        '感谢您提出的保密协议签署请求。我们已审核您提供的NDA草案，现回复如下：\n1. 我方可接受互负保密义务的NDA\n2. 保密期限建议为2-3年\n3. 请确认是否采用我方标准NDA模板'
    },
    {
      id: 'vendor-inquiry',
      name: '供应商询价回复',
      category: 'vendor',
      template:
        '感谢您的询价。我们已收到您的服务/产品报价请求，现回复如下：\n1. 我方需签订正式服务协议\n2. 合同条款需经法务审核\n3. 预计审核周期为5-10个工作日'
    },
    {
      id: 'discovery-hold',
      name: '证据保全通知',
      category: 'litigation',
      template:
        '【证据保全通知】根据相关法律规定及公司合规要求，现通知如下：\n1. 即日起暂停销毁与以下事项相关的所有文件和电子数据\n2. 包括但不限于邮件、即时通讯记录、合同文本、会议纪要等\n3. 本通知持续有效直至书面撤销'
    }
  ]
}

function getStorage() {
  try {
    const app = window.Application
    return app?.PluginStorage || null
  } catch {
    return null
  }
}

function loadPlaybook() {
  const storage = getStorage()
  if (!storage) return { ...DEFAULT_PLAYBOOK }
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_PLAYBOOK }
    const saved = JSON.parse(raw)
    return {
      positions: saved.positions || DEFAULT_PLAYBOOK.positions,
      ndaDefaults: saved.ndaDefaults || DEFAULT_PLAYBOOK.ndaDefaults,
      responseTemplates: saved.responseTemplates || DEFAULT_PLAYBOOK.responseTemplates
    }
  } catch {
    return { ...DEFAULT_PLAYBOOK }
  }
}

function savePlaybook(playbook) {
  const storage = getStorage()
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(playbook))
    return true
  } catch {
    return false
  }
}

function resetPlaybook() {
  return savePlaybook(DEFAULT_PLAYBOOK)
}

function addPosition(position) {
  const playbook = loadPlaybook()
  position.id = position.id || `pos-${Date.now()}`
  playbook.positions.push(position)
  savePlaybook(playbook)
  return playbook
}

function updatePosition(id, updates) {
  const playbook = loadPlaybook()
  const idx = playbook.positions.findIndex((p) => p.id === id)
  if (idx === -1) return playbook
  playbook.positions[idx] = { ...playbook.positions[idx], ...updates }
  savePlaybook(playbook)
  return playbook
}

function removePosition(id) {
  const playbook = loadPlaybook()
  playbook.positions = playbook.positions.filter((p) => p.id !== id)
  savePlaybook(playbook)
  return playbook
}

function addResponseTemplate(template) {
  const playbook = loadPlaybook()
  template.id = template.id || `tpl-${Date.now()}`
  playbook.responseTemplates.push(template)
  savePlaybook(playbook)
  return playbook
}

function updateResponseTemplate(id, updates) {
  const playbook = loadPlaybook()
  const idx = playbook.responseTemplates.findIndex((t) => t.id === id)
  if (idx === -1) return playbook
  playbook.responseTemplates[idx] = { ...playbook.responseTemplates[idx], ...updates }
  savePlaybook(playbook)
  return playbook
}

function removeResponseTemplate(id) {
  const playbook = loadPlaybook()
  playbook.responseTemplates = playbook.responseTemplates.filter((t) => t.id !== id)
  savePlaybook(playbook)
  return playbook
}

function formatPlaybookForPrompt(playbook) {
  if (!playbook) playbook = loadPlaybook()
  let text = '## 组织谈判手册（Playbook）\n\n'

  text += '### 标准立场\n\n'
  for (const pos of playbook.positions) {
    text += `**${pos.category}** (重要度: ${pos.severity || 'medium'})\n`
    text += `- 标准立场: ${pos.standardPosition}\n`
    text += `- 可接受范围: ${pos.acceptableRange}\n`
    text += `- 升级触发: ${pos.escalationTrigger}\n\n`
  }

  text += '### NDA 默认设置\n\n'
  const nda = playbook.ndaDefaults
  if (nda) {
    text += `- 互负保密义务: ${nda.mutualRequired ? '必须' : '可选'}\n`
    text += `- 标准保密期: ${nda.standardTerm}\n`
    text += `- 商业秘密保密期: ${nda.tradeSecretTerm}\n`
    text += `- 标准例外条款: ${nda.standardCarveouts ? '包含' : '不包含'}\n`
    text += `- 残留信息条款: ${nda.residualsClause}\n\n`
  }

  return text
}

export const playbookService = {
  DEFAULT_PLAYBOOK,
  loadPlaybook,
  savePlaybook,
  resetPlaybook,
  addPosition,
  updatePosition,
  removePosition,
  addResponseTemplate,
  updateResponseTemplate,
  removeResponseTemplate,
  formatPlaybookForPrompt
}

export default playbookService
