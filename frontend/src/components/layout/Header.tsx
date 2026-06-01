import { LogOut, Menu, Settings, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'

type HeaderProps = {
  onOpenMobileSidebar: () => void
}

function getInitials(name?: string) {
  if (!name) {
    return 'RI'
  }

  return name.slice(0, 2).toUpperCase()
}

export function Header({ onOpenMobileSidebar }: HeaderProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Local logout should still complete if the server is unavailable.
    }

    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/70 bg-card/85 px-4 backdrop-blur md:px-8">
      <div className="flex items-center gap-3">
        <Button className="md:hidden" size="icon" variant="ghost" onClick={onOpenMobileSidebar}>
          <Menu className="size-5" />
          <span className="sr-only">메뉴 열기</span>
        </Button>
        <div>
          <p className="text-sm font-semibold">채용 준비 현황</p>
          <p className="text-xs text-muted-foreground">오늘의 액션을 빠르게 확인해보세요.</p>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 rounded-full border border-border/70 bg-card px-2 py-1.5 text-left shadow-xs transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar>
              <AvatarImage src={user?.profile?.profileImageUrl ?? undefined} alt={user?.name ?? '사용자'} />
              <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
            </Avatar>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-medium">{user?.name ?? '사용자'}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email ?? '로그인이 필요합니다.'}</p>
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>내 계정</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/profile')}>
            <User className="size-4" />
            프로필
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/settings')}>
            <Settings className="size-4" />
            설정
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={handleLogout}>
            <LogOut className="size-4" />
            로그아웃
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
