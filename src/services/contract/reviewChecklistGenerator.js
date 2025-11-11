/**
 * 审查清单生成器
 * 根据合同类型生成通用审查清单，可复用
 */

export class ReviewChecklistGenerator {
  constructor() {
    // 通用审查清单模板（按合同类型）
    this.checklistTemplates = {
      // 服务合同
      '服务合同': {
        required: [
          { 
            id: 'contract_parties', 
            name: '合同主体信息', 
            priority: 'high', 
            keywords: ['甲方', '乙方', '合同主体', '当事人'],
            reviewRequirements: '审查合同双方主体资格是否合法，包括：1. 企业名称、统一社会信用代码是否完整准确；2. 法定代表人信息是否明确；3. 授权代表是否有有效授权；4. 主体是否具备签约资质',
            riskLevel: 'high',
            reviewBasis: '《民法典》第四百六十九条、第四百七十条；《公司法》相关规定'
          },
          { 
            id: 'service_content', 
            name: '服务内容', 
            priority: 'high', 
            keywords: ['服务内容', '服务项目', '服务标准'],
            reviewRequirements: '审查服务内容是否明确具体：1. 服务项目、范围是否清晰；2. 服务标准、质量要求是否可量化；3. 服务交付物是否明确；4. 是否存在模糊表述',
            riskLevel: 'high',
            reviewBasis: '《民法典》第五百一十条、第五百一十一条'
          },
          { 
            id: 'service_standard', 
            name: '服务标准', 
            priority: 'high', 
            keywords: ['服务标准', '服务质量', '验收标准'],
            reviewRequirements: '审查服务标准是否明确：1. 质量标准是否可量化；2. 验收标准是否清晰；3. 不合格服务的处理方式；4. 服务标准变更程序',
            riskLevel: 'high',
            reviewBasis: '《民法典》第五百一十条、第五百一十一条'
          },
          { 
            id: 'contract_amount', 
            name: '合同金额', 
            priority: 'high', 
            keywords: ['合同金额', '总金额', '价款', '费用'],
            reviewRequirements: '审查合同金额条款：1. 金额是否明确（含税/不含税）；2. 计价方式是否清晰；3. 价格调整机制是否合理；4. 是否存在价格陷阱',
            riskLevel: 'high',
            reviewBasis: '《民法典》第五百一十条、第五百一十一条'
          },
          { 
            id: 'payment_terms', 
            name: '付款方式', 
            priority: 'high', 
            keywords: ['付款', '支付', '付款方式', '付款条件'],
            reviewRequirements: '审查付款条款：1. 付款时间节点是否明确；2. 付款比例是否合理；3. 付款条件是否清晰；4. 逾期付款责任是否明确',
            riskLevel: 'high',
            reviewBasis: '《民法典》第五百一十条、第五百七十七条'
          },
          { 
            id: 'service_period', 
            name: '服务期限', 
            priority: 'high', 
            keywords: ['服务期限', '履行期限', '合同期限'],
            reviewRequirements: '审查服务期限：1. 起止时间是否明确；2. 履行期限是否合理；3. 延期条件是否明确；4. 期限变更程序',
            riskLevel: 'high',
            reviewBasis: '《民法典》第五百一十条、第五百一十一条'
          },
          { 
            id: 'acceptance_criteria', 
            name: '验收标准', 
            priority: 'medium', 
            keywords: ['验收', '验收标准', '验收条件'],
            reviewRequirements: '审查验收标准：1. 验收标准是否明确可操作；2. 验收时间是否合理；3. 验收不合格的处理方式；4. 验收争议解决机制',
            riskLevel: 'medium',
            reviewBasis: '《民法典》第五百一十条、第五百一十一条'
          },
          { 
            id: 'breach_liability', 
            name: '违约责任', 
            priority: 'high', 
            keywords: ['违约责任', '违约', '违约金'],
            reviewRequirements: '审查违约责任条款：1. 违约情形是否明确；2. 违约金是否过高（超过30%可能被调整）；3. 损失计算方法是否合理；4. 免责条款是否合法',
            riskLevel: 'high',
            reviewBasis: '《民法典》第五百七十七条、第五百八十五条'
          },
          { 
            id: 'dispute_resolution', 
            name: '争议解决', 
            priority: 'high', 
            keywords: ['争议解决', '纠纷', '仲裁', '诉讼'],
            reviewRequirements: '审查争议解决条款：1. 管辖法院是否明确（建议约定被告住所地或合同履行地）；2. 仲裁条款是否有效；3. 争议解决方式是否合理',
            riskLevel: 'high',
            reviewBasis: '《民事诉讼法》第三十四条、第三十五条'
          },
          { 
            id: 'contract_effectiveness', 
            name: '合同生效', 
            priority: 'medium', 
            keywords: ['合同生效', '生效条件'],
            reviewRequirements: '审查合同生效条件：1. 生效条件是否明确；2. 是否需要审批、备案；3. 生效时间是否合理',
            riskLevel: 'medium',
            reviewBasis: '《民法典》第五百零二条'
          }
        ],
        optional: [
          { 
            id: 'intellectual_property', 
            name: '知识产权', 
            priority: 'medium', 
            keywords: ['知识产权', '著作权', '专利权'],
            reviewRequirements: '审查知识产权条款：1. 知识产权归属是否明确；2. 使用范围是否受限；3. 侵权责任是否明确',
            riskLevel: 'medium',
            reviewBasis: '《民法典》第一百二十三条；《著作权法》相关规定'
          },
          { 
            id: 'confidentiality', 
            name: '保密条款', 
            priority: 'medium', 
            keywords: ['保密', '商业秘密', '保密义务'],
            reviewRequirements: '审查保密条款：1. 保密范围是否明确；2. 保密期限是否合理；3. 违约责任是否明确',
            riskLevel: 'medium',
            reviewBasis: '《民法典》第五百零一条；《反不正当竞争法》相关规定'
          },
          { 
            id: 'termination', 
            name: '合同解除', 
            priority: 'medium', 
            keywords: ['合同解除', '解除条件', '解除程序'],
            reviewRequirements: '审查合同解除条款：1. 解除条件是否明确；2. 解除程序是否合理；3. 解除后的责任承担',
            riskLevel: 'medium',
            reviewBasis: '《民法典》第五百六十二条、第五百六十三条'
          }
        ]
      },
      
      // 买卖合同
      '买卖合同': {
        required: [
          { id: 'contract_parties', name: '合同主体信息', priority: 'high', keywords: ['甲方', '乙方', '合同主体'] },
          { id: 'contract_subject', name: '合同标的', priority: 'high', keywords: ['标的物', '货物', '商品', '产品'] },
          { id: 'quantity', name: '数量', priority: 'high', keywords: ['数量', '件数', '台数'] },
          { id: 'quality', name: '质量', priority: 'high', keywords: ['质量', '质量标准', '规格'] },
          { id: 'contract_amount', name: '合同金额', priority: 'high', keywords: ['合同金额', '总金额', '价款'] },
          { id: 'payment_terms', name: '付款方式', priority: 'high', keywords: ['付款', '支付', '付款方式'] },
          { id: 'delivery', name: '交付', priority: 'high', keywords: ['交付', '交货', '交付时间', '交付地点'] },
          { id: 'acceptance', name: '验收', priority: 'high', keywords: ['验收', '验收标准', '验收期限'] },
          { id: 'breach_liability', name: '违约责任', priority: 'high', keywords: ['违约责任', '违约', '违约金'] },
          { id: 'dispute_resolution', name: '争议解决', priority: 'high', keywords: ['争议解决', '纠纷', '仲裁', '诉讼'] }
        ],
        optional: [
          { id: 'warranty', name: '质量保证', priority: 'medium', keywords: ['质量保证', '保修', '保修期'] },
          { id: 'risk_transfer', name: '风险转移', priority: 'medium', keywords: ['风险', '风险转移', '风险承担'] }
        ]
      },
      
      // 租赁合同
      '租赁合同': {
        required: [
          { id: 'contract_parties', name: '合同主体信息', priority: 'high', keywords: ['出租方', '承租方', '甲方', '乙方'] },
          { id: 'rental_object', name: '租赁物', priority: 'high', keywords: ['租赁物', '租赁房屋', '租赁场地'] },
          { id: 'rental_period', name: '租赁期限', priority: 'high', keywords: ['租赁期限', '租期', '租赁时间'] },
          { id: 'rent', name: '租金', priority: 'high', keywords: ['租金', '租赁费用', '月租金'] },
          { id: 'deposit', name: '押金', priority: 'high', keywords: ['押金', '保证金', '担保金'] },
          { id: 'payment_terms', name: '付款方式', priority: 'high', keywords: ['付款', '支付', '付款方式'] },
          { id: 'maintenance', name: '维修责任', priority: 'medium', keywords: ['维修', '维修责任', '维护'] },
          { id: 'breach_liability', name: '违约责任', priority: 'high', keywords: ['违约责任', '违约', '违约金'] },
          { id: 'contract_termination', name: '合同解除', priority: 'medium', keywords: ['合同解除', '解除条件'] },
          { id: 'dispute_resolution', name: '争议解决', priority: 'high', keywords: ['争议解决', '纠纷', '仲裁', '诉讼'] }
        ],
        optional: [
          { id: 'use_purpose', name: '使用用途', priority: 'low', keywords: ['使用用途', '用途'] },
          { id: 'sublease', name: '转租', priority: 'low', keywords: ['转租', '转租条件'] }
        ]
      },
      
      // 默认通用清单
      'default': {
        required: [
          { id: 'contract_parties', name: '合同主体信息', priority: 'high', keywords: ['甲方', '乙方', '合同主体'] },
          { id: 'contract_amount', name: '合同金额', priority: 'high', keywords: ['合同金额', '总金额', '价款'] },
          { id: 'payment_terms', name: '付款方式', priority: 'high', keywords: ['付款', '支付', '付款方式'] },
          { id: 'breach_liability', name: '违约责任', priority: 'high', keywords: ['违约责任', '违约', '违约金'] },
          { id: 'dispute_resolution', name: '争议解决', priority: 'high', keywords: ['争议解决', '纠纷', '仲裁', '诉讼'] },
          { id: 'contract_effectiveness', name: '合同生效', priority: 'medium', keywords: ['合同生效', '生效条件'] }
        ],
        optional: []
      }
    }
  }

