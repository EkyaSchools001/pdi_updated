import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Users, FileText, Book, Calendar, Settings, Activity, ClipboardList, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Link, Routes, Route, useNavigate, useLocation, useParams } from "react-router-dom";
import { UserManagementView } from "./admin/UserManagementView";
import { TeacherProfileView } from "@/components/TeacherProfileView";
import { Observation } from "@/types/observation";
import { useState, useEffect } from "react";
import { FormTemplatesView } from "./admin/FormTemplatesView";
import { CourseManagementView } from "./admin/CourseManagementView";
import { AdminCalendarView } from "./admin/AdminCalendarView";
import { AdminReportsView } from "./admin/AdminReportsView";
import { SystemSettingsView } from "./admin/SystemSettingsView";
import { SuperAdminView } from "./admin/SuperAdminView";
import AdminDocumentManagement from "./AdminDocumentManagement";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { getSocket } from "@/lib/socket";
import AttendanceRegister from "@/pages/AttendanceRegister";
import EventAttendanceView from "@/pages/EventAttendanceView";
import { useAccessControl } from "@/hooks/useAccessControl";
import { MeetingsDashboard } from './MeetingsDashboard';
import { CreateMeetingForm } from './CreateMeetingForm';
import { MeetingMoMForm } from './MeetingMoMForm';
import SurveyPage from "@/pages/SurveyPage";
import { FestivalManagementDashboard } from './LearningFestival/FestivalManagementDashboard';

interface DashboardUser {
  id: string;
  fullName: string;
  role: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  if (!user) return null; // Let ProtectedRoute handle it

  const userName = user.fullName;
  const role = user.role;



  const [observations, setObservations] = useState<Observation[]>([]);
  const [recentUsers, setRecentUsers] = useState<DashboardUser[]>([]);

  const [stats, setStats] = useState({
    users: { total: 0, new: 0 },
    training: { total: 0, thisMonth: 0 },
    forms: { active: 0, total: 0 },
    courses: { total: 0, new: 0 }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Backend Stats
        const [obsResponse, usersResponse, statsResponse, templatesResponse] = await Promise.all([
          api.get('/observations').catch(e => ({ data: { status: 'error', data: { observations: [] } } })),
          api.get('/users').catch(e => ({ data: { status: 'error', data: { users: [] } } })),
          api.get('/stats/admin').catch(e => ({ data: { status: 'error', data: {} } })),
          api.get('/templates').catch(e => ({ data: { status: 'error', data: { templates: [] } } }))
        ]);

        console.log('AdminDashboard: API responses', {
          observations: obsResponse.data?.status,
          users: usersResponse.data?.status,
          stats: statsResponse.data?.status,
          templates: templatesResponse.data?.status
        });

        const observationsData = obsResponse.data?.status === 'success' 
          ? (obsResponse.data?.data?.observations || [])
          : [];
        setObservations(observationsData);

        const allUsers = usersResponse.data?.status === 'success'
          ? (usersResponse.data?.data?.users || [])
          : [];
        setRecentUsers(allUsers.slice(0, 5));

        const backendStats = statsResponse.data?.status === 'success'
          ? (statsResponse.data?.data || {})
          : {};

        // 2. Form Stats (from API)
        const forms = templatesResponse.data?.status === 'success'
          ? (templatesResponse.data?.data?.templates || [])
          : [];
        const activeForms = forms.filter((f: any) => f.status === 'Active' || f.isDefault).length;

        setStats({
          users: {
            total: backendStats?.users?.total || allUsers.length || 0,
            new: backendStats?.users?.newThisMonth || 0
          },
          training: {
            total: backendStats?.trainingEvents?.total || 0,
            thisMonth: backendStats?.trainingEvents?.thisMonth || 0
          },
          forms: {
            active: activeForms,
            total: forms.length
          },
          courses: {
            total: backendStats?.courses?.total || 0,
            new: backendStats?.courses?.newThisMonth || 0
          }
        });

      } catch (error: any) {
        console.error("Failed to fetch dashboard data:", error);
        console.error("Error details:", error.response?.data || error.message);
      }
    };

    fetchData();


    const socket = getSocket();
    socket.on('new_observation', (newObs: Observation) => {
      setObservations(prev => [newObs, ...prev]);
    });

    socket.on('update_observation', (updatedObs: Observation) => {
      setObservations(prev => prev.map(obs => obs.id === updatedObs.id ? updatedObs : obs));
    });

