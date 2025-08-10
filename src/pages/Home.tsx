import { useState, useEffect } from 'react'
import { Article, articleAPI, UnfamiliarWord, unfamiliarWordAPI } from '../lib/supabase'
import ArticleCard from '../components/ArticleCard'
import SearchBar from '../components/SearchBar'
import Navbar from '../components/Navbar'
import { Loader2, BookOpen, Trash2 } from 'lucide-react'

interface HomeProps {
  onArticleClick: (id: string) => void
}

export default function Home({ onArticleClick }: HomeProps) {
  const [articles, setArticles] = useState<Article[]>([])
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [unfamiliarWords, setUnfamiliarWords] = useState<UnfamiliarWord[]>([])
  const [unfamiliarLoading, setUnfamiliarLoading] = useState(false)
  const [showUnfamiliarWords, setShowUnfamiliarWords] = useState(false)

  useEffect(() => {
    loadArticles()
    loadUnfamiliarWords()
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

  const loadUnfamiliarWords = async () => {
    try {
      setUnfamiliarLoading(true)
      const data = await unfamiliarWordAPI.getUnfamiliarWords()
      setUnfamiliarWords(data)
    } catch (error) {
      console.error('Failed to load unfamiliar words:', error)
    } finally {
      setUnfamiliarLoading(false)
    }
  }

  const handleRemoveUnfamiliarWord = async (id: number) => {
    try {
      const success = await unfamiliarWordAPI.removeUnfamiliarWord(id)
      if (success) {
        setUnfamiliarWords(prev => prev.filter(word => word.id !== id))
      }
    } catch (error) {
      console.error('Failed to remove unfamiliar word:', error)
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
    <div className="min-h-screen bg-gray-50">
      <Navbar onLogoClick={handleLogoClick} />
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 搜索栏 */}
        <div className="mb-8">
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* 页面标题和导航 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            通过阅读精选的英语文章，提升您的英语阅读能力和语言水平
          </p>
          
          {/* 切换按钮 */}
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setShowUnfamiliarWords(false)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors border ${
                !showUnfamiliarWords 
                  ? 'bg-gray-800 text-white border-gray-800' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              <BookOpen className="inline-block w-4 h-4 mr-2" />
              文章列表
            </button>
            <button
              onClick={() => setShowUnfamiliarWords(true)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors border ${
                showUnfamiliarWords 
                  ? 'bg-gray-800 text-white border-gray-800' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              <BookOpen className="inline-block w-4 h-4 mr-2" />
              不熟悉单词 ({unfamiliarWords.length})
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        {showUnfamiliarWords ? (
          /* 不熟悉单词列表 */
          <div>
            {unfamiliarLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
                <span className="ml-2 text-gray-600">加载中...</span>
              </div>
            ) : unfamiliarWords.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unfamiliarWords.map((word) => (
                  <div key={word.id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-bold text-gray-800 capitalize">
                        {word.word}
                      </h3>
                      <button
                        onClick={() => handleRemoveUnfamiliarWord(word.id)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="删除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    {word.phonetic && (
                      <p className="text-sm text-gray-600 mb-2">
                        [{word.phonetic}]
                      </p>
                    )}
                    
                    {word.translation && (
                      <div className="mb-2">
                        <p className="text-sm font-medium text-gray-700 mb-1">中文释义:</p>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {word.translation.split('\n').slice(0, 2).join('; ')}
                        </p>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500 mt-3">
                      添加时间: {new Date(word.created_at).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">还没有不熟悉的单词</p>
                <p className="text-gray-400 text-sm">
                  在阅读文章时点击单词，然后选择"不熟悉"来添加到这里
                </p>
              </div>
            )}
          </div>
        ) : (
          /* 文章列表 */
          loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
              <span className="ml-2 text-gray-600">加载中...</span>
            </div>
          ) : (
            <>
              {/* 搜索结果提示 */}
              {searchQuery && (
                <div className="mb-6">
                  <p className="text-gray-600">
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
                  <p className="text-gray-500 text-lg">
                    {searchQuery ? '没有找到相关文章' : '暂无文章'}
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => handleSearch('')}
                      className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      清除搜索
                    </button>
                  )}
                </div>
              )}
            </>
          )
        )}
      </div>
    </div>
  )
}