  /**
   * 根据合同类型生成审查清单
   * @param {Object} contractType - 合同类型信息 {type, subtype}
   * @returns {Array} 审查清单
   */
  generateChecklist(contractType) {
    const type = contractType.type || 'default'
    const template = this.checklistTemplates[type] || this.checklistTemplates['default']
    
    // 合并必需和可选条款
    const checklist = [
      ...template.required.map(item => ({ ...item, required: true })),
      ...template.optional.map(item => ({ ...item, required: false }))
    ]
    
    console.log(`[审查清单] 合同类型: ${type}, 生成清单 ${checklist.length} 项`)
    
    return checklist
  }

  /**
   * 合并用户自定义规则到审查清单
   * @param {Array} baseChecklist - 基础审查清单
   * @param {Array} userRules - 用户自定义规则
   * @returns {Array} 合并后的审查清单
   */
  mergeUserRules(baseChecklist, userRules) {
    if (!userRules || userRules.length === 0) {
      return baseChecklist
    }

    const mergedChecklist = [...baseChecklist]
    const existingIds = new Set(mergedChecklist.map(item => item.id))

    // 将用户规则转换为清单项格式
    for (const rule of userRules) {
      const ruleName = rule.reviewRules || rule.name || '用户自定义规则'
      const checklistItem = {
        id: this.ensureRuleId(rule, existingIds, ruleName),
        name: ruleName,
        priority: 'high', // 用户规则默认高优先级
        required: true,
        keywords: this.extractKeywords(rule.reviewRules || rule.name || ''),
        reviewRequirements: rule.reviewRequirements || rule.comment || '',
        actionType: rule.actionType || 'comment' // comment 或 revision
      }

      mergedChecklist.push(checklistItem)
    }

    console.log(`[审查清单] 合并用户规则: 基础 ${baseChecklist.length} 项 + 用户 ${userRules.length} 项 = 总计 ${mergedChecklist.length} 项`)

    return mergedChecklist
  }

