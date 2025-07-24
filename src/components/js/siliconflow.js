// SiliconFlow AI 调用管理

// 替换为你的 SiliconFlow API 密钥
const API_KEY = 'sk-iqleboagtmtngqxrcupwamwalzypxkyzmogtnvnifwtxyztn';

// SiliconFlow API 的基础 URL
const BASE_URL = 'https://api.siliconflow.cn/v1';

/**
 * 调用 SiliconFlow AI 处理文档内容
 * @param {string} content - 要处理的文档内容
 * @returns {Promise<string>} AI 处理后的结果
 */
export async function processDocumentContent(content) {
  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen3-8B',
        messages: [
          {
            role: 'user',
            content: content
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('调用 SiliconFlow AI 时出错:', error);
    throw error;
  }
}