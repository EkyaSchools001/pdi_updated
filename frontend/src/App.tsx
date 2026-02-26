import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import TeacherDashboard from "./pages/TeacherDashboard";
import LeaderDashboard from "./pages/LeaderDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ManagementDashboard from "./pages/ManagementDashboard";
import { MeetingsDashboard } from "./pages/MeetingsDashboard";
import { CreateMeetingForm } from "./pages/CreateMeetingForm";
import { MeetingDetailsView } from "./pages/MeetingDetailsView";
import { MeetingMoMForm } from "./pages/MeetingMoMForm";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import GrowthPage from "./pages/GrowthPage";
import LeaderGrowthPage from "./pages/leader/LeaderGrowthPage";
import AdminGrowthAnalyticsPage from "./pages/admin/AdminGrowthAnalyticsPage";
import DanielsonFrameworkPage from "./pages/leader/DanielsonFrameworkPage";
import QuickFeedbackPage from "./pages/leader/QuickFeedbackPage";
import PerformingArtsObsDashboard from "./pages/leader/PerformingArtsObsDashboard";
import PerformingArtsObsPage from "./pages/leader/PerformingArtsObsPage";
import QuickFeedbackDashboard from "./pages/leader/QuickFeedbackDashboard";
import DanielsonDashboard from "./pages/leader/DanielsonDashboard";
import LifeSkillsObsDashboard from "./pages/leader/LifeSkillsObsDashboard";
import LifeSkillsObsPage from "./pages/leader/LifeSkillsObsPage";
import PEObsDashboard from "./pages/leader/PEObsDashboard";
import PEObsPage from "./pages/leader/PEObsPage";
import VAObsDashboard from "./pages/leader/VAObsDashboard";
import VAObsPage from "./pages/leader/VAObsPage";
import OKRDashboard from "./pages/OKRDashboard";
import NotFound from "./pages/NotFound";


import { AuthProvider } from "./hooks/useAuth";
import { PermissionProvider } from "./contexts/PermissionContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}>
        <AuthProvider>
          <PermissionProvider>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Auth />} />

                <Route
                  path="/teacher/*"
                  element={
                    <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN', 'SUPERADMIN']}>
                      <TeacherDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/leader/*"
                  element={
                    <ProtectedRoute allowedRoles={['LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN']}>
                      <LeaderDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/*"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/management/*"
                  element={
                    <ProtectedRoute allowedRoles={['MANAGEMENT', 'SUPERADMIN']}>
                      <ManagementDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/meetings"
                  element={
                    <ProtectedRoute allowedRoles={['TEACHER', 'LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN', 'MANAGEMENT']}>
                      <MeetingsDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/meetings/create"
                  element={
                    <ProtectedRoute allowedRoles={['LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN']}>
                      <CreateMeetingForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/meetings/edit/:id"
                  element={
                    <ProtectedRoute allowedRoles={['LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN']}>
                      <CreateMeetingForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/meetings/:id"
                  element={
                    <ProtectedRoute allowedRoles={['TEACHER', 'LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN', 'MANAGEMENT']}>
                      <MeetingDetailsView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/meetings/:meetingId/mom"
                  element={
                    <ProtectedRoute allowedRoles={['TEACHER', 'LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN', 'MANAGEMENT']}>
                      <MeetingMoMForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/growth"
                  element={
                    <ProtectedRoute allowedRoles={['TEACHER', 'LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN', 'MANAGEMENT']}>
                      <GrowthPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/growth/feedback"
                  element={<Navigate to="/leader/danielson-framework" replace />}
                />
                <Route
                  path="/leader/growth"
                  element={
                    <ProtectedRoute allowedRoles={['LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN']}>
                      <LeaderGrowthPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/leader/growth/:teacherId"
                  element={
                    <ProtectedRoute allowedRoles={['LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN']}>
                      <LeaderGrowthPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/leader/danielson-framework"
                  element={
                    <ProtectedRoute allowedRoles={['LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN']}>
                      <DanielsonDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/leader/danielson-framework/new"
                  element={
                    <ProtectedRoute allowedRoles={['LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN']}>
                      <DanielsonFrameworkPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/leader/danielson-framework/:teacherId"
                  element={
                    <ProtectedRoute allowedRoles={['LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN']}>
                      <DanielsonFrameworkPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/leader/quick-feedback"
                  element={
                    <ProtectedRoute allowedRoles={['LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN']}>
                      <QuickFeedbackDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/leader/quick-feedback/new"
                  element={
                    <ProtectedRoute allowedRoles={['LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN']}>
                      <QuickFeedbackPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/leader/quick-feedback/:teacherId"
                  element={
                    <ProtectedRoute allowedRoles={['LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN']}>
                      <QuickFeedbackPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/leader/performing-arts-obs"
                  element={
                    <ProtectedRoute allowedRoles={['LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN']}>
                      <PerformingArtsObsDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/leader/performing-arts-obs/new"
                  element={
                    <ProtectedRoute allowedRoles={['LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN']}>
                      <PerformingArtsObsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/leader/life-skills-obs"
                  element={
                    <ProtectedRoute allowedRoles={['LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN']}>
                      <LifeSkillsObsDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/leader/life-skills-obs/new"
                  element={
                    <ProtectedRoute allowedRoles={['LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN']}>
                      <LifeSkillsObsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/leader/pe-obs"
                  element={
                    <ProtectedRoute allowedRoles={['LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN']}>
                      <PEObsDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/leader/pe-obs/new"
                  element={
                    <ProtectedRoute allowedRoles={['LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN']}>
                      <PEObsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/leader/va-obs"
                  element={
                    <ProtectedRoute allowedRoles={['LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN']}>
                      <VAObsDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/leader/va-obs/new"
                  element={
                    <ProtectedRoute allowedRoles={['LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN']}>
                      <VAObsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/growth-analytics"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}>
                      <AdminGrowthAnalyticsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/announcements"
                  element={
                    <ProtectedRoute allowedRoles={['TEACHER', 'LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN', 'MANAGEMENT']}>
                      <AnnouncementsPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/okr"
                  element={
                    <ProtectedRoute allowedRoles={['TEACHER', 'LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN', 'MANAGEMENT']}>
                      <OKRDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
          </PermissionProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
