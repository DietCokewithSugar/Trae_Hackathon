import { createClient } from '@supabase/supabase-js'

// Supabase配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 文章类型定义
export interface Article {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

// 导入OpenAI查词功能
import { lookupWordWithChatGPT } from './openai'

// 导入CSV单词解析器（保留作为备用）
import { Word } from './csvWordParser'

// 重新导出Word类型
export type { Word }

// API函数
export const articleAPI = {
  // 获取所有文章
  async getArticles(): Promise<Article[]> {
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, content, created_at, updated_at')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching articles:', error)
      return []
    }
    
    return data || []
  },

  // 根据ID获取单篇文章
  async getArticleById(id: string): Promise<Article | null> {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching article:', error)
      return null
    }
    
    return data
  },

  // 搜索文章
  async searchArticles(searchTerm: string): Promise<Article[]> {
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, content, created_at, updated_at')
      .ilike('title', `%${searchTerm}%`)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error searching articles:', error)
      return []
    }
    
    return data || []
  },

  // 保存重写后的文章
//   async saveRewrittenArticle(title: string, content: string): Promise<Article | null> {
//     try {
//       const { data, error } = await supabase
//         .from('articles')
//         .insert([
//           {
//             title: `[重写] ${title}`,
//             content: content
//           }
//         ])
//         .select()
//         .single()
      
//       if (error) {
//         console.error('Error saving rewritten article:', error)
//         return null
//       }
      
//       console.log('Successfully saved rewritten article:', data)
//       return data
//     } catch (err) {
//       console.error('Unexpected error saving rewritten article:', err)
//       return null
//     }
//   }
}

// 不熟悉单词类型定义
export interface UnfamiliarWord {
  id: number
  word: string
  phonetic?: string
  definition?: string
  translation?: string
  created_at: string
}

// 单词API函数 - 现在使用ChatGPT API
export const wordAPI = {
  // 根据单词查询释义
  async getWordByText(word: string): Promise<Word | null> {
    try {
      console.log('=== 开始查询单词 ===', word)
      
      // 调用ChatGPT API查询单词
      const result = await lookupWordWithChatGPT(word)
      
      if (result.success && result.wordData) {
        console.log('=== ChatGPT查词成功 ===', result.wordData)
        
        // 转换为Word接口格式
        const wordResult: Word = {
          id: result.wordData.id,
          word: result.wordData.word,
          phonetic: result.wordData.phonetic,
          definition: result.wordData.definition,
          translation: result.wordData.translation
        }
        
        return wordResult
      } else {
        console.error('=== ChatGPT查词失败 ===', result.error)
        return null
      }
    } catch (error) {
      console.error('=== 查词过程中发生错误 ===', error)
      return null
    }
  }
}

// 不熟悉单词API函数
export const unfamiliarWordAPI = {
  // 添加不熟悉的单词
  async addUnfamiliarWord(wordData: Omit<UnfamiliarWord, 'id' | 'created_at'>): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('unfamiliar')
        .insert([wordData])
        .select()
      
      if (error) {
        // 如果是重复键错误，返回true（表示单词已存在）
        if (error.code === '23505') {
          console.log('Word already exists in unfamiliar list:', wordData.word)
          return true
        }
        console.error('Error adding unfamiliar word:', error)
        return false
      }
      
      console.log('Successfully added unfamiliar word:', data)
      return true
    } catch (err) {
      console.error('Unexpected error adding unfamiliar word:', err)
      return false
    }
  },

  // 获取所有不熟悉的单词
  async getUnfamiliarWords(): Promise<UnfamiliarWord[]> {
    try {
      const { data, error } = await supabase
        .from('unfamiliar')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching unfamiliar words:', error)
        return []
      }
      
      return data || []
    } catch (err) {
      console.error('Unexpected error fetching unfamiliar words:', err)
      return []
    }
  },

  // 删除不熟悉的单词
  async removeUnfamiliarWord(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('unfamiliar')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Error removing unfamiliar word:', error)
        return false
      }
      
      return true
    } catch (err) {
      console.error('Unexpected error removing unfamiliar word:', err)
      return false
    }
  }
}