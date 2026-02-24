import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import api from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/hooks/useAuth";
import { AssessmentManagementDashboard } from "@/components/assessments/AssessmentManagementDashboard";
import { useAccessControl } from "@/hooks/useAccessControl";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Users, Eye, TrendingUp, Calendar, FileText, Target, Plus, ChevronLeft, ChevronRight, Save, Star, Search, Filter, Mail, Phone, MapPin, Award, CheckCircle, Download, Printer, Share2, Rocket, Clock, CheckCircle2, Map, Users as Users2, History as HistoryIcon, MessageSquare, Book, Link as LinkIcon, Brain, Paperclip, Sparkles, ClipboardCheck, Tag, Edit, ClipboardList, Trash2, Lock, FileCheck } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Link, useNavigate, Routes, Route, useParams, useLocation } from "react-router-dom";



import { Observation } from "@/types/observation";
import { GoalSettingForm } from "@/components/GoalSettingForm";
import { TeacherAnalyticsReport } from "@/components/TeacherAnalyticsReport";
import { LeaderPerformanceAnalytics } from "@/components/LeaderPerformanceAnalytics";
import { AIAnalysisModal } from "@/components/AIAnalysisModal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { DynamicForm } from "@/components/DynamicForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UnifiedObservationForm } from "@/components/UnifiedObservationForm";
import { TeacherProfileView } from "@/components/TeacherProfileView";
import { moocService } from "@/services/moocService";
import { courseService } from "@/services/courseService";
import { trainingService } from "@/services/trainingService";
import { userService } from "@/services/userService";
import { MeetingsDashboard } from './MeetingsDashboard';
import { CreateMeetingForm } from './CreateMeetingForm';
import { MeetingMoMForm } from './MeetingMoMForm';


// Mock data removed in favor of API calls



import AttendanceRegister from "@/pages/AttendanceRegister";
import EventAttendanceView from "@/pages/EventAttendanceView";

