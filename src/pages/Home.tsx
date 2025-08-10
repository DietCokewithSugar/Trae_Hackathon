import { useState, useEffect } from 'react'
import { Article, articleAPI } from '../lib/supabase'
import ArticleCard from '../components/ArticleCard'
import SearchBar from '../components/SearchBar'
import Navbar from '../components/Navbar'
import { Loader2 } from 'lucide-react'

interface HomeProps {
  onArticleClick: (id: string) => void
}

export default function Home({ onArticleClick }: HomeProps) {
  const [articles, setArticles] = useState<Article[]>([])
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadArticles()
  }, [])

  const loadArticles = async () => {
    try {
      setLoading(true)
      const data = await articleAPI.getArticles()
      setArticles(data)
      setFilteredArticles(data)
    } catch (error) {
      console.error('Failed to load articles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setFilteredArticles(articles)
      return
    }

    try {
      const searchResults = await articleAPI.searchArticles(query)
      setFilteredArticles(searchResults)
    } catch (error) {
      console.error('Search failed:', error)
      // 如果搜索失败，使用本地过滤作为备选
      const localResults = articles.filter(article => 
        article.title.toLowerCase().includes(query.toLowerCase()) ||
        article.content.toLowerCase().includes(query.toLowerCase())
      )
      setFilteredArticles(localResults)
    }
  }

  const handleLogoClick = () => {
    setSearchQuery('')
    setFilteredArticles(articles)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onLogoClick={handleLogoClick} />
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 搜索栏 */}
        <div className="mb-8">
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            英语学习文章
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            通过阅读精选的英语文章，提升您的英语阅读能力和语言水平
          </p>
        </div>

        {/* 加载状态 */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-slate-600">加载中...</span>
          </div>
        ) : (
          <>
            {/* 搜索结果提示 */}
            {searchQuery && (
              <div className="mb-6">
                <p className="text-slate-600">
                  搜索 "{searchQuery}" 找到 {filteredArticles.length} 篇文章
                </p>
              </div>
            )}

            {/* 文章列表 */}
            {filteredArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onClick={onArticleClick}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-500 text-lg">
                  {searchQuery ? '没有找到相关文章' : '暂无文章'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => handleSearch('')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    清除搜索
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}