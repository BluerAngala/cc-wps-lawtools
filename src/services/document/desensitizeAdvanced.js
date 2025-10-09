// 敏感信息类型配置
const SENSITIVE_PATTERNS = [
  // 身份证号
  {
    type: '身份证号',
    regex: /[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]/g,
    mask: (match) => match.replace(/(\d{6})\d{8}(\d{3}[0-9Xx])/, '$1********$2')
  },
  // 银行卡号
  {
    type: '银行卡号',
    regex: /[1-9]\d{15,18}/g,
    mask: (match) => match.replace(/(\d{4})\d+(\d{4})/, '$1****$2')
  },
  // 手机号
  {
    type: '手机号',
    regex: /1[3-9]\d{9}/g,
    mask: (match) => match.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  },
  // 邮箱
  {
    type: '邮箱',
    regex: /[\w.-]+@[\w.-]+\.\w+/g,
    mask: (match) => {
      const [name, domain] = match.split('@')
      return name.charAt(0) + '***@' + domain
    }
  },
  // MAC地址
  {
    type: 'MAC地址',
    regex: /([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/g,
    mask: (match) => match.replace(/([0-9A-Fa-f]{2}[:-]){3}/, '$1**:**:**:')
  },
  // 护照号（中国护照格式）
  {
    type: '护照号',
    regex: /[GEge]\d{8}/g,
    mask: (match) => match.replace(/([GEge]\d{2})\d{4}(\d{2})/, '$1****$2')
  },
  // 案件号（示例格式：(2023)京0105民初1234号）
  {
    type: '案件号',
    regex: /\([^)]+\)[\u4e00-\u9fa5]+\d{4}[\u4e00-\u9fa5]+/g,
    mask: (match) => {
      // 简单处理，将年份后的部分脱敏
      return match.replace(/(\([^)]+\)[\u4e00-\u9fa5]+\d{4})[\u4e00-\u9fa5]+/, '$1***')
    }
  },
  // 公司编号（统一社会信用代码）
  {
    type: '公司编号',
    regex: /[1-9A-GY]{1}[1239]{1}[0-9]{6}[0-9A-Z]{10}/g,
    mask: (match) => match.replace(/([1-9A-GY]{1}[1239]{1})[0-9]{6}([0-9A-Z]{10})/, '$1******$2')
  },
  // 中文地址
  {
    type: '中文地址',
    regex:
      /[\u4e00-\u9fa5]{2,}(省|市|自治区|自治州|县|区|镇|乡|街道)[\u4e00-\u9fa5]+[路街巷弄]\d+[号栋单元层室户]/g,
    mask: (match) => {
      // 保留前两个字符和最后一个字
      if (match.length > 3) {
        return (
          match.substring(0, 2) + '*'.repeat(match.length - 3) + match.substring(match.length - 1)
        )
      }
      return match
    }
  },
  // 合同主体
  {
    type: '合同主体',
    regex: /(甲方|乙方|丙方|丁方)[:：\s]{1,3}([\u4e00-\u9fa5（）]{6,30})/g,
    mask: (match) => {
      const parts = match.match(/(甲方|乙方|丙方|丁方)[:：\s]{1,3}([\u4e00-\u9fa5（）]{6,30})/)
      if (parts && parts[2]) {
        // 只有当第二部分是完整的机构名称时才脱敏
        return match.replace(parts[2], '*'.repeat(parts[2].length))
      }
      return match
    }
  },
  // 姓名
  {
    type: '姓名',
    regex:
      /(?:姓名|名称|法定代表人|委托人|受托人|买方|卖方)[:：\s]{1,3}([\u4e00-\u9fa5]{2,4})(?![\u4e00-\u9fa5])/g,
    mask: (match) => {
      const nameParts = match.match(
        /(?:姓名|名称|法定代表人|委托人|受托人|买方|卖方)[:：\s]{1,3}([\u4e00-\u9fa5]{2,4})(?![\u4e00-\u9fa5])/
      )
      if (nameParts && nameParts[1]) {
        const namePart = nameParts[1]
        if (namePart.length === 2) {
          return match.replace(namePart, namePart.charAt(0) + '*')
        } else {
          return match.replace(
            namePart,
            namePart.charAt(0) + '**' + namePart.charAt(namePart.length - 1)
          )
        }
      }
      return match
    }
  },
  // 银行账号
  {
    type: '银行账号',
    regex: /账号[:：\s]+\d{10,20}/g,
    mask: (match) => {
      const account = match.match(/\d{10,20}/)
      if (account) {
        return match.replace(
          account[0],
          account[0].substring(0, 4) + '****' + account[0].substring(account[0].length - 4)
        )
      }
      return match
    }
  },
  // 纳税人识别号
  {
    type: '纳税人识别号',
    regex: /纳税人识别号[:：\s]+[0-9A-Z]{15,20}/g,
    mask: (match) => {
      const taxId = match.match(/[0-9A-Z]{15,20}/)
      if (taxId) {
        return match.replace(
          taxId[0],
          taxId[0].substring(0, 4) + '****' + taxId[0].substring(taxId[0].length - 4)
        )
      }
      return match
    }
  }
]

