import { BookOpenText, BriefcaseBusiness, FolderKanban, GraduationCap, IdCard, Sparkles, Target, Trophy } from 'lucide-react'

import { BasicInfoSection } from '@/components/profile/BasicInfoSection'
import { CareerSection } from '@/components/profile/CareerSection'
import { CertificationSection } from '@/components/profile/CertificationSection'
import { EducationSection } from '@/components/profile/EducationSection'
import { ProfileCompleteness } from '@/components/profile/ProfileCompleteness'
import { ProjectSection } from '@/components/profile/ProjectSection'
import { SkillSection } from '@/components/profile/SkillSection'
import { SwotSection } from '@/components/profile/SwotSection'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useProfile } from '@/hooks/use-profile'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

const tabItems = [
  { value: 'basic', label: '기본 정보', icon: IdCard },
  { value: 'education', label: '학력', icon: GraduationCap },
  { value: 'career', label: '경력', icon: BriefcaseBusiness },
  { value: 'certification', label: '자격증', icon: Trophy },
  { value: 'project', label: '프로젝트', icon: FolderKanban },
  { value: 'skill', label: '기술', icon: Sparkles },
  { value: 'swot', label: 'SWOT', icon: Target },
] as const

export default function ProfilePage() {
  const userName = useAuthStore((state) => state.user?.name ?? '')
  const { data: profile, isLoading, isError } = useProfile()

  if (isLoading) {
    return (
      <Card className="border-border/60 shadow-sm">
        <CardContent className="flex min-h-80 items-center justify-center text-sm text-muted-foreground">
          프로필 정보를 불러오는 중입니다...
        </CardContent>
      </Card>
    )
  }

  if (isError || !profile) {
    return (
      <Card className="border-border/60 shadow-sm">
        <CardContent className="flex min-h-80 flex-col items-center justify-center gap-2 text-center">
          <BookOpenText className="size-10 text-muted-foreground" />
          <p className="text-sm font-medium">프로필 정보를 불러오지 못했습니다.</p>
          <p className="text-sm text-muted-foreground">잠시 후 다시 시도해 주세요.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <ProfileCompleteness profile={profile} userName={userName} />

      <Tabs defaultValue="basic" className="gap-6">
        <ScrollArea className="w-full whitespace-nowrap rounded-3xl border border-border/60 bg-card/70 p-1.5 shadow-sm">
          <TabsList variant="line" className="h-auto min-w-max gap-1 bg-transparent p-1">
            {tabItems.map((tab) => {
              const Icon = tab.icon

              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={cn('rounded-2xl px-4 py-3 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm')}
                >
                  <Icon className="size-4" />
                  {tab.label}
                </TabsTrigger>
              )
            })}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="basic">
          <BasicInfoSection profile={profile} userName={userName} />
        </TabsContent>
        <TabsContent value="education">
          <EducationSection educations={profile.educations} />
        </TabsContent>
        <TabsContent value="career">
          <CareerSection careers={profile.careers} />
        </TabsContent>
        <TabsContent value="certification">
          <CertificationSection certifications={profile.certifications} />
        </TabsContent>
        <TabsContent value="project">
          <ProjectSection projects={profile.projects} />
        </TabsContent>
        <TabsContent value="skill">
          <SkillSection skills={profile.skills} />
        </TabsContent>
        <TabsContent value="swot">
          <SwotSection swotAnalysis={profile.swotAnalysis} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
