<template>
  <div class="global">
    <div class="divItem">
      这是一个网页，按<span style="font-weight: bolder">"F12"</span>可以打开调试器。
    </div>
    <div class="divItem">
      这个示例展示了wps加载项的相关基础能力，与B/S业务系统的交互，请用浏览器打开：
      <span style="font-weight: bolder; color: slateblue; cursor: pointer" @click="onOpenWeb()">{{
        DemoSpan
      }}</span>
    </div>
    <div class="divItem">
      开发文档:
      <span style="font-weight: bolder; color: slateblue">https://open.wps.cn/docs/office</span>
    </div>
    <hr />
    <div class="divItem">
      <button style="margin: 3px" @click="onbuttonclick('insertDateTime')">插入当前时间</button>
      <button style="margin: 3px" @click="onbuttonclick('addHeader')">添加页眉</button>
      <button style="margin: 3px" @click="onbuttonclick('addComment')">添加批注</button>
      <button style="margin: 3px" @click="onbuttonclick('extractText')">提取纯文本</button>
      <button style="margin: 3px" @click="onProcessWithAI">AI处理文本</button>
      <button style="margin: 3px" @click="onDesensitizeText">脱敏文本</button>
      <button style="margin: 3px" @click="onbuttonclick('dockLeft')">停靠左边</button>
      <button style="margin: 3px" @click="onbuttonclick('dockRight')">停靠右边</button>
      <button style="margin: 3px" @click="onbuttonclick('hideTaskPane')">隐藏TaskPane</button>
      <button style="margin: 3px" @click="onbuttonclick('addString')">文档开头添加字符串</button>
      <button style="margin: 3px" @click="onDocNameClick()">取文件名</button>
      <button style="margin: 3px" @click="onRenameDocClick()">修改文件名为「已修订」+原文件名</button>
    </div>

    <hr />
    <div class="divItem">
      文档文件名为：<span>{{ docName }}</span>
    </div>



    <div class="divItem" v-if="extractedText">
      <h3>纯文本内容：</h3>
      <pre>{{ extractedText }}</pre>
    </div>
    <div class="divItem" v-if="aiProcessedText">
      <h3>AI处理结果：</h3>
      <pre>{{ aiProcessedText }}</pre>
    </div>

    <!-- 脱敏信息展示 -->
    <div class="divItem" v-if="sensitiveInfoList.length > 0">
      <h3>检测到的敏感信息：</h3>
      <div v-for="(info, index) in sensitiveInfoList" :key="index" style="margin-bottom: 10px;">
        <p><strong>{{ info.type }}:</strong></p>
        <p>原始: {{ info.original }}</p>
        <p>脱敏后: {{ info.desensitized }}</p>
      </div>
      <button style="margin: 3px" @click="applyDesensitization">应用脱敏</button>
      <button style="margin: 3px" @click="sensitiveInfoList = []">取消</button>
    </div>

    <!-- 脱敏后文本预览 -->
    <div class="divItem" v-if="desensitizedText">
      <h3>脱敏后文本预览：</h3>
      <pre>{{ desensitizedText }}</pre>
    </div>
    <div class="divItem" v-else>
      <h3>脱敏后文本预览：</h3>
      <p>未检测到敏感信息。请确保输入的文本包含敏感信息（如手机号、身份证号等），或检查是否已正确配置白名单和自定义敏感词。</p>
    </div>

    <!-- 脱敏配置 -->
    <div class="divItem">
      <h3>脱敏配置</h3>
      <p>提示：即使不输入白名单和自定义敏感词，系统也会自动检测常见的敏感信息（如手机号、身份证号等）。</p>
      <div>
        <label>白名单 (每行一个):</label>
        <textarea v-model="whitelist" placeholder="请输入白名单项，每行一个" rows="5" style="width: 100%;"></textarea>
      </div>
      <div>
        <label>自定义敏感词 (格式: 敏感词|替换词，每行一个):</label>
        <textarea v-model="customSensitiveWords" placeholder="请输入自定义敏感词，格式: 敏感词|替换词，每行一个" rows="5"
          style="width: 100%;"></textarea>
      </div>
    </div>

    <!-- AI交互展示 -->
    <div class="divItem">
      <h3>AI文本处理</h3>
      <div>
        <label>输入文本内容：</label>
        <textarea v-model="userInputText" placeholder="请输入要处理的文本内容" rows="5" style="width: 100%;"></textarea>
      </div>
      <div>
        <label>处理要求：</label>
        <input v-model="userProcessRequest" placeholder="请输入处理要求，例如：总结要点" style="width: 100%;" />
      </div>
      <button style="margin: 3px" @click="onProcessUserTextWithAI" :disabled="isProcessing">{{ isProcessing ? '处理中...' :
        'AI处理' }}</button>
      <div v-if="isProcessing" style="margin-top: 10px; color: #007bff;">正在处理中，请稍候...</div>
    </div>


  </div>
</template>

<script>
import { onMounted } from 'vue'
import axios from 'axios'
import taskPane from './js/taskpane.js'
import { processDocumentContent } from './js/siliconflow.js'
import { Desensitizer } from './js/desensitizeAdvanced.js'

