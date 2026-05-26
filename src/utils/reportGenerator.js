/**
 * 专业报告生成器
 * 使用 WPS API 生成格式化的审查报告
 * 遵循公文排版规范
 */

import { BRAND, DEV_CONFIG, REPORT_STYLE, CHINESE_NUMBERS } from '@/config/constants.js'

// 解构常用常量
const { COLORS, FONT_SIZE, LOGO, COVER } = REPORT_STYLE

/**
 * 设置正文段落格式
 */
function setBodyParagraphFormat(selection) {
  selection.ParagraphFormat.FirstLineIndent = 28
  selection.ParagraphFormat.SpaceBefore = 0
  selection.ParagraphFormat.SpaceAfter = 0
  selection.ParagraphFormat.LineSpacingRule = 4
  selection.ParagraphFormat.LineSpacing = 28
  selection.ParagraphFormat.Alignment = 0
}

/**
 * 设置标题段落格式
 */
function setTitleParagraphFormat(selection) {
  selection.ParagraphFormat.FirstLineIndent = 0
  selection.ParagraphFormat.SpaceBefore = 0
  selection.ParagraphFormat.SpaceAfter = 0
  selection.ParagraphFormat.LineSpacingRule = 0
  selection.ParagraphFormat.Alignment = 1
}

/**
 * 格式化日期
 */
