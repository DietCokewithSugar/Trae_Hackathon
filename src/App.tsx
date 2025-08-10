import { useState } from 'react'
import Home from './pages/Home'
import ArticleDetail from './pages/ArticleDetail'
import { articleAPI, unfamiliarWordAPI } from './lib/supabase'
import { rewriteArticleWithWords, checkOpenAIConfig } from './lib/openai'
import { Loader2, AlertCircle, Sparkles } from 'lucide-react'
import './index.css'

type Page = 'home' | 'article' | 'rewriting'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [selectedArticleId, setSelectedArticleId] = useState<string>('')
  const [rewriteStatus, setRewriteStatus] = useState<{
    loading: boolean
    error?: string
    progress?: string
  }>({ loading: false })

  const handleArticleClick = async (articleId: string) => {
    try {
      setCurrentPage('rewriting')
      setRewriteStatus({ loading: true, progress: '正在获取文章内容...' })
      
      // 获取原文章
      const article = await articleAPI.getArticleById(articleId)
      if (!article) {
        setRewriteStatus({ loading: false, error: '文章未找到' })
        return
      }

      setRewriteStatus({ loading: true, progress: '正在获取不熟悉的单词...' })
      
      // 获取所有不熟悉的单词
      const unfamiliarWords = await unfamiliarWordAPI.getUnfamiliarWords()
      const wordList = unfamiliarWords.map(w => w.word)
      
      console.log('=== 文章重写流程开始 ===')
      console.log('原文章标题:', article.title)
      console.log('不熟悉单词数量:', wordList.length)
      console.log('不熟悉单词列表:', wordList)

      // 如果没有不熟悉的单词，直接显示原文章
      if (wordList.length === 0) {
        console.log('没有不熟悉的单词，直接显示原文章')
        setSelectedArticleId(articleId)
        setCurrentPage('article')
        setRewriteStatus({ loading: false })
        return
      }

      // 检查OpenAI配置
      const configCheck = checkOpenAIConfig()
      if (!configCheck.configured) {
        setRewriteStatus({ loading: false, error: configCheck.error })
        return
      }

      setRewriteStatus({ loading: true, progress: `正在使用AI重写文章，融入${wordList.length}个不熟悉的单词...` })
      
      // 调用OpenAI API重写文章
      const rewriteResult = await rewriteArticleWithWords(article.content, wordList)
      
      if (!rewriteResult.success) {
        setRewriteStatus({ loading: false, error: rewriteResult.error })
        return
      }

      setRewriteStatus({ loading: true, progress: '正在保存重写后的文章...' })
      
      // 保存重写后的文章到数据库
      const savedArticle = await articleAPI.saveRewrittenArticle(
        article.title, 
        rewriteResult.rewrittenArticle!
      )
      
      if (!savedArticle) {
        setRewriteStatus({ loading: false, error: '保存重写文章失败' })
        return
      }

      console.log('=== 文章重写流程完成 ===')
      console.log('重写后文章ID:', savedArticle.id)
      
      // 显示重写后的文章
      setSelectedArticleId(savedArticle.id)
      setCurrentPage('article')
      setRewriteStatus({ loading: false })
      
    } catch (error) {
      console.error('文章重写过程中发生错误:', error)
      setRewriteStatus({ 
        loading: false, 
        error: error instanceof Error ? error.message : '未知错误' 
      })
    }
  }

  const handleBackToHome = () => {
    setCurrentPage('home')
    setSelectedArticleId('')
    setRewriteStatus({ loading: false })
  }

  const handleRetryRewrite = () => {
    if (selectedArticleId) {
      handleArticleClick(selectedArticleId)
    }
  }

  return (
    <div className="App">
      {currentPage === 'home' && (
        <Home onArticleClick={handleArticleClick} />
      )}
      
      {currentPage === 'rewriting' && (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center p-8">
            {rewriteStatus.loading ? (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                    <Sparkles className="w-6 h-6 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-slate-800 mb-4">
                  AI正在为您定制文章
                </h2>
                <p className="text-slate-600 mb-6">
                  {rewriteStatus.progress}
                </p>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
                <p className="text-sm text-slate-500 mt-4">
                  这可能需要几秒钟时间，请耐心等待...
                </p>
              </div>
            ) : rewriteStatus.error ? (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex justify-center mb-6">
                  <AlertCircle className="w-12 h-12 text-red-500" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800 mb-4">
                  文章重写失败
                </h2>
                <p className="text-red-600 mb-6">
                  {rewriteStatus.error}
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={handleBackToHome}
                    className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    返回首页
                  </button>
                  <button
                    onClick={handleRetryRewrite}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    重试
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
      
      {currentPage === 'article' && selectedArticleId && (
        <ArticleDetail 
          articleId={selectedArticleId} 
          onBack={handleBackToHome} 
        />
      )}
    </div>
  )
}

export default App
