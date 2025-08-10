// 本地CSV单词解析工具

// 单词类型定义
export interface Word {
  id: string
  word: string
  phonetic: string
  definition: string
  translation: string
  pos?: string
  collins?: number
  oxford?: number
  tag?: string
  bnc?: number
  frq?: number
  exchange?: string
  detail?: string
  audio?: string
}

// CSV数据缓存
let csvData: Word[] | null = null
let isLoading = false

// 解析CSV行数据
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

// 加载CSV数据
async function loadCSVData(): Promise<Word[]> {
  if (csvData) {
    return csvData
  }
  
  if (isLoading) {
    // 等待加载完成
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    return csvData || []
  }
  
  isLoading = true
  
  try {
    console.log('开始加载CSV文件...')
    const response = await fetch('/ecdict.csv')
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const csvText = await response.text()
    const lines = csvText.split('\n').filter(line => line.trim())
    
    console.log(`CSV文件加载完成，共${lines.length}行数据`)
    
    // 解析CSV数据
    const words: Word[] = []
    
    // 跳过标题行（如果有的话）
    const startIndex = lines[0].includes('word,phonetic') ? 1 : 0
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i]
      if (!line.trim()) continue
      
      try {
        const columns = parseCSVLine(line)
        
        // 根据ecdict.csv的结构解析
        const word: Word = {
          id: `csv_${i}`,
          word: columns[0] || '',
          phonetic: columns[1] || '',
          definition: columns[2] || '',
          translation: columns[3] || '',
          pos: columns[4] || undefined,
          collins: columns[5] ? parseInt(columns[5]) : undefined,
          oxford: columns[6] ? parseInt(columns[6]) : undefined,
          tag: columns[7] || undefined,
          bnc: columns[8] ? parseInt(columns[8]) : undefined,
          frq: columns[9] ? parseInt(columns[9]) : undefined,
          exchange: columns[10] || undefined,
          detail: columns[11] || undefined,
          audio: columns[12] || undefined
        }
        
        if (word.word) {
          words.push(word)
        }
      } catch (error) {
        console.warn(`解析第${i + 1}行数据时出错:`, error)
      }
    }
    
    csvData = words
    console.log(`CSV数据解析完成，共解析${words.length}个单词`)
    
    return words
  } catch (error) {
    console.error('加载CSV文件失败:', error)
    csvData = []
    return []
  } finally {
    isLoading = false
  }
}

// 单词查询API
export const csvWordAPI = {
  // 根据单词查询释义
  async getWordByText(word: string): Promise<Word | null> {
    console.log('=== csvWordAPI.getWordByText 调试信息 ===')
    console.log('查询参数 - 原始单词:', word)
    console.log('查询参数 - 转换为小写:', word.toLowerCase())
    
    try {
      const words = await loadCSVData()
      const searchWord = word.toLowerCase().trim()
      
      console.log(`在${words.length}个单词中搜索: ${searchWord}`)
      
      // 精确匹配
      const exactMatch = words.find(w => w.word.toLowerCase() === searchWord)
      
      if (exactMatch) {
        console.log('找到精确匹配:', exactMatch)
        console.log('=================================')
        return exactMatch
      }
      
      // 如果没有精确匹配，尝试前缀匹配
      const prefixMatch = words.find(w => w.word.toLowerCase().startsWith(searchWord))
      
      if (prefixMatch) {
        console.log('找到前缀匹配:', prefixMatch)
        console.log('=================================')
        return prefixMatch
      }
      
      console.log('未找到匹配的单词')
      console.log('=================================')
      return null
    } catch (error) {
      console.error('查询单词时出错:', error)
      console.log('=================================')
      return null
    }
  }
}