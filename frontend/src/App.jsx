import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import ProtectedLayout from './components/layout/ProtectedLayout';
import ErrorBoundary from './components/ErrorBoundary';

// ─── Auth ─────────────────────────────────────────────────────────────────────
const LoginPage             = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage          = lazy(() => import('./pages/auth/RegisterPage'));
const ResetPasswordPage     = lazy(() => import('./pages/auth/ResetPasswordPage'));
const AccountStatusPage     = lazy(() => import('./pages/auth/AccountStatusPage'));

// ─── Feed ─────────────────────────────────────────────────────────────────────
const FeedPage              = lazy(() => import('./features/feed/components/FeedPage'));

// ─── Profile ──────────────────────────────────────────────────────────────────
const MyProfilePage         = lazy(() => import('./pages/profile/MyProfilePage'));
const PublicProfilePage     = lazy(() => import('./pages/profile/PublicProfilePage'));

// ─── Jobs ─────────────────────────────────────────────────────────────────────
const JobListPage           = lazy(() => import('./pages/jobs/JobListPage'));
const JobDetailPage         = lazy(() => import('./pages/jobs/JobDetailPage'));
const PostJobPage           = lazy(() => import('./pages/jobs/PostJobPage'));
const MyJobsPage            = lazy(() => import('./pages/jobs/MyJobsPage'));
const MyApplicationsPage    = lazy(() => import('./pages/jobs/MyApplicationsPage'));
const AdminJobApprovalsPage = lazy(() => import('./pages/jobs/AdminJobApprovalsPage'));

// ─── Search & Recommendation ──────────────────────────────────────────────────
const SearchPage            = lazy(() => import('./pages/search/SearchPage'));
const RecommendedJobsPage   = lazy(() => import('./pages/recommendation/RecommendedJobsPage'));

// ─── Mentorship ───────────────────────────────────────────────────────────────
const MentorListPage            = lazy(() => import('./pages/mentorship/MentorListPage'));
const MentorProfilePage         = lazy(() => import('./pages/mentorship/MentorProfilePage'));
const BecomeMentorPage          = lazy(() => import('./pages/mentorship/BecomeMentorPage'));
const MyMentorRequestsPage      = lazy(() => import('./pages/mentorship/MyMentorRequestsPage'));
const ReceivedMentorRequestsPage = lazy(() => import('./pages/mentorship/ReceivedMentorRequestsPage'));
const MentorSessionsPage        = lazy(() => import('./pages/mentorship/MentorSessionsPage'));

// ─── Connections ──────────────────────────────────────────────────────────────
const MyConnectionsPage     = lazy(() => import('./pages/connections/MyConnectionsPage'));
const ConnectionRequestsPage = lazy(() => import('./pages/connections/ConnectionRequestsPage'));

// ─── Communication ────────────────────────────────────────────────────────────
const ChatLayout = lazy(() => import('./pages/communication/ChatLayout'));

// ─── Admin ────────────────────────────────────────────────────────────────────
const AdminDashboardPage    = lazy(() => import('./pages/admin/AdminDashboardPage'));

// ─── Notifications ───────────────────────────────────────────────────────────
const NotificationsPage     = lazy(() => import('./pages/notifications/NotificationsPage'));

// ─── Communities ──────────────────────────────────────────────────────────────
const DiscoverCommunitiesPage = lazy(() => import('./pages/communities/DiscoverCommunitiesPage'));
const CreateCommunityPage     = lazy(() => import('./pages/communities/CreateCommunityPage'));
const CommunityDetailPage     = lazy(() => import('./pages/communities/CommunityDetailPage'));

// ─── Misc ─────────────────────────────────────────────────────────────────────
const NotFoundPage          = lazy(() => import('./pages/NotFoundPage'));

// ─── Suspense Loader ──────────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 rounded-full border-4 border-primary-500/20" />
      <div className="absolute inset-0 rounded-full border-4 border-t-primary-500 animate-spin" />
    </div>
  </div>
);

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/login"          element={<LoginPage />} />
          <Route path="/register"       element={<RegisterPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/account-status" element={<AccountStatusPage />} />

          {/* Protected — all inside ProtectedRoute → ProtectedLayout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<Navigate to="/feed" replace />} />

              {/* Feed */}
              <Route path="/feed"                 element={<FeedPage />} />

              {/* Jobs */}
              <Route path="/jobs"                 element={<JobListPage />} />
              <Route path="/jobs/:jobId"          element={<JobDetailPage />} />
              <Route path="/jobs/applications/my" element={<MyApplicationsPage />} />

              {/* Profile */}
              <Route path="/profile"              element={<MyProfilePage />} />
              <Route path="/profile/:userId"      element={<PublicProfilePage />} />

              {/* Search */}
              <Route path="/search"               element={<SearchPage />} />

              {/* Notifications */}
              <Route path="/notifications"         element={<NotificationsPage />} />

              {/* Mentors (public for all auth users) */}
              <Route path="/mentors"              element={<MentorListPage />} />
              <Route path="/mentors/:mentorId"    element={<MentorProfilePage />} />
              <Route path="/mentors/requests/my"  element={<MyMentorRequestsPage />} />
              <Route path="/mentors/sessions"     element={<MentorSessionsPage />} />

              {/* Connections */}
              <Route path="/connections"          element={<MyConnectionsPage />} />
              <Route path="/connections/requests" element={<ConnectionRequestsPage />} />

              {/* Communities */}
              <Route path="/communities"            element={<DiscoverCommunitiesPage />} />
              <Route path="/communities/create"     element={<CreateCommunityPage />} />
              <Route path="/communities/:communityId" element={<CommunityDetailPage />} />

              {/* Chat (Unified WhatsApp Style) */}
              <Route path="/chat"                 element={<ChatLayout />} />
              <Route path="/chat/:conversationId" element={<ChatLayout />} />

              {/* ── Role: faculty/alumni/admin ── */}
              <Route element={<RoleRoute allowedRoles={['faculty','alumni','admin']} />}>
                <Route path="/jobs/post"                          element={<PostJobPage />} />
                <Route path="/jobs/my"                            element={<MyJobsPage />} />
                <Route path="/mentors/become"                     element={<BecomeMentorPage />} />
                <Route path="/mentors/requests/received"          element={<ReceivedMentorRequestsPage />} />
              </Route>

              {/* ── Role: student/alumni ── */}
              <Route element={<RoleRoute allowedRoles={['student','alumni']} />}>
                <Route path="/recommendation"  element={<RecommendedJobsPage />} />
              </Route>

              {/* ── Role: admin only ── */}
              <Route element={<RoleRoute allowedRoles={['admin']} />}>
                <Route path="/admin"                element={<AdminDashboardPage />} />
                <Route path="/jobs/admin/pending"   element={<AdminJobApprovalsPage />} />
              </Route>

            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