  /**
   * 为用户规则生成稳定的唯一ID，避免多次生成不一致
   */
  ensureRuleId(rule, existingIds, ruleName) {
    if (rule.id && !existingIds.has(rule.id)) {
      existingIds.add(rule.id)
      return rule.id
    }

    const baseString = [
      ruleName || '',
      rule.reviewRequirements || rule.comment || '',
      rule.actionType || 'comment'
    ]
      .join('|')
      .toLowerCase()

    let hash = this.generateHash(baseString)
    let candidateId = `user_rule_${hash}`

    // 避免与已有ID冲突
    while (existingIds.has(candidateId)) {
      hash = this.generateHash(`${baseString}_${Math.random()}`)
      candidateId = `user_rule_${hash}`
    }

    existingIds.add(candidateId)
    return candidateId
  }

  /**
   * 简单hash函数，生成稳定的字符串
   */
  generateHash(input) {
    let hash = 0
    if (!input) return '0'

    for (let i = 0; i < input.length; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i)
      hash |= 0 // 转32位整数
    }

    return Math.abs(hash).toString(36)
  }

  /**
   * 从规则名称中提取关键词
   */
  extractKeywords(ruleName) {
    if (!ruleName) return []
    
    // 提取可能的关键词
    const keywords = []
    
    // 常见关键词批注
    const keywordPatterns = [
      /(付款|支付|金额|费用|价款)/,
      /(期限|时间|日期)/,
      /(责任|义务|权利)/,
      /(违约|违约处理)/,
      /(争议|纠纷|仲裁|诉讼)/,
      /(保密|商业秘密)/,
      /(知识产权|著作权)/,
      /(验收|验收标准)/,
      /(解除|终止)/
    ]
    
    for (const pattern of keywordPatterns) {
      const match = ruleName.match(pattern)
      if (match) {
        keywords.push(match[1])
      }
    }
    
    return keywords.length > 0 ? keywords : [ruleName.substring(0, 10)]
  }

  /**
   * 获取所有支持的合同类型
   */
  getSupportedContractTypes() {
    return Object.keys(this.checklistTemplates).filter(type => type !== 'default')
  }
}

export const reviewChecklistGenerator = new ReviewChecklistGenerator()

