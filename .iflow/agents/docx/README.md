Docx Workflow - Word文档智能处理工作流

一键安装：
在iFlow CLI中执行以下命令（"iflow workflow..."替换为网站提供的安装指令）：
示例：!iflow workflow add "docx-xxxxxx"
安装完成后重启iFlow CLI，在输入行添加 `/docx` 指令即可使用。

核心功能：
1. 文本提取
提取Word文档的文本内容，保持段落结构和格式信息。支持.docx和.doc格式。
示例：/docx 从report.docx中提取全部文本

2. 表格提取
提取文档中的表格数据并导出为Excel、CSV格式，适合处理数据报表和统计信息。
示例：/docx 提取financial_report.docx中的表格并导出为Excel

3. 文档创建
编程创建专业Word文档，支持文字、表格、图片、图表等元素。完整支持中文格式。
示例：/docx 创建包含公司简介和业绩表格的年度报告

4. 合并与拆分
合并多个Word文档或按章节拆分大型文档，支持保留原始格式和样式。
示例：/docx 将chapter1.docx、chapter2.docx、chapter3.docx合并为完整文档
示例：/docx 将长报告按一级标题拆分为多个文件

5. 样式管理
统一文档样式，批量修改标题、正文、表格格式，应用模板样式。
示例：/docx 将文档所有一级标题改为黑体三号加粗
示例：/docx 应用公司标准文档模板样式

6. 格式转换
将Word文档转换为PDF、HTML、Markdown等格式，保持排版和格式。
示例：/docx 将合同.docx转换为PDF格式
示例：/docx 将技术文档.docx转换为Markdown

7. 批注与审阅
添加、提取或删除文档批注和修订记录，支持多人协作审阅管理。
示例：/docx 提取文档中所有批注内容
示例：/docx 接受所有修订并删除批注

8. 元数据管理
读取和修改Word文档元数据（标题、作者、公司、创建时间等）。
示例：/docx 读取报告的元数据信息
示例：/docx 修改文档作者为"张三"，公司为"XX科技"