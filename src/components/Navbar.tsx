import { BookOpen, Home, Sparkles } from 'lucide-react'

interface NavbarProps {
  onLogoClick: () => void
}

export default function Navbar({ onLogoClick }: NavbarProps) {
  return (
    <nav className="glass-effect border-b border-neutral-200/50 sticky top-0 z-50 animate-fade-in">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo区域 */}
          <div 
            className="flex items-center cursor-pointer group transition-all duration-300 hover:scale-105"
            onClick={onLogoClick}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative bg-gradient-to-r from-primary-600 to-accent-600 p-2.5 rounded-xl">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gradient">PassExam</h1>
              <p className="text-xs text-neutral-500 -mt-1">智能英语学习平台</p>
            </div>
          </div>
          
          {/* 导航菜单 */}
          <div className="hidden md:flex items-center space-x-2">
            <button 
              onClick={onLogoClick}
              className="flex items-center px-4 py-2.5 rounded-xl text-sm font-medium text-neutral-700 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200 group"
            >
              <Home className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
              首页
            </button>
            
            <div className="w-px h-6 bg-neutral-200 mx-2"></div>
            
            <div className="flex items-center px-3 py-2 rounded-xl bg-gradient-to-r from-accent-50 to-primary-50 border border-accent-200/50">
              <Sparkles className="w-4 h-4 text-accent-600 mr-2" />
              <span className="text-sm font-medium text-accent-700">AI 驱动</span>
            </div>
          </div>
          
          {/* 移动端菜单按钮 */}
          <div className="md:hidden">
            <button 
              onClick={onLogoClick}
              className="p-2 rounded-xl text-neutral-600 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200"
            >
              <Home className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}