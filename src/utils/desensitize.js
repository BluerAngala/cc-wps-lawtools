// 简化版脱敏工具

// 核心敏感信息类型配置
const SENSITIVE_PATTERNS = [
  // 身份证号
  { 
    type: '身份证号', 
    regex: /[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]/g,
    mask: (match) => match.replace(/(\d{6})\d{8}(\d{3}[0-9Xx])/, '$1********$2')
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
      const [name, domain] = match.split('@');
      return name.charAt(0) + '***@' + domain;
    }
  },
  // 银行卡号
  { 
    type: '银行卡号', 
    regex: /[1-9]\d{15,18}/g,
    mask: (match) => match.replace(/(\d{4})\d+(\d{4})/, '$1****$2')
  },
  // 姓名（简化版）
  { 
    type: '姓名', 
    regex: /(?:姓名|法定代表人|委托人|受托人)[:：\s]{1,3}([\u4e00-\u9fa5]{2,4})(?![\u4e00-\u9fa5])/g,
    mask: (match) => {
      const parts = match.split(/[:：\s]+/);
      if (parts.length >= 2) {
        const name = parts[1];
        const maskedName = name.charAt(0) + '*'.repeat(name.length - 1);
        return parts[0] + '：' + maskedName;
      }
      return match;
    }
  }
];

/**
 * 简化的脱敏处理函数
 * @param {string} text - 需要脱敏的文本
 * @returns {Object} - 包含脱敏后文本和敏感信息列表的对象
 */
export function desensitizeText(text) {
  if (!text) {
    return { desensitizedText: '', sensitiveInfoList: [] };
  }

  const sensitiveInfoList = [];
  let desensitizedText = text;

  // 处理预定义的敏感信息类型
  SENSITIVE_PATTERNS.forEach(pattern => {
    pattern.regex.lastIndex = 0;
    const matches = text.match(pattern.regex);

    if (matches) {
      matches.forEach(match => {
        // 生成脱敏后的文本
        const desensitized = pattern.mask(match);

        // 添加到敏感信息列表
        sensitiveInfoList.push({
          original: match,
          desensitized: desensitized,
          type: pattern.type
        });

        // 替换文本中的敏感信息
        desensitizedText = desensitizedText.replace(match, desensitized);
      });
    }
  });

  return { desensitizedText, sensitiveInfoList };
}

/**
 * 快速脱敏函数，只返回脱敏后的文本
 * @param {string} text - 需要脱敏的文本
 * @returns {string} - 脱敏后的文本
 */
export function quickDesensitize(text) {
  return desensitizeText(text).desensitizedText;
}

// 默认导出
export default {
  desensitizeText,
  quickDesensitize
};