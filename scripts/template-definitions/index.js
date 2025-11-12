// 模板定义索引文件
import { 诉讼文书模板 } from './诉讼文书.js'
import { 合同模板 } from './合同模板.js'
import { 律师函模板 } from './律师函.js'
import { 其他文书模板 } from './其他文书.js'

// 合并所有模板
export const 所有模板 = {
  ...诉讼文书模板,
  ...合同模板,
  ...律师函模板,
  ...其他文书模板
}

// 按分类导出模板
export const 模板分类 = {
  诉讼文书: 诉讼文书模板,
  合同模板: 合同模板,
  律师函: 律师函模板,
  其他文书: 其他文书模板
}

// 获取所有模板的配置信息
export const 获取模板配置 = () => {
  const configs = []
  
  for (const [fileName, template] of Object.entries(所有模板)) {
    configs.push({
      id: fileName.replace('.docx', ''),
      name: template.title,
      category: template.category,
      description: template.description,
      scene: template.scene,
      fileName: fileName,
      isBuiltIn: true
    })
  }
  
  return configs
}
