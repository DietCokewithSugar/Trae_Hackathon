// OpenAI API 调用函数

// 查词的prompt模板
const word_lookup_prompt = `
Please provide detailed information about the English word: "{word}"

Return the response in the following JSON format:
{
  "word": "the word in lowercase",
  "phonetic": "phonetic transcription (IPA format if possible)",
  "definition": "detailed English definition with examples",
  "translation": "Chinese translation and explanation",
  "pos": "part of speech (noun, verb, adjective, etc.)"
}

Requirements:
1. Provide accurate phonetic transcription
2. Give comprehensive English definition with usage examples
3. Provide clear Chinese translation
4. Include part of speech information
5. Return only valid JSON format
`

// 重写文章的prompt模板
const rewrite_prompt_ver_1 = `
Rewrite the following article incorporating these {num_words} words: {selected_words}
Requirements:
1. Maintain the original meaning of the article
2. Use each target word exactly once
3. Ensure the usage is natural and contextually appropriate
4. Keep the difficulty level similar to the original article
5. For each used target word, wrap it in square brackets like [word]
6. If a target word already exists in the original article, keep it in its original context and just wrap it in square brackets [] - do not rewrite or add it again
Original article: {base_article}
Important:
- Make sure to wrap each used target word in square brackets, e.g., [target_word]
- If you find a target word already present in the original text, simply add square brackets around it rather than rewriting that part
`

// OpenAI API 配置
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || ''
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

// 查词接口
export interface WordLookupRequest {
  word: string
}

export interface WordLookupResponse {
  success: boolean
  wordData?: {
    id: string
    word: string
    phonetic: string
    definition: string
    translation: string
    pos?: string
  }
  error?: string
}

// 文章重写接口
export interface ArticleRewriteRequest {
  originalArticle: string
  unfamiliarWords: string[]
}

export interface ArticleRewriteResponse {
  success: boolean
  rewrittenArticle?: string
  error?: string
}

// 调用OpenAI API查询单词
export async function lookupWordWithChatGPT(word: string): Promise<WordLookupResponse> {
  try {
    // 检查API密钥
    if (!OPENAI_API_KEY) {
      return {
        success: false,
        error: 'OpenAI API密钥未配置，请在环境变量中设置VITE_OPENAI_API_KEY'
      }
    }

    // 清理单词输入
    const cleanWord = word.trim().toLowerCase()
    if (!cleanWord) {
      return {
        success: false,
        error: '单词不能为空'
      }
    }

    // 构建prompt
    const prompt = word_lookup_prompt.replace('{word}', cleanWord)

    console.log('=== ChatGPT 查词调用信息 ===')
    console.log('查询单词:', cleanWord)

    // 调用OpenAI API
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.3
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('OpenAI API 错误:', response.status, errorData)
      return {
        success: false,
        error: `OpenAI API调用失败: ${response.status} ${response.statusText}`
      }
    }

    const data = await response.json()
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('OpenAI API 响应格式错误:', data)
      return {
        success: false,
        error: 'OpenAI API响应格式错误'
      }
    }

    const responseContent = data.choices[0].message.content.trim()
    
    try {
      // 解析JSON响应
      const wordData = JSON.parse(responseContent)
      
      // 验证响应格式
      if (!wordData.word || !wordData.definition || !wordData.translation) {
        console.error('ChatGPT响应缺少必要字段:', wordData)
        return {
          success: false,
          error: 'ChatGPT响应格式不完整'
        }
      }

      console.log('=== ChatGPT 查词成功 ===')
      console.log('单词信息:', wordData)

      return {
        success: true,
        wordData: {
          id: `chatgpt_${Date.now()}`,
          word: wordData.word || cleanWord,
          phonetic: wordData.phonetic || '',
          definition: wordData.definition || '',
          translation: wordData.translation || '',
          pos: wordData.pos || undefined
        }
      }

    } catch (parseError) {
      console.error('解析ChatGPT响应JSON失败:', parseError)
      console.error('原始响应:', responseContent)
      return {
        success: false,
        error: 'ChatGPT响应格式错误，无法解析JSON'
      }
    }

  } catch (error) {
    console.error('ChatGPT查词过程中发生错误:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

// 调用OpenAI API重写文章
export async function rewriteArticleWithWords(
  originalArticle: string,
  unfamiliarWords: string[]
): Promise<ArticleRewriteResponse> {
  try {
    // 检查API密钥
    if (!OPENAI_API_KEY) {
      return {
        success: false,
        error: 'OpenAI API密钥未配置，请在环境变量中设置VITE_OPENAI_API_KEY'
      }
    }

    // 如果没有不熟悉的单词，直接返回原文章
    if (!unfamiliarWords || unfamiliarWords.length === 0) {
      return {
        success: true,
        rewrittenArticle: originalArticle
      }
    }

    // 构建prompt
    const selectedWords = unfamiliarWords.join(', ')
    const prompt = rewrite_prompt_ver_1
      .replace('{num_words}', unfamiliarWords.length.toString())
      .replace('{selected_words}', selectedWords)
      .replace('{base_article}', originalArticle)

    console.log('=== OpenAI API 调用信息 ===')
    console.log('不熟悉单词数量:', unfamiliarWords.length)
    console.log('不熟悉单词列表:', selectedWords)
    console.log('原文章长度:', originalArticle.length)

    // 调用OpenAI API
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('OpenAI API 错误:', response.status, errorData)
      return {
        success: false,
        error: `OpenAI API调用失败: ${response.status} ${response.statusText}`
      }
    }

    const data = await response.json()
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('OpenAI API 响应格式错误:', data)
      return {
        success: false,
        error: 'OpenAI API响应格式错误'
      }
    }

    const rewrittenArticle = data.choices[0].message.content.trim()
    
    console.log('=== 文章重写成功 ===')
    console.log('重写后文章长度:', rewrittenArticle.length)
    console.log('包含方括号的单词数量:', (rewrittenArticle.match(/\[\w+\]/g) || []).length)

    return {
      success: true,
      rewrittenArticle
    }

  } catch (error) {
    console.error('文章重写过程中发生错误:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

// 提取文章中被方括号包围的单词
export function extractHighlightedWords(article: string): string[] {
  const matches = article.match(/\[([^\]]+)\]/g)
  if (!matches) return []
  
  return matches.map(match => match.slice(1, -1)) // 移除方括号
}

// 检查OpenAI API配置是否正确
export function checkOpenAIConfig(): { configured: boolean; error?: string } {
  if (!OPENAI_API_KEY) {
    return {
      configured: false,
      error: 'OpenAI API密钥未配置，请在.env文件中设置VITE_OPENAI_API_KEY'
    }
  }
  
  return { configured: true }
}