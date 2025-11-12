// 其他常用法律文书模板定义
export const 其他文书模板 = {
  '授权委托书.docx': {
    title: '授权委托书',
    category: '其他文书',
    description: '委托他人代理法律事务的授权书',
    scene: '法律事务代理',
    sections: [
      { type: 'paragraph', content: '委托人：{{委托人姓名}}', indent: false },
      { type: 'paragraph', content: '身份证号：{{委托人身份证号}}', indent: false },
      { type: 'paragraph', content: '住址：{{委托人住址}}', indent: false },
      { type: 'paragraph', content: '联系电话：{{委托人电话}}', indent: false },
      { type: 'empty' },
      { type: 'paragraph', content: '受托人：{{受托人姓名}}', indent: false },
      { type: 'paragraph', content: '身份证号：{{受托人身份证号}}', indent: false },
      { type: 'paragraph', content: '住址：{{受托人住址}}', indent: false },
      { type: 'paragraph', content: '联系电话：{{受托人电话}}', indent: false },
      { type: 'empty' },
      {
        type: 'paragraph',
        content: '现委托人{{委托人姓名}}因{{委托事由}}一事，特委托{{受托人姓名}}作为代理人，代理权限如下：'
      },
      { type: 'empty' },
      { type: 'heading', content: '代理权限：' },
      { type: 'paragraph', content: '1. {{代理权限1}}；' },
      { type: 'paragraph', content: '2. {{代理权限2}}；' },
      { type: 'paragraph', content: '3. {{代理权限3}}；' },
      { type: 'paragraph', content: '4. 代为承认、放弃、变更诉讼请求，进行和解，提起反诉或者上诉；' },
      { type: 'paragraph', content: '5. 代为签收法律文书；' },
      { type: 'paragraph', content: '6. 其他与{{委托事由}}相关的法律事务。' },
      { type: 'empty' },
      { type: 'heading', content: '代理期限：' },
      { type: 'paragraph', content: '自{{开始日期}}起至{{结束日期}}止，或至{{委托事由}}完成之日止。' },
      { type: 'empty' },
      { type: 'heading', content: '特别说明：' },
      { type: 'paragraph', content: '1. 受托人在上述权限范围内所签署的有关文件，委托人均予以承认。' },
      { type: 'paragraph', content: '2. 受托人应按照委托人的指示处理委托事务，不得超越代理权限。' },
      { type: 'paragraph', content: '3. 受托人因处理委托事务支出的必要费用，由委托人承担。' },
      { type: 'paragraph', content: '4. 委托人可以随时撤销委托，但应提前{{通知期限}}日书面通知受托人。' },
      { type: 'empty' },
      { type: 'paragraph', content: '委托人：{{委托人姓名}}', indent: false },
      { type: 'paragraph', content: '受托人：{{受托人姓名}}', indent: false },
      { type: 'empty' },
      { type: 'paragraph', content: '日期：{{日期}}', indent: false }
    ]
  },

  '遗嘱.docx': {
    title: '遗嘱',
    category: '其他文书',
    description: '个人处分财产的遗嘱文书',
    scene: '财产继承安排',
    sections: [
      { type: 'paragraph', content: '立遗嘱人：{{立遗嘱人姓名}}', indent: false },
      { type: 'paragraph', content: '身份证号：{{身份证号}}', indent: false },
      { type: 'paragraph', content: '住址：{{住址}}', indent: false },
      { type: 'empty' },
      {
        type: 'paragraph',
        content: '我，{{立遗嘱人姓名}}，{{出生日期}}出生，{{民族}}族，身份证号：{{身份证号}}，现住址：{{住址}}。在头脑清醒、具有完全民事行为能力的情况下，根据《中华人民共和国民法典》的相关规定，自愿订立本遗嘱，对我的财产作出如下处分：'
      },
      { type: 'empty' },
      { type: 'heading', content: '一、财产情况' },
      { type: 'paragraph', content: '1. 房产：{{房产情况}}（房产证号：{{房产证号}}，坐落于{{房产地址}}）；' },
      { type: 'paragraph', content: '2. 存款：{{存款情况}}（开户银行：{{开户银行}}，账号：{{账号}}）；' },
      { type: 'paragraph', content: '3. 车辆：{{车辆情况}}（车牌号：{{车牌号}}）；' },
      { type: 'paragraph', content: '4. 其他财产：{{其他财产情况}}。' },
      { type: 'empty' },
      { type: 'heading', content: '二、财产处分' },
      { type: 'paragraph', content: '1. 将{{财产1}}（具体描述：{{财产1描述}}）遗赠给{{继承人1}}（身份证号：{{继承人1身份证号}}，与立遗嘱人关系：{{关系1}}）；' },
      { type: 'paragraph', content: '2. 将{{财产2}}（具体描述：{{财产2描述}}）遗赠给{{继承人2}}（身份证号：{{继承人2身份证号}}，与立遗嘱人关系：{{关系2}}）；' },
      { type: 'paragraph', content: '3. {{其他财产处分}}。' },
      { type: 'paragraph', content: '4. 如上述继承人先于立遗嘱人死亡或放弃继承的，该部分财产按照法定继承处理。' },
      { type: 'empty' },
      { type: 'heading', content: '三、遗嘱执行人' },
      { type: 'paragraph', content: '指定{{执行人姓名}}（身份证号：{{执行人身份证号}}，联系电话：{{执行人电话}}）为本遗嘱的执行人，负责本遗嘱的执行事宜。' },
      { type: 'paragraph', content: '如执行人无法或不愿执行本遗嘱，指定{{候补执行人姓名}}（身份证号：{{候补执行人身份证号}}）为候补执行人。' },
      { type: 'empty' },
      { type: 'heading', content: '四、其他说明' },
      { type: 'paragraph', content: '1. 本遗嘱为自书遗嘱，由立遗嘱人亲笔书写并签名。' },
      { type: 'paragraph', content: '2. 本遗嘱一式{{份数}}份，具有同等法律效力。' },
      { type: 'paragraph', content: '3. 本遗嘱自立遗嘱人死亡之日起生效。' },
      { type: 'paragraph', content: '4. 如本遗嘱与之前所立遗嘱有冲突的，以本遗嘱为准。' },
      { type: 'empty' },
      { type: 'paragraph', content: '立遗嘱人：{{立遗嘱人姓名}}', indent: false },
      { type: 'paragraph', content: '见证人：{{见证人1姓名}}', indent: false },
      { type: 'paragraph', content: '见证人：{{见证人2姓名}}', indent: false },
      { type: 'empty' },
      { type: 'paragraph', content: '日期：{{日期}}', indent: false }
    ]
  },

  '离婚协议书.docx': {
    title: '离婚协议书',
    category: '其他文书',
    description: '夫妻双方自愿离婚的协议书',
    scene: '协议离婚',
    sections: [
      { type: 'paragraph', content: '男方：{{男方姓名}}', indent: false },
      { type: 'paragraph', content: '身份证号：{{男方身份证号}}', indent: false },
      { type: 'paragraph', content: '住址：{{男方住址}}', indent: false },
      { type: 'paragraph', content: '联系电话：{{男方电话}}', indent: false },
      { type: 'empty' },
      { type: 'paragraph', content: '女方：{{女方姓名}}', indent: false },
      { type: 'paragraph', content: '身份证号：{{女方身份证号}}', indent: false },
      { type: 'paragraph', content: '住址：{{女方住址}}', indent: false },
      { type: 'paragraph', content: '联系电话：{{女方电话}}', indent: false },
      { type: 'empty' },
      {
        type: 'paragraph',
        content: '男方{{男方姓名}}与女方{{女方姓名}}于{{结婚日期}}登记结婚，现因{{离婚原因}}，双方自愿离婚，经协商达成如下协议：'
      },
      { type: 'empty' },
      { type: 'heading', content: '一、自愿离婚' },
      { type: 'paragraph', content: '双方一致同意自愿离婚。' },
      { type: 'empty' },
      { type: 'heading', content: '二、子女抚养' },
      { type: 'paragraph', content: '1. 婚生子/女{{子女姓名}}（{{出生日期}}出生，身份证号：{{子女身份证号}}）由{{抚养方}}抚养；' },
      { type: 'paragraph', content: '2. 另一方每月支付抚养费人民币{{抚养费金额}}元，于每月{{支付日期}}日前支付至{{抚养方}}指定的银行账户（账户名：{{账户名}}，开户银行：{{开户银行}}，账号：{{账号}}）；' },
      { type: 'paragraph', content: '3. 抚养费包括子女的日常生活费、教育费、医疗费等必要费用。如遇重大疾病或特殊教育支出，由双方协商承担；' },
      { type: 'paragraph', content: '4. 抚养费支付至子女年满18周岁止。如子女年满18周岁后仍在接受全日制教育，抚养费支付至其完成全日制教育止；' },
      { type: 'paragraph', content: '5. 另一方享有探望权，具体探望方式为：{{探望方式}}。{{抚养方}}应配合另一方行使探望权；' },
      { type: 'paragraph', content: '6. {{其他子女抚养安排}}。' },
      { type: 'empty' },
      { type: 'heading', content: '三、财产分割' },
      { type: 'paragraph', content: '1. 房产：{{房产分割方案}}（房产证号：{{房产证号}}，坐落于{{房产地址}}）。如涉及房产过户，双方应配合办理相关手续，过户费用由{{承担方}}承担；' },
      { type: 'paragraph', content: '2. 存款：{{存款分割方案}}（开户银行：{{开户银行}}，账号：{{账号}}）；' },
      { type: 'paragraph', content: '3. 车辆：{{车辆分割方案}}（车牌号：{{车牌号}}）；' },
      { type: 'paragraph', content: '4. 其他财产：{{其他财产分割方案}}。' },
      { type: 'paragraph', content: '5. 双方确认，除本协议约定的财产外，双方无其他共同财产。' },
      { type: 'empty' },
      { type: 'heading', content: '四、债务处理' },
      { type: 'paragraph', content: '1. 双方确认，婚姻关系存续期间的共同债务为：{{共同债务说明}}；' },
      { type: 'paragraph', content: '2. 上述债务由{{承担方}}承担，与另一方无关；' },
      { type: 'paragraph', content: '3. 如一方隐瞒债务，该债务由隐瞒方自行承担；' },
      { type: 'paragraph', content: '4. {{其他债务处理方案}}。' },
      { type: 'empty' },
      { type: 'heading', content: '五、其他约定' },
      { type: 'paragraph', content: '{{其他约定事项}}' },
      { type: 'empty' },
      {
        type: 'paragraph',
        content: '本协议一式三份，双方各执一份，婚姻登记机关存档一份，具有同等法律效力。'
      },
      { type: 'empty' },
      { type: 'paragraph', content: '男方（签字）：{{男方姓名}}', indent: false },
      { type: 'paragraph', content: '女方（签字）：{{女方姓名}}', indent: false },
      { type: 'empty' },
      { type: 'paragraph', content: '日期：{{日期}}', indent: false }
    ]
  },

  '和解协议书.docx': {
    title: '和解协议书',
    category: '其他文书',
    description: '纠纷双方达成和解的协议书',
    scene: '纠纷和解',
    sections: [
      { type: 'paragraph', content: '甲方：{{甲方姓名/名称}}', indent: false },
      { type: 'paragraph', content: '身份证号/统一社会信用代码：{{甲方证件号}}', indent: false },
      { type: 'paragraph', content: '住址/地址：{{甲方地址}}', indent: false },
      { type: 'paragraph', content: '联系电话：{{甲方电话}}', indent: false },
      { type: 'empty' },
      { type: 'paragraph', content: '乙方：{{乙方姓名/名称}}', indent: false },
      { type: 'paragraph', content: '身份证号/统一社会信用代码：{{乙方证件号}}', indent: false },
      { type: 'paragraph', content: '住址/地址：{{乙方地址}}', indent: false },
      { type: 'paragraph', content: '联系电话：{{乙方电话}}', indent: false },
      { type: 'empty' },
      {
        type: 'paragraph',
        content: '甲乙双方因{{纠纷事由}}发生纠纷，现经友好协商，自愿达成如下和解协议：'
      },
      { type: 'empty' },
      { type: 'heading', content: '一、纠纷事实' },
      { type: 'paragraph', content: '{{纠纷事实描述}}' },
      { type: 'empty' },
      { type: 'heading', content: '二、和解方案' },
      { type: 'paragraph', content: '1. {{和解方案1}}；' },
      { type: 'paragraph', content: '2. {{和解方案2}}；' },
      { type: 'paragraph', content: '3. {{和解方案3}}。' },
      { type: 'empty' },
      { type: 'heading', content: '三、履行方式' },
      { type: 'paragraph', content: '{{履行方式和期限}}' },
      { type: 'empty' },
      { type: 'heading', content: '四、违约责任' },
      { type: 'paragraph', content: '1. 任何一方违反本协议约定的，应承担违约责任，赔偿守约方因此遭受的全部损失；' },
      { type: 'paragraph', content: '2. 如一方逾期履行本协议约定的义务，每逾期一日，按应履行金额的{{逾期违约金比例}}%（日利率）支付违约金；' },
      { type: 'paragraph', content: '3. 如一方拒绝履行本协议约定的义务，守约方有权要求违约方继续履行，并赔偿因此遭受的全部损失，包括但不限于直接损失、间接损失、律师费、诉讼费等；' },
      { type: 'paragraph', content: '4. {{其他违约责任条款}}。' },
      { type: 'empty' },
      { type: 'heading', content: '五、争议解决' },
      {
        type: 'paragraph',
        content: '1. 本协议履行过程中发生争议的，由双方协商解决；协商不成的，依法向{{管辖法院}}人民法院起诉。'
      },
      {
        type: 'paragraph',
        content: '2. 双方确认，本协议签订地为{{签订地点}}，协议履行地为{{履行地点}}。'
      },
      {
        type: 'paragraph',
        content: '3. 争议期间，除争议事项外，本协议其他条款仍应履行，任何一方不得以争议为由拒绝履行其他义务。'
      },
      {
        type: 'paragraph',
        content: '4. 因本协议产生的诉讼费、律师费、保全费、执行费等费用，由败诉方承担。'
      },
      { type: 'empty' },
      { type: 'heading', content: '六、其他约定' },
      { type: 'paragraph', content: '{{其他约定事项}}' },
      { type: 'empty' },
      {
        type: 'paragraph',
        content: '本协议一式两份，甲乙双方各执一份，具有同等法律效力。自双方签字之日起生效。'
      },
      { type: 'empty' },
      { type: 'paragraph', content: '甲方（签字/盖章）：{{甲方姓名/名称}}', indent: false },
      { type: 'paragraph', content: '乙方（签字/盖章）：{{乙方姓名/名称}}', indent: false },
      { type: 'empty' },
      { type: 'paragraph', content: '日期：{{日期}}', indent: false }
    ]
  },

  '保密协议.docx': {
    title: '保密协议',
    category: '其他文书',
    description: '约定保密义务的协议书',
    scene: '商业合作保密',
    sections: [
      { type: 'paragraph', content: '甲方：{{甲方名称}}', indent: false },
      { type: 'paragraph', content: '地址：{{甲方地址}}', indent: false },
      { type: 'paragraph', content: '法定代表人：{{甲方法定代表人}}', indent: false },
      { type: 'paragraph', content: '联系电话：{{甲方电话}}', indent: false },
      { type: 'empty' },
      { type: 'paragraph', content: '乙方：{{乙方姓名/名称}}', indent: false },
      { type: 'paragraph', content: '身份证号/统一社会信用代码：{{乙方证件号}}', indent: false },
      { type: 'paragraph', content: '住址/地址：{{乙方地址}}', indent: false },
      { type: 'paragraph', content: '联系电话：{{乙方电话}}', indent: false },
      { type: 'empty' },
      {
        type: 'paragraph',
        content: '甲乙双方就{{合作事项}}进行合作，为保护甲方的商业秘密，经协商一致，签订本保密协议：'
      },
      { type: 'empty' },
      { type: 'heading', content: '一、保密信息的范围' },
      { type: 'paragraph', content: '1. 技术信息：{{技术信息范围}}；' },
      { type: 'paragraph', content: '2. 经营信息：{{经营信息范围}}；' },
      { type: 'paragraph', content: '3. 其他信息：{{其他保密信息}}。' },
      { type: 'empty' },
      { type: 'heading', content: '二、保密义务' },
      { type: 'paragraph', content: '1. 乙方不得向任何第三方披露保密信息，包括但不限于通过口头、书面、电子等方式；' },
      { type: 'paragraph', content: '2. 乙方仅可为{{合作目的}}使用保密信息，不得用于其他任何目的；' },
      { type: 'paragraph', content: '3. 乙方应采取合理的保密措施，防止保密信息泄露、丢失或被窃取；' },
      { type: 'paragraph', content: '4. 乙方不得复制、摘录、传播保密信息，除非获得甲方书面同意；' },
      { type: 'paragraph', content: '5. 乙方应要求其员工、代理人、顾问等接触保密信息的人员承担同样的保密义务；' },
      { type: 'paragraph', content: '6. {{其他保密义务}}。' },
      { type: 'empty' },
      { type: 'heading', content: '三、保密期限' },
      { type: 'paragraph', content: '1. 本协议有效期为{{协议期限}}年，自{{开始日期}}起至{{结束日期}}止。' },
      { type: 'paragraph', content: '2. 保密义务不因本协议终止而终止，乙方应在本协议终止后继续承担保密义务，直至保密信息进入公有领域或甲方书面解除乙方的保密义务。' },
      { type: 'paragraph', content: '3. 如双方另行签订保密协议，以另行签订的保密协议为准。' },
      { type: 'empty' },
      { type: 'heading', content: '四、违约责任' },
      { type: 'paragraph', content: '乙方违反本协议约定的，应承担以下违约责任：' },
      { type: 'paragraph', content: '1. 立即停止违约行为，并采取有效措施防止损失扩大；' },
      { type: 'paragraph', content: '2. 赔偿甲方因此遭受的全部损失，包括但不限于直接损失、间接损失、利润损失、商誉损失等；' },
      { type: 'paragraph', content: '3. 支付违约金人民币{{违约金金额}}元；' },
      { type: 'paragraph', content: '4. 承担甲方为追究违约责任而支出的全部费用，包括但不限于律师费、诉讼费、调查取证费等；' },
      { type: 'paragraph', content: '5. 如违约行为构成犯罪的，甲方有权向司法机关举报，追究乙方的刑事责任；' },
      { type: 'paragraph', content: '6. {{其他违约责任}}。' },
      { type: 'empty' },
      { type: 'heading', content: '五、争议解决' },
      {
        type: 'paragraph',
        content: '1. 本协议履行过程中发生争议的，由双方协商解决；协商不成的，依法向{{管辖法院}}人民法院起诉。'
      },
      {
        type: 'paragraph',
        content: '2. 双方确认，本协议签订地为{{签订地点}}，协议履行地为{{履行地点}}。'
      },
      {
        type: 'paragraph',
        content: '3. 争议期间，除争议事项外，本协议其他条款仍应履行，任何一方不得以争议为由拒绝履行其他义务。'
      },
      {
        type: 'paragraph',
        content: '4. 因本协议产生的诉讼费、律师费、保全费、执行费等费用，由败诉方承担。'
      },
      { type: 'empty' },
      { type: 'heading', content: '六、其他约定' },
      { type: 'paragraph', content: '{{其他约定事项}}' },
      { type: 'empty' },
      {
        type: 'paragraph',
        content: '本协议一式两份，甲乙双方各执一份，具有同等法律效力。自双方签字（盖章）之日起生效。'
      },
      { type: 'empty' },
      { type: 'paragraph', content: '甲方（盖章）：{{甲方名称}}', indent: false },
      { type: 'paragraph', content: '乙方（签字/盖章）：{{乙方姓名/名称}}', indent: false },
      { type: 'empty' },
      { type: 'paragraph', content: '日期：{{日期}}', indent: false }
    ]
  }
}
