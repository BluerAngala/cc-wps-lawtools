#!/usr/bin/env node

/**
 * 使用 docx 库生成 Word 模板文档
 * 运行方式：node scripts/create-template-docs.js
 */

import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

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
    text,
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 }
  })
}

// 辅助函数：创建一级标题
function createHeading1(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
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

// 模板定义
const templates = {
  '民事起诉状.docx': {
    title: '民事起诉状',
    sections: [
      {
        type: 'paragraph',
        content: '原告：{{原告姓名}}，性别：{{性别}}，{{出生日期}}出生，{{民族}}族，住址：{{原告住址}}，联系电话：{{原告电话}}。'
      },
      {
        type: 'paragraph',
        content: '被告：{{被告姓名}}，性别：{{性别}}，{{出生日期}}出生，{{民族}}族，住址：{{被告住址}}，联系电话：{{被告电话}}。'
      },
      { type: 'empty' },
      { type: 'heading', content: '诉讼请求：' },
      { type: 'paragraph', content: '1. {{诉讼请求1}}；' },
      { type: 'paragraph', content: '2. {{诉讼请求2}}；' },
      { type: 'paragraph', content: '3. 本案诉讼费用由被告承担。' },
      { type: 'empty' },
      { type: 'heading', content: '事实与理由：' },
      { type: 'paragraph', content: '{{事实与理由}}' },
      { type: 'empty' },
      {
        type: 'paragraph',
        content: '综上所述，原告认为被告的行为已严重侵害了原告的合法权益，特向贵院提起诉讼，恳请贵院依法支持原告的诉讼请求，以维护原告的合法权益。'
      },
      { type: 'empty' },
      { type: 'paragraph', content: '此致', indent: false },
      { type: 'paragraph', content: '{{法院名称}}', indent: false },
      { type: 'empty' },
      { type: 'right', content: '起诉人：{{原告姓名}}' },
      { type: 'right', content: '{{日期}}' }
    ]
  },

  '民事答辩状.docx': {
    title: '民事答辩状',
    sections: [
      {
        type: 'paragraph',
        content: '答辩人：{{答辩人姓名}}，性别：{{性别}}，{{出生日期}}出生，{{民族}}族，住址：{{答辩人住址}}，联系电话：{{答辩人电话}}。'
      },
      { type: 'empty' },
      {
        type: 'paragraph',
        content: '针对原告{{原告姓名}}诉{{案由}}一案，答辩人提出如下答辩意见：'
      },
      { type: 'empty' },
      { type: 'heading', content: '一、答辩意见' },
      { type: 'paragraph', content: '{{答辩意见}}' },
      { type: 'empty' },
      { type: 'heading', content: '二、事实与理由' },
      { type: 'paragraph', content: '{{事实与理由}}' },
      { type: 'empty' },
      { type: 'heading', content: '三、法律依据' },
      {
        type: 'paragraph',
        content: '根据《{{相关法律名称}}》第{{条款}}条的规定，{{法律依据内容}}。'
      },
      { type: 'empty' },
      {
        type: 'paragraph',
        content: '综上所述，答辩人认为原告的诉讼请求缺乏事实和法律依据，请求人民法院依法驳回原告的诉讼请求。'
      },
      { type: 'empty' },
      { type: 'paragraph', content: '此致', indent: false },
      { type: 'paragraph', content: '{{法院名称}}', indent: false },
      { type: 'empty' },
      { type: 'right', content: '答辩人：{{答辩人姓名}}' },
      { type: 'right', content: '{{日期}}' }
    ]
  },

  '代理词.docx': {
    title: '代理词',
    sections: [
      { type: 'paragraph', content: '审判长、审判员：', indent: false },
      { type: 'empty' },
      {
        type: 'paragraph',
        content:
          '{{律师事务所名称}}接受{{委托人姓名}}的委托，指派我作为其诉讼代理人，参加本案诉讼活动。现根据庭审查明的事实和相关法律规定，发表如下代理意见：'
      },
      { type: 'empty' },
      { type: 'heading', content: '一、{{观点1}}' },
      { type: 'paragraph', content: '{{论述1}}' },
      { type: 'empty' },
      { type: 'heading', content: '二、{{观点2}}' },
      { type: 'paragraph', content: '{{论述2}}' },
      { type: 'empty' },
      { type: 'heading', content: '三、{{观点3}}' },
      { type: 'paragraph', content: '{{论述3}}' },
      { type: 'empty' },
      { type: 'heading', content: '四、法律依据' },
      {
        type: 'paragraph',
        content: '根据《{{相关法律名称}}》的相关规定，{{法律依据说明}}。'
      },
      { type: 'empty' },
      {
        type: 'paragraph',
        content:
          '综上所述，代理人认为{{总结观点}}，请求人民法院依法支持{{委托人姓名}}的诉讼请求，以维护其合法权益。'
      },
      { type: 'empty' },
      { type: 'right', content: '代理人：{{代理人姓名}}' },
      { type: 'right', content: '{{律师事务所名称}}' },
      { type: 'right', content: '{{日期}}' }
    ]
  },

  '劳动合同.docx': {
    title: '劳动合同',
    sections: [
      { type: 'paragraph', content: '甲方（用人单位）：{{公司名称}}', indent: false },
      { type: 'paragraph', content: '地址：{{公司地址}}', indent: false },
      { type: 'paragraph', content: '法定代表人：{{法定代表人}}', indent: false },
      { type: 'paragraph', content: '联系电话：{{公司电话}}', indent: false },
      { type: 'empty' },
      { type: 'paragraph', content: '乙方（劳动者）：{{员工姓名}}', indent: false },
      { type: 'paragraph', content: '身份证号：{{身份证号}}', indent: false },
      { type: 'paragraph', content: '住址：{{员工住址}}', indent: false },
      { type: 'paragraph', content: '联系电话：{{员工电话}}', indent: false },
      { type: 'empty' },
      {
        type: 'paragraph',
        content:
          '根据《中华人民共和国劳动合同法》及有关法律法规的规定，甲乙双方遵循合法、公平、平等自愿、协商一致、诚实信用的原则，订立本劳动合同。'
      },
      { type: 'empty' },
      { type: 'heading', content: '一、合同期限' },
      {
        type: 'paragraph',
        content: '本合同为{{合同类型}}劳动合同，期限自{{开始日期}}起至{{结束日期}}止。'
      },
      { type: 'empty' },
      { type: 'heading', content: '二、工作内容和工作地点' },
      {
        type: 'paragraph',
        content: '1. 乙方同意根据甲方工作需要，担任{{岗位名称}}岗位工作。'
      },
      { type: 'paragraph', content: '2. 工作地点：{{工作地点}}。' },
      { type: 'paragraph', content: '3. 工作职责：{{工作职责}}。' },
      { type: 'empty' },
      { type: 'heading', content: '三、工作时间和休息休假' },
      { type: 'paragraph', content: '1. 甲方实行{{工时制度}}工时制度。' },
      { type: 'paragraph', content: '2. 工作时间：{{工作时间安排}}。' },
      {
        type: 'paragraph',
        content: '3. 休息休假：乙方享有法定节假日、年休假、婚假、产假等国家规定的假期。'
      },
      { type: 'empty' },
      { type: 'heading', content: '四、劳动报酬' },
      { type: 'paragraph', content: '1. 乙方月工资为人民币{{工资金额}}元（税前）。' },
      { type: 'paragraph', content: '2. 工资发放时间：每月{{发放日期}}日发放上月工资。' },
      {
        type: 'paragraph',
        content: '3. 甲方根据公司经营状况和乙方工作表现，可适当调整乙方工资。'
      },
      { type: 'empty' },
      { type: 'heading', content: '五、社会保险和福利待遇' },
      {
        type: 'paragraph',
        content: '1. 甲方依法为乙方办理养老、医疗、失业、工伤、生育等社会保险。'
      },
      {
        type: 'paragraph',
        content: '2. 乙方应缴纳的社会保险费由甲方从乙方工资中代扣代缴。'
      },
      { type: 'paragraph', content: '3. 其他福利待遇：{{其他福利}}。' },
      { type: 'empty' },
      { type: 'heading', content: '六、劳动保护、劳动条件和职业危害防护' },
      {
        type: 'paragraph',
        content:
          '甲方应当为乙方提供符合国家规定的劳动安全卫生条件和必要的劳动防护用品，对从事有职业危害作业的劳动者应当定期进行健康检查。'
      },
      { type: 'empty' },
      { type: 'heading', content: '七、劳动纪律' },
      {
        type: 'paragraph',
        content: '乙方应遵守国家法律法规和甲方依法制定的各项规章制度，服从管理，按时完成工作任务。'
      },
      { type: 'empty' },
      { type: 'heading', content: '八、劳动合同的变更、解除和终止' },
      {
        type: 'paragraph',
        content: '双方变更、解除或终止劳动合同，应当依照《劳动合同法》及相关法律法规的规定执行。'
      },
      { type: 'empty' },
      { type: 'heading', content: '九、违约责任' },
      { type: 'paragraph', content: '{{违约责任条款}}' },
      { type: 'empty' },
      { type: 'heading', content: '十、其他约定事项' },
      { type: 'paragraph', content: '{{其他约定}}' },
      { type: 'empty' },
      {
        type: 'paragraph',
        content: '本合同一式两份，甲乙双方各执一份，具有同等法律效力。自双方签字（盖章）之日起生效。'
      },
      { type: 'empty' },
      { type: 'paragraph', content: '甲方（盖章）：                    乙方（签字）：', indent: false },
      { type: 'empty' },
      { type: 'paragraph', content: '法定代表人（签字）：', indent: false },
      { type: 'empty' },
      { type: 'paragraph', content: '日期：                            日期：', indent: false }
    ]
  },

  '律师函.docx': {
    title: '律师函',
    sections: [
      { type: 'paragraph', content: '{{收件人姓名/公司名称}}：', indent: false },
      { type: 'empty' },
      {
        type: 'paragraph',
        content: '{{律师事务所名称}}接受{{委托人姓名/公司名称}}的委托，就{{事由}}一事，特致函如下：'
      },
      { type: 'empty' },
      { type: 'heading', content: '一、基本事实' },
      { type: 'paragraph', content: '{{基本事实描述}}' },
      { type: 'empty' },
      { type: 'heading', content: '二、法律分析' },
      {
        type: 'paragraph',
        content: '根据《{{相关法律名称}}》第{{条款}}条的规定："{{法律条文内容}}"'
      },
      { type: 'paragraph', content: '基于上述法律规定，{{法律分析内容}}' },
      { type: 'empty' },
      { type: 'heading', content: '三、律师意见' },
      { type: 'paragraph', content: '{{律师意见}}' },
      { type: 'empty' },
      { type: 'paragraph', content: '鉴于上述事实和法律规定，本律师郑重函告贵方：' },
      { type: 'paragraph', content: '{{具体要求}}' },
      { type: 'empty' },
      { type: 'paragraph', content: '请贵方在收到本函后{{期限}}日内，{{具体行动要求}}。' },
      { type: 'empty' },
      { type: 'paragraph', content: '如贵方逾期未履行上述义务，我方将依法采取以下法律措施：' },
      { type: 'paragraph', content: '1. {{法律措施1}}' },
      { type: 'paragraph', content: '2. {{法律措施2}}' },
      { type: 'empty' },
      {
        type: 'paragraph',
        content:
          '由此产生的一切法律后果及费用（包括但不限于诉讼费、律师费、保全费、差旅费等）均由贵方承担。'
      },
      { type: 'empty' },
      { type: 'paragraph', content: '特此函告！', indent: false },
      { type: 'empty' },
      { type: 'paragraph', content: '{{律师事务所名称}}', indent: false },
      { type: 'paragraph', content: '律师：{{律师姓名}}', indent: false },
      { type: 'paragraph', content: '执业证号：{{执业证号}}', indent: false },
      { type: 'paragraph', content: '联系电话：{{联系电话}}', indent: false },
      { type: 'paragraph', content: '地址：{{律所地址}}', indent: false },
      { type: 'empty' },
      { type: 'paragraph', content: '{{日期}}', indent: false }
    ]
  }
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

// 主函数
async function main() {
  console.log('开始创建 Word 模板文档...\n')

  try {
    for (const [fileName, template] of Object.entries(templates)) {
      await createDocument(fileName, template)
    }

    console.log('\n✅ 所有模板文档创建完成！')
    console.log(`📁 文件位置: ${targetDir}`)
  } catch (error) {
    console.error('❌ 创建失败:', error)
    process.exit(1)
  }
}

main()

