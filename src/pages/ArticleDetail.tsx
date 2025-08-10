import { useState, useEffect } from 'react'
import { Article, articleAPI, Word, wordAPI } from '../lib/supabase'
import { ArrowLeft, Calendar, Type, Loader2 } from 'lucide-react'
import WordPopup from '../components/WordPopup'

interface ArticleDetailProps {
  articleId: string
  onBack: () => void
}

export default function ArticleDetail({ articleId, onBack }: ArticleDetailProps) {
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [fontSize, setFontSize] = useState(16)
  const [hoveredWord, setHoveredWord] = useState<string | null>(null)
  const [selectedWord, setSelectedWord] = useState<Word | null>(null)
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 })
  const [isPopupVisible, setIsPopupVisible] = useState(false)
  const [loadingWord, setLoadingWord] = useState(false)

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

  // 处理单词点击事件
  const handleWordClick = async (word: string, event: React.MouseEvent) => {
    event.preventDefault()
    
    // 调试日志：打印原始点击的单词
    console.log('=== 单词点击调试信息 ===')
    console.log('1. 原始点击的单词:', word)
    console.log('2. 单词类型:', typeof word)
    console.log('3. 单词长度:', word.length)
    
    // 清理单词，移除标点符号
    const cleanWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase()
    console.log('4. 清理后的单词:', cleanWord)
    console.log('5. 清理后单词长度:', cleanWord.length)
    
    if (!cleanWord) {
      console.log('6. 清理后单词为空，退出处理')
      return
    }

    setLoadingWord(true)
    console.log('7. 开始查询单词:', cleanWord)
    
    try {
      const wordData = await wordAPI.getWordByText(cleanWord)
      console.log('8. 查询结果:', wordData)
      
      if (wordData) {
        console.log('9. 找到单词数据，显示弹窗')
        setSelectedWord(wordData)
        
        // 设置弹窗位置
        const rect = (event.target as HTMLElement).getBoundingClientRect()
        setPopupPosition({
          x: rect.left + rect.width / 2,
          y: rect.top
        })
        
        setIsPopupVisible(true)
      } else {
        console.log('10. 数据库中未找到该单词:', cleanWord)
      }
    } catch (error) {
      console.error('11. 查询单词时发生错误:', error)
    } finally {
      setLoadingWord(false)
      console.log('12. 单词查询处理完成')
      console.log('========================')
    }
  }

  // 关闭弹窗
  const closePopup = () => {
    setIsPopupVisible(false)
    setSelectedWord(null)
  }

  // 将文本按单词分割并渲染为可悬停和点击的元素
  const renderTextWithWordHighlight = (text: string) => {
    // 使用正则表达式分割文本，保留标点符号、空格和方括号
    const tokens = text.split(/(\s+|[.,!?;:"'(){}]|\[[^\]]+\])/)
    
    return tokens.map((token, index) => {
      // 检查是否为方括号包围的单词（重写文章中的目标单词）
      const isBracketedWord = /^\[[^\]]+\]$/.test(token)
      
      if (isBracketedWord) {
        // 提取方括号内的单词
        const word = token.slice(1, -1)
        return (
          <span
            key={index}
            className={`inline-block cursor-pointer transition-all duration-200 rounded px-2 py-1 mx-1 ${
              hoveredWord === word.toLowerCase() 
                ? 'bg-orange-300 text-orange-900 shadow-md transform scale-110 font-bold' 
                : 'bg-orange-200 text-orange-800 hover:bg-orange-300 font-semibold'
            } ${loadingWord ? 'pointer-events-none' : ''} border-2 border-orange-400`}
            onMouseEnter={() => setHoveredWord(word.toLowerCase())}
            onMouseLeave={() => setHoveredWord(null)}
            onTouchStart={() => setHoveredWord(word.toLowerCase())}
            onTouchEnd={() => setTimeout(() => setHoveredWord(null), 1000)}
            onClick={(e) => handleWordClick(word, e)}
            title="这是为您特别融入的不熟悉单词"
          >
            {word}
          </span>
        )
      }
      
      // 检查是否为普通单词（包含字母）
      const isWord = /[a-zA-Z]/.test(token) && !token.includes('[')
      
      if (isWord) {
        return (
          <span
            key={index}
            className={`inline-block cursor-pointer transition-all duration-200 rounded px-1 ${
              hoveredWord === token.toLowerCase() 
                ? 'bg-yellow-200 text-yellow-900 shadow-sm transform scale-105' 
                : 'hover:bg-yellow-100'
            } ${loadingWord ? 'pointer-events-none' : ''}`}
            onMouseEnter={() => setHoveredWord(token.toLowerCase())}
            onMouseLeave={() => setHoveredWord(null)}
            onTouchStart={() => setHoveredWord(token.toLowerCase())}
            onTouchEnd={() => setTimeout(() => setHoveredWord(null), 1000)}
            onClick={(e) => handleWordClick(token, e)}
          >
            {token}
          </span>
        )
      }
      
      // 返回非单词字符（空格、标点符号等）
      return <span key={index}>{token}</span>
    })
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
                  {renderTextWithWordHighlight(paragraph)}
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

      {/* 单词查询弹窗 */}
      <WordPopup
        word={selectedWord}
        position={popupPosition}
        isVisible={isPopupVisible}
        onClose={closePopup}
      />
    </div>
  )
}