import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'

export function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-transparent text-foreground">
      <Sidebar mobileOpen={mobileOpen} onMobileOpenChange={setMobileOpen} />
      <div className="md:pl-64">
        <Header onOpenMobileSidebar={() => setMobileOpen(true)} />
        <main className="min-h-[calc(100vh-4rem)] overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
