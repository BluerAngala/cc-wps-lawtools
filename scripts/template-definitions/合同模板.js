// 合同模板类模板定义
export const 合同模板 = {
  '劳动合同.docx': {
    title: '劳动合同',
    category: '合同模板',
    description: '用人单位与劳动者签订的劳动合同标准格式',
    scene: '劳动关系建立',
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

  '房屋租赁合同.docx': {
    title: '房屋租赁合同',
    category: '合同模板',
    description: '房屋出租方与承租方签订的租赁合同标准格式',
    scene: '房屋租赁关系建立',
    sections: [
      { type: 'paragraph', content: '出租方（甲方）：{{出租方姓名}}', indent: false },
      { type: 'paragraph', content: '身份证号：{{出租方身份证号}}', indent: false },
      { type: 'paragraph', content: '联系电话：{{出租方电话}}', indent: false },
      { type: 'paragraph', content: '地址：{{出租方地址}}', indent: false },
      { type: 'empty' },
      { type: 'paragraph', content: '承租方（乙方）：{{承租方姓名}}', indent: false },
      { type: 'paragraph', content: '身份证号：{{承租方身份证号}}', indent: false },
      { type: 'paragraph', content: '联系电话：{{承租方电话}}', indent: false },
      { type: 'paragraph', content: '地址：{{承租方地址}}', indent: false },
      { type: 'empty' },
      {
        type: 'paragraph',
        content: '根据《中华人民共和国合同法》及相关法律法规的规定，甲乙双方在平等、自愿的基础上，就房屋租赁事宜达成如下协议：'
      },
      { type: 'empty' },
      { type: 'heading', content: '第一条 房屋基本情况' },
      { type: 'paragraph', content: '1. 房屋位置：{{房屋地址}}' },
      { type: 'paragraph', content: '2. 房屋面积：{{房屋面积}}平方米' },
      { type: 'paragraph', content: '3. 房屋用途：{{房屋用途}}' },
      { type: 'paragraph', content: '4. 房屋设施：{{房屋设施}}' },
      { type: 'empty' },
      { type: 'heading', content: '第二条 租赁期限' },
      {
        type: 'paragraph',
        content: '租赁期限自{{开始日期}}起至{{结束日期}}止，共计{{租赁月数}}个月。'
      },
      { type: 'empty' },
      { type: 'heading', content: '第三条 租金及支付方式' },
      { type: 'paragraph', content: '1. 月租金：人民币{{月租金}}元（大写：{{租金大写}}）。' },
      { type: 'paragraph', content: '2. 支付方式：{{支付方式}}' },
      { type: 'paragraph', content: '3. 支付时间：每月{{支付日期}}日前支付当月租金。' },
      { type: 'paragraph', content: '4. 押金：人民币{{押金金额}}元，租赁期满无违约情形时退还。' },
      { type: 'empty' },
      { type: 'heading', content: '第四条 双方权利义务' },
      { type: 'paragraph', content: '1. 甲方保证房屋权属清晰，符合出租条件。' },
      { type: 'paragraph', content: '2. 乙方应按约定用途使用房屋，不得擅自改变房屋结构。' },
      { type: 'paragraph', content: '3. 乙方应按时支付租金及相关费用。' },
      { type: 'paragraph', content: '4. {{其他权利义务}}' },
      { type: 'empty' },
      { type: 'heading', content: '第五条 违约责任' },
      { type: 'paragraph', content: '1. 乙方逾期支付租金的，每逾期一日，按应付租金的{{逾期违约金比例}}%支付违约金。' },
      { type: 'paragraph', content: '2. {{其他违约责任}}' },
      { type: 'empty' },
      { type: 'heading', content: '第六条 合同解除' },
      { type: 'paragraph', content: '{{合同解除条件}}' },
      { type: 'empty' },
      { type: 'heading', content: '第七条 争议解决' },
      {
        type: 'paragraph',
        content: '本合同履行过程中发生争议的，由双方协商解决；协商不成的，依法向房屋所在地人民法院起诉。'
      },
      { type: 'empty' },
      { type: 'heading', content: '第八条 其他约定' },
      { type: 'paragraph', content: '{{其他约定事项}}' },
      { type: 'empty' },
      {
        type: 'paragraph',
        content: '本合同一式两份，甲乙双方各执一份，具有同等法律效力。自双方签字之日起生效。'
      },
      { type: 'empty' },
      { type: 'paragraph', content: '甲方（签字）：                    乙方（签字）：', indent: false },
      { type: 'empty' },
      { type: 'paragraph', content: '日期：                            日期：', indent: false }
    ]
  },

  '买卖合同.docx': {
    title: '买卖合同',
    category: '合同模板',
    description: '买卖双方签订的商品买卖合同标准格式',
    scene: '商品交易',
    sections: [
      { type: 'paragraph', content: '卖方（甲方）：{{卖方名称}}', indent: false },
      { type: 'paragraph', content: '地址：{{卖方地址}}', indent: false },
      { type: 'paragraph', content: '法定代表人：{{卖方法定代表人}}', indent: false },
      { type: 'paragraph', content: '联系电话：{{卖方电话}}', indent: false },
      { type: 'empty' },
      { type: 'paragraph', content: '买方（乙方）：{{买方名称}}', indent: false },
      { type: 'paragraph', content: '地址：{{买方地址}}', indent: false },
      { type: 'paragraph', content: '法定代表人：{{买方法定代表人}}', indent: false },
      { type: 'paragraph', content: '联系电话：{{买方电话}}', indent: false },
      { type: 'empty' },
      {
        type: 'paragraph',
        content: '根据《中华人民共和国合同法》及相关法律法规的规定，甲乙双方在平等、自愿的基础上，就买卖事宜达成如下协议：'
      },
      { type: 'empty' },
      { type: 'heading', content: '第一条 标的物' },
      { type: 'paragraph', content: '1. 商品名称：{{商品名称}}' },
      { type: 'paragraph', content: '2. 规格型号：{{规格型号}}' },
      { type: 'paragraph', content: '3. 数量：{{数量}}' },
      { type: 'paragraph', content: '4. 单价：人民币{{单价}}元' },
      { type: 'paragraph', content: '5. 总价：人民币{{总价}}元（大写：{{总价大写}}）' },
      { type: 'paragraph', content: '6. 质量标准：{{质量标准}}' },
      { type: 'empty' },
      { type: 'heading', content: '第二条 交付与验收' },
      { type: 'paragraph', content: '1. 交付时间：{{交付时间}}' },
      { type: 'paragraph', content: '2. 交付地点：{{交付地点}}' },
      { type: 'paragraph', content: '3. 交付方式：{{交付方式}}' },
      { type: 'paragraph', content: '4. 验收标准：{{验收标准}}' },
      { type: 'paragraph', content: '5. 验收期限：{{验收期限}}' },
      { type: 'empty' },
      { type: 'heading', content: '第三条 付款方式' },
      { type: 'paragraph', content: '1. 付款方式：{{付款方式}}' },
      { type: 'paragraph', content: '2. 付款时间：{{付款时间}}' },
      { type: 'paragraph', content: '3. 付款账户：{{付款账户}}' },
      { type: 'empty' },
      { type: 'heading', content: '第四条 质量保证' },
      { type: 'paragraph', content: '1. 甲方保证所售商品符合约定的质量标准。' },
      { type: 'paragraph', content: '2. 质量保证期：{{质量保证期}}' },
      { type: 'paragraph', content: '3. {{其他质量保证}}' },
      { type: 'empty' },
      { type: 'heading', content: '第五条 违约责任' },
      { type: 'paragraph', content: '1. 甲方逾期交付的，每逾期一日，按合同总价的{{逾期违约金比例}}%支付违约金。' },
      { type: 'paragraph', content: '2. 乙方逾期付款的，每逾期一日，按应付金额的{{逾期违约金比例}}%支付违约金。' },
      { type: 'paragraph', content: '3. {{其他违约责任}}' },
      { type: 'empty' },
      { type: 'heading', content: '第六条 争议解决' },
      {
        type: 'paragraph',
        content: '本合同履行过程中发生争议的，由双方协商解决；协商不成的，依法向{{管辖法院}}人民法院起诉。'
      },
      { type: 'empty' },
      { type: 'heading', content: '第七条 其他约定' },
      { type: 'paragraph', content: '{{其他约定事项}}' },
      { type: 'empty' },
      {
        type: 'paragraph',
        content: '本合同一式两份，甲乙双方各执一份，具有同等法律效力。自双方签字（盖章）之日起生效。'
      },
      { type: 'empty' },
      { type: 'paragraph', content: '甲方（盖章）：                    乙方（盖章）：', indent: false },
      { type: 'empty' },
      { type: 'paragraph', content: '法定代表人（签字）：            法定代表人（签字）：', indent: false },
      { type: 'empty' },
      { type: 'paragraph', content: '日期：                            日期：', indent: false }
    ]
  },

  '借款合同.docx': {
    title: '借款合同',
    category: '合同模板',
    description: '出借人与借款人签订的借款合同标准格式',
    scene: '民间借贷',
    sections: [
      { type: 'paragraph', content: '出借人（甲方）：{{出借人姓名}}', indent: false },
      { type: 'paragraph', content: '身份证号：{{出借人身份证号}}', indent: false },
      { type: 'paragraph', content: '联系电话：{{出借人电话}}', indent: false },
      { type: 'paragraph', content: '地址：{{出借人地址}}', indent: false },
      { type: 'empty' },
      { type: 'paragraph', content: '借款人（乙方）：{{借款人姓名}}', indent: false },
      { type: 'paragraph', content: '身份证号：{{借款人身份证号}}', indent: false },
      { type: 'paragraph', content: '联系电话：{{借款人电话}}', indent: false },
      { type: 'paragraph', content: '地址：{{借款人地址}}', indent: false },
      { type: 'empty' },
      {
        type: 'paragraph',
        content: '根据《中华人民共和国合同法》及相关法律法规的规定，甲乙双方在平等、自愿的基础上，就借款事宜达成如下协议：'
      },
      { type: 'empty' },
      { type: 'heading', content: '第一条 借款金额' },
      {
        type: 'paragraph',
        content: '乙方向甲方借款人民币{{借款金额}}元（大写：{{借款金额大写}}）。'
      },
      { type: 'empty' },
      { type: 'heading', content: '第二条 借款期限' },
      {
        type: 'paragraph',
        content: '借款期限自{{借款开始日期}}起至{{借款结束日期}}止，共计{{借款月数}}个月。'
      },
      { type: 'empty' },
      { type: 'heading', content: '第三条 借款利率' },
      { type: 'paragraph', content: '本借款利率为{{年利率}}%（年利率），{{利率说明}}。' },
      { type: 'empty' },
      { type: 'heading', content: '第四条 还款方式' },
      { type: 'paragraph', content: '1. 还款方式：{{还款方式}}' },
      { type: 'paragraph', content: '2. 还款时间：{{还款时间}}' },
      { type: 'paragraph', content: '3. 还款账户：{{还款账户}}' },
      { type: 'empty' },
      { type: 'heading', content: '第五条 借款用途' },
      { type: 'paragraph', content: '乙方保证将借款用于{{借款用途}}，不得挪作他用。' },
      { type: 'empty' },
      { type: 'heading', content: '第六条 担保条款' },
      { type: 'paragraph', content: '{{担保条款内容}}' },
      { type: 'empty' },
      { type: 'heading', content: '第七条 违约责任' },
      { type: 'paragraph', content: '1. 乙方逾期还款的，每逾期一日，按逾期金额的{{逾期违约金比例}}%支付违约金。' },
      { type: 'paragraph', content: '2. {{其他违约责任}}' },
      { type: 'empty' },
      { type: 'heading', content: '第八条 争议解决' },
      {
        type: 'paragraph',
        content: '本合同履行过程中发生争议的，由双方协商解决；协商不成的，依法向{{管辖法院}}人民法院起诉。'
      },
      { type: 'empty' },
      { type: 'heading', content: '第九条 其他约定' },
      { type: 'paragraph', content: '{{其他约定事项}}' },
      { type: 'empty' },
      {
        type: 'paragraph',
        content: '本合同一式两份，甲乙双方各执一份，具有同等法律效力。自双方签字之日起生效。'
      },
      { type: 'empty' },
      { type: 'paragraph', content: '甲方（签字）：                    乙方（签字）：', indent: false },
      { type: 'empty' },
      { type: 'paragraph', content: '日期：                            日期：', indent: false }
    ]
  }
}
