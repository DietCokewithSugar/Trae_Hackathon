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
  }
}