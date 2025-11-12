// 律师函类模板定义
export const 律师函模板 = {
  '律师函.docx': {
    title: '律师函',
    category: '律师函',
    description: '律师事务所出具的正式法律函件',
    scene: '法律事务交涉',
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
  },

  '催款律师函.docx': {
    title: '催款律师函',
    category: '律师函',
    description: '用于催收欠款的律师函',
    scene: '债务催收',
    sections: [
      { type: 'paragraph', content: '{{债务人姓名/公司名称}}：', indent: false },
      { type: 'empty' },
      {
        type: 'paragraph',
        content: '{{律师事务所名称}}接受{{债权人姓名/公司名称}}的委托，就贵方拖欠款项一事，特致函如下：'
      },
      { type: 'empty' },
      { type: 'heading', content: '一、欠款事实' },
      { type: 'paragraph', content: '根据{{合同/协议名称}}，贵方应于{{应付款日期}}前向{{债权人姓名/公司名称}}支付款项人民币{{欠款金额}}元。' },
      { type: 'paragraph', content: '截至本函出具之日，贵方尚欠款项人民币{{欠款金额}}元未支付。' },
      { type: 'paragraph', content: '{{欠款详情说明}}' },
      { type: 'empty' },
      { type: 'heading', content: '二、法律依据' },
      {
        type: 'paragraph',
        content: '根据《中华人民共和国合同法》第{{条款}}条的规定："当事人应当按照约定全面履行自己的义务。"'
      },
      { type: 'paragraph', content: '贵方未按约定支付款项的行为已构成违约。' },
      { type: 'empty' },
      { type: 'heading', content: '三、律师要求' },
      { type: 'paragraph', content: '请贵方在收到本函后{{付款期限}}日内，将所欠款项人民币{{欠款金额}}元支付至以下账户：' },
      { type: 'paragraph', content: '账户名称：{{账户名称}}' },
      { type: 'paragraph', content: '开户银行：{{开户银行}}' },
      { type: 'paragraph', content: '银行账号：{{银行账号}}' },
      { type: 'empty' },
      { type: 'paragraph', content: '如贵方逾期未支付，我方将依法采取以下法律措施：' },
      { type: 'paragraph', content: '1. 向人民法院提起诉讼，要求贵方支付欠款及违约金；' },
      { type: 'paragraph', content: '2. 申请财产保全，冻结贵方银行账户；' },
      { type: 'paragraph', content: '3. 申请将贵方列入失信被执行人名单。' },
      { type: 'empty' },
      {
        type: 'paragraph',
        content: '由此产生的一切法律后果及费用（包括但不限于诉讼费、律师费、保全费等）均由贵方承担。'
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
  },

  '侵权警告律师函.docx': {
    title: '侵权警告律师函',
    category: '律师函',
    description: '用于警告侵权行为的律师函',
    scene: '知识产权侵权',
    sections: [
      { type: 'paragraph', content: '{{侵权人姓名/公司名称}}：', indent: false },
      { type: 'empty' },
      {
        type: 'paragraph',
        content: '{{律师事务所名称}}接受{{权利人姓名/公司名称}}的委托，就贵方侵犯{{知识产权类型}}一事，特致函如下：'
      },
      { type: 'empty' },
      { type: 'heading', content: '一、权利事实' },
      { type: 'paragraph', content: '{{权利人姓名/公司名称}}是{{知识产权类型}}"{{权利标的}}"的合法权利人。' },
      { type: 'paragraph', content: '{{权利证明说明}}' },
      { type: 'empty' },
      { type: 'heading', content: '二、侵权事实' },
      { type: 'paragraph', content: '贵方未经许可，{{侵权行为描述}}。' },
      { type: 'paragraph', content: '{{侵权证据说明}}' },
      { type: 'paragraph', content: '贵方的行为已构成对{{权利人姓名/公司名称}}{{知识产权类型}}的侵犯。' },
      { type: 'empty' },
      { type: 'heading', content: '三、法律依据' },
      {
        type: 'paragraph',
        content: '根据《{{相关法律名称}}》第{{条款}}条的规定："{{法律条文内容}}"'
      },
      { type: 'paragraph', content: '贵方的行为已违反上述法律规定，应当承担相应的法律责任。' },
      { type: 'empty' },
      { type: 'heading', content: '四、律师要求' },
      { type: 'paragraph', content: '请贵方在收到本函后{{停止期限}}日内：' },
      { type: 'paragraph', content: '1. 立即停止一切侵权行为；' },
      { type: 'paragraph', content: '2. {{其他具体要求}}；' },
      { type: 'paragraph', content: '3. 赔偿我方当事人因此遭受的经济损失人民币{{赔偿金额}}元。' },
      { type: 'empty' },
      { type: 'paragraph', content: '如贵方逾期未履行上述要求，我方将依法采取以下法律措施：' },
      { type: 'paragraph', content: '1. 向人民法院提起诉讼；' },
      { type: 'paragraph', content: '2. 申请诉前禁令；' },
      { type: 'paragraph', content: '3. 要求承担全部诉讼费用及律师费用。' },
      { type: 'empty' },
      {
        type: 'paragraph',
        content: '望贵方慎重考虑，妥善处理，以免造成不必要的法律纠纷和经济损失。'
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
  },

  '劳动争议律师函.docx': {
    title: '劳动争议律师函',
    category: '律师函',
    description: '用于处理劳动争议的律师函',
    scene: '劳动纠纷',
    sections: [
      { type: 'paragraph', content: '{{公司名称}}：', indent: false },
      { type: 'empty' },
      {
        type: 'paragraph',
        content: '{{律师事务所名称}}接受{{员工姓名}}的委托，就贵公司与{{员工姓名}}之间的劳动争议一事，特致函如下：'
      },
      { type: 'empty' },
      { type: 'heading', content: '一、基本事实' },
      { type: 'paragraph', content: '{{员工姓名}}于{{入职日期}}入职贵公司，担任{{岗位名称}}职务。' },
      { type: 'paragraph', content: '{{劳动关系详情}}' },
      { type: 'paragraph', content: '{{争议事实描述}}' },
      { type: 'empty' },
      { type: 'heading', content: '二、法律分析' },
      {
        type: 'paragraph',
        content: '根据《中华人民共和国劳动合同法》第{{条款}}条的规定："{{法律条文内容}}"'
      },
      { type: 'paragraph', content: '贵公司的行为{{违法性分析}}。' },
      { type: 'empty' },
      { type: 'heading', content: '三、律师要求' },
      { type: 'paragraph', content: '请贵公司在收到本函后{{处理期限}}日内：' },
      { type: 'paragraph', content: '1. {{具体要求1}}；' },
      { type: 'paragraph', content: '2. {{具体要求2}}；' },
      { type: 'paragraph', content: '3. 支付{{赔偿项目}}人民币{{金额}}元。' },
      { type: 'empty' },
      { type: 'paragraph', content: '如贵公司逾期未履行上述要求，我方将依法采取以下法律措施：' },
      { type: 'paragraph', content: '1. 向劳动争议仲裁委员会申请仲裁；' },
      { type: 'paragraph', content: '2. 向人民法院提起诉讼；' },
      { type: 'paragraph', content: '3. 申请媒体曝光，维护当事人合法权益。' },
      { type: 'empty' },
      {
        type: 'paragraph',
        content: '望贵公司本着合法、公平的原则，妥善处理此事，以免造成不必要的法律风险。'
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