    return () => {
      socket.off('new_observation');
      socket.off('update_observation');
    };
  }, []);

  return (
    <DashboardLayout role={role.toLowerCase() as any} userName={userName}>
      <Routes>
        <Route index element={<DashboardOverview recentUsers={recentUsers} stats={stats} role={role} />} />
        <Route path="users" element={<UserManagementView />} />
        <Route path="profile/:userId" element={<AdminTeacherProfileView observations={observations} />} />
        <Route path="forms" element={<FormTemplatesView />} />
        <Route path="meetings" element={<MeetingsDashboard />} />
        <Route path="meetings/create" element={<CreateMeetingForm />} />
        <Route path="meetings/:meetingId/mom" element={<MeetingMoMForm />} />
        <Route path="meetings/:meetingId" element={<MeetingMoMForm />} />
        <Route path="courses" element={<CourseManagementView />} />
        <Route path="calendar" element={<AdminCalendarView />} />
        <Route path="attendance" element={<AttendanceRegister />} />
        <Route path="attendance/:id" element={<EventAttendanceView />} />
        <Route path="documents" element={<AdminDocumentManagement />} />
        <Route path="reports" element={<AdminReportsView />} />
        <Route path="settings" element={<SystemSettingsView />} />
        <Route path="survey" element={<SurveyPage />} />
        <Route path="festival" element={<FestivalManagementDashboard />} />
        <Route path="superadmin" element={<SuperAdminView />} />
      </Routes>
    </DashboardLayout>
  );
}


const recentActivity = [
  { id: "1", action: "User role updated", user: "admin@school.edu", target: "Teacher Two → Department Head", time: "2 hours ago" },
  { id: "2", action: "Form template created", user: "admin@school.edu", target: "Classroom Observation v2", time: "5 hours ago" },
  { id: "3", action: "Course added", user: "admin@school.edu", target: "Differentiated Instruction Workshop", time: "1 day ago" },
  { id: "4", action: "Training event scheduled", user: "admin@school.edu", target: "Technology Integration Seminar", time: "2 days ago" },
];

const adminModules = [
  {
    title: "User Management",
    description: "Manage users, roles, and permissions across the platform",
    icon: Users,
    path: "/admin/users",
    stats: "248 active users",
  },
  {
    title: "Form Templates",
    description: "Create and manage observation and goal-setting forms",
    icon: FileText,
    path: "/admin/forms",
    stats: "4 templates",
  },
  {
    title: "Course Catalogue",
    description: "Manage courses, prerequisites, and PD hour assignments",
    icon: Book,
    path: "/admin/courses",
    stats: "34 courses",
  },
  {
    title: "Training Calendar",
    description: "Schedule and manage training events across campuses",
    icon: Calendar,
    path: "/admin/calendar",
    stats: "12 events this month",
  },
  {
    title: "Reports & Analytics",
    description: "Generate cross-campus analytics and comparison reports",
    icon: Activity,
    path: "/admin/reports",
    stats: "Export to PDF/Excel",
  },
  {
    title: "Platform Settings",
    description: "Configure observation rules, workflows, and system settings",
    icon: Settings,
    path: "/admin/settings",
    stats: "System configuration",
  },
];



