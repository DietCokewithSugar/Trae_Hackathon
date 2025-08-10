import { useState, useEffect } from 'react'
import { Article, articleAPI } from '../lib/supabase'
import { ArrowLeft, Calendar, Type, Loader2 } from 'lucide-react'

interface ArticleDetailProps {
  articleId: string
  onBack: () => void
}

export default function ArticleDetail({ articleId, onBack }: ArticleDetailProps) {
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [fontSize, setFontSize] = useState(16)

  useEffect(() => {
    loadArticle()
  }, [articleId])

  const loadArticle = async () => {
    try {
      setLoading(true)
      const data = await articleAPI.getArticleById(articleId)
      setArticle(data)
    } catch (error) {
      console.error('Failed to load article:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const adjustFontSize = (delta: number) => {
    setFontSize(prev => Math.max(12, Math.min(24, prev + delta)))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
          <span className="text-slate-600">加载中...</span>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 text-lg mb-4">文章未找到</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 返回按钮 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span>返回文章列表</span>
          </button>
        </div>
      </div>

      {/* 阅读工具栏 */}
      <div className="fixed right-6 top-1/2 transform -translate-y-1/2 bg-white rounded-lg shadow-lg p-3 z-10">
        <div className="flex flex-col items-center space-y-3">
          <div className="flex items-center">
            <Type className="w-4 h-4 text-slate-600 mr-2" />
            <span className="text-sm text-slate-600">字体</span>
          </div>
          <button
            onClick={() => adjustFontSize(2)}
            className="w-8 h-8 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors text-sm font-bold"
          >
            A+
          </button>
          <span className="text-xs text-slate-500">{fontSize}px</span>
          <button
            onClick={() => adjustFontSize(-2)}
            className="w-8 h-8 bg-slate-600 text-white rounded-full hover:bg-slate-700 transition-colors text-sm font-bold"
          >
            A-
          </button>
        </div>
      </div>

      {/* 文章内容 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-white rounded-lg shadow-sm p-8">
          {/* 文章元信息 */}
          <div className="flex items-center text-slate-500 text-sm mb-6">
            <Calendar className="w-4 h-4 mr-2" />
            <span>发布时间：{formatDate(article.created_at)}</span>
          </div>

          {/* 文章标题 */}
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8 leading-tight">
            {article.title}
          </h1>

          {/* 文章内容 */}
          <div 
            className="prose prose-lg max-w-none text-slate-700 leading-relaxed"
            style={{ fontSize: `${fontSize}px`, lineHeight: '1.8' }}
          >
            {article.content.split('\n').map((paragraph, index) => (
              paragraph.trim() ? (
                <p key={index} className="mb-6">
                  {paragraph}
                </p>
              ) : (
                <div key={index} className="mb-4" />
              )
            ))}
          </div>

          {/* 文章底部 */}
          <div className="mt-12 pt-8 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500">
                最后更新：{formatDate(article.updated_at)}
              </div>
              <button
                onClick={onBack}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                返回文章列表
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}