import { useState, useEffect } from 'react'
import { Article, articleAPI, Word, wordAPI, unfamiliarWordAPI } from '../lib/supabase'
import { rewriteArticleWithWords } from '../lib/openai'
import { ArrowLeft, Calendar, CheckCircle, Loader2 } from 'lucide-react'
import WordPopup from '../components/WordPopup'

interface ArticleDetailProps {
  articleId: string
  onBack: () => void
}

export default function ArticleDetail({ articleId, onBack }: ArticleDetailProps) {
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [sentences, setSentences] = useState<string[]>([])
  const [visibleSentenceCount, setVisibleSentenceCount] = useState(1)
  const [hoveredWord, setHoveredWord] = useState<string | null>(null)
  const [selectedWord, setSelectedWord] = useState<Word | null>(null)
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 })
  const [isPopupVisible, setIsPopupVisible] = useState(false)
  const [loadingWord, setLoadingWord] = useState(false)
  const [rewrittenContent, setRewrittenContent] = useState<string>('')
  const [isRewriting, setIsRewriting] = useState(false)
  const [rewriteError, setRewriteError] = useState<string | null>(null)

  useEffect(() => {
    loadArticle()
  }, [articleId])

  // 添加键盘事件监听
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault()
        if (visibleSentenceCount < sentences.length) {
          setVisibleSentenceCount(prev => prev + 1)
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [visibleSentenceCount, sentences.length])

  const loadArticle = async () => {
    try {
      setLoading(true)
      setRewriteError(null)
      const data = await articleAPI.getArticleById(articleId)
      setArticle(data)
      
      if (data?.content) {
        // 获取用户不熟悉的单词列表
        const unfamiliarWords = await unfamiliarWordAPI.getUnfamiliarWords()
        const unfamiliarWordTexts = unfamiliarWords.map(word => word.word)
        
        let contentToUse = data.content
        
        // 如果有不熟悉的单词，调用ChatGPT重写文章
        if (unfamiliarWordTexts.length > 0) {
          setIsRewriting(true)
          console.log('开始重写文章，不熟悉单词:', unfamiliarWordTexts)
          
          const rewriteResult = await rewriteArticleWithWords(data.content, unfamiliarWordTexts)
          
          if (rewriteResult.success && rewriteResult.rewrittenArticle) {
            contentToUse = rewriteResult.rewrittenArticle
            setRewrittenContent(contentToUse)
            console.log('文章重写成功')
          } else {
            console.error('文章重写失败:', rewriteResult.error)
            setRewriteError(rewriteResult.error || '文章重写失败')
            // 如果重写失败，使用原文章
            contentToUse = data.content
          }
          
          setIsRewriting(false)
        }
        
        // 将文章内容按句子分割
        const sentenceArray = splitIntoSentences(contentToUse)
        setSentences(sentenceArray)
        setVisibleSentenceCount(1)
      }
    } catch (error) {
      console.error('Failed to load article:', error)
      setRewriteError('加载文章失败')
    } finally {
      setLoading(false)
      setIsRewriting(false)
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
                ? 'bg-gray-400 text-gray-900 shadow-md transform scale-110 font-bold' 
                : 'bg-gray-300 text-gray-800 hover:bg-gray-400 font-semibold'
            } ${loadingWord ? 'pointer-events-none' : ''} border-2 border-gray-500`}
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
                ? 'bg-gray-200 text-gray-900 shadow-sm transform scale-105' 
                : 'hover:bg-gray-100'
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

  if (loading || isRewriting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="flex items-center mb-4">
            <Loader2 className="w-8 h-8 animate-spin text-gray-600 mr-3" />
            <span className="text-gray-600">
              {loading ? '加载文章中...' : '正在为您重写文章，融入不熟悉的单词...'}
            </span>
          </div>
          {isRewriting && (
            <p className="text-sm text-gray-500 text-center max-w-md">
              我们正在根据您的不熟悉单词列表重写文章，让学习更有针对性
            </p>
          )}
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">文章未找到</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  const visibleSentences = sentences.slice(0, visibleSentenceCount)
  const isAllSentencesVisible = visibleSentenceCount >= sentences.length

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部导航栏 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span>返回文章列表</span>
            </button>
            
            {/* 进度指示器 */}
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">
                {visibleSentenceCount} / {sentences.length}
              </span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(visibleSentenceCount / sentences.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 文章标题 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 text-center">
            {article.title}
          </h1>
          
          {/* 重写状态提示 */}
          {rewrittenContent && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
                <CheckCircle className="w-4 h-4 mr-2 text-gray-600" />
                已为您融入不熟悉的单词，方括号标记的是重点学习词汇
              </div>
            </div>
          )}
          
          {/* 重写错误提示 */}
          {rewriteError && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-700">
                ⚠️ 文章重写失败：{rewriteError}，显示原文章
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 主要阅读区域 */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-4xl w-full">
          {/* 文章内容显示区域 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-8 border border-gray-200">
            <div className="space-y-6">
              {visibleSentences.map((sentence, index) => (
                <p key={index} className="text-xl md:text-2xl leading-relaxed text-gray-800 font-medium">
                  {renderTextWithWordHighlight(sentence)}
                </p>
              ))}
            </div>
          </div>

          {/* 提示信息和完成按钮 */}
          <div className="flex flex-col items-center space-y-4">
            {!isAllSentencesVisible && (
              <div className="text-center">
                <p className="text-gray-500 text-lg mb-2">按空格键继续阅读</p>
                <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-lg">
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-mono">Space</kbd>
                  <span className="ml-2 text-sm text-gray-600">显示下一句</span>
                </div>
              </div>
            )}

            {/* 完成阅读按钮 */}
            {isAllSentencesVisible && (
              <button
                onClick={finishReading}
                className="flex items-center px-8 py-3 bg-gray-800 text-white rounded-xl shadow-md hover:shadow-lg hover:bg-gray-700 transition-all duration-200 font-medium"
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