// 默认白名单
const DEFAULT_WHITELIST = [
  '110', // 报警电话
  '120', // 急救电话
  '119' // 火警电话
]

// 脱敏处理类
export class Desensitizer {
  constructor(options = {}) {
    // 初始化配置
    this.patterns = [...SENSITIVE_PATTERNS]
    this.whitelist = new Set(DEFAULT_WHITELIST)
    this.customWords = new Map() // 自定义敏感词映射

    // 应用传入的配置
    if (options.whitelist) {
      options.whitelist.forEach((item) => this.whitelist.add(item))
    }

    if (options.customSensitiveWords) {
      options.customSensitiveWords.forEach(({ word, replacement }) => {
        this.addCustomWord(word, replacement)
      })
    }
  }

  // 添加自定义敏感词
  addCustomWord(word, replacement = null) {
    if (replacement === null) {
      // 用相同长度的*代替
      this.customWords.set(word, '*'.repeat(word.length))
    } else {
      this.customWords.set(word, replacement)
    }
  }

  // 删除自定义敏感词
  removeCustomWord(word) {
    this.customWords.delete(word)
  }

  // 添加白名单项
  addToWhitelist(item) {
    this.whitelist.add(item)
  }

  // 从白名单中移除项
  removeFromWhitelist(item) {
    this.whitelist.delete(item)
  }

  // 处理文本脱敏
  desensitizeText(text) {
    if (!text) {
      return { desensitizedText: '', sensitiveInfoList: [] }
    }

    // 查找敏感信息
    const sensitiveInfoList = []
    let desensitizedText = text

    // 处理自定义敏感词
    for (const [word, replacement] of this.customWords.entries()) {
      const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
      const matches = text.match(regex)

      if (matches) {
        matches.forEach((match) => {
          // 检查是否在白名单中
          if (!this.whitelist.has(match)) {
            // 添加到敏感信息列表
            sensitiveInfoList.push({
              original: match,
              desensitized: replacement,
              type: '自定义敏感词'
            })

            // 替换文本中的敏感信息
            desensitizedText = desensitizedText.replace(match, replacement)
          }
        })
      }
    }

    // 处理预定义的敏感信息类型
    this.patterns.forEach((pattern) => {
      // 重置正则表达式的 lastIndex 属性
      pattern.regex.lastIndex = 0
      const matches = text.match(pattern.regex)

      if (matches) {
        matches.forEach((match) => {
          // 检查是否在白名单中
          if (!this.whitelist.has(match)) {
            // 生成脱敏后的文本
            const desensitized = pattern.mask(match)

            // 添加到敏感信息列表
            sensitiveInfoList.push({
              original: match,
              desensitized: desensitized,
              type: pattern.type
            })

            // 替换文本中的敏感信息
            desensitizedText = desensitizedText.replace(match, desensitized)
          }
        })
      }
    })

    return { desensitizedText, sensitiveInfoList }
  }

  // 获取当前配置信息
  getConfig() {
    return {
      patternCount: this.patterns.length,
      whitelistCount: this.whitelist.size,
      customWordsCount: this.customWords.size
    }
  }
}

// 默认导出一个实例
export const defaultDesensitizer = new Desensitizer()

// 兼容旧版本的函数
export function desensitizeText(text) {
  return defaultDesensitizer.desensitizeText(text)
}
