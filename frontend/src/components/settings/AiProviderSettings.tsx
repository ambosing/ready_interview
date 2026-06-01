import { Bot, CheckCircle2, KeyRound, Link2, LoaderCircle, PlugZap, Save, Unplug } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  aiModelOptions,
  aiProviderOptions,
  clearLegacyAiProviderConnections,
  getAiProviderIdFromModel,
  getStoredAiModel,
  setStoredAiModel,
  type AiProvider,
} from '@/lib/ai-models'
import {
  useAiProviderConnections,
  useDeleteAiProviderConnection,
  useSaveAiProviderConnection,
} from '@/hooks/use-ai-provider-connections'
import type { AiModel } from '@/types'

type ProviderFormState = {
  apiKey: string
  accessToken: string
  oauthJson: string
}

const emptyProviderForm: ProviderFormState = {
  apiKey: '',
  accessToken: '',
  oauthJson: '',
}

function formatConnectedAt(value?: string | null) {
  if (!value) {
    return '방금 전'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '방금 전'
  }

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function AiProviderSettings() {
  const [selectedAiModel, setSelectedAiModel] = useState<AiModel>(() => getStoredAiModel())
  const [editingProvider, setEditingProvider] = useState<AiProvider | null>(null)
  const [providerForm, setProviderForm] = useState<ProviderFormState>(emptyProviderForm)
  const { data: connectionStatuses = [], isLoading } = useAiProviderConnections()
  const saveConnection = useSaveAiProviderConnection()
  const deleteConnection = useDeleteAiProviderConnection()

  useEffect(() => {
    clearLegacyAiProviderConnections()
  }, [])

  const selectedAiModelOption = aiModelOptions.find((option) => option.value === selectedAiModel)
  const selectedProvider = getAiProviderIdFromModel(selectedAiModel)

  const connections = useMemo(
    () => Object.fromEntries(connectionStatuses.map((status) => [status.provider, status])),
    [connectionStatuses],
  )

  const modelGroups = useMemo(
    () =>
      aiProviderOptions.map((provider) => ({
        ...provider,
        models: aiModelOptions.filter((option) => option.providerId === provider.id),
      })),
    [],
  )

  const activeProviderOption = aiProviderOptions.find((provider) => provider.id === selectedProvider)
  const editingProviderOption = editingProvider
    ? aiProviderOptions.find((provider) => provider.id === editingProvider)
    : null

  const openProviderDialog = (provider: AiProvider) => {
    setProviderForm(emptyProviderForm)
    setEditingProvider(provider)
  }

  const handleSaveProvider = async () => {
    if (!editingProvider || !editingProviderOption) {
      return
    }

    const payload = {
      provider: editingProvider,
      authType: editingProviderOption.authType,
      apiKey: providerForm.apiKey.trim() || undefined,
      accessToken: providerForm.accessToken.trim() || undefined,
      oauthJson: providerForm.oauthJson.trim() || undefined,
    }

    if (payload.authType === 'api-key' && !payload.apiKey) {
      toast.error('API 키를 입력해 주세요.')
      return
    }

    if (payload.authType === 'oauth' && !payload.accessToken && !payload.oauthJson) {
      toast.error('OAuth 토큰 또는 JSON을 입력해 주세요.')
      return
    }

    await saveConnection.mutateAsync(payload)
    setEditingProvider(null)
  }

  const handleDisconnectProvider = async (provider: AiProvider) => {
    await deleteConnection.mutateAsync(provider)
  }

  const handleModelChange = (value: string) => {
    const aiModel = value as AiModel
    setSelectedAiModel(aiModel)
    setStoredAiModel(aiModel)
    toast.success('AI 모델 기본값이 저장되었습니다.')
  }

  const selectedProviderStatus = connections[selectedProvider]
  const isDialogSaving = saveConnection.isPending

  return (
    <Card className="border-border/60">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bot className="size-4 text-primary" />
          <CardTitle>AI 모델 및 공급자</CardTitle>
        </div>
        <CardDescription>공고 분석, 서류 생성, 모의 면접에 사용할 기본 모델과 공급자 연결을 관리합니다.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
          <div className="space-y-2">
            <Label htmlFor="ai-provider-default-model">전체 기본 AI 모델</Label>
            <Select value={selectedAiModel} onValueChange={handleModelChange}>
              <SelectTrigger id="ai-provider-default-model" className="w-full">
                <SelectValue placeholder="AI 모델 선택" />
              </SelectTrigger>
              <SelectContent>
                {modelGroups.map((group) => (
                  <SelectGroup key={group.id}>
                    <SelectLabel>{group.label}</SelectLabel>
                    {group.models.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="text-xs font-medium text-primary">{option.provider}</span>
                          <span>{option.label}</span>
                          <span className="hidden text-xs text-muted-foreground sm:inline">{option.description}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium">현재 기본값</p>
                <p className="truncate text-sm text-muted-foreground">
                  {selectedAiModelOption?.provider} · {selectedAiModelOption?.label}
                </p>
              </div>
              {selectedProviderStatus?.connected ? (
                <Badge variant="secondary" className="shrink-0 gap-1">
                  <CheckCircle2 className="size-3" />
                  연결됨
                </Badge>
              ) : (
                <Badge variant="outline" className="shrink-0">
                  미연결
                </Badge>
              )}
            </div>
            <Button className="mt-4 w-full gap-2" variant="outline" onClick={() => openProviderDialog(selectedProvider)}>
              <Link2 className="size-4" />
              {activeProviderOption?.label ?? '공급자'} 연결
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {aiProviderOptions.map((provider) => {
            const connection = connections[provider.id]
            const isConnected = Boolean(connection?.connected)
            const secretLabel = connection?.maskedSecret ?? '저장된 키 없음'

            return (
              <div key={provider.id} className="flex min-h-48 flex-col justify-between rounded-lg border border-border/60 bg-background p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium">{provider.label}</p>
                      <p className="text-sm text-muted-foreground">{provider.description}</p>
                    </div>
                    {isConnected ? (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="size-3" />
                        연결됨
                      </Badge>
                    ) : (
                      <Badge variant="outline">미연결</Badge>
                    )}
                  </div>

                  <div className="rounded-md bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <KeyRound className="size-3.5" />
                      <span>{isLoading ? '확인 중...' : secretLabel}</span>
                    </div>
                    {isConnected ? <p className="mt-1">저장: {formatConnectedAt(connection?.connectedAt)}</p> : null}
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button className="flex-1 gap-2" variant="outline" size="sm" onClick={() => openProviderDialog(provider.id)}>
                    <PlugZap className="size-4" />
                    연결
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    variant="outline"
                    size="sm"
                    disabled={!isConnected || deleteConnection.isPending}
                    onClick={() => handleDisconnectProvider(provider.id)}
                  >
                    <Unplug className="size-4" />
                    해제
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>

      <Dialog open={Boolean(editingProvider)} onOpenChange={(open) => !open && setEditingProvider(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProviderOption?.label ?? '공급자'} 연결</DialogTitle>
            <DialogDescription>연결값은 서버에 암호화 저장되며 브라우저 저장소에는 남기지 않습니다.</DialogDescription>
          </DialogHeader>

          {editingProviderOption?.authType === 'oauth' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ai-provider-access-token">Access token</Label>
                <Input
                  id="ai-provider-access-token"
                  type="password"
                  value={providerForm.accessToken}
                  onChange={(event) => setProviderForm((current) => ({ ...current, accessToken: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ai-provider-oauth-json">OAuth JSON</Label>
                <Textarea
                  id="ai-provider-oauth-json"
                  className="min-h-28"
                  value={providerForm.oauthJson}
                  onChange={(event) => setProviderForm((current) => ({ ...current, oauthJson: event.target.value }))}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="ai-provider-api-key">API key</Label>
              <Input
                id="ai-provider-api-key"
                type="password"
                value={providerForm.apiKey}
                onChange={(event) => setProviderForm((current) => ({ ...current, apiKey: event.target.value }))}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProvider(null)} disabled={isDialogSaving}>
              취소
            </Button>
            <Button className="gap-2" onClick={handleSaveProvider} disabled={isDialogSaving}>
              {isDialogSaving ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
