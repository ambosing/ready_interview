import { Briefcase, ClipboardList, FileText, LayoutDashboard, MessageSquare, Settings, Sparkles, UserCircle } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

type SidebarProps = {
  mobileOpen: boolean
  onMobileOpenChange: (open: boolean) => void
}

const navigationItems = [
  { label: '대시보드', href: '/', icon: LayoutDashboard },
  { label: '프로필 관리', href: '/profile', icon: UserCircle },
  { label: '채용 공고', href: '/job-postings', icon: Briefcase },
  { label: '서류 생성', href: '/documents', icon: FileText },
  { label: '면접 준비', href: '/interviews', icon: MessageSquare },
  { label: '지원 관리', href: '/applications', icon: ClipboardList },
  { label: '설정', href: '/settings', icon: Settings },
] as const

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation()

  return (
    <div className="flex h-full flex-col border-r border-border/70 bg-card/75 backdrop-blur">
      <div className="border-b border-border/70 px-6 py-5">
        <Link className="flex items-center gap-3" to="/" onClick={onNavigate}>
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-5" />
          </div>
          <div>
            <p className="text-base font-semibold tracking-tight">Hirey</p>
            <p className="text-xs text-muted-foreground">AI 채용 준비 플랫폼</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-4">
        {navigationItems.map((item) => {
          const isActive = item.href === '/' ? location.pathname === '/' : location.pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export function Sidebar({ mobileOpen, onMobileOpenChange }: SidebarProps) {
  return (
    <>
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:block md:w-64">
        <SidebarContent />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent className="w-[88%] p-0 sm:max-w-xs" side="left">
          <SheetTitle className="sr-only">메인 네비게이션</SheetTitle>
          <SheetDescription className="sr-only">서비스 주요 메뉴를 탐색합니다.</SheetDescription>
          <SidebarContent onNavigate={() => onMobileOpenChange(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}
