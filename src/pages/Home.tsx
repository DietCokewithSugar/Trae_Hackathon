import { useState, useEffect } from 'react'
import { Article, articleAPI, UnfamiliarWord, unfamiliarWordAPI } from '../lib/supabase'
import ArticleCard from '../components/ArticleCard'
import SearchBar from '../components/SearchBar'
import Navbar from '../components/Navbar'
import { Loader2, BookOpen, Trash2, Sparkles, TrendingUp, Users, Award } from 'lucide-react'

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
    <div className="min-h-screen gradient-bg">
      <Navbar onLogoClick={handleLogoClick} />
      
      <div className="max-w-7xl mx-auto py-12 px-6 lg:px-8">
        {/* Hero区域 */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-primary-100 to-accent-100 border border-primary-200/50 mb-6">
            <Sparkles className="w-4 h-4 text-primary-600 mr-2" />
            <span className="text-sm font-medium text-primary-700">AI 驱动的智能学习平台</span>
          </div>
          
          <h1 className="text-5xl lg:text-6xl font-bold text-gradient mb-6">
            PassExam
          </h1>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            通过阅读精选的英语文章，结合AI智能辅助，
            <br className="hidden sm:block" />
            快速提升您的英语阅读能力和语言水平
          </p>
          
          {/* 统计数据 */}
          <div className="flex justify-center items-center gap-8 mb-12">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-xl mb-2 mx-auto">
                <BookOpen className="w-6 h-6 text-primary-600" />
              </div>
              <div className="text-2xl font-bold text-neutral-900">{articles.length}</div>
              <div className="text-sm text-neutral-600">精选文章</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-accent-100 rounded-xl mb-2 mx-auto">
                <TrendingUp className="w-6 h-6 text-accent-600" />
              </div>
              <div className="text-2xl font-bold text-neutral-900">{unfamiliarWords.length}</div>
              <div className="text-sm text-neutral-600">学习单词</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-success-100 rounded-xl mb-2 mx-auto">
                <Award className="w-6 h-6 text-success-600" />
              </div>
              <div className="text-2xl font-bold text-neutral-900">AI</div>
              <div className="text-sm text-neutral-600">智能辅助</div>
            </div>
          </div>
        </div>

        {/* 搜索栏 */}
        <div className="mb-12">
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* 导航标签 */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex p-1 bg-white rounded-2xl shadow-soft border border-neutral-200/50">
            <button
              onClick={() => setShowUnfamiliarWords(false)}
              className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                !showUnfamiliarWords 
                  ? 'bg-primary-600 text-white shadow-medium' 
                  : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              文章列表
            </button>
            <button
              onClick={() => setShowUnfamiliarWords(true)}
              className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                showUnfamiliarWords 
                  ? 'bg-accent-600 text-white shadow-medium' 
                  : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              学习单词
              <span className="ml-2 px-2 py-0.5 text-xs bg-accent-100 text-accent-700 rounded-full">
                {unfamiliarWords.length}
              </span>
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        {!showUnfamiliarWords ? (
          <div className="animate-fade-in">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-accent-400 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '0.8s'}}></div>
                </div>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-12 h-12 text-primary-600" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-800 mb-3">
                  {searchQuery ? '未找到相关文章' : '暂无文章'}
                </h3>
                <p className="text-neutral-600 max-w-md mx-auto">
                  {searchQuery ? '尝试使用其他关键词搜索，或浏览所有文章' : '精彩内容即将上线，敬请期待'}
                </p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredArticles.map((article, index) => (
                    <div key={article.id} className="animate-slide-up" style={{animationDelay: `${index * 0.1}s`}}>
                      <ArticleCard article={article} onClick={onArticleClick} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="animate-fade-in">
            {unfamiliarLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-accent-200 border-t-accent-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-primary-400 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '0.8s'}}></div>
                </div>
              </div>
            ) : unfamiliarWords.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-24 h-24 bg-gradient-to-br from-accent-100 to-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-12 h-12 text-accent-600" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-800 mb-3">
                  暂无学习单词
                </h3>
                <p className="text-neutral-600 max-w-md mx-auto">
                  开始阅读文章，遇到不熟悉的单词时点击查看释义，
                  <br />系统会自动为您收集学习单词
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-3xl font-bold text-neutral-800 mb-2">
                      学习单词库
                    </h2>
                    <p className="text-neutral-600">共收集了 {unfamiliarWords.length} 个需要学习的单词</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {unfamiliarWords.map((word, index) => (
                    <div key={word.id} className="card-base hover:shadow-medium transition-all duration-300 animate-slide-up" style={{animationDelay: `${index * 0.05}s`}}>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-neutral-800 capitalize">
                          {word.word}
                        </h3>
                        <button
                          onClick={() => handleRemoveUnfamiliarWord(word.id)}
                          className="text-neutral-400 hover:text-error-500 transition-colors p-1 rounded-lg hover:bg-error-50"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {word.phonetic && (
                        <p className="text-sm text-neutral-600 mb-3">
                          [{word.phonetic}]
                        </p>
                      )}
                      
                      {word.translation && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-neutral-700 mb-2">中文释义:</p>
                          <p className="text-sm text-neutral-600 leading-relaxed">
                            {word.translation.split('\n').slice(0, 2).join('; ')}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                        <p className="text-xs text-neutral-500">
                          添加时间: {new Date(word.created_at).toLocaleDateString('zh-CN')}
                        </p>
                        <div className="w-2 h-2 bg-accent-400 rounded-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}