// 诉讼文书类模板定义
export const 诉讼文书模板 = {
  '民事起诉状.docx': {
    title: '民事起诉状',
    category: '诉讼文书',
    description: '用于向人民法院提起民事诉讼的标准格式',
    scene: '民事诉讼立案阶段',
    sections: [
      {
        type: 'paragraph',
        content: '原告：{{原告姓名}}，{{性别}}，{{出生日期}}出生，{{民族}}族，{{身份证号}}，住址：{{原告住址}}，联系电话：{{原告电话}}。'
      },
      {
        type: 'paragraph',
        content: '委托诉讼代理人：{{代理人姓名}}，{{律师事务所名称}}律师。'
      },
      {
        type: 'paragraph',
        content: '被告：{{被告姓名}}，{{性别}}，{{出生日期}}出生，{{民族}}族，{{身份证号}}，住址：{{被告住址}}，联系电话：{{被告电话}}。'
      },
      { type: 'empty' },
      { type: 'heading', content: '诉讼请求：' },
      { type: 'paragraph', content: '1. {{诉讼请求1}}；' },
      { type: 'paragraph', content: '2. {{诉讼请求2}}；' },
      { type: 'paragraph', content: '3. 本案诉讼费用由被告承担。' },
      { type: 'empty' },
      { type: 'heading', content: '事实与理由：' },
      { type: 'heading', content: '一、基本事实' },
      { type: 'paragraph', content: '{{基本事实描述}}' },
      { type: 'paragraph', content: '上述事实有{{证据类型1}}、{{证据类型2}}、{{证据类型3}}等证据材料予以证实（详见证据清单）。' },
      { type: 'empty' },
      { type: 'heading', content: '二、法律依据' },
      {
        type: 'paragraph',
        content: '根据《中华人民共和国民法典》第{{条款}}条的规定："{{法律条文内容}}"。'
      },
      {
        type: 'paragraph',
        content: '根据《{{相关法律名称}}》第{{条款2}}条的规定："{{法律条文内容2}}"。'
      },
      {
        type: 'paragraph',
        content: '根据《最高人民法院关于{{相关司法解释名称}}的解释》第{{司法解释条款}}条的规定："{{司法解释内容}}"。'
      },
      { type: 'empty' },
      { type: 'heading', content: '三、诉讼理由' },
      { type: 'paragraph', content: '{{诉讼理由}}' },
      { type: 'empty' },
      {
        type: 'paragraph',
        content: '综上所述，原告认为被告的行为已严重侵害了原告的合法权益，违反了相关法律规定，依法应当承担相应的法律责任。特向贵院提起诉讼，恳请贵院依法支持原告的诉讼请求，以维护原告的合法权益。'
      },
      { type: 'empty' },
      { type: 'heading', content: '证据清单：' },
      { type: 'paragraph', content: '1. {{证据1名称}}（{{页数}}页）；' },
      { type: 'paragraph', content: '2. {{证据2名称}}（{{页数}}页）；' },
      { type: 'paragraph', content: '3. {{证据3名称}}（{{页数}}页）；' },
      { type: 'paragraph', content: '4. {{证据4名称}}（{{页数}}页）。' },
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
    category: '诉讼文书',
    description: '用于被告对原告起诉进行答辩的标准格式',
    scene: '民事诉讼答辩阶段',
    sections: [
      {
        type: 'paragraph',
        content: '答辩人：{{答辩人姓名}}，{{性别}}，{{出生日期}}出生，{{民族}}族，{{身份证号}}，住址：{{答辩人住址}}，联系电话：{{答辩人电话}}。'
      },
      {
        type: 'paragraph',
        content: '委托诉讼代理人：{{代理人姓名}}，{{律师事务所名称}}律师。'
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
        content: '根据《中华人民共和国民法典》第{{条款}}条的规定："{{法律条文内容}}"。'
      },
      {
        type: 'paragraph',
        content: '根据《{{相关法律名称}}》第{{条款2}}条的规定："{{法律条文内容2}}"。'
      },
      {
        type: 'paragraph',
        content: '根据《最高人民法院关于{{相关司法解释名称}}的解释》第{{司法解释条款}}条的规定："{{司法解释内容}}"。'
      },
      { type: 'empty' },
      {
        type: 'paragraph',
        content: '综上所述，答辩人认为原告的诉讼请求缺乏事实和法律依据，请求人民法院依法驳回原告的诉讼请求，并由原告承担本案的诉讼费用。'
      },
      { type: 'empty' },
      { type: 'heading', content: '证据清单：' },
      { type: 'paragraph', content: '1. {{证据1名称}}（{{页数}}页）；' },
      { type: 'paragraph', content: '2. {{证据2名称}}（{{页数}}页）；' },
      { type: 'paragraph', content: '3. {{证据3名称}}（{{页数}}页）。' },
      { type: 'empty' },
      { type: 'paragraph', content: '此致', indent: false },
      { type: 'paragraph', content: '{{法院名称}}', indent: false },
      { type: 'empty' },
      { type: 'right', content: '答辩人：{{答辩人姓名}}' },
      { type: 'right', content: '{{日期}}' }
    ]
  },

  '上诉状.docx': {
    title: '上诉状',
    category: '诉讼文书',
    description: '用于对一审判决不服提起上诉的标准格式',
    scene: '民事诉讼上诉阶段',
    sections: [
      {
        type: 'paragraph',
        content: '上诉人（原审{{原告/被告}}）：{{上诉人姓名}}，{{性别}}，{{出生日期}}出生，{{民族}}族，{{身份证号}}，住址：{{住址}}，联系电话：{{电话}}。'
      },
      {
        type: 'paragraph',
        content: '委托诉讼代理人：{{代理人姓名}}，{{律师事务所名称}}律师。'
      },
      {
        type: 'paragraph',
        content: '被上诉人（原审{{原告/被告}}）：{{被上诉人姓名}}，{{性别}}，{{出生日期}}出生，{{民族}}族，{{身份证号}}，住址：{{住址}}，联系电话：{{电话}}。'
      },
      { type: 'empty' },
      {
        type: 'paragraph',
        content: '上诉人因与被上诉人{{案由}}一案，不服{{一审法院名称}}{{判决日期}}作出的{{文号}}民事判决，现依法提起上诉。'
      },
      { type: 'empty' },
      { type: 'heading', content: '上诉请求：' },
      { type: 'paragraph', content: '1. 依法撤销{{一审法院名称}}{{文号}}民事判决；' },
      { type: 'paragraph', content: '2. {{上诉请求2}}；' },
      { type: 'paragraph', content: '3. 本案一、二审诉讼费用由被上诉人承担。' },
      { type: 'empty' },
      { type: 'heading', content: '上诉理由：' },
      { type: 'heading', content: '一、一审判决认定事实错误' },
      { type: 'paragraph', content: '{{事实认定错误}}' },
      { type: 'empty' },
      { type: 'heading', content: '二、一审判决适用法律错误' },
      { type: 'paragraph', content: '{{法律适用错误}}' },
      { type: 'empty' },
      { type: 'heading', content: '三、一审判决程序违法' },
      { type: 'paragraph', content: '{{程序违法情形}}' },
      { type: 'empty' },
      {
        type: 'paragraph',
        content: '综上所述，一审判决认定事实不清，适用法律错误，程序违法，请求二审法院依法撤销一审判决，改判支持上诉人的诉讼请求，并由被上诉人承担一、二审诉讼费用。'
      },
      { type: 'empty' },
      { type: 'heading', content: '证据清单：' },
      { type: 'paragraph', content: '1. 一审判决书复印件（{{页数}}页）；' },
      { type: 'paragraph', content: '2. {{新证据1名称}}（{{页数}}页）；' },
      { type: 'paragraph', content: '3. {{新证据2名称}}（{{页数}}页）。' },
      { type: 'empty' },
      { type: 'paragraph', content: '此致', indent: false },
      { type: 'paragraph', content: '{{二审法院名称}}', indent: false },
      { type: 'empty' },
      { type: 'right', content: '上诉人：{{上诉人姓名}}' },
      { type: 'right', content: '{{日期}}' }
    ]
  },

  '再审申请书.docx': {
    title: '再审申请书',
    category: '诉讼文书',
    description: '用于对已生效判决申请再审的标准格式',
    scene: '民事诉讼再审申请阶段',
    sections: [
      {
        type: 'paragraph',
        content: '申请人（原审{{原告/被告}}）：{{申请人姓名}}，{{性别}}，{{出生日期}}出生，{{民族}}族，{{身份证号}}，住址：{{住址}}，联系电话：{{电话}}。'
      },
      {
        type: 'paragraph',
        content: '委托诉讼代理人：{{代理人姓名}}，{{律师事务所名称}}律师。'
      },
      {
        type: 'paragraph',
        content: '被申请人（原审{{原告/被告}}）：{{被申请人姓名}}，{{性别}}，{{出生日期}}出生，{{民族}}族，{{身份证号}}，住址：{{住址}}，联系电话：{{电话}}。'
      },
      { type: 'empty' },
      {
        type: 'paragraph',
        content: '申请人因与被申请人{{案由}}一案，不服{{终审法院名称}}{{判决日期}}作出的{{文号}}民事判决，该判决已发生法律效力。申请人认为该判决确有错误，特依法申请再审。'
      },
      { type: 'empty' },
      { type: 'heading', content: '再审请求：' },
      { type: 'paragraph', content: '1. 依法撤销{{终审法院名称}}{{文号}}民事判决；' },
      { type: 'paragraph', content: '2. {{再审请求2}}；' },
      { type: 'paragraph', content: '3. 本案诉讼费用由被申请人承担。' },
      { type: 'empty' },
      { type: 'heading', content: '申请再审的事实与理由：' },
      { type: 'heading', content: '一、原判决认定事实的主要证据是伪造的' },
      { type: 'paragraph', content: '{{伪造证据说明}}' },
      { type: 'empty' },
      { type: 'heading', content: '二、原判决认定的基本事实缺乏证据证明' },
      { type: 'paragraph', content: '{{缺乏证据说明}}' },
      { type: 'empty' },
      { type: 'heading', content: '三、原判决适用法律确有错误' },
      { type: 'paragraph', content: '{{法律适用错误说明}}' },
      { type: 'empty' },
      { type: 'heading', content: '四、原判决程序违法' },
      { type: 'paragraph', content: '{{程序违法说明}}' },
      { type: 'empty' },
      {
        type: 'paragraph',
        content: '综上所述，原判决认定事实不清，适用法律错误，程序违法，符合《中华人民共和国民事诉讼法》第二百零七条规定的再审条件，恳请贵院依法再审，撤销原判决，改判支持申请人的诉讼请求，维护申请人的合法权益。'
      },
      { type: 'empty' },
      { type: 'heading', content: '证据清单：' },
      { type: 'paragraph', content: '1. 原审判决书复印件（{{页数}}页）；' },
      { type: 'paragraph', content: '2. {{新证据1名称}}（{{页数}}页）；' },
      { type: 'paragraph', content: '3. {{新证据2名称}}（{{页数}}页）。' },
      { type: 'empty' },
      { type: 'paragraph', content: '此致', indent: false },
      { type: 'paragraph', content: '{{再审法院名称}}', indent: false },
      { type: 'empty' },
      { type: 'right', content: '申请人：{{申请人姓名}}' },
      { type: 'right', content: '{{日期}}' }
    ]
  },

  '财产保全申请书.docx': {
    title: '财产保全申请书',
    category: '诉讼文书',
    description: '用于申请财产保全的标准格式',
    scene: '诉讼前或诉讼中财产保全',
    sections: [
      {
        type: 'paragraph',
        content: '申请人：{{申请人姓名}}，{{性别}}，{{出生日期}}出生，{{民族}}族，{{身份证号}}，住址：{{住址}}，联系电话：{{电话}}。'
      },
      {
        type: 'paragraph',
        content: '委托诉讼代理人：{{代理人姓名}}，{{律师事务所名称}}律师。'
      },
      {
        type: 'paragraph',
        content: '被申请人：{{被申请人姓名}}，{{性别}}，{{出生日期}}出生，{{民族}}族，{{身份证号}}，住址：{{住址}}，联系电话：{{电话}}。'
      },
      { type: 'empty' },
      {
        type: 'paragraph',
        content: '申请人因与被申请人{{案由}}纠纷一案，为防止被申请人转移、隐匿、毁损财产，致使判决难以执行，特申请财产保全。'
      },
      { type: 'empty' },
      { type: 'heading', content: '保全请求：' },
      { type: 'paragraph', content: '请求依法对被申请人名下价值{{保全金额}}元的财产采取保全措施。' },
      { type: 'empty' },
      { type: 'heading', content: '事实与理由：' },
      { type: 'paragraph', content: '{{保全理由}}' },
      { type: 'paragraph', content: '为防止被申请人转移、隐匿财产，导致将来判决难以执行，特申请财产保全。' },
      { type: 'empty' },
      { type: 'paragraph', content: '申请人提供{{担保方式}}作为担保。' },
      { type: 'empty' },
      {
        type: 'paragraph',
        content: '综上所述，为保障将来判决的执行，维护申请人的合法权益，恳请贵院依法支持申请人的财产保全申请。'
      },
      { type: 'empty' },
      { type: 'paragraph', content: '此致', indent: false },
      { type: 'paragraph', content: '{{法院名称}}', indent: false },
      { type: 'empty' },
      { type: 'right', content: '申请人：{{申请人姓名}}' },
      { type: 'right', content: '{{日期}}' }
    ]
  }
}
