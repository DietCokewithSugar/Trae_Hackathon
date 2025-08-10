import { useState, useEffect } from 'react'
import { Article, articleAPI, Word, wordAPI } from '../lib/supabase'
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, CheckCircle, Loader2 } from 'lucide-react'
import WordPopup from '../components/WordPopup'

interface ArticleDetailProps {
  articleId: string
  onBack: () => void
}

export default function ArticleDetail({ articleId, onBack }: ArticleDetailProps) {
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [sentences, setSentences] = useState<string[]>([])
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0)
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
      
      // 将文章内容按句子分割
      if (data?.content) {
        const sentenceArray = splitIntoSentences(data.content)
        setSentences(sentenceArray)
        setCurrentSentenceIndex(0)
      }
    } catch (error) {
      console.error('Failed to load article:', error)
    } finally {
      setLoading(false)
    }
  }

  // 将文本分割为句子
  const splitIntoSentences = (text: string): string[] => {
    // 移除多余的空白字符并按段落分割
    const paragraphs = text.split('\n').filter(p => p.trim())
    const sentences: string[] = []
    
    paragraphs.forEach(paragraph => {
      // 使用正则表达式按句子分割，保留句号、问号、感叹号作为句子结束标志
      const sentenceMatches = paragraph.match(/[^.!?]+[.!?]+/g)
      if (sentenceMatches) {
        sentences.push(...sentenceMatches.map(s => s.trim()))
      } else if (paragraph.trim()) {
        // 如果没有标点符号，整个段落作为一个句子
        sentences.push(paragraph.trim())
      }
    })
    
    return sentences.filter(s => s.length > 0)
  }

  // 导航到上一句
  const goToPreviousSentence = () => {
    if (currentSentenceIndex > 0) {
      setCurrentSentenceIndex(currentSentenceIndex - 1)
    }
  }

  // 导航到下一句
  const goToNextSentence = () => {
    if (currentSentenceIndex < sentences.length - 1) {
      setCurrentSentenceIndex(currentSentenceIndex + 1)
    }
  }

  // 完成阅读
  const finishReading = () => {
    // 可以在这里添加完成阅读的逻辑，比如记录阅读进度
    onBack()
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

  const currentSentence = sentences[currentSentenceIndex] || ''
  const isFirstSentence = currentSentenceIndex === 0
  const isLastSentence = currentSentenceIndex === sentences.length - 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* 顶部导航栏 */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center text-slate-600 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span>返回文章列表</span>
            </button>
            
            {/* 进度指示器 */}
            <div className="flex items-center space-x-3">
              <span className="text-sm text-slate-500">
                {currentSentenceIndex + 1} / {sentences.length}
              </span>
              <div className="w-32 bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentSentenceIndex + 1) / sentences.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 文章标题 */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 text-center">
            {article.title}
          </h1>
        </div>
      </div>

      {/* 主要阅读区域 */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-4xl w-full">
          {/* 当前句子显示区域 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-8">
            <div className="text-center">
              <p className="text-xl md:text-2xl leading-relaxed text-slate-800 font-medium">
                {renderTextWithWordHighlight(currentSentence)}
              </p>
            </div>
          </div>

          {/* 导航按钮区域 */}
          <div className="flex justify-center items-center space-x-6">
            {/* 上一句按钮 */}
            {!isFirstSentence && (
              <button
                onClick={goToPreviousSentence}
                className="flex items-center px-6 py-3 bg-white text-slate-700 rounded-xl shadow-md hover:shadow-lg hover:bg-slate-50 transition-all duration-200 font-medium"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                上一句
              </button>
            )}

            {/* 下一句按钮 */}
            {!isLastSentence && (
              <button
                onClick={goToNextSentence}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl shadow-md hover:shadow-lg hover:bg-blue-700 transition-all duration-200 font-medium"
              >
                下一句
                <ChevronRight className="w-5 h-5 ml-2" />
              </button>
            )}

            {/* 完成阅读按钮 */}
            {isLastSentence && (
              <button
                onClick={finishReading}
                className="flex items-center px-8 py-3 bg-green-600 text-white rounded-xl shadow-md hover:shadow-lg hover:bg-green-700 transition-all duration-200 font-medium"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                完成阅读
              </button>
            )}
          </div>
        </div>
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