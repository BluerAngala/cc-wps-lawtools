/**
 * 敏感信息类型配置 - 统一配置文件
 * 所有脱敏相关功能都应引用此文件
 */

export const SENSITIVE_PATTERNS = [
  {
    type: '身份证号',
    regex: /(?<!\d)[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx](?!\d)/g,
    mask: (match) => match.replace(/(\d{6})\d{8}(\d{3}[0-9Xx])/, '$1********$2')
  },
  {
    type: '手机号',
    regex: /(?<!\d)1[3-9]\d{9}(?!\d)/g,
    mask: (match) => match.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  },
  {
    type: '银行卡号',
    regex: /(?<!\d)[1-9]\d{15,18}(?!\d)/g,
    mask: (match) => {
      if (match.length === 18 && /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/.test(match)) {
        return match
      }
      return match.replace(/(\d{4})\d+(\d{4})/, '$1****$2')
    }
  },
  {
    type: '邮箱',
    regex: /[\w.-]+@[\w.-]+\.\w+/g,
    mask: (match) => {
      const [name, domain] = match.split('@')
      return name.charAt(0) + '***@' + domain
    }
  },
  {
    type: 'MAC地址',
    regex: /([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/g,
    mask: (match) => match.replace(/([0-9A-Fa-f]{2}[:-]){3}/, '$1**:**:**:')
  },
  {
    type: '护照号',
    regex: /[GEge]\d{8}/g,
    mask: (match) => match.replace(/([GEge]\d{2})\d{4}(\d{2})/, '$1****$2')
  },
  {
    type: '案件号',
    regex: /\([^)]+\)[\u4e00-\u9fa5]+\d{4}[\u4e00-\u9fa5]+/g,
    mask: (match) => match.replace(/(\([^)]+\)[\u4e00-\u9fa5]+\d{4})[\u4e00-\u9fa5]+/, '$1***')
  },
  {
    type: '公司编号',
    regex: /[1-9A-GY]{1}[1239]{1}[0-9]{6}[0-9A-Z]{10}/g,
    mask: (match) => match.replace(/([1-9A-GY]{1}[1239]{1})[0-9]{6}([0-9A-Z]{10})/, '$1******$2')
  },
  {
    type: '中文地址',
    regex: /[\u4e00-\u9fa5]{2,}(省|市|自治区|自治州|县|区|镇|乡|街道)[\u4e00-\u9fa5]+[路街巷弄]\d+[号栋单元层室户]/g,
    mask: (match) => {
      if (match.length > 3) {
        return match.substring(0, 2) + '*'.repeat(match.length - 3) + match.substring(match.length - 1)
      }
      return match
    }
  },
  {
    type: '合同主体',
    regex: /(甲方|乙方|丙方|丁方)[:：\s]{1,3}([\u4e00-\u9fa5（）]{2,30})/g,
    mask: (match) => {
      const parts = match.match(/(甲方|乙方|丙方|丁方)[:：\s]{1,3}([\u4e00-\u9fa5（）]{2,30})/)
      if (parts && parts[2]) {
        return match.replace(parts[2], '*'.repeat(parts[2].length))
      }
      return match
    }
  },
  {
    type: '姓名',
    regex: /(?:姓名|名称|法定代表人|委托人|受托人|买方|卖方)[:：\s]{1,3}([\u4e00-\u9fa5]{2,4})(?![\u4e00-\u9fa5])/g,
    mask: (match) => {
      const nameParts = match.match(/(?:姓名|名称|法定代表人|委托人|受托人|买方|卖方)[:：\s]{1,3}([\u4e00-\u9fa5]{2,4})(?![\u4e00-\u9fa5])/)
      if (nameParts && nameParts[1]) {
        const namePart = nameParts[1]
        if (namePart.length === 2) {
          return match.replace(namePart, namePart.charAt(0) + '*')
        }
        return match.replace(namePart, namePart.charAt(0) + '**' + namePart.charAt(namePart.length - 1))
      }
      return match
    }
  },
  {
    type: '银行账号',
    regex: /账号[:：\s]+\d{10,20}/g,
    mask: (match) => {
      const account = match.match(/\d{10,20}/)
      if (account) {
        return match.replace(account[0], account[0].substring(0, 4) + '****' + account[0].substring(account[0].length - 4))
      }
      return match
    }
  },
  {
    type: '纳税人识别号',
    regex: /纳税人识别号[:：\s]+[0-9A-Z]{15,20}/g,
    mask: (match) => {
      const taxId = match.match(/[0-9A-Z]{15,20}/)
      if (taxId) {
        return match.replace(taxId[0], taxId[0].substring(0, 4) + '****' + taxId[0].substring(taxId[0].length - 4))
      }
      return match
    }
  }
]

export const DEFAULT_WHITELIST = [
  '110',
  '120',
  '119'
]

export const SENSITIVE_TYPES = SENSITIVE_PATTERNS.map(p => p.type)

export function createPatternsWithTypes(types) {
  if (!types || types.length === 0) {
    return [...SENSITIVE_PATTERNS]
  }
  return SENSITIVE_PATTERNS.filter(p => types.includes(p.type))
}
