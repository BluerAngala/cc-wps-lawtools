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
      
      // 诉讼文书（起诉状、答辩状等）
      '诉讼文书': {
        required: [
          { id: 'parties_info', name: '当事人信息', priority: 'high', keywords: ['原告', '被告', '当事人', '身份'], reviewRequirements: '审查当事人信息是否完整准确：1. 姓名/名称是否正确；2. 身份证号/统一社会信用代码是否完整；3. 住所地/经营地址是否明确；4. 联系方式是否有效', riskLevel: 'high', reviewBasis: '《民事诉讼法》第一百二十二条' },
          { id: 'claims', name: '诉讼请求', priority: 'high', keywords: ['诉讼请求', '请求', '诉请'], reviewRequirements: '审查诉讼请求是否明确具体：1. 请求事项是否清晰；2. 金额计算是否准确；3. 请求是否有法律依据；4. 请求之间是否存在矛盾', riskLevel: 'high', reviewBasis: '《民事诉讼法》第一百二十二条' },
          { id: 'facts_reasons', name: '事实与理由', priority: 'high', keywords: ['事实', '理由', '事实与理由'], reviewRequirements: '审查事实与理由是否充分：1. 事实陈述是否清晰完整；2. 时间线是否准确；3. 法律依据是否正确；4. 逻辑是否严密', riskLevel: 'high', reviewBasis: '《民事诉讼法》第一百二十二条' },
          { id: 'evidence_list', name: '证据清单', priority: 'high', keywords: ['证据', '证据清单', '证明'], reviewRequirements: '审查证据是否充分：1. 证据是否与诉请相关；2. 证据来源是否合法；3. 证据是否完整；4. 证据证明力如何', riskLevel: 'high', reviewBasis: '《民事诉讼法》第六十六条' },
          { id: 'jurisdiction', name: '管辖权', priority: 'high', keywords: ['管辖', '法院', '管辖权'], reviewRequirements: '审查管辖是否正确：1. 级别管辖是否正确；2. 地域管辖是否正确；3. 是否存在管辖约定；4. 是否存在专属管辖', riskLevel: 'high', reviewBasis: '《民事诉讼法》第二十四条至第三十五条' },
          { id: 'statute_limitations', name: '诉讼时效', priority: 'high', keywords: ['时效', '诉讼时效', '期限'], reviewRequirements: '审查诉讼时效：1. 是否在诉讼时效期间内；2. 是否存在时效中断/中止情形；3. 时效起算点是否正确', riskLevel: 'high', reviewBasis: '《民法典》第一百八十八条至第一百九十九条' }
        ],
        optional: [
          { id: 'preservation', name: '保全申请', priority: 'medium', keywords: ['保全', '财产保全', '行为保全'], reviewRequirements: '审查是否需要申请保全：1. 是否有保全必要；2. 保全范围是否适当；3. 担保是否充分', riskLevel: 'medium', reviewBasis: '《民事诉讼法》第一百零三条' },
          { id: 'legal_basis', name: '法律依据', priority: 'medium', keywords: ['法律依据', '法条', '规定'], reviewRequirements: '审查法律依据是否准确：1. 引用法条是否正确；2. 法条是否现行有效；3. 适用是否恰当', riskLevel: 'medium', reviewBasis: '相关实体法规定' }
        ]
      },

      // 律师函
      '律师函': {
        required: [
          { id: 'sender_info', name: '发函方信息', priority: 'high', keywords: ['委托人', '发函方', '律师事务所'], reviewRequirements: '审查发函方信息：1. 委托人信息是否完整；2. 律师事务所信息是否准确；3. 授权是否有效', riskLevel: 'high', reviewBasis: '《律师法》相关规定' },
          { id: 'recipient_info', name: '收函方信息', priority: 'high', keywords: ['收函方', '被告知方'], reviewRequirements: '审查收函方信息：1. 名称/姓名是否正确；2. 地址是否准确；3. 主体是否适格', riskLevel: 'high', reviewBasis: '相关规定' },
          { id: 'facts_statement', name: '事实陈述', priority: 'high', keywords: ['事实', '经过', '情况'], reviewRequirements: '审查事实陈述：1. 事实是否客观准确；2. 表述是否清晰；3. 是否有证据支持；4. 是否存在诽谤风险', riskLevel: 'high', reviewBasis: '《民法典》相关规定' },
          { id: 'demands', name: '要求事项', priority: 'high', keywords: ['要求', '请求', '敦促'], reviewRequirements: '审查要求事项：1. 要求是否明确具体；2. 要求是否有法律依据；3. 期限是否合理；4. 后果告知是否适当', riskLevel: 'high', reviewBasis: '相关实体法规定' },
          { id: 'legal_consequences', name: '法律后果', priority: 'medium', keywords: ['后果', '法律后果', '责任'], reviewRequirements: '审查法律后果告知：1. 后果告知是否准确；2. 是否存在威胁恐吓；3. 表述是否得当', riskLevel: 'medium', reviewBasis: '相关规定' }
        ],
        optional: [
          { id: 'deadline', name: '回复期限', priority: 'medium', keywords: ['期限', '回复', '答复'], reviewRequirements: '审查回复期限：1. 期限是否合理；2. 起算点是否明确', riskLevel: 'low', reviewBasis: '相关规定' }
        ]
      },

      // 法律意见书
      '法律意见书': {
        required: [
          { id: 'background', name: '背景介绍', priority: 'high', keywords: ['背景', '概况', '基本情况'], reviewRequirements: '审查背景介绍：1. 背景描述是否完整；2. 关键信息是否准确；3. 是否遗漏重要事实', riskLevel: 'medium', reviewBasis: '相关规定' },
          { id: 'legal_analysis', name: '法律分析', priority: 'high', keywords: ['分析', '法律分析', '论证'], reviewRequirements: '审查法律分析：1. 分析是否全面；2. 逻辑是否严密；3. 法律依据是否准确；4. 结论是否有支撑', riskLevel: 'high', reviewBasis: '相关实体法规定' },
          { id: 'conclusions', name: '结论意见', priority: 'high', keywords: ['结论', '意见', '建议'], reviewRequirements: '审查结论意见：1. 结论是否明确；2. 是否与分析一致；3. 建议是否可行；4. 风险提示是否充分', riskLevel: 'high', reviewBasis: '相关规定' },
          { id: 'risk_warning', name: '风险提示', priority: 'high', keywords: ['风险', '提示', '注意'], reviewRequirements: '审查风险提示：1. 风险识别是否全面；2. 风险等级是否准确；3. 应对建议是否合理', riskLevel: 'high', reviewBasis: '相关规定' }
        ],
        optional: [
          { id: 'assumptions', name: '假设前提', priority: 'medium', keywords: ['假设', '前提', '条件'], reviewRequirements: '审查假设前提：1. 假设是否合理；2. 是否明确告知客户', riskLevel: 'medium', reviewBasis: '相关规定' },
          { id: 'limitations', name: '意见限制', priority: 'medium', keywords: ['限制', '范围', '声明'], reviewRequirements: '审查意见限制：1. 限制范围是否明确；2. 免责声明是否充分', riskLevel: 'medium', reviewBasis: '相关规定' }
        ]
      },

      // 协议书（通用协议）
      '协议书': {
        required: [
          { id: 'parties', name: '协议各方', priority: 'high', keywords: ['甲方', '乙方', '各方', '当事人'], reviewRequirements: '审查协议各方信息：1. 主体信息是否完整；2. 签约资格是否具备；3. 授权是否有效', riskLevel: 'high', reviewBasis: '《民法典》第四百六十九条' },
          { id: 'subject_matter', name: '协议事项', priority: 'high', keywords: ['事项', '内容', '标的'], reviewRequirements: '审查协议事项：1. 事项是否明确；2. 范围是否清晰；3. 是否存在歧义', riskLevel: 'high', reviewBasis: '《民法典》第四百七十条' },
          { id: 'rights_obligations', name: '权利义务', priority: 'high', keywords: ['权利', '义务', '责任'], reviewRequirements: '审查权利义务：1. 权利义务是否对等；2. 是否存在显失公平；3. 是否有遗漏', riskLevel: 'high', reviewBasis: '《民法典》第五百零九条' },
          { id: 'breach_liability', name: '违约责任', priority: 'high', keywords: ['违约', '违约责任', '违约金'], reviewRequirements: '审查违约责任：1. 违约情形是否明确；2. 违约金是否合理；3. 救济方式是否充分', riskLevel: 'high', reviewBasis: '《民法典》第五百七十七条' },
          { id: 'dispute_resolution', name: '争议解决', priority: 'high', keywords: ['争议', '纠纷', '解决'], reviewRequirements: '审查争议解决：1. 解决方式是否明确；2. 管辖约定是否有效', riskLevel: 'high', reviewBasis: '《民事诉讼法》第三十五条' }
        ],
        optional: [
          { id: 'confidentiality', name: '保密条款', priority: 'medium', keywords: ['保密', '秘密'], reviewRequirements: '审查保密条款：1. 保密范围是否明确；2. 保密期限是否合理', riskLevel: 'medium', reviewBasis: '《民法典》第五百零一条' },
          { id: 'termination', name: '终止条款', priority: 'medium', keywords: ['终止', '解除'], reviewRequirements: '审查终止条款：1. 终止条件是否明确；2. 终止后果是否清晰', riskLevel: 'medium', reviewBasis: '《民法典》第五百六十二条' }
        ]
      },

      // 默认通用清单
      'default': {
        required: [
          { id: 'document_parties', name: '文书主体', priority: 'high', keywords: ['甲方', '乙方', '当事人', '主体'], reviewRequirements: '审查文书主体信息是否完整准确', riskLevel: 'high', reviewBasis: '相关法律规定' },
          { id: 'core_content', name: '核心内容', priority: 'high', keywords: ['内容', '事项', '标的'], reviewRequirements: '审查核心内容是否明确清晰', riskLevel: 'high', reviewBasis: '相关法律规定' },
          { id: 'rights_obligations', name: '权利义务', priority: 'high', keywords: ['权利', '义务', '责任'], reviewRequirements: '审查权利义务是否明确、对等', riskLevel: 'high', reviewBasis: '相关法律规定' },
          { id: 'legal_basis', name: '法律依据', priority: 'medium', keywords: ['法律', '依据', '规定'], reviewRequirements: '审查法律依据是否正确有效', riskLevel: 'medium', reviewBasis: '相关法律规定' },
          { id: 'risk_points', name: '风险点', priority: 'high', keywords: ['风险', '问题', '隐患'], reviewRequirements: '识别潜在法律风险和问题', riskLevel: 'high', reviewBasis: '相关法律规定' }
        ],
        optional: []
      }
    }

    // 视角调整规则
    this.perspectiveRules = {
      partyA: {
        focusAreas: ['payment_terms', 'breach_liability', 'acceptance', 'warranty'],
        priorityBoost: ['contract_amount', 'delivery', 'quality'],
        description: '甲方视角：重点关注付款条件、违约责任、验收标准等对甲方权益的保护'
      },
      partyB: {
        focusAreas: ['payment_terms', 'service_period', 'termination', 'intellectual_property'],
        priorityBoost: ['contract_amount', 'acceptance_criteria', 'breach_liability'],
        description: '乙方视角：重点关注付款保障、履行期限、知识产权归属等对乙方权益的保护'
      },
      neutral: {
        focusAreas: [],
        priorityBoost: [],
        description: '中立视角：平衡审查双方权利义务，识别对任一方不利的条款'
      }
    }
  }

  /**
   * 根据文档类型和审查视角生成审查清单
   * @param {Object} documentType - 文档类型信息 {type, subtype}
   * @param {string} perspective - 审查视角：partyA | partyB | neutral | 自定义文本
   * @returns {Array} 审查清单
   */
  generateChecklist(documentType, perspective = 'neutral') {
    const type = documentType?.type || 'default'
    const template = this.checklistTemplates[type] || this.checklistTemplates['default']
    
    // 合并必需和可选条款
    let checklist = [
      ...template.required.map(item => ({ ...item, required: true, selected: true })),
      ...template.optional.map(item => ({ ...item, required: false, selected: true }))
    ]
    
    // 判断是否为自定义视角（非预设值）
    const isCustomPerspective = !['partyA', 'partyB', 'neutral'].includes(perspective)
    
    // 根据视角调整优先级
    if (isCustomPerspective) {
      // 自定义视角：添加自定义审查项
      checklist = this.adjustByCustomPerspective(checklist, perspective)
    } else {
      checklist = this.adjustByPerspective(checklist, perspective)
    }
    
    console.log(`[审查清单] 文档类型: ${type}, 视角: ${isCustomPerspective ? '自定义' : perspective}, 生成清单 ${checklist.length} 项`)
    
    return checklist
  }

  /**
   * 根据自定义视角调整清单
   * @param {Array} checklist - 基础清单
   * @param {string} customPerspective - 自定义视角描述
   * @returns {Array} 调整后的清单
   */
  adjustByCustomPerspective(checklist, customPerspective) {
    // 添加自定义视角审查项
    const customItem = {
      id: 'custom_perspective',
      name: '自定义视角审查',
      priority: 'high',
      required: true,
      selected: true,
      perspectiveFocus: true,
      keywords: [],
      reviewRequirements: customPerspective,
      customPerspective: true
    }
    
    return [customItem, ...checklist]
  }

  /**
   * 根据审查视角调整清单优先级
   * @param {Array} checklist - 基础清单
   * @param {string} perspective - 审查视角
   * @returns {Array} 调整后的清单
   */
  adjustByPerspective(checklist, perspective) {
    const rules = this.perspectiveRules[perspective] || this.perspectiveRules.neutral
    
    return checklist.map(item => {
      const adjusted = { ...item }
      
      // 如果是重点关注领域，提升优先级
      if (rules.focusAreas.includes(item.id)) {
        adjusted.priority = 'high'
        adjusted.perspectiveFocus = true
      }
      
      // 如果是优先级提升项，标记
      if (rules.priorityBoost.includes(item.id)) {
        adjusted.priorityBoosted = true
      }
      
      return adjusted
    })
  }

  /**
   * 获取视角描述
   * @param {string} perspective - 审查视角
   * @returns {string} 视角描述
   */
  getPerspectiveDescription(perspective) {
    // 判断是否为自定义视角
    if (!['partyA', 'partyB', 'neutral'].includes(perspective)) {
      return `自定义视角：${perspective}`
    }
    return this.perspectiveRules[perspective]?.description || '中立视角审查'
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

