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
          { id: 'contract_parties', name: '合同主体信息', priority: 'high', keywords: ['甲方', '乙方', '合同主体', '当事人'] },
          { id: 'service_content', name: '服务内容', priority: 'high', keywords: ['服务内容', '服务项目', '服务标准'] },
          { id: 'service_standard', name: '服务标准', priority: 'high', keywords: ['服务标准', '服务质量', '验收标准'] },
          { id: 'contract_amount', name: '合同金额', priority: 'high', keywords: ['合同金额', '总金额', '价款', '费用'] },
          { id: 'payment_terms', name: '付款方式', priority: 'high', keywords: ['付款', '支付', '付款方式', '付款条件'] },
          { id: 'service_period', name: '服务期限', priority: 'high', keywords: ['服务期限', '履行期限', '合同期限'] },
          { id: 'acceptance_criteria', name: '验收标准', priority: 'medium', keywords: ['验收', '验收标准', '验收条件'] },
          { id: 'breach_liability', name: '违约责任', priority: 'high', keywords: ['违约责任', '违约', '违约金'] },
          { id: 'dispute_resolution', name: '争议解决', priority: 'high', keywords: ['争议解决', '纠纷', '仲裁', '诉讼'] },
          { id: 'contract_effectiveness', name: '合同生效', priority: 'medium', keywords: ['合同生效', '生效条件'] }
        ],
        optional: [
          { id: 'intellectual_property', name: '知识产权', priority: 'medium', keywords: ['知识产权', '著作权', '专利权'] },
          { id: 'confidentiality', name: '保密条款', priority: 'medium', keywords: ['保密', '商业秘密', '保密义务'] },
          { id: 'termination', name: '合同解除', priority: 'medium', keywords: ['合同解除', '解除条件', '解除程序'] }
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

    // 将用户规则转换为清单项格式
    for (const rule of userRules) {
      const checklistItem = {
        id: `user_rule_${Date.now()}_${Math.random()}`,
        name: rule.reviewRules || rule.name || '用户自定义规则',
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