export default {
  name: 'TaskPane',
  data() {
    return {
      DemoSpan: '',
      docName: '',
      extractedText: '',
      aiProcessedText: '',
      userInputText: '',
      userProcessRequest: '',
      isProcessing: false,
      desensitizedText: '',
      sensitiveInfoList: [],
      whitelist: '',
      customSensitiveWords: ''
    }
  },
  methods: {
    onbuttonclick(id) {
      const result = taskPane.onbuttonclick(id)
      if (id === 'extractText') {
        this.extractedText = result
      }
      return result
    },
    onDocNameClick() {
      this.docName = taskPane.onbuttonclick('getDocName')
    },
    onOpenWeb() {
      taskPane.onbuttonclick('openWeb', this.DemoSpan)
    },
    onRenameDocClick() {
      const newName = taskPane.onbuttonclick('renameDoc')
      if (newName) {
        this.docName = newName
      }
    },
    async onProcessWithAI() {
      if (!this.extractedText) {
        alert('请先提取文档文本')
        return
      }
      try {
        this.aiProcessedText = await processDocumentContent(this.extractedText)
      } catch (error) {
        console.error('AI处理失败:', error)
        alert('AI处理失败，请查看控制台错误信息')
      }
    },
    async onProcessUserTextWithAI() {
      if (!this.userInputText) {
        alert('请输入要处理的文本内容')
        return
      }
      if (!this.userProcessRequest) {
        alert('请输入处理要求')
        return
      }

      // 设置加载状态
      this.isProcessing = true;

      try {
        // 构造发送给AI的完整提示
        const fullPrompt = `${this.userProcessRequest}\n\n文本内容：\n${this.userInputText}`;
        this.aiProcessedText = await processDocumentContent(fullPrompt)
      } catch (error) {
        console.error('AI处理失败:', error)
        alert('AI处理失败，请查看控制台错误信息')
      } finally {
        // 处理完成后重置加载状态
        this.isProcessing = false;
      }
    },
    // 脱敏功能
    onDesensitizeText() {
      if (!this.extractedText) {
        alert('请先提取文档文本');
        return;
      }

      // 解析白名单
      const whitelistArray = this.whitelist.split('\n').filter(item => item.trim() !== '');

      // 解析自定义敏感词
      const customWordsArray = this.customSensitiveWords.split('\n').filter(item => item.trim() !== '').map(item => {
        const [word, replacement] = item.split('|');
        return { word: word.trim(), replacement: replacement ? replacement.trim() : '*' };
      });

      // 创建脱敏器实例
      const desensitizer = new Desensitizer({
        whitelist: whitelistArray,
        customSensitiveWords: customWordsArray
      });

      // 使用高级脱敏器处理文本
      const { desensitizedText, sensitiveInfoList } = desensitizer.desensitizeText(this.extractedText);

      // 调试信息
      console.log('Desensitized Text:', desensitizedText);
      console.log('Sensitive Info List:', sensitiveInfoList);

      // 保存脱敏信息和文本
      this.sensitiveInfoList = sensitiveInfoList;
      this.desensitizedText = desensitizedText;

      // 如果没有检测到敏感信息，提示用户
      if (sensitiveInfoList.length === 0) {
        alert('未检测到敏感信息');
      }
    },
    // 应用脱敏到文档
    applyDesensitization() {
      if (this.sensitiveInfoList && this.sensitiveInfoList.length > 0) {
        const wps = this.$wps;
        const doc = wps.WpsApplication().ActiveDocument;
        const find = doc.Content.Find;
        const wdReplaceOne = 2; // WPS常量，替换一个匹配项
        const wdColorBlue = 5; // WPS颜色常量，蓝色
        // 由于 wdRevisionInsert 已定义但未使用，移除该常量定义
        // const wdRevisionDelete = 2; // WPS修订常量，删除内容

        // 启用修订模式
        doc.TrackRevisions = true;
        doc.ShowRevisions = true;

        this.sensitiveInfoList.forEach(item => {
          // 清除之前的查找设置
          find.ClearFormatting();
          find.Replacement.ClearFormatting();

          // 设置查找和替换文本
          find.Text = item.original;
          find.Replacement.Text = item.desensitized;

          // 执行替换（仅替换第一个匹配项）
          // 先删除原文并记录为删除修订
          find.Execute(
            false, // MatchCase
            false, // MatchWholeWord
            false, // MatchWildcards
            false, // MatchSoundsLike
            false, // MatchAllWordForms
            false, // Forward
            true,  // Wrap
            1,     // Format
            true,  // Replace
            wdReplaceOne // ReplaceAll/ReplaceOne
          );

          // 在相同位置插入脱敏文本并记录为插入修订
          if (find.Found) {
            const range = find.Parent;
            range.Text = item.desensitizedText;
            range.Font.ColorIndex = wdColorBlue; // 用蓝色标记插入的脱敏文本
          }
        });

        // 更新提取的文本为脱敏后的文本
        this.extractedText = this.desensitizedText;

        // 清空敏感信息列表
        this.sensitiveInfoList = [];

        alert('敏感信息已成功替换');
      }
    }
  }
}
onMounted(() => {
  axios.get('/.debugTemp/NotifyDemoUrl').then((res) => {
    this.DemoSpan = res.data
  })
})
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.global {
  font-size: 15px;
  min-height: 95%;
}

.divItem {
  margin-left: 5px;
  margin-bottom: 18px;
  font-size: 15px;
  word-wrap: break-word;
}

.divItem h3 {
  margin-top: 10px;
  margin-bottom: 5px;
  font-size: 16px;
  font-weight: bold;
}

.divItem pre {
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  padding: 10px;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 200px;
  overflow-y: auto;
}
</style>
