import { useState, useEffect } from 'react'
import { Article, articleAPI, Word, wordAPI, unfamiliarWordAPI } from '../lib/supabase'
import { rewriteArticleWithWords } from '../lib/openai'
import { ArrowLeft, Calendar, CheckCircle, Loader2, Clock, BookOpen, Home, Sparkles, TrendingUp, Target, Award, Zap, Eye } from 'lucide-react'
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
  
  // 阅读统计相关状态
  const [readingStartTime, setReadingStartTime] = useState<Date | null>(null)
  const [readingEndTime, setReadingEndTime] = useState<Date | null>(null)
  const [newWordsAdded, setNewWordsAdded] = useState<string[]>([])
  
  // 句子阅读速度统计相关状态
  const [sentenceTimings, setSentenceTimings] = useState<{
    sentenceIndex: number
    displayTime: Date
    readTime?: Date
    duration?: number
    wordCount: number
    readingSpeed?: number
  }[]>([])
  const [currentSentenceStartTime, setCurrentSentenceStartTime] = useState<Date | null>(null)
  const [showStatistics, setShowStatistics] = useState(false)

  useEffect(() => {
    loadArticle()
    // 记录阅读开始时间
    setReadingStartTime(new Date())
  }, [articleId])

  // 添加键盘事件监听
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !isPopupVisible) {
        event.preventDefault()
        if (visibleSentenceCount < sentences.length) {
          const now = new Date()
          
          // 记录当前句子的阅读完成时间
          if (currentSentenceStartTime && visibleSentenceCount > 0) {
            const currentSentenceIndex = visibleSentenceCount - 1
            const duration = now.getTime() - currentSentenceStartTime.getTime()
            const wordCount = countWords(sentences[currentSentenceIndex])
            const readingSpeed = wordCount > 0 ? (wordCount / (duration / 1000 / 60)) : 0
            
            setSentenceTimings(prev => {
              const updated = [...prev]
              const existingIndex = updated.findIndex(t => t.sentenceIndex === currentSentenceIndex)
              if (existingIndex >= 0) {
                updated[existingIndex] = {
                  ...updated[existingIndex],
                  readTime: now,
                  duration,
                  readingSpeed
                }
              }
              return updated
            })
          }
          
          // 显示下一句并记录开始时间
          setVisibleSentenceCount(prev => prev + 1)
          setCurrentSentenceStartTime(now)
          
          // 记录新句子的显示时间
          if (visibleSentenceCount < sentences.length) {
            const nextSentenceIndex = visibleSentenceCount
            const wordCount = countWords(sentences[nextSentenceIndex])
            setSentenceTimings(prev => [
              ...prev,
              {
                sentenceIndex: nextSentenceIndex,
                displayTime: now,
                wordCount
              }
            ])
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [visibleSentenceCount, sentences.length, isPopupVisible, currentSentenceStartTime, sentences])

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
        const now = new Date()
        setCurrentSentenceStartTime(now)
        setVisibleSentenceCount(1)
        
        // 初始化第一句的时间记录
        if (sentenceArray.length > 0) {
          const wordCount = countWords(sentenceArray[0])
          setSentenceTimings([{
            sentenceIndex: 0,
            displayTime: now,
            wordCount
          }])
        }
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
    const now = new Date()
    
    // 记录最后一句的阅读完成时间
    if (currentSentenceStartTime && sentences.length > 0) {
      const lastSentenceIndex = sentences.length - 1
      const duration = now.getTime() - currentSentenceStartTime.getTime()
      const wordCount = countWords(sentences[lastSentenceIndex])
      const readingSpeed = wordCount > 0 ? (wordCount / (duration / 1000 / 60)) : 0
      
      setSentenceTimings(prev => {
        const updated = [...prev]
        const existingIndex = updated.findIndex(t => t.sentenceIndex === lastSentenceIndex)
        if (existingIndex >= 0) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            readTime: now,
            duration,
            readingSpeed
          }
        }
        return updated
      })
    }
    
    // 记录阅读结束时间
    setReadingEndTime(now)
    // 显示统计信息
    setShowStatistics(true)
  }

  // 处理添加新单词到生词本
  const handleAddToUnfamiliar = (word: string) => {
    if (!newWordsAdded.includes(word)) {
      setNewWordsAdded(prev => [...prev, word])
    }
  }

  // 格式化阅读时长
  const formatReadingTime = (startTime: Date, endTime: Date) => {
    const diffMs = endTime.getTime() - startTime.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffSeconds = Math.floor((diffMs % 60000) / 1000)
    
    if (diffMinutes > 0) {
      return `${diffMinutes}分${diffSeconds}秒`
    } else {
      return `${diffSeconds}秒`
    }
  }

  // 计算句子中的单词数量
  const countWords = (sentence: string) => {
    // 移除HTML标签和特殊字符，只保留英文单词
    const cleanText = sentence.replace(/<[^>]*>/g, '').replace(/[^a-zA-Z\s]/g, ' ')
    const words = cleanText.trim().split(/\s+/).filter(word => word.length > 0)
    return words.length
  }

  // 计算阅读速度统计
  const calculateReadingSpeedStats = () => {
    const completedTimings = sentenceTimings.filter(t => t.readingSpeed !== undefined)
    if (completedTimings.length === 0) return null

    // 按阅读速度排序
    const sortedBySpeed = [...completedTimings].sort((a, b) => (a.readingSpeed || 0) - (b.readingSpeed || 0))
    
    // 计算分位数
    const total = sortedBySpeed.length
    const q1Index = Math.floor(total * 0.25)
    const q2Index = Math.floor(total * 0.5)
    const q3Index = Math.floor(total * 0.75)
    
    const q1Speed = sortedBySpeed[q1Index]?.readingSpeed || 0
    const q2Speed = sortedBySpeed[q2Index]?.readingSpeed || 0
    const q3Speed = sortedBySpeed[q3Index]?.readingSpeed || 0
    
    // 分级统计
    const levels = {
      slow: completedTimings.filter(t => (t.readingSpeed || 0) <= q1Speed),
      medium: completedTimings.filter(t => (t.readingSpeed || 0) > q1Speed && (t.readingSpeed || 0) <= q2Speed),
      fast: completedTimings.filter(t => (t.readingSpeed || 0) > q2Speed && (t.readingSpeed || 0) <= q3Speed),
      veryFast: completedTimings.filter(t => (t.readingSpeed || 0) > q3Speed)
    }
    
    // 计算平均速度
    const avgSpeed = completedTimings.reduce((sum, t) => sum + (t.readingSpeed || 0), 0) / completedTimings.length
    
    return {
      totalSentences: completedTimings.length,
      averageSpeed: avgSpeed,
      levels,
      unfamiliarSentences: levels.slow // 最慢的25%作为不熟悉句子
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
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative mb-8">
            <div className="w-20 h-20 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-accent-400 rounded-full animate-spin mx-auto" style={{animationDirection: 'reverse', animationDuration: '0.8s'}}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              {loading ? (
                <BookOpen className="w-8 h-8 text-primary-600" />
              ) : (
                <Sparkles className="w-8 h-8 text-accent-600" />
              )}
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-neutral-800 mb-4">
            {loading ? '加载文章中...' : 'AI 正在为您优化文章'}
          </h2>
          
          <p className="text-neutral-600 max-w-md mx-auto mb-6">
            {loading 
              ? '正在获取文章内容，请稍候' 
              : '我们正在根据您的不熟悉单词列表重写文章，让学习更有针对性'
            }
          </p>
          
          {isRewriting && (
            <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-primary-200/50">
              <Zap className="w-4 h-4 text-accent-600 mr-2" />
              <span className="text-sm font-medium text-neutral-700">AI 智能重写中</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-24 h-24 bg-gradient-to-br from-error-100 to-warning-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-12 h-12 text-error-600" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-800 mb-3">文章未找到</h2>
          <p className="text-neutral-600 mb-8">抱歉，无法找到您要查看的文章</p>
          <button
            onClick={onBack}
            className="btn-primary"
          >
            <Home className="w-4 h-4 mr-2" />
            返回首页
          </button>
        </div>
      </div>
    )
  }

  const visibleSentences = sentences.slice(0, visibleSentenceCount)
  const isAllSentencesVisible = visibleSentenceCount >= sentences.length
  
  // 获取慢速句子索引用于高亮显示
  const getSlowSentenceIndices = () => {
    const speedStats = calculateReadingSpeedStats()
    if (!speedStats) return new Set()
    return new Set(speedStats.unfamiliarSentences.map(s => s.sentenceIndex))
  }
  
  const slowSentenceIndices = getSlowSentenceIndices()

  // 如果显示统计信息，渲染统计界面
  if (showStatistics && readingStartTime && readingEndTime) {
    const speedStats = calculateReadingSpeedStats()
    
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-6">
        <div className="max-w-3xl w-full animate-fade-in">
          {/* 成功标题 */}
          <div className="text-center mb-12">
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-success-100 to-primary-100 rounded-2xl flex items-center justify-center mx-auto shadow-soft">
                <Award className="w-12 h-12 text-success-600" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gradient mb-4">阅读完成！</h1>
            <p className="text-xl text-neutral-600 max-w-md mx-auto">
              恭喜您完成了《{article?.title}》的阅读
            </p>
          </div>

          {/* 统计卡片网格 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* 阅读时长 */}
            <div className="card-base text-center animate-slide-up" style={{animationDelay: '0.1s'}}>
              <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-bold text-neutral-800 mb-2">阅读时长</h3>
              <p className="text-3xl font-bold text-gradient mb-1">
                {formatReadingTime(readingStartTime, readingEndTime)}
              </p>
              <p className="text-sm text-neutral-500">专注学习时间</p>
            </div>

            {/* 新学单词 */}
            <div className="card-base text-center animate-slide-up" style={{animationDelay: '0.2s'}}>
              <div className="w-16 h-16 bg-gradient-to-br from-accent-100 to-accent-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-accent-600" />
              </div>
              <h3 className="text-lg font-bold text-neutral-800 mb-2">新学单词</h3>
              <p className="text-3xl font-bold text-gradient mb-1">
                {newWordsAdded.length}
              </p>
              <p className="text-sm text-neutral-500 mb-4">词汇收获</p>
              {newWordsAdded.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {newWordsAdded.slice(0, 3).map((word, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-accent-100 text-accent-700 rounded-full text-xs font-medium"
                    >
                      {word}
                    </span>
                  ))}
                  {newWordsAdded.length > 3 && (
                    <span className="px-3 py-1 bg-neutral-100 text-neutral-600 rounded-full text-xs font-medium">
                      +{newWordsAdded.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 阅读速度 */}
            {speedStats && (
              <div className="card-base text-center animate-slide-up" style={{animationDelay: '0.3s'}}>
                <div className="w-16 h-16 bg-gradient-to-br from-success-100 to-success-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-success-600" />
                </div>
                <h3 className="text-lg font-bold text-neutral-800 mb-2">阅读速度</h3>
                <p className="text-3xl font-bold text-gradient mb-1">
                  {Math.round(speedStats.averageSpeed)}
                </p>
                <p className="text-sm text-neutral-500">词/分钟</p>
              </div>
            )}
          </div>
          {/* 详细分析 */}
          {speedStats && (
            <div className="card-base mb-8 animate-slide-up" style={{animationDelay: '0.4s'}}>
              <h3 className="text-xl font-bold text-neutral-800 mb-6 text-center">阅读表现分析</h3>
              
              {/* 速度分布 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-error-50 rounded-xl border border-error-200">
                  <div className="w-3 h-3 bg-error-500 rounded-full mx-auto mb-2"></div>
                  <div className="text-lg font-bold text-error-700">{speedStats.levels.slow.length}</div>
                  <div className="text-xs text-error-600">较慢句子</div>
                </div>
                <div className="text-center p-4 bg-warning-50 rounded-xl border border-warning-200">
                  <div className="w-3 h-3 bg-warning-500 rounded-full mx-auto mb-2"></div>
                  <div className="text-lg font-bold text-warning-700">{speedStats.levels.medium.length}</div>
                  <div className="text-xs text-warning-600">一般句子</div>
                </div>
                <div className="text-center p-4 bg-primary-50 rounded-xl border border-primary-200">
                  <div className="w-3 h-3 bg-primary-500 rounded-full mx-auto mb-2"></div>
                  <div className="text-lg font-bold text-primary-700">{speedStats.levels.fast.length}</div>
                  <div className="text-xs text-primary-600">较快句子</div>
                </div>
                <div className="text-center p-4 bg-success-50 rounded-xl border border-success-200">
                  <div className="w-3 h-3 bg-success-500 rounded-full mx-auto mb-2"></div>
                  <div className="text-lg font-bold text-success-700">{speedStats.levels.veryFast.length}</div>
                  <div className="text-xs text-success-600">很快句子</div>
                </div>
              </div>
              
              {/* 不熟悉句子提示 */}
              {speedStats.unfamiliarSentences.length > 0 && (
                <div className="bg-gradient-to-r from-error-50 to-warning-50 border border-error-200 rounded-xl p-4">
                  <div className="flex items-center mb-2">
                    <Eye className="w-5 h-5 text-error-600 mr-2" />
                    <span className="font-bold text-error-800">
                      需要重点关注的句子 ({speedStats.unfamiliarSentences.length}句)
                    </span>
                  </div>
                  <p className="text-sm text-error-700">
                    这些句子的阅读速度较慢，建议重点复习和练习
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{animationDelay: '0.5s'}}>
            <button
              onClick={onBack}
              className="btn-primary flex-1"
            >
              <Home className="w-5 h-5 mr-2" />
              返回首页
            </button>
            <button
              onClick={() => {
                setShowStatistics(false)
                const now = new Date()
                setReadingStartTime(now)
                setReadingEndTime(null)
                setNewWordsAdded([])
                setVisibleSentenceCount(1)
                setCurrentSentenceStartTime(now)
                // 重置句子时间统计
                setSentenceTimings(sentences.length > 0 ? [{
                  sentenceIndex: 0,
                  displayTime: now,
                  wordCount: countWords(sentences[0])
                }] : [])
              }}
              className="btn-secondary flex-1"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              重新阅读
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {/* 顶部导航栏 */}
      <div className="bg-white/80 backdrop-blur-md shadow-soft border-b border-neutral-200/50">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center text-neutral-600 hover:text-neutral-800 transition-all duration-200 hover:bg-neutral-100 px-3 py-2 rounded-xl"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="font-medium">返回文章列表</span>
            </button>
            
            {/* 进度指示器 */}
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-sm font-bold text-neutral-800">
                  {visibleSentenceCount} / {sentences.length}
                </div>
                <div className="text-xs text-neutral-500">句子进度</div>
              </div>
              <div className="w-40 bg-neutral-200 rounded-full h-3 shadow-inner">
                <div 
                  className="bg-gradient-to-r from-primary-500 to-accent-500 h-3 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${(visibleSentenceCount / sentences.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 文章标题区域 */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-neutral-200/50">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="text-center animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-6">
              {article.title}
            </h1>
            
            {/* 状态提示 */}
            <div className="flex flex-wrap justify-center gap-3">
              {rewrittenContent && (
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-success-100 to-primary-100 border border-success-200/50 rounded-full">
                  <Sparkles className="w-4 h-4 mr-2 text-success-600" />
                  <span className="text-sm font-medium text-success-700">
                    AI 已为您融入不熟悉单词
                  </span>
                </div>
              )}
              
              {rewriteError && (
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-warning-100 to-error-100 border border-warning-200/50 rounded-full">
                  <span className="text-sm font-medium text-warning-700">
                    ⚠️ 重写失败，显示原文章
                  </span>
                </div>
              )}
              
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-100 to-accent-100 border border-primary-200/50 rounded-full">
                <Eye className="w-4 h-4 mr-2 text-primary-600" />
                <span className="text-sm font-medium text-primary-700">
                  点击单词查看释义
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主要阅读区域 */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-5xl w-full">
          {/* 文章内容显示区域 */}
          <div className="card-base p-8 md:p-16 mb-12 animate-fade-in">
            <div className="space-y-8">
              {visibleSentences.map((sentence, index) => {
                const isSlowSentence = slowSentenceIndices.has(index)
                return (
                  <div 
                    key={index} 
                    className={`animate-slide-up transition-all duration-500 ${
                      isSlowSentence 
                        ? 'bg-gradient-to-r from-error-50 to-warning-50 p-6 rounded-2xl border-l-4 border-error-400 shadow-soft' 
                        : ''
                    }`}
                    style={{animationDelay: `${index * 0.2}s`}}
                  >
                    <p className={`text-xl md:text-2xl lg:text-3xl leading-relaxed font-medium ${
                      isSlowSentence 
                        ? 'text-error-800' 
                        : 'text-neutral-800'
                    }`}>
                      {renderTextWithWordHighlight(sentence)}
                    </p>
                    {isSlowSentence && (
                      <div className="mt-4 flex items-center text-sm text-error-600">
                        <Eye className="w-4 h-4 mr-2" />
                        <span>这句话阅读速度较慢，建议重点关注</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* 控制区域 */}
          <div className="flex flex-col items-center space-y-6 animate-fade-in">
            {!isAllSentencesVisible && (
              <div className="text-center">
                <p className="text-neutral-600 text-xl mb-4">按空格键继续阅读下一句</p>
                <div className="inline-flex items-center px-6 py-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft border border-neutral-200/50">
                  <kbd className="px-4 py-2 bg-gradient-to-br from-neutral-100 to-neutral-200 border border-neutral-300 rounded-xl text-lg font-mono font-bold text-neutral-700 shadow-inner">
                    Space
                  </kbd>
                  <span className="ml-4 text-neutral-700 font-medium">显示下一句</span>
                </div>
                
                {/* 阅读提示 */}
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <div className="inline-flex items-center px-3 py-2 bg-primary-100 text-primary-700 rounded-full text-sm">
                    <Sparkles className="w-4 h-4 mr-2" />
                    <span>方括号单词是重点词汇</span>
                  </div>
                  <div className="inline-flex items-center px-3 py-2 bg-accent-100 text-accent-700 rounded-full text-sm">
                    <Target className="w-4 h-4 mr-2" />
                    <span>点击任意单词查看释义</span>
                  </div>
                </div>
              </div>
            )}

            {/* 完成阅读按钮 */}
            {isAllSentencesVisible && (
              <div className="text-center animate-scale-in">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-success-100 to-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-success-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-800 mb-2">文章阅读完成！</h3>
                  <p className="text-neutral-600">点击下方按钮查看您的阅读统计</p>
                </div>
                
                <button
                  onClick={finishReading}
                  className="btn-primary px-12 py-4 text-lg shadow-medium hover:shadow-large transform hover:scale-105"
                >
                  <Award className="w-6 h-6 mr-3" />
                  查看阅读统计
                </button>
              </div>
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
        onAddToUnfamiliar={handleAddToUnfamiliar}
      />
    </div>
  )
}