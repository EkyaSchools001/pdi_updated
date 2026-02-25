import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
