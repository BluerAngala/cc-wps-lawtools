// 合同模板类模板定义
export const 合同模板 = {
  '劳动合同.docx': {
    title: '劳动合同',
    category: '合同模板',
    description: '用人单位与劳动者签订的劳动合同标准格式',
    scene: '劳动关系建立',
    sections: [
      { type: 'paragraph', content: '甲方（用人单位）：{{公司名称}}', indent: false },
      { type: 'paragraph', content: '统一社会信用代码：{{统一社会信用代码}}', indent: false },
      { type: 'paragraph', content: '地址：{{公司地址}}', indent: false },
      { type: 'paragraph', content: '法定代表人：{{法定代表人}}', indent: false },
      { type: 'paragraph', content: '联系电话：{{公司电话}}', indent: false },
      { type: 'empty' },
      { type: 'paragraph', content: '乙方（劳动者）：{{员工姓名}}', indent: false },
      { type: 'paragraph', content: '身份证号：{{身份证号}}', indent: false },
      { type: 'paragraph', content: '住址：{{员工住址}}', indent: false },
      { type: 'paragraph', content: '联系电话：{{员工电话}}', indent: false },
      { type: 'paragraph', content: '紧急联系人：{{紧急联系人}}', indent: false },
      { type: 'paragraph', content: '紧急联系电话：{{紧急联系电话}}', indent: false },
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
      { type: 'paragraph', content: '其中试用期为{{试用期}}个月，自{{试用期开始日期}}起至{{试用期结束日期}}止。' },
      { type: 'empty' },
      { type: 'heading', content: '二、工作内容和工作地点' },
      {
        type: 'paragraph',
        content: '1. 乙方同意根据甲方工作需要，担任{{岗位名称}}岗位工作。'
      },
      { type: 'paragraph', content: '2. 工作地点：{{工作地点}}。' },
      { type: 'paragraph', content: '3. 工作职责：{{工作职责}}。' },
      { type: 'paragraph', content: '4. 甲方有权根据生产经营需要及乙方的能力、表现，调整乙方的工作岗位和工作内容，乙方应当服从安排。' },
      { type: 'empty' },
      { type: 'heading', content: '三、工作时间和休息休假' },
      { type: 'paragraph', content: '1. 甲方实行{{工时制度}}工时制度。' },
      { type: 'paragraph', content: '2. 工作时间：{{工作时间安排}}。' },
      {
        type: 'paragraph',
        content: '3. 休息休假：乙方享有法定节假日、年休假、婚假、产假、丧假等国家规定的假期。'
      },
      { type: 'paragraph', content: '4. 甲方因生产经营需要安排乙方加班的，应依法安排补休或支付加班工资。' },
      { type: 'empty' },
      { type: 'heading', content: '四、劳动报酬' },
      { type: 'paragraph', content: '1. 乙方月工资为人民币{{工资金额}}元（税前），其中基本工资{{基本工资金额}}元，绩效工资{{绩效工资金额}}元。' },
      { type: 'paragraph', content: '2. 工资发放时间：每月{{发放日期}}日发放上月工资。' },
      {
        type: 'paragraph',
        content: '3. 甲方根据公司经营状况和乙方工作表现，可适当调整乙方工资，调整幅度不低于当地最低工资标准。'
      },
      { type: 'paragraph', content: '4. 加班工资计算标准：{{加班工资计算标准}}。' },
      { type: 'empty' },
      { type: 'heading', content: '五、社会保险和福利待遇' },
      {
        type: 'paragraph',
        content: '1. 甲方依法为乙方办理养老、医疗、失业、工伤、生育等社会保险，并承担相应费用。'
      },
      {
        type: 'paragraph',
        content: '2. 乙方应缴纳的社会保险费由甲方从乙方工资中代扣代缴。'
      },
      { type: 'paragraph', content: '3. 其他福利待遇：{{其他福利}}。' },
      { type: 'paragraph', content: '4. 甲方为乙方购买{{商业保险类型}}商业保险，保险金额{{保险金额}}元。' },
      { type: 'empty' },
      { type: 'heading', content: '六、劳动保护、劳动条件和职业危害防护' },
      {
        type: 'paragraph',
        content:
          '甲方应当为乙方提供符合国家规定的劳动安全卫生条件和必要的劳动防护用品，对从事有职业危害作业的劳动者应当定期进行健康检查。'
      },
      { type: 'paragraph', content: '甲方应建立健全劳动安全卫生制度，严格执行国家劳动安全卫生规程和标准。' },
      { type: 'empty' },
      { type: 'heading', content: '七、劳动纪律' },
      {
        type: 'paragraph',
        content: '乙方应遵守国家法律法规和甲方依法制定的各项规章制度，服从管理，按时完成工作任务。'
      },
      { type: 'paragraph', content: '乙方违反甲方规章制度的，甲方有权按照规定给予相应处理。' },
      { type: 'empty' },
      { type: 'heading', content: '八、劳动合同的变更、解除和终止' },
      {
        type: 'paragraph',
        content: '1. 双方变更、解除或终止劳动合同，应当依照《劳动合同法》及相关法律法规的规定执行。'
      },
      { type: 'paragraph', content: '2. 经双方协商一致，可以变更本合同的内容。变更劳动合同应当采用书面形式。' },
      { type: 'paragraph', content: '3. 乙方提前解除劳动合同的，应当提前{{提前通知期限}}日书面通知甲方；在试用期内提前解除的，应当提前{{试用期提前通知期限}}日通知。' },
      { type: 'paragraph', content: '4. 有下列情形之一的，甲方可以解除劳动合同：' },
      { type: 'paragraph', content: '（1）在试用期间被证明不符合录用条件的；' },
      { type: 'paragraph', content: '（2）严重违反甲方规章制度的；' },
      { type: 'paragraph', content: '（3）严重失职，营私舞弊，给甲方造成重大损害的；' },
      { type: 'paragraph', content: '（4）乙方同时与其他用人单位建立劳动关系，对完成本单位的工作任务造成严重影响，或者经甲方提出，拒不改正的；' },
      { type: 'paragraph', content: '（5）被依法追究刑事责任的。' },
      { type: 'paragraph', content: '5. 有下列情形之一的，甲方提前{{提前通知期限}}日书面通知乙方或者额外支付乙方一个月工资后，可以解除劳动合同：' },
      { type: 'paragraph', content: '（1）乙方患病或者非因工负伤，在规定的医疗期满后不能从事原工作，也不能从事由甲方另行安排的工作的；' },
      { type: 'paragraph', content: '（2）乙方不能胜任工作，经过培训或者调整工作岗位，仍不能胜任工作的；' },
      { type: 'paragraph', content: '（3）劳动合同订立时所依据的客观情况发生重大变化，致使劳动合同无法履行，经双方协商未能就变更劳动合同内容达成协议的。' },
      { type: 'paragraph', content: '6. 解除或终止劳动合同时，甲方应依法为乙方办理相关手续，出具解除或终止劳动合同证明，并在{{办理期限}}日内为乙方办理档案和社会保险关系转移手续。' },
      { type: 'paragraph', content: '7. 乙方应当按照双方约定，办理工作交接。甲方应当向乙方支付经济补偿的，在办结工作交接时支付。' },
      { type: 'empty' },
      { type: 'heading', content: '九、保密与知识产权' },
      {
        type: 'paragraph',
        content: '乙方在职期间及离职后，应对甲方的商业秘密和与知识产权相关的保密事项承担保密义务。'
      },
      {
        type: 'paragraph',
        content: '乙方在职期间因履行职务或主要利用甲方的物质技术条件所完成的发明创造、作品等知识产权归甲方所有。'
      },
      { type: 'empty' },
      { type: 'heading', content: '十、违约责任' },
      { type: 'paragraph', content: '1. 乙方有下列情形之一的，视为违约：' },
      { type: 'paragraph', content: '（1）未按照约定履行工作职责或完成工作任务的；' },
      { type: 'paragraph', content: '（2）违反甲方规章制度，情节严重的；' },
      { type: 'paragraph', content: '（3）泄露甲方商业秘密或违反保密义务的；' },
      { type: 'paragraph', content: '（4）{{其他违约情形}}。' },
      { type: 'paragraph', content: '2. 乙方违反本合同约定，给甲方造成损失的，应承担相应的赔偿责任，赔偿范围包括但不限于直接损失、间接损失、律师费、诉讼费等。' },
      { type: 'paragraph', content: '3. 甲方有下列情形之一的，视为违约：' },
      { type: 'paragraph', content: '（1）未按照约定支付劳动报酬的；' },
      { type: 'paragraph', content: '（2）未按照约定提供劳动条件或劳动保护的；' },
      { type: 'paragraph', content: '（3）违法解除或终止劳动合同的；' },
      { type: 'paragraph', content: '（4）{{其他违约情形}}。' },
      { type: 'paragraph', content: '4. 甲方违反本合同约定，给乙方造成损失的，应承担相应的赔偿责任。' },
      { type: 'empty' },
      { type: 'heading', content: '十一、通知与送达' },
      {
        type: 'paragraph',
        content: '甲乙双方确认本合同载明的地址为有效送达地址，任何书面通知发送至该地址即视为送达。'
      },
      { type: 'paragraph', content: '一方变更送达地址的，应提前{{通知期限}}日书面通知对方。' },
      { type: 'empty' },
      { type: 'heading', content: '十二、争议解决' },
      {
        type: 'paragraph',
        content: '本合同履行过程中发生争议的，双方应首先协商解决；协商不成的，任何一方均可向劳动合同履行地劳动争议仲裁委员会申请仲裁。'
      },
      { type: 'paragraph', content: '对仲裁裁决不服的，可以依法向有管辖权的人民法院提起诉讼。' },
      { type: 'empty' },
      { type: 'heading', content: '十三、其他约定事项' },
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
        content: '根据《中华人民共和国民法典》及相关法律法规的规定，甲乙双方在平等、自愿的基础上，就房屋租赁事宜达成如下协议：'
      },
      { type: 'empty' },
      { type: 'heading', content: '第一条 房屋基本情况' },
      { type: 'paragraph', content: '1. 房屋位置：{{房屋地址}}' },
      { type: 'paragraph', content: '2. 房屋面积：{{房屋面积}}平方米' },
      { type: 'paragraph', content: '3. 房屋用途：{{房屋用途}}，乙方不得擅自改变房屋用途。' },
      { type: 'paragraph', content: '4. 房屋设施：{{房屋设施}}' },
      { type: 'paragraph', content: '5. 房屋权属状况：甲方保证对房屋享有合法出租权。' },
      { type: 'empty' },
      { type: 'heading', content: '第二条 租赁期限' },
      {
        type: 'paragraph',
        content: '租赁期限自{{开始日期}}起至{{结束日期}}止，共计{{租赁月数}}个月。'
      },
      { type: 'paragraph', content: '租赁期满，甲方有权收回出租房屋，乙方应如期交还。乙方如需续租，应在租赁期满前{{续租通知期限}}日书面通知甲方，经甲方同意后，双方另行签订租赁合同。' },
      { type: 'empty' },
      { type: 'heading', content: '第三条 租金及支付方式' },
      { type: 'paragraph', content: '1. 月租金：人民币{{月租金}}元（大写：{{租金大写}}）。' },
      { type: 'paragraph', content: '2. 支付方式：{{支付方式}}（现金/银行转账/其他方式）。' },
      { type: 'paragraph', content: '3. 支付时间：每月{{支付日期}}日前支付当月租金。' },
      { type: 'paragraph', content: '4. 押金：人民币{{押金金额}}元（相当于{{押金月数}}个月租金），于本合同签订时一次性支付。租赁期满，乙方无违约情形且房屋及设施完好无损的，甲方应在{{退还期限}}日内无息退还押金。' },
      { type: 'paragraph', content: '5. 租金调整：租赁期内，如遇市场租金大幅变动，双方可协商调整租金，调整幅度不超过{{租金调整幅度}}%。租金调整应当采用书面形式，自双方签字确认之日起生效。' },
      { type: 'paragraph', content: '6. 租金包含的费用：{{租金包含费用说明}}。' },
      { type: 'paragraph', content: '7. 租金不包含的费用：水费、电费、燃气费、物业管理费、网络费、有线电视费等由乙方自行承担。' },
      { type: 'empty' },
      { type: 'heading', content: '第四条 双方权利义务' },
      { type: 'paragraph', content: '1. 甲方保证房屋权属清晰，符合出租条件，并承担房屋主体结构自然损坏的维修责任。' },
      { type: 'paragraph', content: '2. 乙方应按约定用途使用房屋，不得擅自改变房屋结构，不得从事违法活动。' },
      { type: 'paragraph', content: '3. 乙方应按时支付租金及相关费用，并承担房屋使用过程中产生的水、电、燃气、物业等费用。' },
      { type: 'paragraph', content: '4. 乙方应合理使用房屋及其设施，因使用不当造成损坏的，应承担赔偿责任。' },
      { type: 'paragraph', content: '5. {{其他权利义务}}' },
      { type: 'empty' },
      { type: 'heading', content: '第五条 房屋维修' },
      { type: 'paragraph', content: '1. 房屋主体结构及固定设施的自然损坏由甲方负责维修。' },
      { type: 'paragraph', content: '2. 乙方使用不当造成的损坏由乙方负责维修并承担费用。' },
      { type: 'paragraph', content: '3. 维修事宜应及时通知对方，紧急情况可先行处理后协商费用承担。' },
      { type: 'empty' },
      { type: 'heading', content: '第六条 转租与转让' },
      { type: 'paragraph', content: '1. 未经甲方书面同意，乙方不得擅自转租、转借房屋。' },
      { type: 'paragraph', content: '2. 如甲方同意转租，转租合同期限不得超过本合同的剩余期限。' },
      { type: 'empty' },
      { type: 'heading', content: '第七条 违约责任' },
      { type: 'paragraph', content: '1. 乙方逾期支付租金的，每逾期一日，按应付租金的{{逾期违约金比例}}%（日利率）支付违约金。逾期超过{{逾期天数}}日的，甲方有权解除本合同，收回房屋，并要求乙方支付相当于{{违约金比例}}个月租金的违约金。' },
      { type: 'paragraph', content: '2. 乙方擅自改变房屋用途或结构的，应承担恢复原状的责任，并支付相当于{{违约金比例}}个月租金的违约金。如无法恢复原状的，应赔偿甲方因此遭受的全部损失。' },
      { type: 'paragraph', content: '3. 乙方未经甲方同意擅自转租、转借房屋的，甲方有权解除本合同，收回房屋，并要求乙方支付相当于{{违约金比例}}个月租金的违约金。' },
      { type: 'paragraph', content: '4. 乙方在租赁期内提前解除合同的，应提前{{提前通知期限}}日书面通知甲方，并支付相当于{{违约金比例}}个月租金的违约金。' },
      { type: 'paragraph', content: '5. 甲方提前收回房屋的，应提前{{通知期限}}日书面通知乙方，并退还剩余租金及押金，支付相当于{{违约金比例}}个月租金的违约金。' },
      { type: 'paragraph', content: '6. 甲方未按约定交付房屋或交付的房屋不符合约定条件的，应承担违约责任，并赔偿乙方因此遭受的损失。' },
      { type: 'paragraph', content: '7. 因一方违约导致合同解除的，违约方应赔偿守约方因此遭受的全部损失，包括但不限于直接损失、间接损失、律师费、诉讼费等。' },
      { type: 'paragraph', content: '8. {{其他违约责任}}' },
      { type: 'empty' },
      { type: 'heading', content: '第八条 不可抗力' },
      {
        type: 'paragraph',
        content: '因地震、台风、洪水、战争等不可抗力因素导致房屋损坏或合同无法履行的，双方互不承担责任，但应及时通知对方并采取适当措施减少损失。'
      },
      { type: 'empty' },
      { type: 'heading', content: '第九条 合同解除' },
      { type: 'paragraph', content: '{{合同解除条件}}' },
      { type: 'empty' },
      { type: 'heading', content: '第十条 通知与送达' },
      {
        type: 'paragraph',
        content: '甲乙双方确认本合同载明的地址为有效送达地址，任何书面通知发送至该地址即视为送达。'
      },
      { type: 'paragraph', content: '一方变更送达地址的，应提前{{通知期限}}日书面通知对方。' },
      { type: 'empty' },
      { type: 'heading', content: '第十一条 争议解决' },
      {
        type: 'paragraph',
        content: '1. 本合同履行过程中发生争议的，由双方协商解决；协商不成的，依法向房屋所在地人民法院起诉。'
      },
      {
        type: 'paragraph',
        content: '2. 双方确认，本合同签订地为{{签订地点}}，合同履行地为{{履行地点}}（即房屋所在地）。'
      },
      {
        type: 'paragraph',
        content: '3. 争议期间，除争议事项外，本合同其他条款仍应履行，任何一方不得以争议为由拒绝履行其他义务。'
      },
      {
        type: 'paragraph',
        content: '4. 因本合同产生的诉讼费、律师费、保全费、执行费等费用，由败诉方承担。'
      },
      { type: 'empty' },
      { type: 'heading', content: '第十二条 其他约定' },
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
      { type: 'paragraph', content: '统一社会信用代码：{{卖方统一社会信用代码}}', indent: false },
      { type: 'paragraph', content: '地址：{{卖方地址}}', indent: false },
      { type: 'paragraph', content: '法定代表人：{{卖方法定代表人}}', indent: false },
      { type: 'paragraph', content: '联系电话：{{卖方电话}}', indent: false },
      { type: 'empty' },
      { type: 'paragraph', content: '买方（乙方）：{{买方名称}}', indent: false },
      { type: 'paragraph', content: '统一社会信用代码：{{买方统一社会信用代码}}', indent: false },
      { type: 'paragraph', content: '地址：{{买方地址}}', indent: false },
      { type: 'paragraph', content: '法定代表人：{{买方法定代表人}}', indent: false },
      { type: 'paragraph', content: '联系电话：{{买方电话}}', indent: false },
      { type: 'empty' },
      {
        type: 'paragraph',
        content: '根据《中华人民共和国民法典》及相关法律法规的规定，甲乙双方在平等、自愿的基础上，就买卖事宜达成如下协议：'
      },
      { type: 'empty' },
      { type: 'heading', content: '第一条 标的物' },
      { type: 'paragraph', content: '1. 商品名称：{{商品名称}}' },
      { type: 'paragraph', content: '2. 规格型号：{{规格型号}}' },
      { type: 'paragraph', content: '3. 数量：{{数量}}' },
      { type: 'paragraph', content: '4. 单价：人民币{{单价}}元' },
      { type: 'paragraph', content: '5. 总价：人民币{{总价}}元（大写：{{总价大写}}）' },
      { type: 'paragraph', content: '6. 质量标准：{{质量标准}}' },
      { type: 'paragraph', content: '7. 包装方式：{{包装方式}}' },
      { type: 'paragraph', content: '8. 产地：{{产地}}' },
      { type: 'empty' },
      { type: 'heading', content: '第二条 交付与验收' },
      { type: 'paragraph', content: '1. 交付时间：{{交付时间}}' },
      { type: 'paragraph', content: '2. 交付地点：{{交付地点}}' },
      { type: 'paragraph', content: '3. 交付方式：{{交付方式}}' },
      { type: 'paragraph', content: '4. 运输方式及费用承担：{{运输方式及费用承担}}' },
      { type: 'paragraph', content: '5. 验收标准：{{验收标准}}' },
      { type: 'paragraph', content: '6. 验收期限：乙方应在收到货物后{{验收期限}}日内完成验收，如有异议应书面通知甲方。' },
      { type: 'paragraph', content: '7. 所有权转移：标的物所有权自{{所有权转移时间}}起转移给乙方。' },
      { type: 'empty' },
      { type: 'heading', content: '第三条 付款方式' },
      { type: 'paragraph', content: '1. 付款方式：{{付款方式}}' },
      { type: 'paragraph', content: '2. 付款时间：{{付款时间}}' },
      { type: 'paragraph', content: '3. 付款账户：{{付款账户}}' },
      { type: 'paragraph', content: '4. 发票：甲方应在收到款项后{{发票开具时间}}日内向乙方开具符合税法规定的发票。' },
      { type: 'empty' },
      { type: 'heading', content: '第四条 质量保证' },
      { type: 'paragraph', content: '1. 甲方保证所售商品符合约定的质量标准。' },
      { type: 'paragraph', content: '2. 质量保证期：{{质量保证期}}' },
      { type: 'paragraph', content: '3. 质量保证期内，因商品质量问题造成的损失由甲方承担。' },
      { type: 'paragraph', content: '4. {{其他质量保证}}' },
      { type: 'empty' },
      { type: 'heading', content: '第五条 知识产权保证' },
      {
        type: 'paragraph',
        content: '甲方保证所售商品不侵犯任何第三方的知识产权，如因知识产权问题导致乙方遭受损失的，由甲方承担全部责任。'
      },
      { type: 'empty' },
      { type: 'heading', content: '第六条 违约责任' },
      { type: 'paragraph', content: '1. 甲方逾期交付的，每逾期一日，按合同总价的{{逾期违约金比例}}%（日利率）支付违约金。逾期超过{{逾期天数}}日的，乙方有权解除本合同，并要求甲方支付相当于合同总价{{违约金比例}}%的违约金。' },
      { type: 'paragraph', content: '2. 乙方逾期付款的，每逾期一日，按应付金额的{{逾期违约金比例}}%（日利率）支付违约金。逾期超过{{逾期天数}}日的，甲方有权解除本合同，并要求乙方支付相当于合同总价{{违约金比例}}%的违约金。' },
      { type: 'paragraph', content: '3. 商品质量不符合约定的，乙方有权要求甲方在{{修复期限}}日内修理、更换、退货或减少价款。如甲方拒绝或无法在期限内修复的，乙方有权解除本合同，并要求甲方支付相当于合同总价{{违约金比例}}%的违约金。' },
      { type: 'paragraph', content: '4. 甲方交付的商品数量不足的，应补足数量；数量超出约定的，超出部分乙方有权拒收，由此产生的费用由甲方承担。' },
      { type: 'paragraph', content: '5. 因一方违约导致合同解除的，违约方应赔偿守约方因此遭受的全部损失，包括但不限于直接损失、间接损失、律师费、诉讼费等。' },
      { type: 'paragraph', content: '6. 违约金不足以弥补守约方损失的，违约方还应承担赔偿责任。' },
      { type: 'paragraph', content: '7. {{其他违约责任}}' },
      { type: 'empty' },
      { type: 'heading', content: '第七条 不可抗力' },
      {
        type: 'paragraph',
        content: '因地震、台风、洪水、战争等不可抗力因素导致合同无法履行的，双方互不承担责任，但应及时通知对方并采取适当措施减少损失。'
      },
      { type: 'empty' },
      { type: 'heading', content: '第八条 合同解除' },
      { type: 'paragraph', content: '{{合同解除条件}}' },
      { type: 'empty' },
      { type: 'heading', content: '第九条 通知与送达' },
      {
        type: 'paragraph',
        content: '甲乙双方确认本合同载明的地址为有效送达地址，任何书面通知发送至该地址即视为送达。'
      },
      { type: 'paragraph', content: '一方变更送达地址的，应提前{{通知期限}}日书面通知对方。' },
      { type: 'empty' },
      { type: 'heading', content: '第十条 争议解决' },
      {
        type: 'paragraph',
        content: '1. 本合同履行过程中发生争议的，由双方协商解决；协商不成的，依法向{{管辖法院}}人民法院起诉。'
      },
      {
        type: 'paragraph',
        content: '2. 双方确认，本合同签订地为{{签订地点}}，合同履行地为{{履行地点}}。'
      },
      {
        type: 'paragraph',
        content: '3. 争议期间，除争议事项外，本合同其他条款仍应履行，任何一方不得以争议为由拒绝履行其他义务。'
      },
      {
        type: 'paragraph',
        content: '4. 因本合同产生的诉讼费、律师费、保全费、执行费等费用，由败诉方承担。'
      },
      { type: 'empty' },
      { type: 'heading', content: '第十一条 其他约定' },
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
        content: '根据《中华人民共和国民法典》及相关法律法规的规定，甲乙双方在平等、自愿的基础上，就借款事宜达成如下协议：'
      },
      { type: 'empty' },
      { type: 'heading', content: '第一条 借款金额' },
      {
        type: 'paragraph',
        content: '乙方向甲方借款人民币{{借款金额}}元（大写：{{借款金额大写}}）。'
      },
      { type: 'paragraph', content: '甲方应于{{借款发放日期}}前将借款一次性支付给乙方。' },
      { type: 'empty' },
      { type: 'heading', content: '第二条 借款期限' },
      {
        type: 'paragraph',
        content: '借款期限自{{借款开始日期}}起至{{借款结束日期}}止，共计{{借款月数}}个月。'
      },
      { type: 'empty' },
      { type: 'heading', content: '第三条 借款利率' },
      { type: 'paragraph', content: '本借款利率为{{年利率}}%（年利率），{{利率说明}}。' },
      { type: 'paragraph', content: '利息计算方式：{{利息计算方式}}。' },
      { type: 'paragraph', content: '利率调整：{{利率调整方式}}。' },
      { type: 'empty' },
      { type: 'heading', content: '第四条 还款方式' },
      { type: 'paragraph', content: '1. 还款方式：{{还款方式}}' },
      { type: 'paragraph', content: '2. 还款时间：{{还款时间}}' },
      { type: 'paragraph', content: '3. 还款账户：{{还款账户}}' },
      { type: 'paragraph', content: '4. 提前还款：乙方可以提前还款，提前还款的利息计算方式为{{提前还款利息计算}}。' },
      { type: 'empty' },
      { type: 'heading', content: '第五条 借款用途' },
      { type: 'paragraph', content: '乙方保证将借款用于{{借款用途}}，不得挪作他用。' },
      { type: 'paragraph', content: '甲方有权对借款用途进行监督，如发现挪用，甲方有权提前收回借款。' },
      { type: 'empty' },
      { type: 'heading', content: '第六条 担保条款' },
      { type: 'paragraph', content: '{{担保条款内容}}' },
      { type: 'paragraph', content: '担保范围：主债权及利息、违约金、损害赔偿金和实现债权的费用。' },
      { type: 'paragraph', content: '担保期限：{{担保期限}}。' },
      { type: 'empty' },
      { type: 'heading', content: '第七条 违约责任' },
      { type: 'paragraph', content: '1. 乙方逾期还款的，每逾期一日，按逾期金额的{{逾期违约金比例}}%（日利率）支付违约金。逾期超过{{逾期天数}}日的，甲方有权提前收回全部借款，并要求乙方支付相当于借款总额{{违约金比例}}%的违约金。' },
      { type: 'paragraph', content: '2. 乙方未按约定用途使用借款的，甲方有权提前收回借款，并要求乙方支付相当于借款总额{{违约金比例}}%的违约金。' },
      { type: 'paragraph', content: '3. 乙方提供虚假信息或隐瞒重要事实的，甲方有权提前收回借款，并要求乙方支付相当于借款总额{{违约金比例}}%的违约金。' },
      { type: 'paragraph', content: '4. 乙方未按约定提供担保或担保无效的，甲方有权提前收回借款，并要求乙方支付相当于借款总额{{违约金比例}}%的违约金。' },
      { type: 'paragraph', content: '5. 甲方未按约定发放借款的，每逾期一日，按应发放金额的{{逾期违约金比例}}%（日利率）支付违约金。' },
      { type: 'paragraph', content: '6. 因一方违约导致合同解除的，违约方应赔偿守约方因此遭受的全部损失，包括但不限于直接损失、间接损失、律师费、诉讼费等。' },
      { type: 'paragraph', content: '7. 违约金不足以弥补守约方损失的，违约方还应承担赔偿责任。' },
      { type: 'paragraph', content: '8. {{其他违约责任}}' },
      { type: 'empty' },
      { type: 'heading', content: '第八条 不可抗力' },
      {
        type: 'paragraph',
        content: '1. 不可抗力是指不能预见、不能避免并不能克服的客观情况，包括但不限于地震、台风、洪水、火灾、战争、罢工、暴动、政府行为、法律法规变化、公共卫生事件等。'
      },
      {
        type: 'paragraph',
        content: '2. 因不可抗力导致合同无法履行的，遭受不可抗力的一方应及时通知对方，并在{{通知期限}}日内提供相关证明文件。'
      },
      {
        type: 'paragraph',
        content: '3. 因不可抗力导致合同部分或全部无法履行的，双方互不承担责任，但应及时采取适当措施减少损失。'
      },
      {
        type: 'paragraph',
        content: '4. 因不可抗力导致合同无法履行的，双方应协商解决。如协商不成，任何一方均有权解除合同，已履行的部分按照实际履行情况结算。'
      },
      {
        type: 'paragraph',
        content: '5. 因不可抗力导致合同迟延履行的，迟延履行期间不承担违约责任，但应尽快恢复履行。'
      },
      { type: 'empty' },
      { type: 'heading', content: '第九条 通知与送达' },
      {
        type: 'paragraph',
        content: '甲乙双方确认本合同载明的地址为有效送达地址，任何书面通知发送至该地址即视为送达。'
      },
      { type: 'paragraph', content: '一方变更送达地址的，应提前{{通知期限}}日书面通知对方。' },
      { type: 'empty' },
      { type: 'heading', content: '第十条 争议解决' },
      {
        type: 'paragraph',
        content: '1. 本合同履行过程中发生争议的，由双方协商解决；协商不成的，依法向{{管辖法院}}人民法院起诉。'
      },
      {
        type: 'paragraph',
        content: '2. 双方确认，本合同签订地为{{签订地点}}，合同履行地为{{履行地点}}。'
      },
      {
        type: 'paragraph',
        content: '3. 争议期间，除争议事项外，本合同其他条款仍应履行，任何一方不得以争议为由拒绝履行其他义务。'
      },
      {
        type: 'paragraph',
        content: '4. 因本合同产生的诉讼费、律师费、保全费、执行费等费用，由败诉方承担。'
      },
      { type: 'empty' },
      { type: 'heading', content: '第十一条 其他约定' },
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
