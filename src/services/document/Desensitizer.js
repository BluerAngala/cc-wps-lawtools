/**
 * 高级脱敏处理类
 * 引用统一的敏感信息配置
 */

import { SENSITIVE_PATTERNS, DEFAULT_WHITELIST } from '../../config/sensitivePatterns.js'

export class Desensitizer {
  constructor(options = {}) {
    this.patterns = [...SENSITIVE_PATTERNS]
    this.whitelist = new Set(DEFAULT_WHITELIST)
    this.customWords = new Map()

    if (options.whitelist) {
      options.whitelist.forEach((item) => this.whitelist.add(item))
    }

    if (options.customSensitiveWords) {
      options.customSensitiveWords.forEach(({ word, replacement }) => {
        this.addCustomWord(word, replacement)
      })
    }
  }

  addCustomWord(word, replacement = null) {
    if (replacement === null) {
      this.customWords.set(word, '*'.repeat(word.length))
    } else {
      this.customWords.set(word, replacement)
    }
  }

  removeCustomWord(word) {
    this.customWords.delete(word)
  }

  addToWhitelist(item) {
    this.whitelist.add(item)
  }

  removeFromWhitelist(item) {
    this.whitelist.delete(item)
  }

  isInWhitelist(match) {
    if (this.whitelist.has(match)) return true
    for (const item of this.whitelist) {
      if (match.includes(item) || item.includes(match)) {
        return true
      }
    }
    return false
  }

  desensitizeText(text) {
    if (!text) {
      return { desensitizedText: '', sensitiveInfoList: [] }
    }

    const sensitiveInfoList = []
    let desensitizedText = text

    for (const [word, replacement] of this.customWords.entries()) {
      const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
      const matches = text.match(regex)

      if (matches) {
        matches.forEach((match) => {
          if (!this.isInWhitelist(match)) {
            sensitiveInfoList.push({
              original: match,
              desensitized: replacement,
              type: '自定义敏感词'
            })
            desensitizedText = desensitizedText.replace(match, replacement)
          }
        })
      }
    }

    this.patterns.forEach((pattern) => {
      pattern.regex.lastIndex = 0
      const matches = text.match(pattern.regex)

      if (matches) {
        matches.forEach((match) => {
          const isWhitelisted = this.isInWhitelist(match)
          if (!isWhitelisted) {
            const desensitized = pattern.mask(match)
            sensitiveInfoList.push({
              original: match,
              desensitized: desensitized,
              type: pattern.type
            })
            desensitizedText = desensitizedText.replace(match, desensitized)
          }
        })
      }
    })

    return { desensitizedText, sensitiveInfoList }
  }

  getConfig() {
    return {
      patternCount: this.patterns.length,
      whitelistCount: this.whitelist.size,
      customWordsCount: this.customWords.size
    }
  }
}

export const defaultDesensitizer = new Desensitizer()

export function desensitizeText(text) {
  return defaultDesensitizer.desensitizeText(text)
}
