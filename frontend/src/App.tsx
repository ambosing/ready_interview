import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { queryClient } from '@/lib/query-client'
import ApplicationDetailPage from '@/pages/ApplicationDetailPage'
import ApplicationsPage from '@/pages/ApplicationsPage'
import DashboardPage from '@/pages/DashboardPage'
import DocumentEditorPage from '@/pages/DocumentEditorPage'
import DocumentsPage from '@/pages/DocumentsPage'
import InterviewFeedbackPage from '@/pages/InterviewFeedbackPage'
import InterviewPrepPage from '@/pages/InterviewPrepPage'
import JobPostingDetailPage from '@/pages/JobPostingDetailPage'
import JobPostingNewPage from '@/pages/JobPostingNewPage'
import JobPostingsPage from '@/pages/JobPostingsPage'
import LoginPage from '@/pages/LoginPage'
import MockInterviewPage from '@/pages/MockInterviewPage'
import ProfilePage from '@/pages/ProfilePage'
import SelfEvaluationPage from '@/pages/SelfEvaluationPage'
import SettingsPage from '@/pages/SettingsPage'
import SignupPage from '@/pages/SignupPage'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="job-postings" element={<JobPostingsPage />} />
              <Route path="job-postings/new" element={<JobPostingNewPage />} />
              <Route path="job-postings/:id" element={<JobPostingDetailPage />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="documents/:id" element={<DocumentEditorPage />} />
              <Route path="interviews" element={<InterviewPrepPage />} />
              <Route path="interviews/:id" element={<MockInterviewPage />} />
              <Route path="interviews/:id/feedback" element={<InterviewFeedbackPage />} />
              <Route path="applications" element={<ApplicationsPage />} />
              <Route path="applications/:id" element={<ApplicationDetailPage />} />
              <Route path="self-evaluations/new" element={<SelfEvaluationPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