export default function LeaderDashboard() {
  const { user } = useAuth();
  if (!user) return null;

  const userName = user.fullName;
  const role = user.role;

  console.log("LeaderDashboard: Mounting...", { user, role, userName });

  const [team, setTeam] = useState<any[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [training, setTraining] = useState<any[]>([]);

  // Computed Stats
  const domainAverages = useMemo(() => {
    const domains = ["Pedagogy", "Technology", "Assessment", "Curriculum"];
    return domains.map(domainName => {
      const domainObs = observations.filter(o => o.domain === domainName);
      const avg = domainObs.length > 0
        ? Number((domainObs.reduce((acc, o) => acc + (o.score || 0), 0) / domainObs.length).toFixed(1))
        : 0;
      return {
        domain: domainName,
        average: avg,
        count: domainObs.length
      };
    });
  }, [observations]);

  const systemAvgScore = useMemo(() => {
    if (observations.length === 0) return "0.0";
    const total = observations.reduce((acc, o) => acc + (o.score || 0), 0);
    return (total / observations.length).toFixed(1);
  }, [observations]);


  console.log("LeaderDashboard: State initialized", { teamLength: team.length, observationsLength: observations.length });

  const fetchObservations = async () => {
    try {
      const response = await api.get('/observations');
      console.log("LeaderDashboard: fetchObservations response", response.data);
      if (response.data?.status === 'success') {
        const apiObservations = (response.data?.data?.observations || []).map((obs: any) => {
          // Parse detailedReflection if it's a string
          let parsedReflection = obs.detailedReflection;
          if (typeof obs.detailedReflection === 'string') {
            try {
              parsedReflection = JSON.parse(obs.detailedReflection);
            } catch (e) {
              console.warn("Failed to parse detailedReflection for obs", obs.id);
            }
          }

          return {
            ...obs,
            // Ensure teacher is a string name for display
            teacher: obs.teacher?.fullName || obs.teacherEmail || 'Unknown Teacher',
            // Flatten classroom fields if they are at root
            classroom: obs.classroom || {
              block: obs.block,
              grade: obs.grade,
              section: obs.section,
              learningArea: obs.learningArea
            },
            // Ensure detailedReflection is an object
            detailedReflection: parsedReflection || {},
            // Map legacy fields if they are in detailedReflection
            strengths: obs.strengths || parsedReflection?.strengths || "",
            improvements: obs.improvements || parsedReflection?.improvements || "",
            teachingStrategies: obs.teachingStrategies || parsedReflection?.teachingStrategies || [],
            // Ensure date is formatted
            date: obs.date ? new Date(obs.date).toLocaleDateString() : 'N/A'
          };
        });

        if (apiObservations.length > 0) {
          setObservations(apiObservations);
        } else {
          setObservations([]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch observations:", error);
      setObservations([]);
    }
  };

  const fetchGoals = async () => {
    try {
      const response = await api.get('/goals');
      if (response.data?.status === 'success') {
        const apiGoals = response.data?.data?.goals || [];
        if (apiGoals.length > 0) {
          setGoals(apiGoals);
        }
      }
    } catch (error) {
      console.error("Failed to fetch goals:", error);
    }
  };

  const fetchTraining = async () => {
    try {
      const events = await trainingService.getAllEvents();
      if (events && events.length > 0) {
        setTraining(events);
      }
    } catch (error) {
      console.error("Failed to fetch training events:", error);
    }
  };

  // Raw Data States
  const [teachers, setTeachers] = useState<any[]>([]);
  const [moocSubmissions, setMoocSubmissions] = useState<any[]>([]);

  // Fetch Raw Teachers
  const fetchTeachers = async () => {
    try {
      const apiTeachers = await userService.getTeachers();
      if (apiTeachers) {
        setTeachers(apiTeachers);
      }
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
    }
  };

  // Fetch Raw MOOC Submissions
  const fetchMoocSubmissions = async () => {
    try {
      const allMoocs = await moocService.getAllSubmissions();
      if (allMoocs) {
        setMoocSubmissions(allMoocs);
      }
    } catch (error) {
      console.error("Failed to fetch MOOC submissions:", error);
    }
  };

  // Derive Team Stats Dynamically
  useEffect(() => {
    if (teachers.length === 0) return;

    const mappedTeam = teachers.map(teacher => {
      // 1. Calculate Observation Stats from Real-time State
      const teacherObs = observations.filter(o =>
        o.teacherId === teacher.id ||
        (o.teacher && o.teacher.email === teacher.email)
      );

      const obsCount = teacherObs.length;

      const lastObsDate = teacherObs.length > 0
        ? new Date(Math.max(...teacherObs.map(o => new Date(o.date).getTime()))).toLocaleDateString()
        : 'N/A';

      const avgScore = teacherObs.length > 0
        ? (teacherObs.reduce((acc, o) => acc + (o.score || 0), 0) / teacherObs.length).toFixed(1)
        : "0";

      // 2. Calculate PD Stats
      const teacherSubmissions = moocSubmissions.filter((s: any) =>
        (s.userId === teacher.id || s.email === teacher.email || s.teacherEmail === teacher.email) && s.status === 'APPROVED'
      );

      const pdHours = teacherSubmissions.reduce((acc: number, s: any) => acc + Number(s.hours || 0), 0);
      const completionRate = Math.min(100, Math.round((pdHours / 20) * 100));

      return {
        id: teacher.id,
        name: teacher.fullName,
        email: teacher.email,
        role: teacher.role || 'Teacher',
        observations: obsCount,
        lastObserved: lastObsDate,
        avgScore: Number(avgScore),
        pdHours: pdHours,
        completionRate: completionRate
      };
    });

    console.log("LeaderDashboard: Recalculated Team Stats", mappedTeam);
    setTeam(mappedTeam);

  }, [teachers, observations, moocSubmissions]);

  // Fetch initial data via API
  useEffect(() => {
    fetchObservations();
    fetchGoals();
    fetchTraining();
    fetchTeachers();
    fetchMoocSubmissions();

    // Socket.io Real-time Sync
    const socket = getSocket();

    // Join room for leaders to get MOOC submissions
    socket.emit('join_room', 'leaders');
    socket.on('observation:created', (newObs: any) => {
      // Map incoming observation to match UI structure
      let parsedReflection = newObs.detailedReflection;
      if (typeof newObs.detailedReflection === 'string') {
        try {
          parsedReflection = JSON.parse(newObs.detailedReflection);
        } catch (e) { }
      }

      const mappedObs = {
        ...newObs,
        teacher: newObs.teacher?.fullName || newObs.teacherEmail || 'Unknown Teacher',
        detailedReflection: parsedReflection || {},
        strengths: newObs.strengths || parsedReflection?.strengths || "",
        improvements: newObs.improvements || parsedReflection?.improvements || "",
        teachingStrategies: newObs.teachingStrategies || parsedReflection?.teachingStrategies || [],
        date: newObs.date ? new Date(newObs.date).toLocaleDateString() : 'N/A'
      };

      setObservations(prev => [mappedObs, ...prev]);
      toast.info(`New observation received for ${mappedObs.teacher}`);
    });

    socket.on('observation:updated', (updatedObs: any) => {
      // Map teacher if it's an object to maintain UI consistency
      let parsedReflection = updatedObs.detailedReflection;
      if (typeof updatedObs.detailedReflection === 'string') {
        try {
          parsedReflection = JSON.parse(updatedObs.detailedReflection);
        } catch (e) { }
      }

      const mappedObs = {
        ...updatedObs,
        teacher: (updatedObs.teacher as any)?.fullName || updatedObs.teacher || updatedObs.teacherEmail || 'Unknown Teacher',
        detailedReflection: parsedReflection || {},
        strengths: updatedObs.strengths || parsedReflection?.strengths || "",
        improvements: updatedObs.improvements || parsedReflection?.improvements || "",
        teachingStrategies: updatedObs.teachingStrategies || parsedReflection?.teachingStrategies || [],
        date: updatedObs.date ? new Date(updatedObs.date).toLocaleDateString() : 'N/A'
      };

      setObservations(prev => prev.map(obs => obs.id === mappedObs.id ? mappedObs : obs));
      toast.info(`Observation updated for ${mappedObs.teacher}`);
    });

    socket.on('mooc:created', (newSub: any) => {
      toast.info(`New MOOC submission received from ${newSub.user?.fullName || 'a teacher'}`);
      // If we are on MOOC view, it will be refreshed by the child component if we pass a refresh trigger,
      // but here we just need to know we might need to refresh team data if we want PD hours to be instant.
      // Actually, PD hours only change on APPROVAL, so mooc:created just needs to notify.
    });

    socket.on('mooc:updated', (updatedSub: any) => {
      // If a MOOC is approved/rejected, we definitely need to refresh team data to update PD hours
      fetchMoocSubmissions();
      if (updatedSub.status === 'APPROVED') {
        toast.success(`MOOC for ${updatedSub.user?.fullName} has been approved.`);
      }
    });

    socket.on('attendance:submitted', (data: any) => {
      toast.info(`New attendance submission from ${data.attendance.teacherName}`);
      window.dispatchEvent(new CustomEvent('attendance-updated', { detail: data }));
    });

    return () => {
      socket.off('observation:created');
      socket.off('observation:updated');
      socket.off('mooc:created');
      socket.off('mooc:updated');
      socket.off('attendance:submitted');
      socket.emit('leave_room', 'leaders');
    };
  }, []);


  useEffect(() => {
    window.dispatchEvent(new Event('local-goals-update'));
  }, [goals]);



  console.log("LeaderDashboard: Rendering...", { role, userName, collapsed: false }); // collapsed state is managed in layout but good to know we got here

  return (
    <DashboardLayout role={role.toLowerCase() as any} userName={userName}>
      <Routes>
        <Route index element={<DashboardOverview team={team} observations={observations} userName={userName} systemAvgScore={systemAvgScore} domainAverages={domainAverages} role={role} />} />
        <Route path="team" element={<TeamManagementView team={team} observations={observations} goals={goals} systemAvgScore={systemAvgScore} />} />
        <Route path="team/:teacherId" element={<TeacherDetailsView team={team} observations={observations} goals={goals} />} />
        <Route path="observations" element={<ObservationsManagementView observations={observations} systemAvgScore={systemAvgScore} />} />
        <Route path="observations/:obsId" element={<ObservationReportView observations={observations} team={team} />} />
        <Route path="observe" element={<ObserveView setObservations={setObservations} setTeam={setTeam} team={team} observations={observations} />} />
        <Route path="goals" element={<TeacherGoalsView goals={goals} />} />
        <Route path="goals/assign" element={<AssignGoalView setGoals={setGoals} team={team} />} />
        <Route path="performance" element={<LeaderPerformanceAnalytics team={team} observations={observations} />} />
        <Route path="calendar" element={<PDCalendarView training={training} setTraining={setTraining} />} />
        <Route path="calendar/propose" element={<ProposeCourseView setTraining={setTraining} />} />
        <Route path="calendar/responses" element={<MoocResponsesView refreshTeam={fetchTeachers} />} />
        <Route path="calendar/events/:eventId" element={<PlaceholderView title="PD Event Details" icon={Book} />} />
        <Route path="attendance" element={<AttendanceRegister />} />
        <Route path="attendance/:id" element={<EventAttendanceView />} />
        <Route path="participation" element={<PDParticipationView team={team} />} />
        <Route path="reports" element={<ReportsView team={team} observations={observations} />} />
        <Route path="users" element={<UserManagementView />} />
        <Route path="forms" element={<FormTemplatesView />} />
        <Route path="courses/*" element={<LeaderCoursesModule />} />
        <Route path="documents" element={<AdminDocumentManagement />} />
        <Route path="survey" element={<SurveyPage />} />
        <Route path="settings" element={<SystemSettingsView />} />
      </Routes>
    </DashboardLayout>
  );
}

function LeaderCoursesModule() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentTab = location.pathname.includes('/assessments') ? 'assessments' : 'catalogue';

  return (
    <div className="space-y-6">
      <PageHeader
        title="School Leader: Courses & Assessments"
        subtitle="Review curriculum and manage teacher evaluations"
      />

      <Tabs value={currentTab} onValueChange={(val) => navigate(val === 'catalogue' ? '/leader/courses' : '/leader/courses/assessments')}>
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="catalogue" className="gap-2">
            <Book className="w-4 h-4" />
            Course Catalogue
          </TabsTrigger>
          <TabsTrigger value="assessments" className="gap-2">
            <FileCheck className="w-4 h-4" />
            Assessment Templates
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <Routes>
            <Route index element={<CourseManagementView hideHeader />} />
            <Route path="assessments" element={<AssessmentManagementDashboard hideHeader />} />
          </Routes>
        </div>
      </Tabs>
    </div>
  );
}

function DashboardOverview({
  team,
  observations,
  userName,
  systemAvgScore,
  domainAverages,
  role
}: {
  team: any[],
  observations: Observation[],
  userName: string,
  systemAvgScore: string,
  domainAverages: any[],
  role: string
}) {
  const navigate = useNavigate();
  const { isModuleEnabled } = useAccessControl();

  return (
    <>
      <PageHeader
        title={`Welcome, ${userName.split(' ')[0]}!`}
        subtitle="Track team performance and professional development"
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {isModuleEnabled('/leader/team', role) && (
          <StatCard
            title="Team Members"
            value={team.length}
            subtitle="Direct reports"
            icon={Users}
            onClick={() => navigate("/leader/team")}
          />
        )}
        {isModuleEnabled('/leader/observations', role) && (
          <StatCard
            title="Observations This Month"
            value={observations.length}
            subtitle="Goal: 24"
            icon={Eye}
            trend={{ value: 15, isPositive: true }}
            onClick={() => navigate("/leader/observations")}
          />
        )}
        {isModuleEnabled('/leader/performance', role) && (
          <StatCard
            title="Average Score"
            value={systemAvgScore}
            subtitle="System wide"
            icon={TrendingUp}
            onClick={() => navigate("/leader/performance")}
          />
        )}
        {isModuleEnabled('/leader/hours', role) && (
          <StatCard
            title="PD Participation"
            value={`${team.length > 0 ? Math.round(team.reduce((acc, m) => acc + (m.pdHours || 0), 0) / team.length) : 0}h`}
            subtitle="Avg hours per staff"
            icon={Clock}
            onClick={() => navigate("/leader/participation")}
          />
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Team Overview */}
        {isModuleEnabled('/leader/team', role) && (
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-foreground">Team Overview</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/leader/team")}>
                View All
              </Button>
            </div>

            <div className="dashboard-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Teacher</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Observations</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Last Observed</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Avg Score</th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.map((member) => (
                      <tr key={member.id} className="border-t hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-foreground">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.role}</p>
                          </div>
                        </td>
                        <td className="p-4 text-foreground">{member.observations}</td>
                        <td className="p-4 text-muted-foreground">{member.lastObserved}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-success/10 text-success font-bold text-sm">
                            {member.avgScore}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="outline" size="sm" onClick={() => navigate("/leader/observe")}>
                            <Eye className="w-4 h-4 mr-2" />
                            Observe
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Domain Performance */}
        {isModuleEnabled('/leader/observations', role) && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-foreground">Domain Performance</h2>
              </div>
            </div>

            <div className="dashboard-card p-5 space-y-5">
              {domainAverages.map((domain) => (
                <div key={domain.domain}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{domain.domain}</span>
                    <span className="text-sm text-muted-foreground">{domain.average}/5</span>
                  </div>
                  <Progress value={domain.average * 20} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{domain.count} observations</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Observations */}
      {isModuleEnabled('/leader/observations', role) && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-foreground">Recent Observations</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/leader/team")}>
              View All
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {observations.map((obs) => (
              <div
                key={obs.id}
                className="dashboard-card p-5 cursor-pointer hover:shadow-md transition-all hover:border-primary/20 group"
                onClick={() => navigate(`/leader/observations/${obs.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm text-muted-foreground">{obs.date}</span>
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-success/10 text-success font-bold text-sm">
                    {obs.score}
                  </span>
                </div>
                <p className="font-medium text-foreground mb-1 group-hover:text-primary transition-colors">{obs.teacher}</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {obs.domain}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {isModuleEnabled('/teacher/goals', role) && (
          <Button variant="outline" className="h-auto p-6 flex flex-col items-start gap-2" onClick={() => navigate("/leader/goals")}>
            <Target className="w-6 h-6 text-primary" />
            <div className="text-left">
              <p className="font-medium">Teacher Goals</p>
              <p className="text-sm text-muted-foreground">Manage development goals</p>
            </div>
          </Button>
        )}

        {isModuleEnabled('/leader/calendar', role) && (
          <Button variant="outline" className="h-auto p-6 flex flex-col items-start gap-2" onClick={() => navigate("/leader/calendar")}>
            <Calendar className="w-6 h-6 text-primary" />
            <div className="text-left">
              <p className="font-medium">Manage Calendar</p>
              <p className="text-sm text-muted-foreground">Schedule training events</p>
            </div>
          </Button>
        )}

        {isModuleEnabled('/admin/reports', role) && (
          <Button variant="outline" className="h-auto p-6 flex flex-col items-start gap-2" onClick={() => navigate("/leader/reports")}>
            <FileText className="w-6 h-6 text-primary" />
            <div className="text-left">
              <p className="font-medium">Export Reports</p>
              <p className="text-sm text-muted-foreground">Generate data exports</p>
            </div>
          </Button>
        )}
      </div>
    </>
  );
}

function TeamManagementView({ team, observations, goals, systemAvgScore }: { team: any[], observations: Observation[], goals: any[], systemAvgScore: string }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTeam = team.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/leader")}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <PageHeader
            title="Team Management"
            subtitle="Oversee teacher performance and professional growth"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search teachers..."
              className="pl-10 w-[250px] bg-background/50 border-muted-foreground/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Staff"
          value={team.length}
          subtitle="Active educators"
          icon={Users}
          onClick={() => navigate("/leader/team")}
        />
        <StatCard
          title="Observations"
          value={observations.length}
          subtitle="This quarter"
          icon={Eye}
          onClick={() => navigate("/leader/observations")}
        />
        <StatCard
          title="Avg Performance"
          value={systemAvgScore}
          subtitle="Across all domains"
          icon={TrendingUp}
          onClick={() => navigate("/leader/performance")}
        />
        <StatCard
          title="Active Goals"
          value={goals.filter(g => g.status !== 'COMPLETED').length}
          subtitle="Pending completion"
          icon={Target}
          onClick={() => navigate("/leader/goals")}
        />
      </div>

      <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle>Teacher Registry</CardTitle>
          <CardDescription>Comprehensive list of teaching staff and their current standing.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/30 border-b">
                  <th className="text-left p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Teacher Profile</th>
                  <th className="text-left p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Specialization</th>
                  <th className="text-left p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Observation Cycle</th>
                  <th className="text-left p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Score</th>
                  <th className="text-right p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted-foreground/10">
                {filteredTeam.map((member) => (
                  <tr key={member.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/20 shadow-inner">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-foreground group-hover:text-primary transition-colors">{member.name}</p>
                          <p className="text-sm text-muted-foreground">Staff ID: #EDU-{member.id.substring(0, 8).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-muted text-muted-foreground border border-muted-foreground/10">
                        {member.role}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="text-primary">{Math.round((member.observations / 10) * 100)}%</span>
                        </div>
                        <Progress value={(member.observations / 10) * 100} className="h-1.5 w-32" />
                        <p className="text-xs text-muted-foreground mt-1">Last: <span className="font-bold text-foreground">{member.lastObserved}</span></p>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold border shadow-sm",
                          member.avgScore >= 4 ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"
                        )}>
                          <span className="text-lg">{member.avgScore}</span>
                          <span className="text-[10px] uppercase opacity-60">Avg</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" className="h-10 px-4 gap-2 hover:bg-primary/10 hover:text-primary" onClick={() => navigate(`/leader/team/${member.id}`)}>
                          <Eye className="w-4 h-4" />
                          View Details
                        </Button>
                        <Button variant="outline" size="sm" className="h-10 px-4 gap-2 border-primary/20 hover:bg-primary hover:text-primary-foreground shadow-sm" onClick={() => navigate("/leader/observe")}>
                          <Plus className="w-4 h-4" />
                          Observe
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTeam.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-20 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4 grayscale opacity-40">
                        <Users className="w-16 h-16" />
                        <div className="space-y-1">
                          <p className="text-xl font-bold">No teachers found</p>
                          <p className="text-muted-foreground">Try adjusting your search query</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TeacherDetailsView({ team, observations, goals }: { team: any[], observations: Observation[], goals: any[] }) {
  const { teacherId } = useParams();
  const navigate = useNavigate();
  const teacher = team.find(t => t.id === teacherId);

  if (!teacher) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <Users className="w-16 h-16 text-muted-foreground mb-4 opacity-20" />
        <h2 className="text-2xl font-bold">Teacher not found</h2>
        <Button onClick={() => navigate("/leader/team")} className="mt-4">Back to Team Registry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TeacherProfileView
        teacher={teacher}
        observations={observations}
        goals={goals}
        onBack={() => navigate("/leader/team")}
        userRole="leader"
      />
    </div>
  );
}

function PDParticipationView({ team }: { team: any[] }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Exclude Super Admin from PD Participation tracking
  const pdTeam = team.filter(m => m.role !== "Super Admin");

  const filteredTeam = pdTeam.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || m.role === roleFilter;
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "Certified" && m.completionRate >= 90) ||
      (statusFilter === "In Progress" && m.completionRate < 90);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const uniqueRoles = Array.from(new Set(pdTeam.map(m => m.role)));

  const totalHours = pdTeam.reduce((acc, m) => acc + m.pdHours, 0);
  const avgCompletion = pdTeam.length > 0
    ? Math.round(pdTeam.reduce((acc, m) => acc + m.completionRate, 0) / pdTeam.length)
    : 0;

  const activeFiltersCount = (roleFilter !== "all" ? 1 : 0) + (statusFilter !== "all" ? 1 : 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="PD Participation Tracking"
        subtitle="Monitor professional development hours and compliance"
        actions={
          <Button onClick={() => navigate("/leader/calendar")}>
            <Calendar className="mr-2 w-4 h-4" />
            Manage Training
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total PD Hours"
          value={totalHours}
          subtitle="Accrued across all staff"
          icon={Clock}
        />
        <StatCard
          title="Avg. Completion"
          value={`${avgCompletion}%`}
          subtitle="Mandatory training"
          icon={CheckCircle2}
        />
        <StatCard
          title="Active Learners"
          value={pdTeam.filter(m => m.pdHours > 20).length}
          subtitle="Staff > 20 hours"
          icon={Award}
        />
      </div>

      <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm">
        <CardHeader className="border-b bg-muted/20 pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Staff PD Registry</CardTitle>
              <CardDescription>Track individual professional development progress and hours.</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search staff..."
                  className="pl-10 w-[250px] bg-background border-muted-foreground/20 rounded-xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={activeFiltersCount > 0 ? "default" : "outline"}
                    size="icon"
                    className="rounded-xl relative"
                  >
                    <Filter className="w-4 h-4" />
                    {activeFiltersCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-6 rounded-2xl shadow-2xl border-primary/10" align="end">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-foreground">Filters</h4>
                      {(roleFilter !== "all" || statusFilter !== "all") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setRoleFilter("all");
                            setStatusFilter("all");
                          }}
                          className="h-8 text-xs text-primary font-bold hover:bg-primary/5"
                        >
                          Reset All
                        </Button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Staff Role</Label>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                          <SelectTrigger className="rounded-xl bg-muted/30 border-none">
                            <SelectValue placeholder="All Roles" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-primary/10">
                            <SelectItem value="all">All Roles</SelectItem>
                            {uniqueRoles.map(role => (
                              <SelectItem key={role} value={role}>{role}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="rounded-xl bg-muted/30 border-none">
                            <SelectValue placeholder="All Statuses" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-primary/10">
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="Certified">Certified (≥90%)</SelectItem>
                            <SelectItem value="In Progress">In Progress (&lt;90%)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/30 border-b">
                  <th className="text-left p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Teacher</th>
                  <th className="text-left p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Role</th>
                  <th className="text-left p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">PD Hours</th>
                  <th className="text-left p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground w-1/4">Progress</th>
                  <th className="text-right p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted-foreground/10">
                {filteredTeam.map((member) => (
                  <tr key={member.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="p-6">
                      <p className="font-bold text-foreground">{member.name}</p>
                    </td>
                    <td className="p-6">
                      <p className="text-sm font-medium text-muted-foreground">{member.role}</p>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {member.pdHours}
                        </div>
                        <span className="text-xs font-bold uppercase text-muted-foreground">Hours</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span>{member.completionRate}%</span>
                          <span className={cn(
                            member.completionRate >= 90 ? "text-success" : member.completionRate >= 60 ? "text-primary" : "text-warning"
                          )}>
                            {member.completionRate >= 90 ? "Certified" : "In Progress"}
                          </span>
                        </div>
                        <Progress value={member.completionRate} className="h-2" />
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 px-4 gap-2 hover:bg-primary/10 hover:text-primary"
                        onClick={() => navigate(`/leader/team/${member.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PDCalendarView({ training, setTraining }: { training: any[], setTraining: React.Dispatch<React.SetStateAction<any[]>> }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 1, 15)); // Default to Feb 15, 2026

  // Edit & Creation State
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isRegistrantsOpen, setIsRegistrantsOpen] = useState(false);
  const [selectedRegistrants, setSelectedRegistrants] = useState<any[]>([]);
  const [newEvent, setNewEvent] = useState({
    title: "",
    type: "Pedagogy",
    date: new Date(2026, 1, 15),
    time: "09:00 AM",
    location: "",
    capacity: 30,
    description: "",
    objectives: ""
  });

  // Helper to parse "MMM d, yyyy" string to Date object
  const parseEventDate = (dateStr: string) => {
    try {
      // Handle both "MMM d, yyyy" and potential legacy "MMM d"
      const parts = dateStr.includes(',') ? dateStr : `${dateStr}, 2026`;
      return new Date(parts);
    } catch (e) {
      return new Date();
    }
  };

  // Helper to format Date object to "MMM d, yyyy" string
  const formatDateStr = (d: Date) => {
    return format(d, "MMM d, yyyy");
  };

  const safeTraining = Array.isArray(training) ? training.filter(e => e && typeof e.title === 'string') : [];

  const filteredEvents = safeTraining.filter((e) => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.topic || e.type || "").toLowerCase().includes(searchQuery.toLowerCase());

    let matchesDate = true;
    if (date) {
      matchesDate = e.date === formatDateStr(date);
    }

    return matchesSearch && matchesDate;
  });

  // Get dates that have events for highlighting
  const eventDates = safeTraining.map(e => parseEventDate(e.date));

  const handleToggleAttendance = async (eventId: string, action: 'enable' | 'close') => {
    try {
      const updatedEvent = await trainingService.toggleAttendance(eventId, action);
      setTraining(prev => prev.map(ev => ev.id === eventId ? { ...ev, ...updatedEvent } : ev));
      if (editingEvent && editingEvent.id === eventId) {
        setEditingEvent({ ...editingEvent, ...updatedEvent });
      }
      toast.success(`Attendance ${action === 'enable' ? 'enabled' : 'closed'} successfully`);
    } catch (error) {
      console.error(`Failed to ${action} attendance:`, error);
      toast.error(`Failed to ${action} attendance`);
    }
  };

  const handleScheduleEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      const eventData = {
        title: newEvent.title,
        type: newEvent.type,
        topic: newEvent.type,
        date: formatDateStr(newEvent.date),
        time: newEvent.time,
        location: newEvent.location,
        capacity: newEvent.capacity,
        description: newEvent.description,
        objectives: newEvent.objectives,
        status: "Approved"
      };

      const response = await trainingService.createEvent(eventData);
      setTraining(prev => [...prev, response]);
      setIsScheduleOpen(false);
      setNewEvent({
        title: "",
        type: "Pedagogy",
        date: new Date(2026, 1, 15),
        time: "09:00 AM",
        location: "",
        capacity: 30,
        description: "",
        objectives: ""
      });
      toast.success("Event scheduled successfully");
    } catch (error) {
      console.error("Error scheduling event:", error);
      toast.error("Failed to schedule event.");
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    try {
      const updatedData = {
        ...editingEvent,
        date: typeof editingEvent.date === 'string' ? editingEvent.date : formatDateStr(editingEvent.date),
        topic: editingEvent.type || editingEvent.topic
      };

      const savedEvent = await trainingService.updateEvent(editingEvent.id, updatedData);
      setTraining(prev => prev.map(ev => ev.id === editingEvent.id ? savedEvent : ev));
      setIsEditOpen(false);
      setEditingEvent(null);
      toast.success("Event details updated successfully");
    } catch (error) {
      console.error("Failed to update event:", error);
      toast.error("Failed to update event.");
    }
  };

  const handleDeleteEvent = async () => {
    if (!editingEvent) return;
    try {
      await trainingService.deleteEvent(editingEvent.id);
      setTraining(prev => prev.filter(t => t.id !== editingEvent.id));
      setIsDeleteOpen(false);
      setIsEditOpen(false);
      setEditingEvent(null);
      toast.success("Event deleted successfully");
    } catch (error) {
      console.error("Failed to delete event:", error);
      toast.error("Failed to delete event.");
    }
  };



  const handleViewRegistrants = (event: any) => {
    setSelectedRegistrants(event.registrants || []);
    setEditingEvent(event);
    setIsRegistrantsOpen(true);
    setIsEditOpen(false);
  };

  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
    setIsEditOpen(true);
  };

  const handleRegister = async (eventId: string) => {
    try {
      await trainingService.registerForEvent(eventId);

      setTraining(prev => prev.map(event => {
        if (event.id === eventId) {
          toast.success(`Successfully registered for ${event.title}`);
          return {
            ...event,
            isRegistered: true,
            registered: (event.registered || 0) + 1,
            spotsLeft: (event.spotsLeft || 1) - 1,
          };
        }
        return event;
      }));
    } catch (error) {
      console.error("Failed to register:", error);
      toast.error("Failed to register for the event.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Training & PD Calendar"
        subtitle="Schedule and manage professional development sessions"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/leader/calendar/responses")}>
              <FileText className="mr-2 w-4 h-4" />
              Course Evidence Responses
            </Button>
            <Button variant="outline" onClick={() => setIsScheduleOpen(true)}>
              <Plus className="mr-2 w-4 h-4" />
              Schedule Event
            </Button>
            <Button onClick={() => navigate("/leader/calendar/propose")}>
              <Plus className="mr-2 w-4 h-4" />
              Propose New Course
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Upcoming Sessions"
          value={training.length}
          subtitle="Scheduled this month"
          icon={Calendar}
        />
        <StatCard
          title="Total Registrations"
          value={training.reduce((acc, e) => acc + (e.registrants?.length || 0), 0)}
          subtitle="Staff enrolled"
          icon={Users2}
        />
        <StatCard
          title="Capacity Util."
          value={`${training.reduce((acc, e) => acc + (e.capacity || 0), 0) > 0 ? Math.round((training.reduce((acc, e) => acc + (e.registrants?.length || 0), 0) / training.reduce((acc, e) => acc + (e.capacity || 0), 0)) * 100) : 0}%`}
          subtitle="Seat occupancy"
          icon={Rocket}
        />
      </div>

      <div className="space-y-8">
        {/* Calendar Widget */}
        <div className="w-full space-y-6">
          <Card className="border-none shadow-2xl bg-zinc-950 text-white overflow-hidden relative">
            {/* decorative gradient blob */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl translate-y-10 -translate-x-10 pointer-events-none" />

            <CardContent className="p-6 md:p-10 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* Left side: Header and Calendar */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="text-left w-full">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 bg-clip-text text-transparent">
                      Activity Summary
                    </h3>
                    <p className="text-zinc-400 text-xs uppercase tracking-wider font-medium">
                      {formatDateStr(new Date())}
                    </p>
                  </div>

                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-2xl border-none bg-zinc-900/50 p-6 w-full"
                    classNames={{
                      months: "flex flex-col space-y-4",
                      month: "space-y-4 w-full",
                      caption: "flex justify-center pt-1 relative items-center mb-6",
                      caption_label: "text-base font-bold text-white",
                      nav: "space-x-1 flex items-center",
                      nav_button: "h-8 w-8 bg-transparent p-0 text-zinc-400 hover:text-white border-zinc-700 hover:bg-zinc-800",
                      nav_button_previous: "absolute left-2",
                      nav_button_next: "absolute right-2",
                      table: "w-full border-collapse",
                      head_row: "flex w-full mt-2",
                      head_cell: "text-zinc-400 rounded-md w-10 font-bold text-[0.85rem] uppercase tracking-wider flex items-center justify-center",
                      row: "flex w-full mt-3",
                      cell: "h-10 w-10 text-center text-base p-0 relative [&:has([aria-selected])]:bg-zinc-800 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                      day: "h-10 w-10 p-0 font-semibold aria-selected:opacity-100 text-white hover:bg-zinc-800 rounded-full transition-all flex items-center justify-center",
                      day_selected: "bg-gradient-to-br from-pink-500 to-red-600 text-white hover:bg-red-600 focus:bg-red-600 shadow-lg shadow-red-500/30",
                      day_today: "bg-zinc-800 text-white font-black ring-2 ring-zinc-700",
                      day_outside: "text-zinc-500 opacity-40",
                    }}
                    modifiers={{
                      pedagogy: training.filter((e: any) => (e.topic || e.type) === "Pedagogy").map((e: any) => parseEventDate(e.date)),
                      technology: training.filter((e: any) => (e.topic || e.type) === "Technology").map((e: any) => parseEventDate(e.date)),
                      assessment: training.filter((e: any) => (e.topic || e.type) === "Assessment").map((e: any) => parseEventDate(e.date)),
                      other: training.filter((e: any) => !["Pedagogy", "Technology", "Assessment"].includes(e.topic || e.type)).map((e: any) => parseEventDate(e.date)),
                    }}
                    modifiersStyles={{
                      pedagogy: { border: '2px solid #3b82f6', color: 'white' }, // Blue
                      technology: { border: '2px solid #10b981', color: 'white' }, // Green
                      assessment: { border: '2px solid #f43f5e', color: 'white' }, // Red
                      other: { border: '2px solid #eab308', color: 'white' } // Yellow
                    }}
                  />
                </div>

                {/* Right side: Legend and Actions */}
                <div className="lg:col-span-5 h-full flex flex-col justify-center pt-10">
                  <div className="space-y-6">
                    <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4">Legend</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                        <span className="flex items-center gap-3 text-sm text-zinc-300">
                          <span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]"></span> Pedagogy
                        </span>
                        <span className="font-mono text-white text-sm bg-blue-500/20 px-2 py-0.5 rounded-md">
                          {training.filter((t: any) => (t.topic || t.type) === 'Pedagogy').length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                        <span className="flex items-center gap-3 text-sm text-zinc-300">
                          <span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]"></span> Technology
                        </span>
                        <span className="font-mono text-white text-sm bg-green-500/20 px-2 py-0.5 rounded-md">
                          {training.filter((t: any) => (t.topic || t.type) === 'Technology').length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
                        <span className="flex items-center gap-3 text-sm text-zinc-300">
                          <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]"></span> Assessment
                        </span>
                        <span className="font-mono text-white text-sm bg-rose-500/20 px-2 py-0.5 rounded-md">
                          {training.filter((t: any) => (t.topic || t.type) === 'Assessment').length}
                        </span>
                      </div>
                    </div>

                    <div className="pt-8">
                      <Button
                        variant="outline"
                        className="w-full py-6 bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all text-base rounded-xl"
                        onClick={() => setDate(undefined)}
                        disabled={!date}
                      >
                        Clear Selection Filter
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Event List */}
        <div className="w-full">
          <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm h-full">
            <CardHeader className="border-b bg-muted/20 pb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>
                    {date ? `Sessions for ${formatDateStr(date)}` : "All Upcoming Sessions"}
                  </CardTitle>
                  <CardDescription>
                    {filteredEvents.length} session{filteredEvents.length !== 1 && 's'} scheduled
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search sessions..."
                      className="pl-10 w-[200px] bg-background border-muted-foreground/20 rounded-xl"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                {filteredEvents.length > 0 ? (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/30 border-b">
                        <th className="text-left p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Session Title</th>
                        <th className="text-left p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Type</th>
                        <th className="text-left p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Time</th>
                        <th className="text-left p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Location</th>
                        <th className="text-left p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                        <th className="text-right p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted-foreground/10">
                      {filteredEvents.map((session) => (
                        <tr key={session.id} className="hover:bg-primary/5 transition-colors group">
                          <td className="p-6">
                            <p className="font-bold text-foreground">{session.title}</p>
                            {!date && <p className="text-xs text-muted-foreground mt-1">{session.date}</p>}
                          </td>
                          <td className="p-6">
                            <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-primary/10 text-primary uppercase tracking-wider">
                              {session.topic || session.type}
                            </span>
                          </td>
                          <td className="p-6">
                            <p className="text-sm font-bold text-foreground flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              {session.time}
                            </p>
                          </td>
                          <td className="p-6">
                            <p className="text-sm text-foreground flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-primary" />
                              {session.location}
                            </p>
                          </td>
                          <td className="p-6">
                            <span className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                              session.status === "Approved"
                                ? "bg-success/10 text-success border-success/20"
                                : "bg-warning/10 text-warning border-warning/20"
                            )}>
                              {session.status}
                            </span>
                          </td>
                          <td className="p-6 text-right">
                            {(session as any).isRegistered ? (
                              <div className="flex items-center justify-end gap-2 text-emerald-600 font-bold">
                                <CheckCircle2 className="w-4 h-4" />
                                Registered
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2 text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-9 px-4 rounded-xl border-primary/20 text-primary hover:bg-primary/5 font-bold flex items-center gap-2"
                                  onClick={() => handleViewRegistrants(session)}
                                >
                                  <Users2 className="w-4 h-4" />
                                  Registrants
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-9 px-4 rounded-xl border-primary/20 text-primary hover:bg-primary/5 font-bold flex items-center gap-2"
                                  onClick={() => handleEditEvent(session)}
                                >
                                  <Edit className="w-4 h-4" />
                                  Edit
                                </Button>
                                <Button
                                  className="h-10 px-6 rounded-xl bg-[#1e293b] hover:bg-[#0f172a] text-white shadow-lg shadow-slate-900/20 transition-all active:scale-[0.98] font-black uppercase tracking-tighter text-xs"
                                  onClick={() => handleRegister(session.id)}
                                >
                                  Register Now
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">No sessions scheduled for this date.</p>
                    <Button variant="link" onClick={() => setDate(undefined)} className="mt-2">
                      View all sessions
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Event Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => !open && setIsEditOpen(false)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Event Details</DialogTitle>
            <DialogDescription>Update the schedule or details for this professional development session.</DialogDescription>
          </DialogHeader>

          {editingEvent && (
            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Event Title</Label>
                <Input
                  id="edit-title"
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-type">Type</Label>
                  <Select
                    value={editingEvent.type || editingEvent.topic}
                    onValueChange={(val) => setEditingEvent({ ...editingEvent, type: val, topic: val })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pedagogy">Pedagogy</SelectItem>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Assessment">Assessment</SelectItem>
                      <SelectItem value="Culture">Culture</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editingEvent.status}
                    onValueChange={(val) => setEditingEvent({ ...editingEvent, status: val })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Date (MMM DD)</Label>
                  <Input
                    id="edit-date"
                    value={editingEvent.date}
                    onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-time">Time</Label>
                  <Input
                    id="edit-time"
                    value={editingEvent.time}
                    onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={editingEvent.location}
                  onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                />
              </div>


              {/* Attendance Control Section */}
              <div className="pt-4 border-t border-muted/20">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-muted/20">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold flex items-center gap-2">
                      <Users2 className="w-4 h-4 text-primary" />
                      Attendance Control
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Enable staff to mark their presence for this session.
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-tighter transition-colors",
                        (editingEvent.attendanceEnabled && !editingEvent.attendanceClosed) ? "text-primary" : "text-muted-foreground"
                      )}>
                        {(editingEvent.attendanceEnabled && !editingEvent.attendanceClosed) ? "Live" : "Disabled"}
                      </span>
                      <Switch
                        checked={editingEvent.attendanceEnabled && !editingEvent.attendanceClosed}
                        onCheckedChange={(checked) => handleToggleAttendance(editingEvent.id, checked ? 'enable' : 'close')}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <Button type="button" variant="destructive" size="sm" onClick={() => setIsDeleteOpen(true)}>
                  <Trash2 className="mr-2 w-4 h-4" />
                  Delete Event
                </Button>
                <div className="flex gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                  <Button type="submit">Save Changes</Button>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Event Dialog */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule Training Event</DialogTitle>
            <DialogDescription>Add a new session to the PD calendar for your campus.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleScheduleEvent} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="event-title">Event Title</Label>
              <Input
                id="event-title"
                placeholder="Workshop Name"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-type">Type</Label>
                <Select
                  value={newEvent.type}
                  onValueChange={(val) => setNewEvent({ ...newEvent, type: val })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pedagogy">Pedagogy</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Assessment">Assessment</SelectItem>
                    <SelectItem value="Culture">Culture</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newEvent.date && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {newEvent.date ? formatDateStr(newEvent.date) : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={newEvent.date}
                      onSelect={(d) => d && setNewEvent({ ...newEvent, date: d })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-time">Time</Label>
                <Input
                  id="event-time"
                  placeholder="09:00 AM"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-capacity">Capacity</Label>
                <Input
                  id="event-capacity"
                  type="number"
                  value={newEvent.capacity}
                  onChange={(e) => setNewEvent({ ...newEvent, capacity: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-location">Location</Label>
              <Input
                id="event-location"
                placeholder="Room/Lab Name"
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsScheduleOpen(false)}>Cancel</Button>
              <Button type="submit">Schedule Event</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive font-bold">Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{editingEvent?.title}</strong>? This action cannot be undone and will remove it from the calendar for all staff members.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteEvent}>Confirm Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Registrants Dialog */}
      <Dialog open={isRegistrantsOpen} onOpenChange={setIsRegistrantsOpen}>
        <DialogContent className="sm:max-w-[700px] rounded-[2rem] overflow-hidden border-none shadow-2xl p-0">
          <div className="bg-zinc-950 text-white p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-20 translate-x-20 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-primary to-info bg-clip-text text-transparent">
                Registered Participants
              </h2>
              <p className="text-zinc-400 font-medium text-sm mt-1 uppercase tracking-[0.2em]">
                {editingEvent?.title}
              </p>
            </div>
          </div>
          <div className="p-8 bg-background">
            <div className="rounded-2xl border border-muted/20 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/5">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-black uppercase tracking-widest text-[10px] py-4">Participant Name</TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px] py-4">Contact Detail</TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px] py-4 text-right">Registration Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedRegistrants.length > 0 ? (
                    selectedRegistrants.map((registrant) => (
                      <TableRow key={registrant.id} className="hover:bg-primary/5 transition-colors group">
                        <TableCell className="py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm group-hover:bg-primary group-hover:text-white transition-all">
                              {registrant.name.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                            <span className="font-bold text-foreground">{registrant.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-muted-foreground">{registrant.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-5 text-right font-medium text-muted-foreground">
                          {registrant.dateRegistered}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                          <div className="w-16 h-16 rounded-3xl bg-muted/50 flex items-center justify-center">
                            <Users2 className="w-8 h-8 opacity-20" />
                          </div>
                          <p className="font-bold italic">No registrations for this event yet.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-8 flex justify-end">
              <Button
                className="h-12 px-8 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase tracking-widest text-xs"
                onClick={() => setIsRegistrantsOpen(false)}
              >
                Close View
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
}

function ProposeCourseView({ setTraining }: { setTraining: React.Dispatch<React.SetStateAction<any[]>> }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    date: "",
    time: "",
    location: "",
    capacity: 20,
    description: "",
    objectives: ""
  });



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.type) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      await courseService.createCourse({
        title: formData.title,
        category: formData.type,
        hours: 2, // Default
        instructor: "School Leader",
        status: "PENDING_APPROVAL",
        description: `${formData.description}\n\nProposed Details:\nDate: ${formData.date}\nTime: ${formData.time}\nLocation: ${formData.location}\nCapacity: ${formData.capacity}`,
        isDownloadable: false
      });

      // Do NOT update local training state as per requirements
      // setTraining(prev => [...prev, newSession]); 

      toast.success("Course proposal submitted for admin approval!");
      navigate("/leader/calendar");
    } catch (error) {
      console.error("Failed to propose course:", error);
      toast.error("Failed to submit course proposal.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate("/leader/calendar")}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Propose New Course</h1>
          <p className="text-muted-foreground">Submit a professional development session for administrative approval</p>
        </div>
      </div>

      <Card className="border-none shadow-xl bg-card">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Session Details
          </CardTitle>
          <CardDescription>All proposals are reviewed within 48 hours.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Course Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g. Advanced Pedagogy"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Session Type *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["Pedagogy", "Technology", "Assessment", "Culture"].map(type => (
                    <div
                      key={type}
                      className={cn(
                        "cursor-pointer rounded-lg border p-2 text-center text-sm font-medium transition-all",
                        formData.type === type
                          ? "bg-primary text-primary-foreground border-primary"
                          : "hover:bg-muted"
                      )}
                      onClick={() => setFormData({ ...formData, type })}
                    >
                      {type}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })} // Note: In real app, format this to "MMM DD"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={e => setFormData({ ...formData, time: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Proposed Location</Label>
                <Input
                  id="location"
                  placeholder="e.g. Conference Room B"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Max Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Course Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the learning objectives and outcomes..."
                className="min-h-[100px]"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => navigate("/leader/calendar")}>
                Cancel
              </Button>
              <Button type="submit">
                Submit Proposal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportsView({ team, observations }: { team: any[], observations: Observation[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  // Filter State
  const [selectedRole, setSelectedRole] = useState("all");
  const [performanceFilter, setPerformanceFilter] = useState("all");

  const roles = Array.from(new Set(team.map(t => t.role)));

  const filteredTeam = team.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = selectedRole === "all" || t.role === selectedRole;

    const matchesPerformance = performanceFilter === "all" ||
      (performanceFilter === "high" && t.avgScore >= 4.0) ||
      (performanceFilter === "proficient" && t.avgScore >= 3.0 && t.avgScore < 4.0) ||
      (performanceFilter === "support" && (t.avgScore > 0 && t.avgScore < 3.0));

    return matchesSearch && matchesRole && matchesPerformance;
  });

  const handleEmailReport = (teacher: any) => {
    setSendingId(teacher.id);
    const email = `${teacher.name.toLowerCase().replace(' ', '.')}@school.edu`;

    // Simulate API call
    setTimeout(() => {
      setSendingId(null);
      toast.success(`Performance report has been emailed to ${email}`, {
        description: "The teacher will receive a PDF summary of their observations and PD progress."
      });
    }, 1500);
  };

  const resetFilters = () => {
    setSelectedRole("all");
    setPerformanceFilter("all");
    setSearchQuery("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Export Reports"
        subtitle="Generate and share teacher performance summaries"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Reports Generated"
          value={observations.length}
          subtitle="Total observations"
          icon={FileText}
        />
        <StatCard
          title="Pending Reviews"
          value={observations.filter(o => !o.hasReflection).length}
          subtitle="Require reflection"
          icon={Clock}
        />
        <StatCard
          title="Shared Reports"
          value="18"
          subtitle="Sent to teachers"
          icon={Mail}
        />
      </div>

      <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm">
        <CardHeader className="border-b bg-muted/20 pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Staff Reports Registry</CardTitle>
              <CardDescription>Select a teacher to preview or email their comprehensive report.</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <AIAnalysisModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                data={team}
                type="admin"
                title="Staff Performance AI Analysis"
              />
              <Button
                onClick={() => setIsAIModalOpen(true)}
                variant="outline"
                className="gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border-emerald-200 text-emerald-700 font-bold"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                AI Smart Insights
              </Button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search staff..."
                  className="pl-10 w-[250px] bg-background border-muted-foreground/20 rounded-xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className={cn("rounded-xl", (selectedRole !== "all" || performanceFilter !== "all") && "border-primary text-primary bg-primary/10")}>
                    <Filter className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="end">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Filter Reports</h4>
                      <p className="text-sm text-muted-foreground">Narrow down the list by role or performance.</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Roles" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Roles</SelectItem>
                          {roles.map(role => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Performance Band</Label>
                      <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Performance Levels" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Performance Levels</SelectItem>
                          <SelectItem value="high">High Performing (4.0+)</SelectItem>
                          <SelectItem value="proficient">Proficient (3.0-3.9)</SelectItem>
                          <SelectItem value="support">Needs Support (&lt;3.0)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="pt-2 flex justify-end">
                      <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground hover:text-foreground">
                        Reset Filters
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/30 border-b">
                  <th className="text-left p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Teacher</th>
                  <th className="text-left p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Performance Impact</th>
                  <th className="text-left p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">PD Progress</th>
                  <th className="text-left p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Last Updated</th>
                  <th className="text-right p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted-foreground/10">
                {filteredTeam.length > 0 ? (
                  filteredTeam.map((member) => (
                    <tr key={member.id} className="hover:bg-primary/5 transition-colors group">
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-2">
                          <Star className={cn("w-4 h-4", member.avgScore >= 4.0 ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground")} />
                          <span className="font-bold">{member.avgScore}</span>
                          <span className="text-xs text-muted-foreground">/ 5.0</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="space-y-1.5 max-w-[140px]">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium">{member.pdHours}h</span>
                            <span className="text-muted-foreground">{member.completionRate}%</span>
                          </div>
                          <Progress value={member.completionRate} className="h-1.5" />
                        </div>
                      </td>
                      <td className="p-6">
                        <p className="text-sm text-foreground">{member.lastObserved}, 2026</p>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 gap-2"
                            onClick={() => {
                              setSelectedTeacher(member);
                              setIsReportOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                            Preview
                          </Button>
                          <Button
                            size="sm"
                            className="h-9 gap-2 min-w-[100px]"
                            disabled={sendingId === member.id}
                            onClick={() => handleEmailReport(member)}
                          >
                            {sendingId === member.id ? (
                              <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                Sending
                              </>
                            ) : (
                              <>
                                <Mail className="w-4 h-4" />
                                Email
                              </>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No teachers found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="max-w-5xl h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-none shadow-2xl">
          {selectedTeacher && (
            <TeacherAnalyticsReport teacher={selectedTeacher} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TeacherGoalsView({ goals }: { goals: any[] }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGoal, setSelectedGoal] = useState<any | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [teacherFilter, setTeacherFilter] = useState("All");
  const [progressFilter, setProgressFilter] = useState("All");

  // Ensure goals is an array and filter out invalid entries to prevent crashes
  const safeGoals = Array.isArray(goals) ? goals.filter(g => g && typeof g.teacher === 'string' && typeof g.title === 'string') : [];

  // Get unique teachers for filter
  const uniqueTeachers = Array.from(new Set(safeGoals.map(g => g.teacher)));

  // Apply all filters
  const filteredGoals = safeGoals.filter(g => {
    const matchesSearch = g.teacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === "All" || g.category === categoryFilter;
    const matchesStatus = statusFilter === "All" || g.status === statusFilter;
    const matchesTeacher = teacherFilter === "All" || g.teacher === teacherFilter;

    let matchesProgress = true;
    if (progressFilter === "<50%") matchesProgress = g.progress < 50;
    else if (progressFilter === "50-79%") matchesProgress = g.progress >= 50 && g.progress < 80;
    else if (progressFilter === "≥80%") matchesProgress = g.progress >= 80;

    return matchesSearch && matchesCategory && matchesStatus && matchesTeacher && matchesProgress;
  });

  // Count active filters
  const activeFilterCount = [categoryFilter, statusFilter, teacherFilter, progressFilter].filter(f => f !== "All").length;

  const clearAllFilters = () => {
    setCategoryFilter("All");
    setStatusFilter("All");
    setTeacherFilter("All");
    setProgressFilter("All");
  };

  const handleReviewSubmit = () => {
    toast.success(`Review submitted for ${selectedGoal?.teacher}'s goal.`);
    setSelectedGoal(null);
    setReviewFeedback("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teacher Professional Goals"
        subtitle="Manage and track performance targets for your staff"
        actions={
          <Button onClick={() => navigate("/leader/goals/assign")}>
            <Plus className="mr-2 w-4 h-4" />
            Assign New Goal
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Active Goals"
          value={goals.length}
          subtitle="Total in progress"
          icon={Target}
        />
        <StatCard
          title="Near Completion"
          value={goals.filter(g => g.progress >= 80).length}
          subtitle="Progress > 80%"
          icon={Rocket}
        />
        <StatCard
          title="Avg. Progress"
          value={`${Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / goals.length)}%`}
          subtitle="System wide"
          icon={TrendingUp}
        />
      </div>

      <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm">
        <CardHeader className="border-b bg-muted/20 pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Goal Registry</CardTitle>
              <CardDescription>Comprehensive list of all teacher development targets.</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search goals..."
                  className="pl-10 w-[250px] bg-background border-muted-foreground/20 rounded-xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-xl relative">
                    <Filter className="w-4 h-4" />
                    {activeFilterCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">Filters</h4>
                      {activeFilterCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAllFilters}
                          className="h-8 text-xs"
                        >
                          Clear all
                        </Button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Category</Label>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="All categories" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="All">All Categories</SelectItem>
                            <SelectItem value="Instruction">Instruction</SelectItem>
                            <SelectItem value="Assessment">Assessment</SelectItem>
                            <SelectItem value="Management">Management</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Status</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="All statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="All">All Statuses</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Near Completion">Near Completion</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Teacher</Label>
                        <Select value={teacherFilter} onValueChange={setTeacherFilter}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="All teachers" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="All">All Teachers</SelectItem>
                            {uniqueTeachers.map(teacher => (
                              <SelectItem key={teacher} value={teacher}>{teacher}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Progress Level</Label>
                        <Select value={progressFilter} onValueChange={setProgressFilter}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="All progress levels" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="All">All Progress Levels</SelectItem>
                            <SelectItem value="<50%">Below 50%</SelectItem>
                            <SelectItem value="50-79%">50% - 79%</SelectItem>
                            <SelectItem value="≥80%">80% and above</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/30 border-b">
                  <th className="text-left p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Teacher</th>
                  <th className="text-left p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Email</th>
                  <th className="text-left p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Goal Target</th>
                  <th className="text-left p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Category</th>
                  <th className="text-left p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground w-1/4">Progress</th>
                  <th className="text-left p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Due Date</th>
                  <th className="text-right p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted-foreground/10">
                {filteredGoals.map((goal) => (
                  <tr key={goal.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="p-6">
                      <p className="font-bold text-foreground">{goal.teacher}</p>
                    </td>
                    <td className="p-6">
                      <p className="text-sm text-foreground">{goal.teacherEmail || "-"}</p>
                    </td>
                    <td className="p-6">
                      <p className="font-semibold">{goal.title}</p>
                    </td>
                    <td className="p-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-primary/10 text-primary uppercase tracking-wider">
                        {goal.category}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span>{goal.progress}%</span>
                          <span className={cn(
                            goal.progress >= 80 ? "text-success" : goal.progress >= 50 ? "text-primary" : "text-warning"
                          )}>{goal.status}</span>
                        </div>
                        <Progress value={goal.progress} className="h-2" />
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {goal.dueDate}
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 px-4 hover:bg-primary/10 hover:text-primary font-bold"
                        onClick={() => setSelectedGoal(goal)}
                      >
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedGoal} onOpenChange={(open) => !open && setSelectedGoal(null)}>
        <DialogContent className="sm:max-w-[500px] border-none shadow-2xl bg-background p-0 overflow-hidden">
          <DialogHeader className="p-8 pb-0">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">Goal Review</DialogTitle>
                <DialogDescription>Provide feedback on teacher progress</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6 p-6 rounded-2xl bg-muted/30 border border-muted-foreground/10">
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Teacher</p>
                <p className="font-bold text-lg">{selectedGoal?.teacher}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Due Date</p>
                <p className="font-bold text-lg">{selectedGoal?.dueDate}</p>
              </div>
              <div className="col-span-2 space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Goal Target</p>
                <p className="font-semibold text-primary">{selectedGoal?.title}</p>
              </div>
              <div className="col-span-2 space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Current Progress</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span>{selectedGoal?.progress}%</span>
                    <span className="text-primary">{selectedGoal?.category}</span>
                  </div>
                  <Progress value={selectedGoal?.progress} className="h-3 rounded-full" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="feedback" className="text-sm font-bold text-foreground">Leader Feedback</Label>
              <Textarea
                id="feedback"
                placeholder="Share your thoughts on the progress, areas of improvement, or words of encouragement..."
                className="min-h-[120px] bg-background border-muted-foreground/20 rounded-2xl focus:ring-primary/20 resize-none p-4"
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button variant="outline" className="flex-1 h-12 rounded-xl border-muted-foreground/20" onClick={() => setSelectedGoal(null)}>
                Cancel
              </Button>
              <Button className="flex-1 h-12 rounded-xl shadow-lg shadow-primary/20 font-bold" onClick={handleReviewSubmit}>
                Submit Review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ObservationReportView({ observations, team }: { observations: Observation[], team: any[] }) {
  const { obsId } = useParams();
  const navigate = useNavigate();
  const observation = observations.find(o => o.id === obsId);
  const teacher = team.find(t => t.name === (observation?.teacher || observation?.teacherEmail));

  const [showReflection, setShowReflection] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  if (!observation) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <FileText className="w-16 h-16 text-muted-foreground mb-4 opacity-20" />
        <h2 className="text-2xl font-bold">Report not found</h2>
        <Button onClick={() => navigate("/leader/observations")} className="mt-4">Back to Observations</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <PageHeader
            title="Instructional Review Report"
            subtitle={`Ref: #OBS-${observation.id.toUpperCase()}`}
          />
        </div>
        <div className="flex items-center gap-2">
          <AIAnalysisModal
            isOpen={isAIModalOpen}
            onClose={() => setIsAIModalOpen(false)}
            data={{ observation, teacher }}
            type="observation"
            title={`Observation Analysis - ${observation.teacher}`}
          />
          <Button
            onClick={() => setIsAIModalOpen(true)}
            size="sm"
            className="gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-lg shadow-indigo-500/20 font-bold border-none"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            AI Smart Analysis
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => navigate("/leader/observe", { state: { observation } })}
          >
            <Edit className="w-4 h-4" />
            Edit
          </Button>

          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />
            Print
          </Button>
          {(observation.hasReflection || observation.detailedReflection) && (
            <Button
              variant={showReflection ? "secondary" : "default"}
              size="sm"
              className="gap-2"
              onClick={() => {
                setShowReflection(!showReflection);
                if (!showReflection) {
                  setTimeout(() => document.getElementById('reflection-card')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }
              }}
            >
              <MessageSquare className="w-4 h-4" />
              {showReflection ? "Hide Reflection" : "View Teacher Reflection"}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              toast.info("Please select 'Save as PDF' in the print dialog.");
              setTimeout(() => window.print(), 500);
            }}
          >
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              const subject = `Observation Report: ${observation.teacher} - ${observation.date}`;
              const body = `Please find the observation report details for ${observation.teacher} observed on ${observation.date}.\n\nDomain: ${observation.domain}\nScore: ${observation.score}/5\n\nLink: ${window.location.href}`;
              window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            }}
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Assessment Card */}
          <Card className="border-none shadow-2xl bg-background/50 backdrop-blur-sm overflow-hidden">
            <div className="h-2 bg-primary" />
            <CardHeader className="bg-muted/10 pb-8">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      {observation.domain}
                    </span>
                    <span className="text-muted-foreground text-sm">•</span>
                    <span className="text-muted-foreground text-sm font-medium">{observation.date}, 2026</span>
                  </div>
                  <CardTitle className="text-3xl font-bold">Instructional Assessment</CardTitle>
                </div>
                <div className={cn(
                  "w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-black border-4 shadow-xl",
                  observation.score >= 4 ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"
                )}>
                  <span className="text-3xl leading-none">{observation.score}</span>
                  <span className="text-[10px] uppercase opacity-60">Score</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8 p-8">
              <div className="grid md:grid-cols-2 gap-8 border-b border-dashed pb-8">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Teacher</p>
                  <p className="text-lg font-bold">{observation.teacher}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Observer</p>
                  <p className="text-lg font-bold">Dr. Sarah Johnson</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-primary">
                  <FileText className="w-5 h-5" />
                  General Feedback & Notes
                </h3>
                <div className="p-6 rounded-2xl bg-muted/20 border border-muted-foreground/10 text-foreground leading-relaxed italic">
                  "{observation.notes || "No additional feedback provided."}"
                </div>
              </div>

              {/* Domain Specific Evidence */}
              {observation.domains && observation.domains.length > 0 && (
                <div className="space-y-6 pt-4 border-t border-dashed">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-primary">
                    <ClipboardCheck className="w-5 h-5" />
                    Domain Evidence & Indicator Ratings
                  </h3>
                  <div className="grid gap-6">
                    {observation.domains.map((dom) => (
                      <Card key={dom.domainId} className="border-muted/30 shadow-sm overflow-hidden bg-background/50">
                        <div className="bg-muted/10 p-4 border-b">
                          <h4 className="font-bold flex items-center justify-between">
                            {dom.title}
                            <Badge variant="outline" className="text-[10px] font-black uppercase">Domain {dom.domainId}</Badge>
                          </h4>
                        </div>
                        <CardContent className="p-5 space-y-4">
                          <div className="grid gap-2">
                            {dom.indicators.map((ind, idx) => (
                              <div key={idx} className="flex items-center justify-between py-1.5 border-b border-dashed last:border-0">
                                <span className="text-sm font-medium text-foreground/80">{ind.name}</span>
                                <Badge variant={ind.rating === "Highly Effective" ? "default" : ind.rating === "Effective" ? "secondary" : "outline"} className={cn(
                                  "text-[10px] font-bold",
                                  ind.rating === "Not Observed" && "opacity-40"
                                )}>
                                  {ind.rating}
                                </Badge>
                              </div>
                            ))}
                          </div>
                          {dom.evidence && (
                            <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                              <p className="text-xs font-bold uppercase text-primary mb-2 tracking-widest">Evidence Observed</p>
                              <p className="text-sm italic text-foreground/80 leading-relaxed">"{dom.evidence}"</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Steps & Conversation Reflection */}
              <div className="grid md:grid-cols-2 gap-8 pt-4 border-t border-dashed">
                {observation.actionStep && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-600">
                      <Target className="w-5 h-5" />
                      Action Step
                    </h3>
                    <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-900 font-medium leading-relaxed">
                      {observation.actionStep}
                    </div>
                  </div>
                )}
                {observation.teacherReflection && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-amber-600">
                      <MessageSquare className="w-5 h-5" />
                      Teacher's Conversation Reflection
                    </h3>
                    <div className="p-6 rounded-2xl bg-amber-50 border border-amber-100 text-amber-900 leading-relaxed italic">
                      "{observation.teacherReflection}"
                    </div>
                  </div>
                )}
              </div>

              {/* Meta Tags / Focus Areas */}
              {observation.metaTags && observation.metaTags.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-dashed">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-muted-foreground">
                    <Tag className="w-5 h-5" />
                    Focus Areas for Improvement
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {observation.metaTags.map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="px-3 py-1.5 rounded-xl border-primary/20 bg-primary/5 text-primary text-xs font-bold">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {observation.strengths && (
                <div className="space-y-4 pt-4 border-t border-dashed">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-success">
                    <CheckCircle className="w-5 h-5" />
                    Key Strengths Observed
                  </h3>
                  <div className="p-6 rounded-2xl bg-success/5 border border-success/10 text-foreground leading-relaxed">
                    {observation.strengths}
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-between items-center text-xs text-muted-foreground border-t">
                <p>Digitally signed by Dr. Sarah Johnson</p>
                <p>Timestamp: Feb 04, 2026 13:28:45</p>
              </div>
            </CardContent>
          </Card>

          {/* Teacher Reflection Card - Collapsible */}
          {(observation.hasReflection || observation.detailedReflection) && showReflection && (
            <div id="reflection-card" className="animate-in slide-in-from-bottom-5 fade-in duration-500">
              <Card className="border-none shadow-2xl bg-background/50 backdrop-blur-sm overflow-hidden mt-8">
                <CardHeader className="bg-indigo-50/40 pb-8 border-b border-indigo-100/50">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                        <MessageSquare className="w-8 h-8" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold text-foreground">Teacher Reflection</CardTitle>
                        <CardDescription>
                          Submitted on {observation.detailedReflection?.submissionDate ? new Date(observation.detailedReflection.submissionDate).toLocaleDateString() : (observation.updatedAt ? new Date(observation.updatedAt).toLocaleDateString() : observation.date)} • Self-Assessment
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  {observation.detailedReflection && Object.keys(observation.detailedReflection).length > 0 ? (
                    <div className="space-y-8">
                      {/* Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-emerald-50/50 border-emerald-100 shadow-sm">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-emerald-700">Strengths</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm font-medium text-foreground/80 leading-relaxed">{observation.detailedReflection?.strengths || "No strengths recorded."}</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-amber-50/50 border-amber-100 shadow-sm">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-amber-700">Areas for Growth</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm font-medium text-foreground/80 leading-relaxed">{observation.detailedReflection?.improvements || "No areas for growth recorded."}</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-blue-50/50 border-blue-100 shadow-sm">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-blue-700">Goal for Next Cycle</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm font-medium text-foreground/80 leading-relaxed">{observation.detailedReflection?.goal || "No goal recorded."}</p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Detailed Sections */}
                      <div className="space-y-6">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                          <FileText className="w-5 h-5 text-muted-foreground" />
                          Reflection Details
                        </h3>
                        {observation.detailedReflection?.sections && (
                          Object.entries(observation.detailedReflection.sections).map(([key, section]: [string, any]) => (
                            <div key={key} className="space-y-4 border rounded-2xl p-6 bg-card/50">
                              <div className="flex items-center gap-3 pb-4 border-b">
                                <div className="w-2 h-8 rounded-full bg-indigo-500" />
                                <h4 className="font-bold text-lg">{section.title}</h4>
                              </div>
                              <div className="grid lg:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                  <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Self-Ratings</p>
                                  <div className="space-y-3">
                                    {section.ratings && section.ratings.map((r: any) => (
                                      <div key={r.indicator} className="flex justify-between items-center group">
                                        <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">{r.indicator}</span>
                                        <Badge variant={r.rating === "Highly Effective" ? "default" : r.rating === "Effective" ? "secondary" : "outline"} className="ml-4">
                                          {r.rating}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Evidence Provided</p>
                                  <div className="p-4 rounded-xl bg-muted/30 text-sm italic leading-relaxed text-muted-foreground border border-dashed border-muted-foreground/20">
                                    "{section.evidence}"
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 rounded-2xl bg-muted/20 border-2 border-dashed border-muted-foreground/10 text-lg leading-relaxed text-foreground/80 italic text-center">
                      {observation.teacherReflection || observation.reflection || "No reflection text provided."}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-lg bg-background/50 backdrop-blur-sm">
            <CardHeader className="pb-3 border-b bg-muted/10">
              <CardTitle className="text-lg">Instructional Impact</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-bold uppercase text-muted-foreground tracking-widest">Performance Tier</p>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Award className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold">{observation.score === 5 ? "Distinguished" : observation.score === 4 ? "Proficient" : "Developing"}</p>
                    <p className="text-xs text-muted-foreground">Exceeds standard expectations</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-bold uppercase text-muted-foreground tracking-widest">Growth Vector</p>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <TrendingUp className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="font-bold text-success">+0.4 Increase</p>
                    <p className="text-xs text-muted-foreground">Compared to last observation</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-primary/5 border border-primary/10">
            <CardHeader>
              <CardTitle className="text-lg">Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Review this report with the teacher during the post-observation conference. Define one specific actionable goal for the next cycle.
              </p>
              <Button
                className="w-full gap-2"
                onClick={() => toast.success("Debrief session scheduled. Email invites sent to teacher.")}
              >
                <Calendar className="w-4 h-4" />
                Schedule Debrief
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ObservationsManagementView({ observations, systemAvgScore }: { observations: Observation[], systemAvgScore: string }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredObservations = observations.filter(obs => {
    const teacherName = obs.teacher || obs.teacherEmail || 'Unknown Teacher';
    const domainName = obs.domain || 'General';
    return teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      domainName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/leader")}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <PageHeader
            title="Observations Management"
            subtitle="Audit teacher reviews and instructional quality"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search observations..."
              className="pl-10 w-[250px] bg-background/50 border-muted-foreground/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Reviews"
          value={observations.length}
          subtitle="This academic year"
          icon={Eye}
          onClick={() => navigate("/leader/observations")}
        />
        <StatCard
          title="Average Score"
          value={systemAvgScore}
          subtitle="Institutional avg"
          icon={Star}
          onClick={() => navigate("/leader/performance")}
        />
        <StatCard
          title="Distinguished"
          value={observations.filter(o => o.score === 5).length}
          subtitle="Top tier performance"
          icon={TrendingUp}
          onClick={() => navigate("/leader/performance")}
        />
        <StatCard
          title="Pending Feedback"
          value="2"
          subtitle="Requires attention"
          icon={FileText}
          onClick={() => navigate("/leader/reports")}
        />
      </div>

      <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle>Observation Audit Log</CardTitle>
          <CardDescription>View and manage all classroom visit records.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/30 border-b">
                  <th className="text-left p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Date</th>
                  <th className="text-left p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Teacher</th>
                  <th className="text-left p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Domain</th>
                  <th className="text-left p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Score</th>
                  <th className="text-right p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted-foreground/10">
                {filteredObservations.map((obs) => (
                  <tr key={obs.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="p-6 text-sm font-medium text-muted-foreground">
                      {obs.date}, 2026
                    </td>
                    <td className="p-6">
                      <p className="font-bold text-foreground group-hover:text-primary transition-colors">{obs.teacher}</p>
                    </td>
                    <td className="p-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                        {obs.domain}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center font-bold border",
                        obs.score >= 4 ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"
                      )}>
                        {obs.score}
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <Button variant="ghost" size="sm" className="h-10 px-4 gap-2 hover:bg-primary/10 hover:text-primary" onClick={() => navigate(`/leader/observations/${obs.id}`)}>
                        View Full Report
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ObserveView({ setObservations, setTeam, team, observations }: {
  setObservations: React.Dispatch<React.SetStateAction<Observation[]>>,
  setTeam: React.Dispatch<React.SetStateAction<any[]>>,
  team: any[],
  observations: Observation[]
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const initialData = location.state?.observation || location.state?.initialData || {};
  const isEditing = !!initialData.id;

  if (!team || !observations) {
    return <div className="p-8 text-center text-muted-foreground">Loading dashboard data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate("/leader")}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <PageHeader
          title={isEditing ? "Edit Observation" : "Ekya Danielson Framework"}
          subtitle={isEditing ? `Updating observation for ${initialData.teacher}` : "Unified Observation, Feedback & Improvement Form"}
        />
      </div>

      <UnifiedObservationForm
        teachers={team}
        initialData={initialData}
        onCancel={() => navigate("/leader")}
        onSubmit={async (data) => {
          if (isEditing) {
            try {
              await api.patch(`/observations/${initialData.id}`, data);
              toast.success("Observation updated successfully!");
            } catch (error) {
              console.error(error);
              toast.error("Failed to update observation");
            }
          } else {
            const newObs = {
              ...data,
              // Let backend handle ID generation or use this one if backend accepts it (our mock backend does)
              date: data.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              hasReflection: false,
              reflection: "",
            } as Observation;

            try {
              await api.post('/observations', newObs);
              toast.success(`Observation for ${newObs.teacher} recorded successfully!`);

              // Update teacher stats locally immediately for UX
              setTeam(prev => {
                const teacherName = newObs.teacher;
                if (!teacherName || typeof teacherName !== 'string') return prev;

                const existing = prev.find(t => t?.name?.toLowerCase() === teacherName.toLowerCase());
                if (existing) {
                  return prev.map(t => (t?.name?.toLowerCase() === teacherName.toLowerCase()) ? {
                    ...t,
                    observations: (t.observations || 0) + 1,
                    lastObserved: newObs.date,
                    avgScore: Number((((t.avgScore || 0) * (t.observations || 0) + newObs.score) / ((t.observations || 0) + 1)).toFixed(1))
                  } : t);
                } else {
                  return [...prev, {
                    id: Math.random().toString(36).substr(2, 9),
                    name: teacherName,
                    email: newObs.teacherEmail || "",
                    role: "Subject Teacher",
                    observations: 1,
                    lastObserved: newObs.date,
                    avgScore: newObs.score,
                    pdHours: 0,
                    completionRate: 0
                  }];
                }
              });
            } catch (error) {
              console.error(error);
              toast.error("Failed to save observation");
            }
          }
          navigate("/leader");
        }}
      />
    </div>
  );
}



function AssignGoalView({ setGoals, team }: { setGoals: React.Dispatch<React.SetStateAction<any[]>>, team: any[] }) {
  const navigate = useNavigate();
  const [goalTemplate, setGoalTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await api.get('/templates');
        if (response.data?.status === 'success') {
          const templates = response.data.data.templates || [];
          const active = templates.find((t: any) => t.type === 'Goal Setting' && t.status === 'Active');
          if (active) setGoalTemplate(active);
        }
      } catch (error) {
        console.error("Failed to fetch goal template", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-muted-foreground">Loading goal template...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/leader/goals")}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <PageHeader
            title="Assign New Goal"
            subtitle="Set academic year goals for educators"
          />
        </div>
      </div>

      {goalTemplate ? (
        <Card className="border-none shadow-premium bg-background/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <DynamicForm
              fields={goalTemplate.fields.map((f: any) =>
                f.id === "g1" ? { ...f, type: "select" as const, options: team.map(t => t.name) } : f
              )}
              submitLabel="Assign Goal"
              onCancel={() => navigate("/leader/goals")}
              onSubmit={async (data) => {
                console.log("Goal Submission Data (Template):", data); // DEBUG LOG
                console.log("Current Team State:", team); // DEBUG LOG

                if (!data.g1 || data.g1 === "Unknown Teacher") {
                  toast.error("Please select a teacher.");
                  return;
                }
                const targetTeacher = team.find(t => t.name === data.g1);

                if (!targetTeacher) {
                  toast.error("Selected teacher not found in team records.");
                  return;
                }

                if (!targetTeacher.email) {
                  toast.error("Selected teacher is missing an email address. Cannot assign goal.");
                  return;
                }

                const newGoal = {
                  teacher: data.g1 || "Unknown Teacher",
                  teacherEmail: targetTeacher?.email,
                  title: data.g9 || "New School Goal",
                  category: data.g12 || "General",
                  progress: 0,
                  status: "Assigned",
                  dueDate: data.g_end_date ? format(new Date(data.g_end_date), "MMM dd, yyyy") : "Jun 28, 2026",
                  assignedBy: data.g2 || "Admin",
                  description: data.g10 || "",
                  actionStep: data.g11 || "",
                  pillar: data.g12 || "Professional Practice",
                  campus: data.g3 || "HQ",
                  ay: "25-26",
                  isSchoolAligned: true,
                  assignedDate: new Date().toISOString(),
                  reflectionCompleted: true,
                };

                try {
                  await api.post('/goals', newGoal);
                  toast.success("Goal successfully assigned using Master Template.");
                  navigate("/leader/goals");
                } catch (error) {
                  console.error(error);
                  toast.error("Failed to assign goal");
                }
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <GoalSettingForm
          teachers={team}
          defaultCoachName="Rohit"
          onCancel={() => navigate("/leader/goals")}
          onSubmit={async (data) => {
            const targetTeacher = team.find(t => t.name === data.educatorName);

            if (!targetTeacher) {
              toast.error("Selected teacher not found in team records.");
              return;
            }

            const emailToSave = data.teacherEmail || targetTeacher.email;

            if (!emailToSave) {
              toast.error("Selected teacher is missing an email address.");
              return;
            }

            const newGoal = {
              teacher: data.educatorName,
              teacherEmail: emailToSave,
              title: data.goalForYear,
              category: data.pillarTag,
              progress: 0,
              status: "Assigned",
              dueDate: format(data.goalEndDate, "MMM dd, yyyy"),
              assignedBy: data.coachName,
              description: data.reasonForGoal,
              actionStep: data.actionStep,
              pillar: data.pillarTag,
              campus: data.campus,
              ay: "25-26",
              isSchoolAligned: true,
              assignedDate: new Date().toISOString(),
              reflectionCompleted: true,
            };

            try {
              await api.post('/goals', newGoal);
              toast.success("Goal successfully assigned.");
              navigate("/leader/goals");
            } catch (error) {
              console.error(error);
              toast.error("Failed to assign goal");
            }
          }}
        />
      )}
    </div>
  );
}

function PlaceholderView({ title, icon: Icon }: { title: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
      <div className="p-4 rounded-3xl bg-primary/10 mb-6">
        <Icon className="w-12 h-12 text-primary" />
      </div>
      <h2 className="text-3xl font-bold text-foreground mb-3">{title}</h2>
      <p className="text-muted-foreground max-w-md mx-auto mb-8">
        This management module is currently in development.
        It will provide deep insights and powerful tools for school leaders once released.
      </p>
      <Button asChild>
        <Link to="/leader">Return to Overview</Link>
      </Button>
    </div>
  );
}

function MoocResponsesView({ refreshTeam }: { refreshTeam: () => Promise<void> }) {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        setLoading(true);
        const data = await moocService.getAllSubmissions();
        setSubmissions(data);
      } catch (error) {
        console.error("Failed to load MOOC submissions", error);
        toast.error("Failed to load submissions");
      } finally {
        setLoading(false);
      }
    };
    loadSubmissions();
  }, []);

  async function handleUpdateStatus(status: string) {
    if (!selectedSubmission) return;
    try {
      setIsUpdating(true);
      await moocService.updateStatus(selectedSubmission.id, status);
      toast.success(`Submission ${status.toLowerCase()} successfully`);

      // Update local state
      setSubmissions(prev => prev.map(s => s.id === selectedSubmission.id ? { ...s, status } : s));
      setSelectedSubmission(null);

      // Refresh team data to update PD hours
      await refreshTeam();
    } catch (error) {
      console.error("Failed to update status", error);
      toast.error("Failed to update submission status");
    } finally {
      setIsUpdating(false);
    }
  }

  const filteredSubmissions = submissions.filter(s =>
    (s.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.courseName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && submissions.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/leader/calendar")}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <PageHeader
          title="Course Evidence Registry"
          subtitle="Review MOOC completions and reflection evidence"
        />
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search submissions..."
            className="pl-10 w-[250px] bg-background border-muted-foreground/20 rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/30 border-b">
                  <th className="text-left p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Teacher</th>
                  <th className="text-left p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Course</th>
                  <th className="text-left p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Platform</th>
                  <th className="text-left p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Completion Date</th>
                  <th className="text-left p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Evidence</th>
                  <th className="text-left p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="text-right p-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr >
              </thead >
              <tbody className="divide-y divide-muted-foreground/10">
                {filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="p-6">
                      <p className="font-bold text-foreground">{sub.name}</p>
                      <p className="text-xs text-muted-foreground">{sub.email}</p>
                    </td>
                    <td className="p-6">
                      <p className="font-medium text-foreground">{sub.courseName}</p>
                      <p className="text-xs text-muted-foreground">{sub.hours} Hours</p>
                    </td>
                    <td className="p-6">
                      <Badge variant="outline">{sub.platform === 'Other' ? sub.otherPlatform : sub.platform}</Badge>
                    </td>
                    <td className="p-6">
                      {new Date(sub.completionDate).toLocaleDateString()}
                    </td>
                    <td className="p-6">
                      {sub.hasCertificate === 'yes' ? (
                        <a href={sub.proofLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline font-medium">
                          <LinkIcon className="w-3 h-3" />
                          Certificate
                        </a>
                      ) : (
                        <Badge variant="secondary">Reflection</Badge>
                      )}
                    </td>
                    <td className="p-6">
                      <Badge variant={sub.status === 'APPROVED' ? 'default' : sub.status === 'REJECTED' ? 'destructive' : 'outline'} className={sub.status === 'APPROVED' ? 'bg-green-600' : ''}>
                        {sub.status || 'PENDING'}
                      </Badge>
                    </td>
                    <td className="p-6 text-right">
                      <Button variant="outline" size="sm" onClick={() => setSelectedSubmission(sub)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </td>
                  </tr >
                ))
                }
                {
                  filteredSubmissions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-muted-foreground">
                        No submissions found.
                      </td>
                    </tr>
                  )
                }
              </tbody >
            </table >
          </div >
        </CardContent >
      </Card >

      <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>
              Submitted on {selectedSubmission && new Date(selectedSubmission.submittedAt).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Teacher</Label>
                  <p className="font-medium">{selectedSubmission.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Campus</Label>
                  <p className="font-medium">{selectedSubmission.campus}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Course</Label>
                  <p className="font-medium">{selectedSubmission.courseName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Platform</Label>
                  <p className="font-medium">{selectedSubmission.platform === 'Other' ? selectedSubmission.otherPlatform : selectedSubmission.platform}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Hours</Label>
                  <p className="font-medium">{selectedSubmission.hours}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Completion Date</Label>
                  <p className="font-medium">{new Date(selectedSubmission.completionDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="h-px bg-border my-4" />

              {selectedSubmission.hasCertificate === 'yes' ? (
                <div>
                  <Label className="text-muted-foreground block mb-2">Certificate</Label>
                  <a href={selectedSubmission.proofLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline border px-4 py-2 rounded-md bg-primary/5">
                    <LinkIcon className="w-4 h-4" />
                    Open Certificate Link
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2"><Brain className="w-4 h-4" /> Reflection</h4>
                  <div>
                    <Label className="text-muted-foreground">Key Takeaways</Label>
                    <p className="mt-1 text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">{selectedSubmission.keyTakeaways}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Unanswered Questions</Label>
                    <p className="mt-1 text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">{selectedSubmission.unansweredQuestions}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Self-Assessment</Label>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-4 h-4 text-primary fill-primary" />
                      <span className="font-bold">{selectedSubmission.effectivenessRating}/10</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Supporting Documents Section */}
              {(selectedSubmission.supportingDocType || selectedSubmission.supportingDocLink || selectedSubmission.supportingDocFile) && (
                <div>
                  <div className="h-px bg-border my-4" />
                  <h4 className="font-semibold flex items-center gap-2 mb-3">
                    <Paperclip className="w-4 h-4" /> Supporting Documents
                  </h4>

                  {selectedSubmission.supportingDocType === 'link' && selectedSubmission.supportingDocLink && (
                    <div>
                      <Label className="text-muted-foreground block mb-2">External Link</Label>
                      <a
                        href={selectedSubmission.supportingDocLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:underline border px-4 py-2 rounded-md bg-primary/5"
                      >
                        <LinkIcon className="w-4 h-4" />
                        Open Attached Document
                      </a>
                    </div>
                  )}

                  {selectedSubmission.supportingDocType === 'file' && selectedSubmission.supportingDocFile && (
                    <div>
                      <Label className="text-muted-foreground block mb-2">Attached File</Label>
                      <a
                        href={selectedSubmission.supportingDocFile}
                        download={selectedSubmission.supportingDocFileName || "supporting-document"}
                        className="inline-flex items-center gap-2 text-primary hover:underline border px-4 py-2 rounded-md bg-primary/5"
                      >
                        <Download className="w-4 h-4" />
                        Download {selectedSubmission.supportingDocFileName || "Document"}
                      </a>
                    </div>
                  )}
                </div>
              )}
              <div className="h-px bg-border my-4" />

              <div>
                <Label className="text-muted-foreground">Effectiveness Rating</Label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex gap-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className={cn("w-2 h-2 rounded-full", i < (Array.isArray(selectedSubmission.effectivenessRating) ? selectedSubmission.effectivenessRating[0] : selectedSubmission.effectivenessRating) ? "bg-primary" : "bg-muted")} />
                    ))}
                  </div>
                  <span className="font-bold">{(Array.isArray(selectedSubmission.effectivenessRating) ? selectedSubmission.effectivenessRating[0] : selectedSubmission.effectivenessRating)}/10</span>
                </div>
              </div>

              {selectedSubmission.additionalFeedback && (
                <div>
                  <Label className="text-muted-foreground">Additional Feedback</Label>
                  <p className="mt-1 text-sm italic">{selectedSubmission.additionalFeedback}</p>
                </div>
              )}

              {selectedSubmission.status !== 'APPROVED' && selectedSubmission.status !== 'REJECTED' && (
                <div className="flex gap-3 pt-6 border-t mt-6">
                  <Button
                    variant="outline"
                    className="flex-1 text-destructive hover:bg-destructive/10"
                    onClick={() => handleUpdateStatus('REJECTED')}
                    disabled={isUpdating}
                  >
                    Reject Submission
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleUpdateStatus('APPROVED')}
                    disabled={isUpdating}
                  >
                    Approve Submission
                  </Button>
                </div>
              )}
            </div >
          )}
        </DialogContent >
      </Dialog >
    </div >
  );
}