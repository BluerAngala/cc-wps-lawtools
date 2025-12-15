/**
 * 业务系统对接桥接
 * 处理从外部业务系统传入的参数和调用
 */

/**
 * 从业务系统打开文件
 */
function openOfficeFileFromSystemDemo(param) {
  const jsonObj = typeof param === 'string' ? JSON.parse(param) : param
  console.log('从业务系统传过来的参数为：', JSON.stringify(jsonObj))
  window.$message?.info('收到业务系统参数: ' + jsonObj.filepath)
  return { wps加载项项返回: jsonObj.filepath + ', 这个地址给的不正确' }
}

/**
 * 业务系统调用入口
 */
function InvokeFromSystemDemo(param) {
  const jsonObj = typeof param === 'string' ? JSON.parse(param) : param
  const handleInfo = jsonObj.Index

  switch (handleInfo) {
    case 'getDocumentName': {
      let docName = ''
      if (window.Application.ActiveDocument) {
        docName = window.Application.ActiveDocument.Name
      }
      return { 当前打开的文件名为: docName }
    }

    case 'newDocument': {
      const doc = window.Application.Documents.Add()
      return { 操作结果: '新建文档成功，文档名为：' + doc.Name }
    }

    case 'OpenFile': {
      const filePath = jsonObj.filepath
      window.Application.Documents.OpenFromUrl(filePath)
      return { 操作结果: '打开文件成功' }
    }

    default:
      return { 其它xxx: '' }
  }
}

export default {
  openOfficeFileFromSystemDemo,
  InvokeFromSystemDemo
}

export { openOfficeFileFromSystemDemo, InvokeFromSystemDemo }