function DashboardOverview({ recentUsers, stats, role }: {
  recentUsers: DashboardUser[],
  role: string,
  stats: {
    users: { total: number, new: number },
    training: { total: number, thisMonth: number },
    forms: { active: number, total: number },
    courses: { total: number, new: number }
  }
}) {
  const { isModuleEnabled } = useAccessControl();
  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Manage platform settings, users, and content"
      />

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {isModuleEnabled('/admin/users', role) && (
            <StatCard
              title="Total Users"
              value={stats.users?.total?.toString() || "0"}
              subtitle={`+${stats.users?.new || 0} this month`}
              icon={Users}
              trend={{ value: stats.users?.new || 0, isPositive: true }}
            />
          )}
          {isModuleEnabled('/admin/forms', role) && (
            <StatCard
              title="Active Forms"
              value={stats.forms?.active?.toString() || "0"}
              subtitle="All systems active"
              icon={FileText}
            />
          )}
          {isModuleEnabled('/admin/courses', role) && (
            <StatCard
              title="Courses"
              value={stats.courses?.total?.toString() || "0"}
              subtitle={`${stats.courses?.new || 0} new downloadable`}
              icon={Book}
            />
          )}
          {isModuleEnabled('/admin/calendar', role) && (
            <StatCard
              title="Training Events"
              value={stats.training?.total?.toString() || "0"}
              subtitle={`${stats.training?.thisMonth || 0} this month`}
              icon={Calendar}
            />
          )}
        </div>
      )}

      {/* Live Data Feeds / Drill Downs */}
      <div className="mb-8 animate-in slide-in-from-bottom-5 duration-500 delay-100">
        <h2 className="text-xl font-semibold text-foreground mb-4">Pending Actions & Live Updates</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">

          {/* New Registrations Card */}
          {isModuleEnabled('/admin/users', role) && (
            <div className="dashboard-card p-4 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-sm text-foreground">New Registrations</h3>
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div className="space-y-3 flex-1 overflow-auto max-h-[200px] pr-1">
                {recentUsers.length > 0 ? (
                  recentUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer">
                      <div className="flex flex-col">
                        <span className="font-medium">{u.fullName}</span>
                        <span className="text-xs text-muted-foreground">{u.role}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4">No recent registrations</div>
                )}
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-3 text-xs" asChild>
                <Link to="/admin/users">Review All</Link>
              </Button>
            </div>
          )}

          {/* Pending Forms Card */}
          {isModuleEnabled('/admin/forms', role) && (
            <div className="dashboard-card p-4 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-sm text-foreground">Pending Form Reviews</h3>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600">2</span>
              </div>
              <div className="space-y-3 flex-1 overflow-auto max-h-[200px] pr-1">
                {[
                  { title: "Walkthrough: Gr 5 Math", author: "J. Doe", status: "Waiting" },
                  { title: "Self-Reflection Q3", author: "M. Smith", status: "Waiting" },
                  { title: "Peer Obsv: Science", author: "K. Williams", status: "Reviewed" },
                ].map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-sm p-2 rounded bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer">
                    <div className="flex flex-col truncate max-w-[120px]">
                      <span className="font-medium truncate">{f.title}</span>
                      <span className="text-xs text-muted-foreground">{f.author}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${f.status === 'Waiting' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{f.status}</span>
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-3 text-xs" asChild>
                <Link to="/admin/forms">Go to Approvals</Link>
              </Button>
            </div>
          )}

          {/* Recent Course Enrollments */}
          {isModuleEnabled('/admin/courses', role) && (
            <div className="dashboard-card p-4 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-sm text-foreground">Recent Enrollments</h3>
                <Book className="w-4 h-4 text-primary" />
              </div>
              <div className="space-y-3 flex-1 overflow-auto max-h-[200px] pr-1">
                {[
                  { user: "Teacher One", course: "Diff. Instruction", date: "Today" },
                  { user: "Teacher Two", course: "Tech Integration", date: "Yesterday" },
                  { user: "Teacher Three", course: "Diff. Instruction", date: "Yesterday" },
                ].map((e, i) => (
                  <div key={i} className="flex items-center justify-between text-sm p-2 rounded bg-muted/40 transition-colors">
                    <div className="flex flex-col truncate max-w-[140px]">
                      <span className="font-medium truncate">{e.user}</span>
                      <span className="text-xs text-muted-foreground truncate">{e.course}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{e.date}</span>
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-3 text-xs" asChild>
                <Link to="/admin/courses">View Catalogue</Link>
              </Button>
            </div>
          )}

          {/* Upcoming Event RSVPs */}
          {isModuleEnabled('/admin/calendar', role) && (
            <div className="dashboard-card p-4 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-sm text-foreground">Event RSVPs</h3>
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <div className="space-y-3 flex-1 overflow-auto max-h-[200px] pr-1">
                {[
                  { event: "Feb 15: Pedagogy Dept", user: "Alice M.", status: "Going" },
                  { event: "Feb 15: Pedagogy Dept", user: "John D.", status: "Going" },
                  { event: "Feb 18: Digital Safety", user: "Robert F.", status: "Maybe" },
                ].map((e, i) => (
                  <div key={i} className="flex items-center justify-between text-sm p-2 rounded bg-muted/40 transition-colors">
                    <div className="flex flex-col truncate max-w-[130px]">
                      <span className="font-medium truncate">{e.event}</span>
                      <span className="text-xs text-muted-foreground">{e.user}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${e.status === 'Going' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{e.status}</span>
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-3 text-xs" asChild>
                <Link to="/admin/calendar">Manage Calendar</Link>
              </Button>
            </div>
          )}

        </div>
      </div>

      {/* Admin Modules Grid */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">Platform Management</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminModules.filter(module => isModuleEnabled(module.path, role)).map((module) => (
            <Link
              key={module.title}
              to={module.path}
              className="dashboard-card p-6 hover:shadow-lg transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <module.icon className="w-6 h-6" />
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-2">{module.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{module.description}</p>
              <span className="text-xs text-primary font-medium">{module.stats}</span>
            </Link>
          ))}
        </div>
      </div >

      {/* Recent Activity & Audit Log Preview */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground">Recent Activity</h2>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/reports">View Audit Log</Link>
          </Button>
        </div>

        <div className="dashboard-card divide-y">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-foreground">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">{activity.target}</p>
                  <p className="text-xs text-muted-foreground mt-1">by {activity.user}</p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function AdminTeacherProfileView({ observations }: { observations: Observation[] }) {
  const { userId } = useParams();
  const navigate = useNavigate();

  // In a real app, this would fetch the user from a database
  // Here we'll mock it based on common names used in the app
  const teacher = {
    id: userId || "1",
    name: userId === "3" ? "Teacher Three" : userId === "2" ? "Teacher Two" : "Teacher One",
    role: "Teacher",
    observations: 8,
    lastObserved: "Jan 15",
    avgScore: 4.2,
    pdHours: 32,
    completionRate: 85
  };

  return (
    <div className="space-y-6">
      <TeacherProfileView
        teacher={teacher}
        observations={observations}
        goals={[]} // We can mock goals here too
        onBack={() => navigate("/admin/users")}
        userRole="admin"
      />
    </div>
  );
}
