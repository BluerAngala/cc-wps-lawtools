/**
 * 动态AI提示词生成器
 * 根据用户输入的提取标签动态生成合同要素提取提示词
 */

/**
 * 生成动态合同要素提取提示词
 * @param {Array<string>} extractTags - 用户配置的提取标签数组
 * @param {string} content - 合同文档内容
 * @returns {string} 生成的提示词
 */
export function generateContractExtractionPrompt(extractTags, content) {
  // 构建JSON字段定义
  const jsonFields = extractTags.map(tag => `  "${tag}": string | null`).join(',\n')
  
  // 构建字段提取规则
  const extractionRules = extractTags.map(tag => {
    return `- ${tag}：\n  - 从文档中准确提取与"${tag}"相关的信息；\n  - 如无法确定则填入 null，不使用空字符串或占位词。`
  }).join('\n')

  // 构建示例输出
  const exampleOutput = extractTags.reduce((obj, tag, index) => {
    obj[tag] = index === 0 ? "示例值" : null
    return obj
  }, {})

  const prompt = `
用户输入的合同文件内容：${content}

任务：从上述输入中抽取合同要素，并以严格 JSON 返回。必须严格遵守以下要求。

【输出要求】
1) 只返回 JSON，对象顶层仅包含以下字段，且键名必须完全一致：
{
${jsonFields}
}
2) 输出为单个 JSON 对象，不要包含多余字段、注释、解释、Markdown 代码块标记或额外文本。
3) 任一字段无法从文本确定时填入 null，而不是空字符串或占位词。

【字段提取与规范化规则】
${extractionRules}

【通用规则】
- 优先提取全称和完整信息
- 金额类字段规范为数字格式，去除千分位逗号
- 日期类字段规范为标准格式：YYYY年MM月DD日
- 去除括号中的说明性文字（如"模板""示例"等）
- 多处不一致时，优先采用正文首次明确出现且上下文最清晰的信息
- 不进行主观推断；无法确定即为 null

【示例输出格式】
${JSON.stringify(exampleOutput, null, 2)}

请严格按照以上规则进行抽取与规范化，并直接返回 JSON 结果。`

  return prompt
}

/**
 * 预定义的常用提取标签及其说明
 */
export const COMMON_EXTRACT_TAGS = {
  '合同名称': '合同的正式名称或标题',
  '甲方名称': '合同甲方的完整名称',
  '乙方名称': '合同乙方的完整名称', 
  '合同金额': '合同涉及的总金额',
  '合同期限': '合同的有效期限',
  '签订日期': '合同签订的具体日期',
  '履行地点': '合同履行的地点',
  '付款方式': '约定的付款方式',
  '违约责任': '违约时的责任条款',
  '争议解决': '争议解决的方式和管辖',
  '合同摘要': '合同的核心内容概要'
}

/**
 * 验证提取标签的有效性
 * @param {Array<string>} extractTags - 提取标签数组
 * @returns {Object} 验证结果
 */
export function validateExtractTags(extractTags) {
  const result = {
    isValid: true,
    errors: [],
    warnings: []
  }

  if (!Array.isArray(extractTags)) {
    result.isValid = false
    result.errors.push('提取标签必须是数组格式')
    return result
  }

  if (extractTags.length === 0) {
    result.isValid = false
    result.errors.push('至少需要指定一个提取标签')
    return result
  }

  if (extractTags.length > 20) {
    result.warnings.push('提取标签过多可能影响AI处理效果，建议控制在20个以内')
  }

  // 检查重复标签
  const duplicates = extractTags.filter((tag, index) => extractTags.indexOf(tag) !== index)
  if (duplicates.length > 0) {
    result.warnings.push(`发现重复标签：${duplicates.join(', ')}`)
  }

  // 检查空标签
  const emptyTags = extractTags.filter(tag => !tag || tag.trim() === '')
  if (emptyTags.length > 0) {
    result.isValid = false
    result.errors.push('存在空的提取标签')
  }

  return result
}