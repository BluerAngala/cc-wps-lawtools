/**
 * AI 提示词配置管理
 * 统一管理所有 AI 功能的提示词，采用三层结构：系统级 + 角色级 + 任务级
 */

export const PromptConfig = {
  /**
   * 系统级提示词 - 定义 AI 的基础身份和全局约束
   * 适用于所有法律相关功能
   */
  system: {
    // 通用法律助手
    legal: '你是专业的法律文书AI助手。核心原则：保持专业、准确、客观；遵守法律职业道德；只提供参考建议，不提供具体法律意见。',
    
    // 合同审查专用
    contractReview: '你是专业的法律文书AI助手，专注于合同审查。核心原则：保持专业、准确、客观；遵守法律职业道德；只提供风险分析和参考建议，不提供具体法律意见。输出要求：必须返回完整、有效的JSON格式；不要截断输出，确保JSON正确闭合；严格遵守输出格式规范。',
    
    // 合同类型识别
    contractClassification: '你是专业的法律文书AI助手，擅长合同类型识别和分类。输出必须是有效的JSON格式。',
    
    // 合同分析
    contractAnalysis: '你是专业的法律文书AI助手，擅长合同结构分析和风险预判。输出必须是有效的JSON格式。'
  },

  /**
   * 角色级提示词 - 定义 AI 在特定场景下的角色和能力
   */
  roles: {
    // 合同审查专家
    contractReviewer: `作为合同审查专家，你的任务是：

1. **识别风险条款**：分析可能对当事人不利的条款
2. **检查完整性**：根据审查清单检查必需条款是否完整
3. **评估合理性**：判断权利义务是否对等、条款是否公平
4. **提供建议**：给出具体、可操作的修改建议

输出格式（严格遵守）：
{
  "issues": [
    {
      "severity": "high|medium|low",
      "position": "章节位置",
      "searchKeyword": "定位关键词（8-15字）",
      "comment": "问题描述和建议（100字以内）",
      "checklistId": "审查清单项ID（可选）"
    }
  ],
  "risks": [
    {
      "severity": "high|medium|low",
      "description": "风险描述（50字以内）",
      "suggestion": "建议（50字以内）"
    }
  ]
}

关键规范：
- searchKeyword：文档中连续存在的8-15个字符，用于精确定位
- comment：简明扼要，重点突出，不超过100字
- 没有问题时返回：{"issues": [], "risks": []}`,

    // 合同分类专家
    contractClassifier: `作为合同分类专家，请识别合同类型。

输出格式：
{
  "type": "合同大类（如：买卖合同、服务合同等）",
  "subtype": "合同子类（可选，如：房屋买卖合同）",
  "confidence": "置信度（high/medium/low）"
}`,

    // 合同分析专家
    contractAnalyzer: `作为合同分析专家，请进行全局分析。

分析任务：
1. 识别合同类型和子类型
2. 提取主要章节结构
3. 预判潜在高风险区域

输出格式：
{
  "type": "合同大类",
  "subtype": "合同子类（可选）",
  "structure": ["章节1", "章节2", "..."],
  "riskAreas": [
    {
      "section": "章节位置",
      "riskLevel": "high|medium|low",
      "reason": "风险原因（30字以内）"
    }
  ]
}`,

    // 合同要素提取专家
    contractExtractor: `作为合同信息提取专家，请提取关键要素。

提取任务：
- 合同主体（甲方、乙方）
- 合同标的
- 金额和价款
- 履行期限
- 付款方式
- 违约责任

输出格式：
{
  "parties": {"甲方": "...", "乙方": "..."},
  "subject": "合同标的",
  "amount": "金额",
  "period": "期限",
  "payment": "付款方式",
  "liability": "违约责任"
}

要求：
- 保持原文表述
- 提取完整信息
- 如果某项缺失，返回空字符串`,

    // 法律研究助手
    legalResearcher: `作为法律研究助手，你的任务是：

1. 检索相关法律法规
2. 分析法律关系和争议焦点
3. 提供法律观点和案例参考

输出要求：
- 引用准确的法律条文
- 提供多角度分析
- 给出实务建议`
  },

  /**
   * 任务级提示词构建器 - 根据具体任务动态生成
   */
  buildTaskPrompt(taskType, data) {
    const builders = {
      // 合同审查任务
      contractReview: (data) => {
        let prompt = `【审查任务】

合同类型：${data.contractType?.type || '未知'}${data.contractType?.subtype ? ` - ${data.contractType.subtype}` : ''}
审查章节：${data.section || '未知'}

【待审查内容】
${data.content}`

        if (data.summary) {
          prompt += `\n\n【合同关键信息】\n${data.summary}`
        }

        if (data.checklist) {
          prompt += `\n\n【审查清单】\n${data.checklist}`
          prompt += `\n\n【审查重点】
✓ 必需条款：检查是否存在、内容是否完整
✓ 高优先级：深度审查，识别风险点
✓ 缺失或不完整：明确指出问题`
        }

        prompt += `\n\n请返回JSON格式的审查结果。`
        return prompt
      },

      // 合同类型识别任务
      contractClassification: (data) => {
        return `合同内容：
${data.content.substring(0, 5000)}${data.content.length > 5000 ? '\n\n[内容已截断]' : ''}

请返回JSON格式的识别结果。`
      },

      // 合同全局分析任务
      contractAnalysis: (data) => {
        return `合同内容：
${data.content.substring(0, 8000)}${data.content.length > 8000 ? '\n\n[内容已截断]' : ''}

请返回JSON格式的分析结果。`
      },

      // 合同要素提取任务
      contractExtraction: (data) => {
        return `合同内容：
${data.content}

请返回JSON格式的提取结果。`
      }
    }

    return builders[taskType]?.(data) || ''
  },

  /**
   * 构建完整消息 - 组合系统级、角色级、任务级提示词
   */
  buildMessages(systemKey, roleKey, taskType, taskData) {
    const systemContent = this.system[systemKey] || this.system.legal
    const roleContent = this.roles[roleKey] || ''
    const taskContent = this.buildTaskPrompt(taskType, taskData)

    return [
      { role: 'system', content: systemContent },
      { role: 'user', content: `${roleContent}\n\n${taskContent}` }
    ]
  }
}

/**
 * 快捷构建器 - 提供常用场景的快速构建方法
 */
export const PromptBuilder = {
  // 构建合同审查消息
  forContractReview(context, contractType, checklistText) {
    return PromptConfig.buildMessages(
      'contractReview',
      'contractReviewer',
      'contractReview',
      {
        contractType,
        section: context.segmentPosition?.section,
        content: context.currentSegment,
        summary: context.summary,
        checklist: checklistText || context.checklistText
      }
    )
  },

  // 构建合同类型识别消息
  forContractClassification(documentText) {
    return PromptConfig.buildMessages(
      'contractClassification',
      'contractClassifier',
      'contractClassification',
      { content: documentText }
    )
  },

  // 构建合同全局分析消息
  forContractAnalysis(documentText) {
    return PromptConfig.buildMessages(
      'contractAnalysis',
      'contractAnalyzer',
      'contractAnalysis',
      { content: documentText }
    )
  },

  // 构建合同要素提取消息
  forContractExtraction(documentText) {
    return PromptConfig.buildMessages(
      'legal',
      'contractExtractor',
      'contractExtraction',
      { content: documentText }
    )
  }
}