function formatDate(date) {
  const d = date || new Date()
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

/**
 * 生成风险扫描报告
 */
export function generateRiskScanReport(options) {
  const { documentType, perspectiveLabel, scanScope, checklist, reviewResult, statistics } = options

  if (typeof window.Application === 'undefined') {
    throw new Error('请在 WPS 环境中使用此功能')
  }

  const doc = window.Application.Documents.Add()
  const selection = window.Application.Selection

  // 设置页面边距
  doc.PageSetup.TopMargin = REPORT_STYLE.PAGE_MARGIN
  doc.PageSetup.BottomMargin = REPORT_STYLE.PAGE_MARGIN
  doc.PageSetup.LeftMargin = REPORT_STYLE.PAGE_MARGIN
  doc.PageSetup.RightMargin = REPORT_STYLE.PAGE_MARGIN

  const docTypeName = documentType?.subtype || documentType?.type || '法律文书'

  // 第一页：封面页（无页眉页脚）- 第1节
  insertCoverPage(selection, doc, { documentType, perspectiveLabel, scanScope })

  // 第二页：基本信息和统计（无页码）- 第2节
  selection.InsertBreak(2) // wdSectionBreakNextPage = 2，创建新节
  insertInfoPage(selection, doc, { docTypeName, perspectiveLabel, scanScope, statistics })

  // 第三页开始：详细审查结果（从这里开始有页码）- 第3节
  selection.InsertBreak(2) // wdSectionBreakNextPage = 2，创建新节

  insertDetailPage(selection, docTypeName, checklist, reviewResult)

  // 报告尾部
  insertFooter(selection)

  // 所有内容插入完成后，设置页眉页脚
  setupAllHeadersFooters(doc)

  return doc
}

/**
 * 获取 logo 图片路径（简化版）
 * 直接使用插件目录下的图片，无需复制
 */
function getLogoPath() {
  try {
    const href = window.location.href
    let pluginDir = ''

    if (href.startsWith('file:')) {
      // 生产环境：使用 URL 对象解析路径
      try {
        const url = new URL(href)
        // decodeURIComponent 处理路径中的中文和空格
        let pathname = decodeURIComponent(url.pathname)

        // Windows 路径处理：去掉开头的斜杠（例如 /C:/path -> C:/path）
        if (pathname.startsWith('/') && /^[a-zA-Z]:/.test(pathname.substring(1))) {
          pathname = pathname.substring(1)
        }

        // 获取目录路径
        pluginDir = pathname.substring(0, pathname.lastIndexOf('/')).replace(/\//g, '\\')
      } catch (e) {
        // 备选方案
        pluginDir = decodeURIComponent(
          href.substring(href.indexOf('file://') + 7, href.lastIndexOf('/'))
        ).replace(/\//g, '\\')
        // 处理可能多出的开头的斜杠
        if (pluginDir.startsWith('\\')) pluginDir = pluginDir.substring(1)
      }
    } else {
      // 开发环境
      pluginDir = DEV_CONFIG.PROJECT_ROOT + '\\' + DEV_CONFIG.BUILD_DIR
    }

    const fs = window.Application?.FileSystem

    // 尝试多个可能的路径
    const possiblePaths = [
      pluginDir + '\\images\\' + LOGO.FILE_NAME,
      pluginDir + '\\' + LOGO.FILE_NAME,
      // 针对开发环境的特殊处理
      DEV_CONFIG.PROJECT_ROOT + '\\public\\images\\' + LOGO.FILE_NAME
    ]

    for (const logoPath of possiblePaths) {
      if (fs && fs.Exists(logoPath)) {
        console.log('找到logo文件:', logoPath)
        return logoPath
      }
    }

    console.log('所有预设路径均未找到logo文件')
    return ''
  } catch (e) {
    console.log('获取logo路径失败:', e)
    return ''
  }
}

/**
 * 在页眉中添加 logo 图片（右上角）
 */
function addHeaderLogo(header) {
  try {
    const logoPath = getLogoPath()
    console.log('尝试加载logo:', logoPath)

    if (!logoPath) {
      console.log('无法获取logo路径，跳过')
      return
    }

    // 先选中页眉区域
    header.Range.Select()

    // 在页眉中插入图片
    const shape = header.Shapes.AddPicture(logoPath, false, true)

    if (!shape) {
      console.log('图片插入失败，shape 为 null')
      return
    }

    // 设置图片大小
    shape.LockAspectRatio = true
    shape.Width = LOGO.WIDTH

    // 设置环绕方式为衬于文字下方
    shape.WrapFormat.Type = 5 // wdWrapBehind = 5

    // 设置相对于页面定位
    shape.RelativeHorizontalPosition = 1 // wdRelativeHorizontalPositionPage = 1
    shape.RelativeVerticalPosition = 1 // wdRelativeVerticalPositionPage = 1

    // 定位到页面右上角
    shape.Left = LOGO.LEFT
    shape.Top = LOGO.TOP

    // 退出页眉编辑模式，返回正文
    window.Application.ActiveDocument.ActiveWindow.View.SeekView = 0 // wdSeekMainDocument = 0

    console.log('logo插入成功')
  } catch (e) {
    console.log('添加页眉logo失败:', e)
  }
}

// WPS 页眉页脚常量
const wdHeaderFooterPrimary = 1

/**
 * 设置所有节的页眉页脚
 * 关键：必须从第1节开始，按顺序断开链接
 */
function setupAllHeadersFooters(doc) {
  try {
    const sectionsCount = doc.Sections.Count
    console.log('文档共有节数:', sectionsCount)

    // === 第1节（封面）- 无页眉无页脚 ===
    const section1 = doc.Sections.Item(1)
    const header1 = section1.Headers.Item(wdHeaderFooterPrimary)
    const footer1 = section1.Footers.Item(wdHeaderFooterPrimary)
    // 第1节不需要断开链接（它是第一节）
    header1.Range.Text = ''
    footer1.Range.Text = ''
    console.log('第1节页眉页脚已清空')

    // === 第2节（基本信息）- 有页眉无页码 ===
    if (sectionsCount >= 2) {
      const section2 = doc.Sections.Item(2)
      const header2 = section2.Headers.Item(wdHeaderFooterPrimary)
      const footer2 = section2.Footers.Item(wdHeaderFooterPrimary)

      // 断开与第1节的链接
      header2.LinkToPrevious = false
      footer2.LinkToPrevious = false

      // 设置页眉
      header2.Range.Text = BRAND.HEADER_TEXT
      header2.Range.Font.Name = '宋体'
      header2.Range.Font.Size = 9
      header2.Range.Font.Color = COLORS.BLACK
      header2.Range.ParagraphFormat.Alignment = 1
      addHeaderLogo(header2)

      // 清空页脚（无页码）
      footer2.Range.Text = ''
      console.log('第2节页眉已设置，页脚已清空')
    }

    // === 第3节（正文）- 有页眉有页码 ===
    if (sectionsCount >= 3) {
      const section3 = doc.Sections.Item(3)
      const header3 = section3.Headers.Item(wdHeaderFooterPrimary)
      const footer3 = section3.Footers.Item(wdHeaderFooterPrimary)

      // 断开与第2节的链接
      header3.LinkToPrevious = false
      footer3.LinkToPrevious = false

      // 设置页眉
      header3.Range.Text = BRAND.HEADER_TEXT
      header3.Range.Font.Name = '宋体'
      header3.Range.Font.Size = 9
      header3.Range.Font.Color = COLORS.BLACK
      header3.Range.ParagraphFormat.Alignment = 1
      addHeaderLogo(header3)

      // 设置页脚页码：从1开始，格式 - x -
      footer3.PageNumbers.RestartNumberingAtSection = true
      footer3.PageNumbers.StartingNumber = 1
      footer3.Range.Text = ''
      footer3.Range.InsertAfter('- ')
      footer3.Range.Collapse(0) // wdCollapseEnd = 0
      footer3.PageNumbers.Add(1) // wdAlignPageNumberCenter = 1
      footer3.Range.InsertAfter(' -')
      footer3.Range.Font.Name = '宋体'
      footer3.Range.Font.Size = 12
      footer3.Range.Font.Color = COLORS.BLACK
      footer3.Range.ParagraphFormat.Alignment = 1
      console.log('第3节页眉页脚已设置')
    }
  } catch (e) {
    console.log('页眉页脚设置失败:', e)
  }
}

/**
 * 在封面插入居中 logo
 */
function insertCoverLogo(selection, width = 120) {
  try {
    const logoPath = getLogoPath()
    if (!logoPath) {
      console.log('封面logo路径为空，跳过')
      return
    }

    // 使用 InlineShapes 插入嵌入式图片（随文字流动）
    const inlineShape = selection.InlineShapes.AddPicture(logoPath, false, true)
    if (!inlineShape) {
      console.log('封面logo插入失败')
      return
    }

    // 设置图片大小
    inlineShape.LockAspectRatio = true
    inlineShape.Width = width

    console.log('封面logo插入成功')
  } catch (e) {
    console.log('封面logo插入失败:', e)
  }
}

/**
 * 插入封面页
 */
function insertCoverPage(selection, doc, info) {
  // 顶部留白
  for (let i = 0; i < COVER.TOP_BLANK_LINES; i++) {
    selection.TypeParagraph()
  }

  // 插入居中 logo
  setTitleParagraphFormat(selection)
  insertCoverLogo(selection, COVER.LOGO_WIDTH)
  for (let i = 0; i < COVER.LOGO_BOTTOM_LINES; i++) {
    selection.TypeParagraph()
  }

  // 主标题
  selection.Font.Name = '黑体'
  selection.Font.Size = COVER.TITLE_FONT_SIZE
  selection.Font.Bold = true
  selection.Font.Color = COLORS.BLACK
  selection.TypeText('文档风险扫描报告')
  selection.TypeParagraph()
  for (let i = 0; i < COVER.TITLE_BOTTOM_LINES; i++) {
    selection.TypeParagraph()
  }

  // 装饰线（黑色）
  selection.Font.Size = COVER.DIVIDER_FONT_SIZE
  selection.Font.Bold = false
  selection.Font.Color = COLORS.BLACK
  selection.TypeText('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  selection.TypeParagraph()
  for (let i = 0; i < COVER.DIVIDER_BOTTOM_LINES; i++) {
    selection.TypeParagraph()
  }

  // 文档信息
  selection.Font.Name = '宋体'
  selection.Font.Size = COVER.INFO_FONT_SIZE
  selection.Font.Color = COLORS.BLACK

  const docTypeName = info.documentType?.subtype || info.documentType?.type || '法律文书'
  selection.TypeText(`文档类型：${docTypeName}`)
  selection.TypeParagraph()
  for (let i = 0; i < COVER.INFO_LINE_SPACING; i++) {
    selection.TypeParagraph()
  }

  selection.TypeText(`审查视角：${info.perspectiveLabel}`)
  selection.TypeParagraph()
  for (let i = 0; i < COVER.INFO_LINE_SPACING; i++) {
    selection.TypeParagraph()
  }

  selection.TypeText(`扫描范围：${info.scanScope === 'full' ? '全文扫描' : '选中内容扫描'}`)
  selection.TypeParagraph()
  for (let i = 0; i < COVER.INFO_LINE_SPACING; i++) {
    selection.TypeParagraph()
  }

  selection.TypeText(`报告日期：${formatDate()}`)
  selection.TypeParagraph()
  for (let i = 0; i < COVER.INFO_BOTTOM_LINES; i++) {
    selection.TypeParagraph()
  }

  // 底部机构名称（黑色）
  selection.Font.Name = '黑体'
  selection.Font.Size = COVER.BRAND_FONT_SIZE
  selection.Font.Bold = true
  selection.Font.Color = COLORS.BLACK
  selection.TypeText(BRAND.NAME)
  selection.TypeParagraph()
}

/**
 * 插入基本信息和统计页
 */
function insertInfoPage(selection, doc, info) {
  selection.TypeParagraph()

  insertLevel1Title(selection, '基本信息')
  insertInfoTable(selection, doc, [
    ['文档类型', info.docTypeName],
    ['审查视角', info.perspectiveLabel],
    ['扫描范围', info.scanScope === 'full' ? '全文' : '选中内容'],
    ['生成时间', formatDate()]
  ])

  selection.TypeParagraph()
  selection.TypeParagraph()

  insertLevel1Title(selection, '审查统计')
  insertStatisticsTable(selection, doc, info.statistics)
}

/**
 * 插入详细审查结果页
 */
function insertDetailPage(selection, docTypeName, checklist, reviewResult) {
  selection.TypeParagraph()

  insertLevel1Title(selection, `关于${docTypeName}的审查报告`)

  const selectedItems = checklist.filter((item) => item.selected)
  selectedItems.forEach((item, index) => {
    const itemIssues = (reviewResult.issues || []).filter((i) => i.checklistId === item.id)
    insertChecklistItem(selection, item, itemIssues, index)
  })

  if (reviewResult.risks?.length > 0) {
    insertRiskSection(selection, reviewResult.risks, selectedItems.length)
  }
}

/**
 * 一级标题
 */
function insertLevel1Title(selection, text) {
  setTitleParagraphFormat(selection)
  selection.Font.Name = '黑体'
  selection.Font.Size = FONT_SIZE.ER_HAO
  selection.Font.Bold = true
  selection.Font.Color = COLORS.BLACK
  selection.TypeText(text)
  selection.TypeParagraph()
  selection.TypeParagraph()
}

/**
 * 二级标题（首行缩进2字符）
 * @param {boolean} hasIssues - true 表示有问题（红色），false 表示已通过（蓝色）
 */
function insertLevel2Title(selection, index, text, statusText = '', hasIssues = false) {
  selection.TypeParagraph()

  setBodyParagraphFormat(selection)
  // 二级标题也需要首行缩进2字符
  selection.ParagraphFormat.FirstLineIndent = 28
  selection.Font.Name = '黑体'
  selection.Font.Size = FONT_SIZE.SI_HAO
  selection.Font.Bold = true
  selection.Font.Color = COLORS.BLACK

  const chineseNum = CHINESE_NUMBERS[index] || String(index + 1)
  selection.TypeText(`${chineseNum}、${text}`)

  if (statusText) {
    // 有问题用红色，已通过用蓝色
    selection.Font.Color = hasIssues ? COLORS.RED : COLORS.BLUE
    selection.TypeText(`  [${statusText}]`)
    // 恢复黑色
    selection.Font.Color = COLORS.BLACK
  }

  selection.TypeParagraph()
}

/**
 * 正文
 */
function insertBodyText(selection, text, color = COLORS.BLACK, bold = false) {
  setBodyParagraphFormat(selection)
  selection.Font.Name = '宋体'
  selection.Font.Size = FONT_SIZE.SI_HAO
  selection.Font.Bold = bold
  selection.Font.Color = color
  selection.TypeText(text)
  selection.TypeParagraph()
}

/**
 * 基本信息表格
 * 左列灰底黑字，右列白底黑字，增加行高
 */
function insertInfoTable(selection, doc, data) {
  setTitleParagraphFormat(selection)

  const table = doc.Tables.Add(selection.Range, data.length, 2)
  table.Borders.Enable = true
  table.Borders.OutsideLineStyle = 1
  table.Borders.InsideLineStyle = 1
  table.Rows.Alignment = 1

  // 设置列宽
  table.Columns.Item(1).Width = 120
  table.Columns.Item(2).Width = 280

  // 设置行高（增加间距）
  for (let r = 1; r <= data.length; r++) {
    table.Rows.Item(r).Height = 28
    table.Rows.Item(r).HeightRule = 1 // wdRowHeightAtLeast
  }

  data.forEach((row, rowIndex) => {
    const cell1 = table.Cell(rowIndex + 1, 1)
    const cell2 = table.Cell(rowIndex + 1, 2)

    cell1.Range.Text = row[0]
    cell1.Range.Font.Name = '宋体'
    cell1.Range.Font.Size = 12
    cell1.Range.Font.Bold = true
    cell1.Range.Font.Color = COLORS.BLACK
    cell1.Shading.BackgroundPatternColor = COLORS.LIGHT_GRAY
    cell1.VerticalAlignment = 1
    cell1.Range.ParagraphFormat.Alignment = 1 // 居中

    cell2.Range.Text = row[1]
    cell2.Range.Font.Name = '宋体'
    cell2.Range.Font.Size = 12
    cell2.Range.Font.Color = COLORS.BLACK
    cell2.VerticalAlignment = 1
    cell2.Range.ParagraphFormat.Alignment = 1 // 居中
  })

  selection.EndOf(15)
  selection.MoveDown()
}

/**
 * 统计表格
 * 表头：灰底黑字
 * 数据行：审查项和已通过用黑色，有问题和问题数用红色
 */
function insertStatisticsTable(selection, doc, stats) {
  setTitleParagraphFormat(selection)

  const table = doc.Tables.Add(selection.Range, 2, 4)
  table.Borders.Enable = true
  table.Borders.OutsideLineStyle = 1
  table.Borders.InsideLineStyle = 1
  table.Rows.Alignment = 1

  // 设置行高
  table.Rows.Item(1).Height = 28
  table.Rows.Item(2).Height = 36

  // 表头：灰底黑字
  const headers = ['审查项', '已通过', '有问题', '问题数']
  headers.forEach((header, i) => {
    const cell = table.Cell(1, i + 1)
    cell.Range.Text = header
    cell.Range.Font.Name = '黑体'
    cell.Range.Font.Size = 12
    cell.Range.Font.Bold = true
    cell.Range.Font.Color = COLORS.BLACK
    cell.Shading.BackgroundPatternColor = COLORS.LIGHT_GRAY
    cell.Range.ParagraphFormat.Alignment = 1
    cell.VerticalAlignment = 1
  })

  // 数据行：审查项和已通过用黑色，有问题和问题数用红色
  const values = [stats.total, stats.passed, stats.failed, stats.issues]
  const valueColors = [COLORS.BLACK, COLORS.BLACK, COLORS.RED, COLORS.RED]

  values.forEach((value, i) => {
    const cell = table.Cell(2, i + 1)
    cell.Range.Text = String(value)
    cell.Range.Font.Name = '黑体'
    cell.Range.Font.Size = 16
    cell.Range.Font.Bold = true
    cell.Range.Font.Color = valueColors[i]
    cell.Range.ParagraphFormat.Alignment = 1
    cell.VerticalAlignment = 1
  })

  for (let i = 1; i <= 4; i++) {
    table.Columns.Item(i).Width = 100
  }

  selection.EndOf(15)
  selection.MoveDown()
}

/**
 * 审查项
 */
function insertChecklistItem(selection, item, issues, index) {
  const hasIssues = issues.length > 0
  const statusText = hasIssues ? `有问题 - ${issues.length}个` : '已通过'

  insertLevel2Title(selection, index, item.name, statusText, hasIssues)

  if (item.reviewRequirements) {
    insertBodyText(selection, `审查要点：${item.reviewRequirements}`)
  }

  if (item.reviewBasis) {
    insertBodyText(selection, `法律依据：${item.reviewBasis}`)
  }

  if (hasIssues) {
    insertBodyText(selection, '审查结果：')
    issues.forEach((issue, idx) => {
      insertIssueItem(selection, issue, idx + 1)
    })
  } else {
    insertBodyText(selection, '审查结果：未发现问题', COLORS.BLUE, true)
  }
}

/**
 * 问题项（三级标题，首行缩进2字符）
 */
function insertIssueItem(selection, issue, index) {
  const isHighRisk = issue.severity === 'high'
  const riskText = { high: '高风险', medium: '中风险', low: '低风险' }[issue.severity] || '风险'

  setBodyParagraphFormat(selection)
  // 三级标题也需要首行缩进2字符
  selection.ParagraphFormat.FirstLineIndent = 28
  selection.Font.Name = '楷体'
  selection.Font.Size = FONT_SIZE.SI_HAO
  selection.Font.Color = isHighRisk ? COLORS.RED : COLORS.BLACK
  selection.Font.Bold = !isHighRisk

  selection.TypeText(`${index}. [${riskText}] ${issue.position || ''}`)
  selection.TypeParagraph()

  if (issue.keyword) {
    insertBodyText(selection, `相关条款：${issue.keyword}`)
  }

  insertBodyText(selection, `问题说明：${issue.comment}`)
}

/**
 * 风险提示章节
 */
function insertRiskSection(selection, risks, startIndex) {
  insertLevel2Title(selection, startIndex, '风险提示', '', false)

  risks.forEach((risk, index) => {
    const isHighRisk = risk.severity === 'high'
    const riskText = { high: '高风险', medium: '中风险', low: '低风险' }[risk.severity] || '风险'

    setBodyParagraphFormat(selection)
    // 风险项也需要首行缩进2字符
    selection.ParagraphFormat.FirstLineIndent = 28
    selection.Font.Name = '楷体'
    selection.Font.Size = FONT_SIZE.SI_HAO
    selection.Font.Color = isHighRisk ? COLORS.RED : COLORS.BLACK
    selection.Font.Bold = !isHighRisk

    selection.TypeText(`${index + 1}. [${riskText}] ${risk.description}`)
    selection.TypeParagraph()

    if (risk.suggestion) {
      insertBodyText(selection, `建议：${risk.suggestion}`, COLORS.BLUE, false)
    }
  })
}

/**
 * 报告尾部
 */
function insertFooter(selection) {
  selection.TypeParagraph()
  selection.TypeParagraph()

  setBodyParagraphFormat(selection)
  selection.ParagraphFormat.FirstLineIndent = 0
  selection.ParagraphFormat.Alignment = 2

  selection.Font.Name = '宋体'
  selection.Font.Size = FONT_SIZE.SI_HAO
  selection.Font.Bold = false
  selection.Font.Color = COLORS.BLACK

  selection.TypeText(`审查人：${BRAND.NAME}`)
  selection.TypeParagraph()

  selection.TypeText(`审查时间：${formatDate()}`)
  selection.TypeParagraph()
}
