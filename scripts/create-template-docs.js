#!/usr/bin/env node

/**
 * 使用 docx 库生成 Word 模板文档
 * 运行方式：node scripts/create-template-docs.js
 */

import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { 所有模板, 获取模板配置 } from './template-definitions/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 目标目录
const targetDir = path.join(__dirname, '../public/templates')

// 确保目录存在
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true })
}

// 辅助函数：创建标题段落
function createTitle(text) {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: '宋体',
        size: 32, // 16pt = 32 half-points
        bold: true,
        color: '000000' // 黑色
      })
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 }
  })
}

// 辅助函数：创建一级标题
function createHeading1(text) {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: '宋体',
        size: 28, // 14pt = 28 half-points
        bold: true,
        color: '000000' // 黑色
      })
    ],
    spacing: { before: 200, after: 200 }
  })
}

// 辅助函数：创建普通段落
function createParagraph(text, indent = true) {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: '宋体',
        size: 24 // 12pt = 24 half-points
      })
    ],
    spacing: { line: 360 }, // 1.5倍行距
    indent: indent ? { firstLine: 480 } : undefined // 首行缩进2字符
  })
}

// 辅助函数：创建变量占位符段落
function createVariableParagraph(text, indent = true) {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: '宋体',
        size: 24,
        color: 'FF0000' // 红色标注变量
      })
    ],
    spacing: { line: 360 },
    indent: indent ? { firstLine: 480 } : undefined
  })
}

// 辅助函数：创建右对齐段落
function createRightAlignParagraph(text) {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: '宋体',
        size: 24
      })
    ],
    alignment: AlignmentType.RIGHT,
    spacing: { line: 360 }
  })
}

// 生成文档
async function createDocument(fileName, template) {
  console.log(`正在创建: ${fileName}`)

  const paragraphs = []

  // 添加标题
  paragraphs.push(createTitle(template.title))
  paragraphs.push(new Paragraph({ text: '' })) // 空行

  // 添加内容
  for (const section of template.sections) {
    switch (section.type) {
      case 'heading':
        paragraphs.push(createHeading1(section.content))
        break
      case 'paragraph':
        // 检查是否包含变量占位符
        if (section.content.includes('{{')) {
          paragraphs.push(createVariableParagraph(section.content, section.indent !== false))
        } else {
          paragraphs.push(createParagraph(section.content, section.indent !== false))
        }
        break
      case 'right':
        paragraphs.push(createRightAlignParagraph(section.content))
        break
      case 'empty':
        paragraphs.push(new Paragraph({ text: '' }))
        break
    }
  }

  // 创建文档
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs
      }
    ]
  })

  // 生成并保存文件
  const buffer = await Packer.toBuffer(doc)
  const filePath = path.join(targetDir, fileName)
  fs.writeFileSync(filePath, buffer)

  console.log(`✓ 创建成功: ${fileName}`)
}

// 生成模板配置文件
function generateTemplateConfig() {
  const configs = 获取模板配置()
  const configData = {
    templates: configs,
    lastUpdated: new Date().toISOString()
  }
  
  const configPath = path.join(targetDir, 'templates.json')
  fs.writeFileSync(configPath, JSON.stringify(configData, null, 2))
  console.log(`✓ 配置文件已更新: templates.json`)
}

// 主函数
async function main() {
  console.log('开始创建 Word 模板文档...\n')

  try {
    // 创建所有模板文档
    for (const [fileName, template] of Object.entries(所有模板)) {
      await createDocument(fileName, template)
    }

    // 生成配置文件
    generateTemplateConfig()

    console.log('\n✅ 所有模板文档创建完成！')
    console.log(`📁 文件位置: ${targetDir}`)
    console.log(`📄 共创建 ${Object.keys(所有模板).length} 个模板文档`)
  } catch (error) {
    console.error('❌ 创建失败:', error)
  }
}

main()

