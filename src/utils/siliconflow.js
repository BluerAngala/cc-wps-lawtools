// SiliconFlow AI 调用管理

// 替换为你的 SiliconFlow API 密钥
const API_KEY =import.meta.env.VITE_AI_API_KEY

// SiliconFlow API 的基础 URL
const BASE_URL = import.meta.env.VITE_AI_API_BASE_URL

if (!API_KEY || !BASE_URL) {
  throw new Error('SiliconFlow API 密钥或基础 URL 未配置');
}

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