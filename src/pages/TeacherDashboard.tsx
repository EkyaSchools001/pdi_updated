import { useState, useEffect, useMemo } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Routes, Route, Link, useLocation, useNavigate, useParams } from "react-router-dom";
import api from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/StatCard";
import { ObservationCard } from "@/components/ObservationCard";
import { GoalCard } from "@/components/GoalCard";
import { TrainingEventCard } from "@/components/TrainingEventCard";
import {
  Clock,
  Eye,
  Target,
  Calendar,
  TrendingUp,
  Book,
  Lightbulb,
  CheckCircle2,
  ChevronRight,
  Search,
  Play,
  Filter,
  Star,
  Trophy,
  History,
  FileCheck,
  PlusCircle,
  MoreVertical,
  Download,
  Brain,
  Zap,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Flag,
  MessageSquare,
  Users,
  FileText,
  User,
  Share2,
  ExternalLink,
  Plus,
  ChevronLeft,
  Save,
  Mail,
  Phone,
  MapPin,
  Award,
  CheckCircle,
  Printer,
  Rocket,
  History as HistoryIcon,
  Link as LinkIcon,
  Paperclip,
  ClipboardCheck,
  Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AcknowledgementsView } from "@/components/documents/AcknowledgementsView";
import { AIAnalysisModal } from "@/components/AIAnalysisModal";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format, parse, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getActiveTemplateByType } from "@/lib/template-utils";
import { DynamicForm } from "@/components/DynamicForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  AreaChart,
  Area
} from "recharts";
import { Progress } from "@/components/ui/progress";


import { Observation, DetailedReflection } from "@/types/observation";
import { ReflectionForm } from "@/components/ReflectionForm";
import { MoocEvidenceForm } from "@/components/MoocEvidenceForm";

import { TeacherProfileView } from "@/components/TeacherProfileView";

// Removed local Observation interface in favor of shared type


const mockObservations: Observation[] = [
  {
    id: "1",
    teacher: "Teacher One",
    date: "Jan 15, 2024",
    observerName: "Dr. Sarah Johnson",
    observerRole: "Head of School",
    domain: "Instruction",
    score: 4,
    notes: "Excellent engagement strategies used. Student participation was very high.",
    hasReflection: true,
    reflection: "I will focus on pacing next time.",
  },
  {
    id: "new-demo-1",
    teacher: "Teacher One",
    date: "Feb 5, 2024",
    observerName: "Dr. Sarah Johnson",
    observerRole: "Head of School",
    domain: "Assessment",
    score: 3,
    notes: "Good formative assessment, but check for understanding more frequently.",
    hasReflection: false,
  },
];

const initialGoals = [
  {
    id: "1",
    title: "Implement Project-Based Learning",
    description: "Incorporate at least 2 PBL units this semester with cross-curricular connections",
    progress: 65,
    dueDate: "Mar 30, 2024",
    assignedBy: "Dr. Sarah Johnson",
    isSchoolAligned: true,
    teacher: "Teacher One"
  },
  {
    id: "2",
    title: "Differentiation Strategies",
    description: "Develop and implement tiered assignments for diverse learner needs",
    progress: 40,
    dueDate: "Apr 15, 2024",
    teacher: "Teacher One"
  },
];

const initialEvents = [
  {
    id: "1",
    title: "Differentiated Instruction Workshop",
    topic: "Pedagogy",
    type: "Pedagogy",
    date: "Feb 15, 2026",
    time: "09:00 AM",
    location: "Auditorium A",
    registered: 12,
    capacity: 20,
    status: "Approved",
    spotsLeft: 8,
    isRegistered: false,
    isAdminCreated: true,
    registrants: [
      { id: "u1", name: "Teacher One", email: "teacher1.btmlayout@pdi.com", dateRegistered: "Jan 12, 2026" },
      { id: "u2", name: "Teacher Two", email: "teacher2.jpnagar@pdi.com", dateRegistered: "Jan 14, 2026" },
      { id: "u3", name: "Teacher Three", email: "teacher3.itpl@pdi.com", dateRegistered: "Jan 15, 2026" },
    ]
  },
  {
    id: "2",
    title: "Digital Literacy in Classroom",
    topic: "Technology",
    type: "Technology",
    date: "Feb 18, 2026",
    time: "02:00 PM",
    location: "Computer Lab 1",
    registered: 18,
    capacity: 25,
    status: "Approved",
    spotsLeft: 7,
    isRegistered: true,
    isAdminCreated: true,
    registrants: [
      { id: "u4", name: "Teacher Three", email: "teacher3.itpl@pdi.com", dateRegistered: "Jan 20, 2026" },
      { id: "u5", name: "Teacher Two", email: "teacher2.jpnagar@pdi.com", dateRegistered: "Jan 21, 2026" },
    ]
  },
  { id: "3", title: "Social-Emotional Learning Hub", topic: "Culture", type: "Culture", date: "Feb 22, 2026", time: "11:00 AM", location: "Conference Room B", registered: 8, capacity: 15, status: "Approved", spotsLeft: 7, isRegistered: false, isAdminCreated: true, registrants: [] },
  { id: "4", title: "Advanced Formative Assessment", topic: "Assessment", type: "Assessment", date: "Feb 25, 2026", time: "03:30 PM", location: "Main Library", registered: 15, capacity: 20, status: "Pending", spotsLeft: 5, isRegistered: false, isAdminCreated: true, registrants: [] },
  { id: "5", title: "Instructional Design Workshop", topic: "Pedagogy", type: "Pedagogy", date: "Feb 13, 2026", time: "09:00 AM", location: "TRC 1", registered: 10, capacity: 15, status: "Approved", spotsLeft: 5, isRegistered: false, isAdminCreated: true, registrants: [] },
];

const mockCourses = [
  {
    id: "1",
    title: "Advanced Classroom Management",
    instructor: "Sarah Jenkins, PhD",
    duration: "4h 30m",
    progress: 75,
    category: "Management",
    rating: 4.8,
    students: 1240,
    thumbnail: "bg-blue-500",
    status: "in-progress"
  },
  {
    id: "2",
    title: "Inclusive Education Strategies",
    instructor: "Mark Thompson",
    duration: "6h 15m",
    progress: 30,
    category: "Special Ed",
    rating: 4.9,
    students: 850,
    thumbnail: "bg-purple-500",
    status: "in-progress"
  },
  {
    id: "3",
    title: "Digital Literacy in 2024",
    instructor: "Emily Chen",
    duration: "3h 0m",
    progress: 0,
    category: "Technology",
    rating: 4.7,
    students: 2100,
    thumbnail: "bg-orange-500",
    status: "recommended"
  },
  {
    id: "4",
    title: "Assessment for Learning",
    instructor: "David Miller",
    duration: "5h 45m",
    progress: 0,
    category: "Pedagogy",
    rating: 4.6,
    students: 1500,
    thumbnail: "bg-emerald-500",
    status: "recommended"
  },
  {
    id: "5",
    title: "Mental Health First Aid",
    instructor: "Dr. Lisa Wong",
    duration: "8h 20m",
    progress: 100,
    category: "Wellbeing",
    rating: 5.0,
    students: 3200,
    thumbnail: "bg-rose-500",
    status: "completed"
  }
];

const mockPDHours = {
  total: 24.5,
  target: 30,
  categories: [
    { name: "Workshops", hours: 12, color: "bg-blue-500" },
    { name: "Online Courses", hours: 8, color: "bg-purple-500" },
    { name: "Seminars", hours: 4.5, color: "bg-emerald-500" }
  ],
  history: [
    { id: 1, activity: "Advanced Classroom Management", category: "Online Course", date: "Jan 20, 2024", hours: 4, status: "Approved", instructor: "Dr. Sarah Jenkins", enrolled: 45 },
    { id: 2, activity: "Inquiry-Based Learning Workshop", category: "Workshop", date: "Jan 15, 2024", hours: 3, status: "Approved", instructor: "Prof. Michael Chen", enrolled: 32 },
    { id: 3, activity: "Digital Literacy Seminar", category: "Seminar", date: "Jan 10, 2024", hours: 2.5, status: "Approved", instructor: "Sarah Johnson", enrolled: 28 },
    { id: 4, activity: "Inclusive Education Strategies", category: "Online Course", date: "Dec 18, 2023", hours: 4, status: "Approved", instructor: "Dr. Lisa Wong", enrolled: 56 },
    { id: 5, activity: "Annual Staff Training Day", category: "Workshop", date: "Nov 05, 2023", hours: 6, status: "Approved", instructor: "Multiple Facilitators", enrolled: 120 },
    { id: 6, activity: "Faculty Meeting: New Curriculum", category: "Seminar", date: "Oct 22, 2023", hours: 2, status: "Pending", instructor: "HR Department", enrolled: 85 }
  ]
};

const mockInsights = {
  skills: [
    { subject: 'Instruction', A: 120, B: 110, fullMark: 150 },
    { subject: 'Classroom Mgmt', A: 98, B: 130, fullMark: 150 },
    { subject: 'Assessment', A: 86, B: 130, fullMark: 150 },
    { subject: 'Technology', A: 99, B: 100, fullMark: 150 },
    { subject: 'Collaboration', A: 85, B: 90, fullMark: 150 },
    { subject: 'Professionalism', A: 65, B: 85, fullMark: 150 },
  ],
  growth: [
    { month: 'Sep', hours: 4 },
    { month: 'Oct', hours: 7 },
    { month: 'Nov', hours: 15 },
    { month: 'Dec', hours: 19 },
    { month: 'Jan', hours: 24.5 },
  ],
  strengths: [
    { name: "Active Engagement", level: "Expert", description: "Consistently maintains high student participation throughout lessons." },
    { name: "Curriculum Design", level: "Advanced", description: "Skillfully aligns lessons with complex learning objectives." }
  ],
  recommendations: [
    { name: "Differentiation", focus: "Personalization", reason: "Focus on tiered assignments to address diverse learner needs." },
    { name: "Data Analysis", focus: "Assessment", reason: "Leverage assessment data to drive instructional pivots." }
  ]
};

const DashboardOverview = ({
  goals,
  events,
  observations,
  onRegister,
  onView,
  onReflect,
  userName,
  pdHours
}: {
  goals: typeof initialGoals,
  events: typeof initialEvents,
  observations: Observation[],
  onRegister: (id: string) => void,
  onView: (id: string) => void,
  onReflect: (obs: Observation) => void,
  userName: string,
  pdHours: typeof mockPDHours
}) => {
  const navigate = useNavigate();
  const schoolAlignedGoals = goals.filter(g => g.isSchoolAligned).length;
  const reflectionsCount = observations.filter(o => o.hasReflection).length;
  const upcomingTrainings = events.filter(e => !e.isRegistered).length;

  return (
    <>
      <PageHeader
        title={`Welcome back, ${userName.split(' ')[0]}!`}
        subtitle="Here's your professional development overview"
        actions={
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => window.open('https://pdi.ekyaschools.com/education-blogs/', '_blank')}
          >
            <Book className="w-4 h-4" />
            Blogs
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <StatCard
          title="PD Hours Completed"
          value={pdHours.total}
          subtitle="This school year"
          icon={Clock}
          trend={{ value: 12, isPositive: true }}

          onClick={() => navigate("/teacher/hours")}
        />
        <StatCard
          title="Observations"
          value={observations.length}
          subtitle={`${reflectionsCount} with reflections`}
          icon={Eye}

          onClick={() => navigate("/teacher/observations")}
        />
        <StatCard
          title="Active Goals"
          value={goals.length}
          subtitle={`${schoolAlignedGoals} school-aligned`}
          icon={Target}

          onClick={() => navigate("/teacher/goals")}
        />
        <StatCard
          title="Upcoming Training"
          value={upcomingTrainings}
          subtitle="Next: Jan 25"
          icon={Calendar}

          onClick={() => navigate("/teacher/calendar")}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Recent Observations</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/teacher/observations">
                View All
                <TrendingUp className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
          <div className="space-y-4">
            {observations.slice(0, 3).map((obs) => (
              <ObservationCard
                key={obs.id}
                observation={obs}
                onView={() => onView(obs.id)}
                onReflect={() => onReflect(obs)}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">My Goals</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/teacher/goals">View All</Link>
            </Button>
          </div>
          <div className="space-y-4">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Upcoming Training</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/teacher/calendar">View Calendar</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <TrainingEventCard
              key={event.id}
              event={event}
              onRegister={() => onRegister(event.id)}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function ObservationsView({
  observations,
  onReflect,
  onView
}: {
  observations: Observation[],
  onReflect: (obs: Observation) => void,
  onView: (id: string) => void
}) {
  return (
    <div className="space-y-6">
      <PageHeader title="My Observations" subtitle="Manage and reflect on your classroom observations" />
      <div className="grid gap-4">
        {observations.map((obs) => (
          <ObservationCard
            key={obs.id}
            observation={obs}
            onReflect={() => onReflect(obs)}
            onView={() => onView(obs.id)}
          />
        ))}
        {observations.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-muted/20 rounded-2xl border border-dashed">
            <Eye className="w-12 h-12 text-muted-foreground opacity-20 mb-4" />
            <p className="text-muted-foreground">No observations recorded yet.</p>
          </div>
        )}
      </div>

    </div>
  );
}

function GoalsView({ goals, onAddGoal, userName }: { goals: typeof initialGoals, onAddGoal: (goal: NewGoal) => void, userName: string }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: "", description: "", dueDate: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title || !newGoal.dueDate) return;
    onAddGoal(newGoal);
    setNewGoal({ title: "", description: "", dueDate: "" });
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Professional Goals" subtitle="Track your growth and align with school priorities" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Card className="border-dashed flex items-center justify-center p-12 text-center cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="space-y-2">
                <Target className="mx-auto h-8 w-8 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">Create New Goal</h3>
                <p className="text-sm text-muted-foreground">Set a new objective for your professional growth</p>
              </div>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-background border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Target className="w-6 h-6 text-primary" />
                New Professional Goal
              </DialogTitle>
              <DialogDescription>
                Define a clear objective to track your growth this semester.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Goal Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Mastery in Classroom Management"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your objective and desired outcomes..."
                  className="min-h-[100px]"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Target Completion Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newGoal.dueDate}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, dueDate: e.target.value }))}
                  required
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Create Goal</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function CalendarView({
  events,
  onRegister
}: {
  events: typeof initialEvents,
  onRegister: (id: string) => void
}) {
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 1, 25)); // Set a default date in center of mock data
  const [searchQuery, setSearchQuery] = useState("");

  const parseEventDate = (dateStr: string) => {
    try {
      return parse(dateStr, "MMM d, yyyy", new Date());
    } catch (e) {
      return new Date();
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.topic.toLowerCase().includes(searchQuery.toLowerCase());

    if (!date) return matchesSearch;

    const eventDate = parseEventDate(event.date);
    return isSameDay(eventDate, date) && matchesSearch;
  });

  const formatDateStr = (d: Date | string) => {
    if (typeof d === 'string') return d;
    return format(d, "MMM d, yyyy");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Training & PD Calendar"
        subtitle="Discover and register for professional development sessions"
      />

      <div className="w-full space-y-6">
        <Card className="border-none shadow-2xl bg-zinc-950 text-white overflow-hidden relative">
          {/* decorative gradient blob */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-info/20 rounded-full blur-3xl translate-y-10 -translate-x-10 pointer-events-none" />

          <CardContent className="p-6 md:p-10 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* Left side: Header and Calendar */}
              <div className="lg:col-span-7 space-y-6">
                <div className="text-left w-full">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-primary via-info to-accent bg-clip-text text-transparent">
                    Activity Summary
                  </h3>
                  <p className="text-zinc-400 text-xs uppercase tracking-wider font-medium">
                    {formatDateStr(new Date())}
                  </p>
                </div>

                <CalendarUI
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
                    day_selected: "bg-primary text-white hover:bg-primary/90 focus:bg-primary shadow-lg shadow-primary/30",
                    day_today: "bg-zinc-800 text-white font-black ring-2 ring-zinc-700",
                    day_outside: "text-zinc-500 opacity-40",
                  }}
                  modifiers={{
                    hasEvent: events.map(e => parseEventDate(e.date))
                  }}
                  modifiersStyles={{
                    hasEvent: { border: '2px solid hsl(var(--primary))', color: 'white' }
                  }}
                />
              </div>

              {/* Right side: Legend and Actions */}
              <div className="lg:col-span-5 h-full flex flex-col justify-center pt-10">
                <div className="space-y-6">
                  <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4">Legend</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10">
                      <span className="flex items-center gap-3 text-sm text-zinc-300">
                        <span className="w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.6)]"></span> Pedagogy
                      </span>
                      <span className="font-mono text-white text-sm bg-primary/20 px-2 py-0.5 rounded-md">
                        {events.filter((t: any) => (t.topic || t.type) === 'Pedagogy').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-info/5 border border-info/10">
                      <span className="flex items-center gap-3 text-sm text-zinc-300">
                        <span className="w-3 h-3 rounded-full bg-info shadow-[0_0_10px_rgba(var(--info),0.6)]"></span> Technology
                      </span>
                      <span className="font-mono text-white text-sm bg-info/20 px-2 py-0.5 rounded-md">
                        {events.filter((t: any) => (t.topic || t.type) === 'Technology').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-accent/5 border border-accent/10">
                      <span className="flex items-center gap-3 text-sm text-zinc-300">
                        <span className="w-3 h-3 rounded-full bg-accent shadow-[0_0_10px_rgba(var(--accent),0.6)]"></span> Culture
                      </span>
                      <span className="font-mono text-white text-sm bg-accent/20 px-2 py-0.5 rounded-md">
                        {events.filter((t: any) => (t.topic || t.type) === 'Culture').length}
                      </span>
                    </div>
                  </div>

                  <div className="pt-8">
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <Input
                        placeholder="Search sessions..."
                        className="pl-10 bg-zinc-900 border-zinc-800 text-white rounded-xl focus:ring-primary"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
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

      <div className="pt-10">
        <Card className="border-none shadow-2xl bg-background/60 backdrop-blur-xl rounded-[2rem] overflow-hidden border border-muted/20">
          <CardHeader className="px-8 py-8 border-b bg-muted/5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <CardTitle className="text-2xl font-black text-foreground tracking-tight">
                  {date ? `Sessions for ${formatDateStr(date)}` : "Upcoming Training Sessions"}
                </CardTitle>
                <p className="text-sm font-medium text-muted-foreground mt-1">
                  {filteredEvents.length} session{filteredEvents.length !== 1 && 's'} identified for this period
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/10 border-b">
                    <th className="text-left px-8 py-5 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/70">Session Title</th>
                    <th className="text-left px-8 py-5 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/70">Type</th>
                    <th className="text-left px-8 py-5 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/70">Time</th>
                    <th className="text-left px-8 py-5 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/70">Location</th>
                    <th className="text-left px-8 py-5 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/70">Status</th>
                    <th className="text-right px-8 py-5 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/70">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted/10">
                  {filteredEvents.length > 0 ? (
                    filteredEvents.map((session) => (
                      <tr key={session.id} className="hover:bg-primary/[0.02] transition-colors group">
                        <td className="px-8 py-7">
                          <div className="flex flex-col">
                            <span className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{session.title}</span>
                            {!date && (
                              <span className="text-xs font-bold text-muted-foreground mt-1 flex items-center gap-1.5 uppercase tracking-wide">
                                <Calendar className="w-3 h-3" /> {session.date}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-7">
                          <Badge variant="outline" className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-primary/5 text-primary border-primary/20">
                            {session.topic || session.type}
                          </Badge>
                        </td>
                        <td className="px-8 py-7">
                          <div className="text-sm font-bold text-foreground flex items-center gap-2.5">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            {session.time}
                          </div>
                        </td>
                        <td className="px-8 py-7">
                          <div className="text-sm font-medium text-muted-foreground flex items-center gap-2.5">
                            <MapPin className="w-4 h-4 text-primary" />
                            {session.location}
                          </div>
                        </td>
                        <td className="px-8 py-7">
                          <span className={cn(
                            "inline-flex items-center px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border shadow-sm",
                            session.status === "Approved"
                              ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/20"
                              : "bg-amber-500/5 text-amber-600 border-amber-500/20"
                          )}>
                            {session.status}
                          </span>
                        </td>
                        <td className="px-8 py-7 text-right">
                          {session.isRegistered ? (
                            <div className="flex items-center justify-end gap-2 text-emerald-600 font-bold">
                              <CheckCircle2 className="w-5 h-5" />
                              Registered
                            </div>
                          ) : (
                            <Button
                              className="h-10 px-6 rounded-xl bg-[#1e293b] hover:bg-[#0f172a] text-white shadow-lg shadow-slate-900/20 transition-all active:scale-[0.98] font-bold"
                              onClick={() => onRegister(session.id)}
                            >
                              Register Now
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center text-muted-foreground">
                            <Calendar className="w-8 h-8" />
                          </div>
                          <p className="text-muted-foreground font-bold italic">No sessions found for this selection.</p>
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
    </div>
  );
}

function CoursesView() {
  const { user } = useAuth();
  const userName = user?.fullName || "Teacher";
  const userEmail = user?.email || "";
  const [isMoocFormOpen, setIsMoocFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [downloadableCourses, setDownloadableCourses] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('downloadable_courses');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load downloadable courses", e);
      return [];
    }
  });

  const categories = Array.from(new Set(mockCourses.map(c => c.category)));

  // Convert downloadable courses to course format and merge with mock courses
  const downloadableCoursesFormatted = downloadableCourses.map(dc => ({
    id: `dc-${dc.id}`,
    title: dc.title,
    category: "Downloadable Course",
    hours: 0,
    duration: "Self-paced",
    instructor: dc.uploadedBy || "Admin",
    status: "recommended",
    progress: 0,
    rating: 0,
    students: 0,
    thumbnail: "/placeholder.svg",
    description: dc.description || "",
    url: dc.url,
    isDownloadable: true
  }));

  const allCourses = [...mockCourses, ...downloadableCoursesFormatted];
  const allCategories = Array.from(new Set(allCourses.map(c => c.category)));

  const filteredCourses = allCourses.filter(course => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === "all" || course.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Listen for downloadable course updates
  useEffect(() => {
    const handleCoursesUpdate = () => {
      try {
        const saved = localStorage.getItem('downloadable_courses');
        setDownloadableCourses(saved ? JSON.parse(saved) : []);
      } catch (e) {
        console.error("Failed to sync downloadable courses", e);
      }
    };

    window.addEventListener('downloadable-courses-updated', handleCoursesUpdate);
    return () => window.removeEventListener('downloadable-courses-updated', handleCoursesUpdate);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Course Catalogue"
          subtitle="Expand your knowledge with certified professional development courses"
        />
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsMoocFormOpen(true)} className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 mr-2">
            <PlusCircle className="w-4 h-4" />
            Submit MOOC Evidence
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9 w-[200px] lg:w-[300px]"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className={selectedCategory !== "all" ? "bg-accent text-accent-foreground border-accent" : ""}>
                <Filter className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedCategory("all")}>
                All Categories
              </DropdownMenuItem>
              {allCategories.map(category => (
                <DropdownMenuItem key={category} onClick={() => setSelectedCategory(category)}>
                  {category}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={isMoocFormOpen} onOpenChange={setIsMoocFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6 bg-background/95 backdrop-blur-xl border-none">
          {getActiveTemplateByType("Other", "MOOC") ? (
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-2xl font-bold">MOOC Submission (Master)</h2>
                <p className="text-muted-foreground italic">Submit your course evidence using the latest official form</p>
              </div>
              <DynamicForm
                fields={getActiveTemplateByType("Other", "MOOC")!.fields}
                submitLabel="Submit MOOC Evidence"
                onCancel={() => setIsMoocFormOpen(false)}
                onSubmit={(data) => {
                  toast.success("MOOC Evidence submitted successfully using Master Template!");
                  setIsMoocFormOpen(false);
                }}
              />
            </div>
          ) : (
            <MoocEvidenceForm
              onCancel={() => setIsMoocFormOpen(false)}
              onSubmitSuccess={() => setIsMoocFormOpen(false)}
              userEmail={userEmail}
              userName={userName}
            />
          )}
        </DialogContent>
      </Dialog>



      <div className="space-y-8">
        {/* In Progress */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Play className="w-5 h-5 text-primary fill-primary" />
            <h3 className="text-xl font-bold">Continue Learning</h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.filter(c => c.status === 'in-progress').map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>

        {/* Recommended */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <h3 className="text-xl font-bold">Recommended for You</h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.filter(c => c.status === 'recommended').map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>

        {/* Completed */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-emerald-500" />
            <h3 className="text-xl font-bold">Completed Courses</h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.filter(c => c.status === 'completed').map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      </div>
    </div >
  );
}

function CourseCard({ course }: { course: typeof mockCourses[0] & { isDownloadable?: boolean; url?: string } }) {
  return (
    <Card className="group hover:shadow-2xl transition-all duration-300 border-none bg-background/50 backdrop-blur-sm overflow-hidden flex flex-col">
      <div className={cn("h-32 w-full relative", course.thumbnail)}>
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-white/90 text-black border-none backdrop-blur-sm">
            {course.category}
          </Badge>
        </div>
      </div>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors cursor-pointer">
            {course.title}
          </CardTitle>
          <div className="flex items-center gap-1 text-sm font-bold text-yellow-600">
            <Star className="w-3 h-3 fill-yellow-600" />
            {course.rating}
          </div>
        </div>
        <CardDescription className="text-xs">By {course.instructor} • {course.duration}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-1">
        {course.status === 'in-progress' ? (
          <div className="space-y-2 mt-2">
            <div className="flex justify-between text-xs font-medium">
              <span>Progress</span>
              <span>{course.progress}%</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>
        ) : course.status === 'completed' ? (
          <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium mt-2">
            <CheckCircle2 className="w-4 h-4" />
            Course Completed
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            Master the essentials of {course.title.toLowerCase()} in this comprehensive guide.
          </p>
        )}
      </CardContent>
      <div className="p-4 pt-0">
        <Button
          className="w-full gap-2 group/btn"
          variant={course.status === 'in-progress' ? 'default' : 'outline'}
          onClick={() => {
            if (course.isDownloadable && course.url) {
              window.open(course.url, '_blank');
            }
          }}
        >
          {course.status === 'in-progress' ? 'Continue Lesson' : course.status === 'completed' ? 'Review Course' : 'Start Learning'}
          {course.isDownloadable ? <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" /> : <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />}
        </Button>
      </div>
    </Card>
  );
}

function PDHoursView({ pdHours, onOpenCreditDialog }: { pdHours: typeof mockPDHours, onOpenCreditDialog: () => void }) {
  const { user } = useAuth();
  const userName = user?.fullName || "Teacher";
  const [selectedActivity, setSelectedActivity] = useState<typeof mockPDHours.history[0] | null>(null);
  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(20);
    doc.text("Professional Development Activity Log", 14, 22);

    // Add date
    doc.setFontSize(11);
    doc.text(`Generated on: ${format(new Date(), "MMM d, yyyy")}`, 14, 30);

    // Add teacher info
    doc.text(`Teacher: ${userName}`, 14, 38);

    // Create table
    const tableColumn = ["Activity", "Category", "Date", "Hours", "Status"];
    const tableRows = pdHours.history.map(item => [
      item.activity,
      item.category,
      item.date,
      `${item.hours}h`,
      item.status
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      },
    });

    // Save the PDF
    doc.save("activity_history.pdf");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="PD Hours Tracking"
          subtitle="Monitor your professional development progress and claim credits"
        />
        <Button onClick={onOpenCreditDialog} className="gap-2">
          <PlusCircle className="w-4 h-4" />
          Request Credit
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Progress Card */}
        <Card className="lg:col-span-2 border-none shadow-xl bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Annual Progress</CardTitle>
            <CardDescription>You have completed {pdHours.total} of {pdHours.target} required hours</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Completion Status</span>
                <span>{Math.round((pdHours.total / pdHours.target) * 100)}%</span>
              </div>
              <div className="h-4 w-full bg-muted rounded-full overflow-hidden flex">
                {pdHours.categories.map((cat, idx) => (
                  <div
                    key={idx}
                    className={cn("h-full transition-all duration-500", cat.color)}
                    style={{ width: `${(cat.hours / pdHours.target) * 100}%` }}
                    title={`${cat.name}: ${cat.hours}h`}
                  />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {pdHours.categories.map((cat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <div className={cn("w-2 h-2 rounded-full", cat.color)} />
                    {cat.name}
                  </div>
                  <div className="text-lg font-bold">{cat.hours}h</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="space-y-4">
          <Card className="border-none shadow-lg bg-emerald-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-emerald-50/80 text-sm font-medium">Approved Hours</p>
                  <p className="text-3xl font-bold">{pdHours.total}h</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <FileCheck className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-lg bg-background/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-sm font-medium">Remaining Target</p>
                  <p className="text-3xl font-bold">{pdHours.target - pdHours.total}h</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* History Table */}
      <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-muted/50 pb-4">
          <div>
            <CardTitle className="text-xl font-bold">Activity History</CardTitle>
            <CardDescription>A detailed log of all your PD activities</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportPDF}>
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-muted/50">
                <TableHead className="w-[300px]">Activity</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pdHours.history.map((row) => (
                <TableRow key={row.id} className="group hover:bg-muted/30 border-muted/50 transition-colors">
                  <TableCell className="font-medium">{row.activity}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal text-xs">{row.category}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{row.date}</TableCell>
                  <TableCell className="text-right font-bold">{row.hours}h</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {row.status}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => setSelectedActivity(row)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Activity Detail Dialog */}
      {selectedActivity && (
        <Dialog open={!!selectedActivity} onOpenChange={() => setSelectedActivity(null)}>
          <DialogContent className="max-w-4xl bg-background/95 backdrop-blur-xl border-none">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Book className="w-6 h-6 text-primary" />
                Activity Details
              </DialogTitle>
              <DialogDescription>
                Comprehensive overview of your professional development activity
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 pt-4">
              {/* Header Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-none shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-50/80 text-xs font-medium mb-1">PD Hours</p>
                        <p className="text-2xl font-bold">{selectedActivity.hours}h</p>
                      </div>
                      <Clock className="w-8 h-8 text-blue-50/50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-50/80 text-xs font-medium mb-1">Enrolled</p>
                        <p className="text-2xl font-bold">{selectedActivity.enrolled || 'N/A'}</p>
                      </div>
                      <Users className="w-8 h-8 text-purple-50/50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className={cn(
                  "border-none shadow-lg text-white",
                  selectedActivity.status === "Approved"
                    ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                    : "bg-gradient-to-br from-amber-500 to-amber-600"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={cn(
                          "text-xs font-medium mb-1",
                          selectedActivity.status === "Approved" ? "text-emerald-50/80" : "text-amber-50/80"
                        )}>Status</p>
                        <p className="text-xl font-bold">{selectedActivity.status}</p>
                      </div>
                      <ShieldCheck className={cn(
                        "w-8 h-8",
                        selectedActivity.status === "Approved" ? "text-emerald-50/50" : "text-amber-50/50"
                      )} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Details */}
              <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Course Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Course Title</Label>
                      <p className="text-lg font-semibold text-foreground">{selectedActivity.activity}</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Category</Label>
                      <div>
                        <Badge className="text-sm py-1 px-3">{selectedActivity.category}</Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Instructor</Label>
                      <p className="text-base font-medium flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        {selectedActivity.instructor || 'Not Specified'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Date Completed</Label>
                      <p className="text-base font-medium flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {selectedActivity.date}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <DialogFooter className="flex justify-between items-center pt-4 border-t">
              <Button variant="outline" onClick={() => setSelectedActivity(null)}>
                Close
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Download Certificate
                </Button>
                <Button className="gap-2">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function InsightsView() {
  const { user } = useAuth();
  const userName = user?.fullName || "Teacher";
  const navigate = useNavigate();
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const handleDownloadPortfolio = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(22);
    doc.setTextColor(41, 128, 185);
    doc.text("Professional Growth Portfolio", 20, 20);

    // Subtitle
    doc.setFontSize(16);
    doc.setTextColor(100);
    doc.text(`${userName} - Teacher`, 20, 30);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 36);

    let yPos = 50;

    // Core Strengths Section
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Core Strengths", 20, yPos);
    yPos += 10;

    const strengthsData = mockInsights.strengths.map(s => [s.name, s.level, s.description]);
    autoTable(doc, {
      startY: yPos,
      head: [['Strength', 'Level', 'Description']],
      body: strengthsData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 10 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 20;

    // Skill Competencies Section
    doc.setFontSize(14);
    doc.text("Skill Competencies (Radar Data)", 20, yPos);
    yPos += 10;

    const skillsData = mockInsights.skills.map(s => [s.subject, s.A.toString(), s.B.toString(), s.fullMark.toString()]);
    autoTable(doc, {
      startY: yPos,
      head: [['Subject', 'Score (Growth)', 'Benchmark', 'Max Score']],
      body: skillsData,
      theme: 'striped',
      headStyles: { fillColor: [39, 174, 96] }, // Emerald color
    });

    yPos = (doc as any).lastAutoTable.finalY + 20;

    // Growth Trends Section
    doc.setFontSize(14);
    doc.text("Growth Trends (Cumulative Hours)", 20, yPos);
    yPos += 10;

    const growthData = mockInsights.growth.map(g => [g.month, `${g.hours}h`]);
    autoTable(doc, {
      startY: yPos,
      head: [['Month', 'Hours']],
      body: growthData,
      theme: 'plain',
      styles: { cellWidth: 50 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 20;

    // Recommendations Section
    doc.setFontSize(14);
    doc.text("Growth Recommendations", 20, yPos);
    yPos += 10;

    mockInsights.recommendations.forEach((rec) => {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`• ${rec.name} (${rec.focus})`, 25, yPos);
      yPos += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(rec.reason, 30, yPos);
      yPos += 10;
    });

    // Save
    doc.save("growth_portfolio.pdf");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Professional Insights"
          subtitle="Data-driven overview of your teaching competencies and growth"
        />
        <div className="flex items-center gap-2">
          <AIAnalysisModal
            isOpen={isAIModalOpen}
            onClose={() => setIsAIModalOpen(false)}
            data={{ insights: mockInsights }}
            type="teacher"
            title="Personalized Professional Growth Analysis"
          />
          <Button
            onClick={() => setIsAIModalOpen(true)}
            variant="outline"
            className="gap-2 bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 border-indigo-200 text-indigo-700 font-bold"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            AI Smart Insights
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleDownloadPortfolio}>
            <Download className="w-4 h-4" />
            Download Growth Portfolio
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Competency Radar */}
        <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Skill Competencies
            </CardTitle>
            <CardDescription>Based on observation scores and PD completions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={mockInsights.skills}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                  <Radar
                    name="Growth"
                    dataKey="A"
                    stroke="#2563eb"
                    fill="#2563eb"
                    fillOpacity={0.6}
                  />
                  <Radar
                    name="Benchmark"
                    dataKey="B"
                    stroke="#94a3b8"
                    fill="#94a3b8"
                    fillOpacity={0.2}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Growth Trend */}
        <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Professional Growth Trend
            </CardTitle>
            <CardDescription>Cumulative PD hours over the academic year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockInsights.growth}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="hours"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorHours)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Identified Strengths */}
        <Card className="lg:col-span-1 border-none shadow-xl bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <ShieldCheck className="w-5 h-5" />
              Core Strengths
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockInsights.strengths.map((strength, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-primary/5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{strength.name}</span>
                  <Badge className="bg-primary/20 text-primary border-none hover:bg-primary/20">{strength.level}</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{strength.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Personalized Actions */}
        <Card className="lg:col-span-2 border-none shadow-xl bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-600">
              <Sparkles className="w-5 h-5" />
              Growth Recommendations
            </CardTitle>
            <CardDescription>Targeted actions to reach the next competency level</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {mockInsights.recommendations.map((rec, idx) => (
                <div key={idx} onClick={() => navigate("/teacher/courses")} className="group p-5 rounded-2xl border border-muted/50 hover:bg-muted/30 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="font-semibold">{rec.focus}</Badge>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h4 className="font-bold mb-1">{rec.name}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{rec.reason}</p>
                </div>
              ))}
            </div>
            <div className="pt-2">
              <Button variant="link" onClick={() => navigate("/teacher/courses")} className="p-0 h-auto gap-2 text-primary font-bold group">
                Browse related courses
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
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
        We're working hard to bring you the best {title.toLowerCase()} experience.
        This module will be available in the next platform update.
      </p>
      <Button asChild>
        <Link to="/teacher">Return to Dashboard</Link>
      </Button>
    </div>
  );
}

interface NewGoal {
  title: string;
  description: string;
  dueDate: string;
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const userName = user?.fullName || "Teacher";
  const userEmail = user?.email || "";
  const role = user?.role || "TEACHER";

  const navigate = useNavigate();
  const [goals, setGoals] = useState(() => {
    try {
      const saved = localStorage.getItem('goals_data');
      return saved ? JSON.parse(saved) : initialGoals;
    } catch (e) {
      console.error("Failed to load goals", e);
      return initialGoals;
    }
  });
  const [events, setEvents] = useState(() => {
    try {
      const saved = localStorage.getItem('training_events_data');
      return saved ? JSON.parse(saved) : initialEvents;
    } catch (e) {
      console.error("Failed to load events", e);
      return initialEvents;
    }
  });
  const [observations, setObservations] = useState<Observation[]>([]);
  const [pdHours, setPdHours] = useState(() => {
    try {
      const moocSubmissions = localStorage.getItem('mooc_submissions');
      if (moocSubmissions) {
        const submissions = JSON.parse(moocSubmissions);
        const totalHours = submissions.reduce((acc: number, sub: any) => acc + Number(sub.hours || 0), 0);
        const historyFromSubmissions = submissions.map((sub: any, idx: number) => ({
          id: sub.id || idx + 100,
          activity: sub.courseName || "MOOC Evidence Submission",
          category: "Online Course",
          date: sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A",
          hours: Number(sub.hours || 0),
          status: "Pending"
        }));
        return {
          ...mockPDHours,
          total: mockPDHours.total + totalHours,
          history: [...mockPDHours.history, ...historyFromSubmissions]
        };
      }
      return mockPDHours;
    } catch (e) {
      console.error("Failed to load PD hours", e);
      return mockPDHours;
    }
  });
  const [selectedReflectObs, setSelectedReflectObs] = useState<Observation | null>(null);
  const [isCreditDialogOpen, setIsCreditDialogOpen] = useState(false);

  // Fetch initial data via API
  useEffect(() => {
    const fetchObservations = async () => {
      try {
        const response = await api.get('/observations');
        if (response.data?.status === 'success') {
          const apiObservations = response.data?.data?.observations || [];
          // Filter observations for the current teacher
          let teacherObservations = apiObservations.filter(
            (obs: Observation) => obs.teacherId === user?.id || obs.teacherEmail === userEmail || obs.teacher === userName
          );

          // If no observations in API, use mock data but personalize it
          if (teacherObservations.length === 0) {
            teacherObservations = mockObservations.map(obs => ({
              ...obs,
              teacher: userName,
              teacherEmail: userEmail
            }));
          }

          setObservations(teacherObservations);
        }
      } catch (error) {
        console.error("Failed to fetch observations:", error);
        // Fallback to personalized mock data
        setObservations(mockObservations.map(obs => ({
          ...obs,
          teacher: userName,
          teacherEmail: userEmail
        })));
      }
    };

    const fetchGoals = async () => {
      try {
        const response = await api.get('/goals');
        if (response.data?.status === 'success') {
          const apiGoals = response.data?.data?.goals || [];
          if (apiGoals.length > 0) {
            setGoals(apiGoals);
          } else {
            // Personalize initial goals if API returns nothing
            setGoals(initialGoals.map(g => ({
              ...g,
              teacher: userName
            })));
          }
        }
      } catch (error) {
        console.error("Failed to fetch goals:", error);
        setGoals(initialGoals.map(g => ({
          ...g,
          teacher: userName
        })));
      }
    };

    fetchObservations();
    fetchGoals();

    // Socket.io Real-time Sync
    const socket = getSocket();

    // Join room for this specific teacher
    socket.emit('join_room', user?.id || userName);

    socket.on('observation:created', (newObs: Observation) => {
      // Small security check: only add if it belongs to this teacher
      if (newObs.teacherId === user?.id || newObs.teacherEmail === userEmail || newObs.teacher === userName) {
        setObservations(prev => [newObs, ...prev]);
        toast.success(`You have a new observation report from ${newObs.observerName}!`);
        window.dispatchEvent(new Event('observations-updated'));
      }
    });

    socket.on('observation:updated', (updatedObs: Observation) => {
      if (updatedObs.teacherId === user?.id || updatedObs.teacherEmail === userEmail || (updatedObs.teacher as any)?.fullName === userName || updatedObs.teacher === userName) {
        // Map teacher if it's an object
        const mappedObs = {
          ...updatedObs,
          teacher: (updatedObs.teacher as any)?.fullName || updatedObs.teacher || updatedObs.teacherEmail || userName
        };
        setObservations(prev => prev.map(obs => obs.id === mappedObs.id ? mappedObs : obs));
        toast.info(`Observation report updated by ${updatedObs.observerName || 'School Leader'}`);
        window.dispatchEvent(new Event('observations-updated'));
      }
    });

    socket.on('goal:created', (newGoal: any) => {
      setGoals(prev => [newGoal, ...prev]);
      toast.success("A new goal has been assigned to you!");
    });

    socket.on('goal:updated', (updatedGoal: any) => {
      setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
    });

    return () => {
      socket.off('observation:created');
      socket.off('observation:updated');
      socket.off('goal:created');
      socket.off('goal:updated');
      socket.emit('leave_room', user?.id || userName);
    };
  }, [userName, userEmail, user?.id]);

  const handleReflect = (id: string, reflection: DetailedReflection) => {
    // In a real app, this would be an API call
    console.log("Saving reflection for observation:", id, reflection);
    setObservations(prev => prev.map(obs =>
      obs.id === id ? { ...obs, hasReflection: true, reflection: reflection.comments } : obs
    ));
    setSelectedReflectObs(null);
    toast.success("Reflection saved successfully!");
  };

  const handleReflectionSubmit = async (reflection: DetailedReflection) => {
    if (!selectedReflectObs) return;
    try {
      // Patch observation with reflection status
      await api.patch(`/observations/${selectedReflectObs.id}`, {
        hasReflection: true,
        teacherReflection: reflection.comments,
        detailedReflection: reflection, // Store the full detailed reflection
        status: "Submitted" // Mark as submitted after reflection
      });

      setObservations(prev => prev.map(obs =>
        obs.id === selectedReflectObs.id
          ? { ...obs, hasReflection: true, teacherReflection: reflection.comments, detailedReflection: reflection, status: "Submitted" }
          : obs
      ));
      setSelectedReflectObs(null);
      toast.success("Reflection submitted successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit reflection");
    }
  };

  const handleViewReport = (id: string) => {
    navigate(`/teacher/observations/${id}`);
  };

  useEffect(() => {
    localStorage.setItem('goals_data', JSON.stringify(goals));
  }, [goals]);

  // Sync training events to localStorage when changed (e.g., registration)
  useEffect(() => {
    localStorage.setItem('training_events_data', JSON.stringify(events));
    window.dispatchEvent(new Event('training-events-updated'));
  }, [events]);

  // Sync PD hours when MOOC submissions update
  useEffect(() => {
    const handleMoocUpdate = () => {
      try {
        const moocSubmissions = localStorage.getItem('mooc_submissions');
        if (moocSubmissions) {
          const submissions = JSON.parse(moocSubmissions);
          const totalHours = submissions.reduce((acc: number, sub: any) => acc + Number(sub.hours || 0), 0);
          const historyFromSubmissions = submissions.map((sub: any, idx: number) => ({
            id: sub.id || idx + 100,
            activity: sub.courseName || "MOOC Evidence Submission",
            category: "Online Course",
            date: sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A",
            hours: Number(sub.hours || 0),
            status: "Pending"
          }));
          setPdHours({
            ...mockPDHours,
            total: mockPDHours.total + totalHours,
            history: [...mockPDHours.history, ...historyFromSubmissions]
          });
        }
      } catch (err) {
        console.error("Failed to sync PD hours", err);
      }
    };

    window.addEventListener('mooc-submission-updated', handleMoocUpdate);
    return () => {
      window.removeEventListener('mooc-submission-updated', handleMoocUpdate);
    };
  }, []);




  const handleAddGoal = async (newGoal: NewGoal) => {
    try {
      const response = await api.post('/goals', newGoal);
      if (response.data.status === 'success') {
        const goal = response.data.data.goal;
        setGoals(prev => [...prev, goal]);
        toast.success("Goal added successfully!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to add goal");
    }
  };

  const handleRegister = async (eventId: string) => {
    try {
      // In a real app, this would be an API call: await api.post(`/training/${eventId}/register`);

      setEvents(prev => prev.map(event => {
        if (event.id === eventId) {
          toast.success(`Successfully registered for ${event.title}`);

          // Add current user to registrants list
          const newRegistrant = {
            id: user?.id || `u-${Date.now()}`,
            name: userName,
            email: userEmail,
            dateRegistered: format(new Date(), "MMM d, yyyy")
          };

          const updatedRegistrants = [...(event.registrants || []), newRegistrant];

          return {
            ...event,
            isRegistered: true,
            registered: (event.registered || 0) + 1,
            spotsLeft: (event.spotsLeft || 1) - 1,
            registrants: updatedRegistrants
          };
        }
        return event;
      }));
    } catch (error) {
      console.error(error);
      toast.error("Failed to register for event");
    }
  };

  // Filtered data for current user
  const userObservations = useMemo(() => {
    return observations.filter(o =>
      o.teacherId === user?.id ||
      o.teacher?.toLowerCase() === userName.toLowerCase() ||
      o.teacherEmail?.toLowerCase() === userEmail?.toLowerCase()
    );
  }, [observations, user?.id, userName, userEmail]);

  const userGoals = useMemo(() => {
    return goals.filter(g =>
      g.teacherId === user?.id ||
      g.teacher?.toLowerCase() === userName.toLowerCase()
    );
  }, [goals, user?.id, userName]);

  return (
    <DashboardLayout role={role.toLowerCase() as any} userName={userName}>
      <Routes>
        <Route index element={
          <DashboardOverview
            goals={userGoals}
            events={events}
            observations={userObservations}
            onRegister={handleRegister}
            onView={handleViewReport}
            onReflect={setSelectedReflectObs}
            userName={userName}
            pdHours={pdHours}
          />
        } />
        <Route path="observations" element={
          <ObservationsView
            observations={userObservations}
            onReflect={setSelectedReflectObs}
            onView={handleViewReport}
          />
        } />
        <Route path="observations/:id" element={<ObservationDetailView observations={userObservations} />} />
        <Route path="goals" element={<GoalsView goals={userGoals} onAddGoal={handleAddGoal} userName={userName} />} />
        <Route path="calendar" element={<CalendarView events={events} onRegister={handleRegister} />} />
        <Route path="courses" element={<CoursesView />} />
        <Route path="hours" element={<PDHoursView pdHours={pdHours} onOpenCreditDialog={() => setIsCreditDialogOpen(true)} />} />
        <Route path="documents" element={<AcknowledgementsView teacherId={user?.id || "unknown"} />} />
        <Route path="insights" element={<InsightsView />} />
        <Route path="profile" element={
          <TeacherProfileView
            teacher={{
              id: user?.id || "unknown",
              name: userName,
              role: user?.department ? `${user.department} Teacher` : "Teacher",
              observations: userObservations.length,
              lastObserved: userObservations[0]?.date || "N/A",
              avgScore: userObservations.length > 0
                ? Number((userObservations.reduce((acc, o) => acc + (o.score || 0), 0) / userObservations.length).toFixed(1))
                : 0,
              pdHours: pdHours.total,
              completionRate: userGoals.length > 0
                ? Math.round(userGoals.filter(g => g.progress === 100).length / userGoals.length * 100)
                : 85,
              email: userEmail,
              campus: user?.campusId || "Main Campus"
            }}
            observations={userObservations}
            goals={userGoals}
            userRole="teacher"
          />
        } />
      </Routes>

      {/* Reflection Dialog */}
      {selectedReflectObs && (
        <>
          {getActiveTemplateByType("Reflection") ? (
            <Dialog open={!!selectedReflectObs} onOpenChange={() => setSelectedReflectObs(null)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Teacher Self-Reflection (Master)</DialogTitle>
                  <DialogDescription>Based on the Ekya Danielson Framework</DialogDescription>
                </DialogHeader>
                <DynamicForm
                  fields={getActiveTemplateByType("Reflection")!.fields}
                  submitLabel="Submit Reflection"
                  onCancel={() => setSelectedReflectObs(null)}
                  onSubmit={(data) => {
                    const reflection: DetailedReflection = {
                      teacherName: userName,
                      teacherEmail: userEmail,
                      submissionDate: new Date().toISOString(),
                      sections: {
                        planning: {
                          id: "planning",
                          title: "Planning",
                          ratings: [
                            { indicator: "A1: Content and Pedagogy", rating: data.r1 as any },
                            { indicator: "A2: Knowledge of Students", rating: data.r2 as any },
                            { indicator: "A3: Knowledge of Resources", rating: data.r3 as any },
                            { indicator: "A4: Designing a Microplan", rating: data.r4 as any },
                            { indicator: "A5: Using Student Assessments", rating: data.r5 as any },
                          ],
                          evidence: data.r6 || "No evidence provided."
                        },
                        classroomEnvironment: {
                          id: "classroomEnvironment",
                          title: "Classroom Environment",
                          ratings: [
                            { indicator: "B1: Respect and Rapport", rating: data.r7 as any },
                            { indicator: "B2: Culture for Learning", rating: data.r8 as any },
                            { indicator: "B3: Classroom Procedures", rating: data.r9 as any },
                            { indicator: "B4: Student Behaviour", rating: data.r10 as any },
                          ],
                          evidence: data.r11 || "No evidence provided."
                        },
                        instruction: {
                          id: "instruction",
                          title: "Instruction",
                          ratings: [
                            { indicator: "B5: Communicating with Students", rating: data.r12 as any },
                            { indicator: "B6: Questioning and Discussion", rating: data.r13 as any },
                            { indicator: "B7: Engages in Student Learning", rating: data.r14 as any },
                            { indicator: "B8: Flexibility and Responsiveness", rating: data.r15 as any },
                          ],
                          evidence: data.r16 || "No evidence provided."
                        },
                        professionalism: {
                          id: "professionalism",
                          title: "Professionalism",
                          ratings: [
                            { indicator: "C1: Reflecting on Teaching", rating: data.r17 as any },
                            { indicator: "C2: Maintaining Accurate Records", rating: data.r18 as any },
                            { indicator: "C3: Communicating with Families", rating: data.r19 as any },
                            { indicator: "C4: Professional Community", rating: data.r20 as any },
                            { indicator: "C5: Growing Professionally", rating: data.r21 as any },
                          ],
                          evidence: data.r22 || "No evidence provided."
                        },
                        // Missing from Master Template, set empty
                        assessment: { id: "assessment", title: "Assessment", ratings: [], evidence: "Part of Section B1/B2 in Master Form" },
                        environment: { id: "environment", title: "Environment", ratings: [], evidence: "Part of Section B4/B1 in Master Form" },
                      },
                      strengths: data.r23 || "See details",
                      improvements: data.r24 || "See details",
                      goal: data.r25 || "Assigned by teacher",
                      comments: data.r26 || "Master form reflection submitted.",
                    };
                    handleReflectionSubmit(reflection);
                  }}
                />
              </DialogContent>
            </Dialog>
          ) : (
            <ReflectionForm
              isOpen={!!selectedReflectObs}
              onClose={() => setSelectedReflectObs(null)}
              onSubmit={handleReflectionSubmit}
              observation={selectedReflectObs}
              teacherName={userName}
              teacherEmail={userEmail}
            />
          )}
        </>
      )}

      {/* Credit Request Dialog */}
      <Dialog open={isCreditDialogOpen} onOpenChange={setIsCreditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6 bg-background/95 backdrop-blur-xl border-none">
          {getActiveTemplateByType("Other", "MOOC") ? (
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-2xl font-bold">Request PD Credit (Master)</h2>
                <p className="text-muted-foreground italic">Submit your professional development evidence using the latest official form</p>
              </div>
              <DynamicForm
                fields={getActiveTemplateByType("Other", "MOOC")!.fields}
                submitLabel="Submit Credit Request"
                onCancel={() => setIsCreditDialogOpen(false)}
                onSubmit={(data) => {
                  toast.success("PD Credit request submitted successfully using Master Template!");
                  setIsCreditDialogOpen(false);
                }}
              />
            </div>
          ) : (
            <MoocEvidenceForm
              onCancel={() => setIsCreditDialogOpen(false)}
              onSubmitSuccess={() => setIsCreditDialogOpen(false)}
              userEmail={userEmail}
              userName={userName}
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function ObservationDetailView({ observations }: { observations: Observation[] }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const observation = observations.find(o => o.id === id);

  if (!observation) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <FileCheck className="w-16 h-16 text-muted-foreground mb-4 opacity-20" />
        <h2 className="text-2xl font-bold">Observation not found</h2>
        <Button onClick={() => navigate("/teacher/observations")} className="mt-4">Back to Observations</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/teacher/observations")} className="print:hidden">
          <ChevronRight className="w-5 h-5 rotate-180" />
        </Button>
        <div className="flex flex-col md:flex-row md:items-center justify-between flex-1 gap-4">
          <PageHeader
            title="Observation Report"
            subtitle={`Ref: #OBS-${observation.id.toUpperCase()}`}
          />
          <div className="flex items-center gap-2">
            <AIAnalysisModal
              isOpen={isAIModalOpen}
              onClose={() => setIsAIModalOpen(false)}
              data={{ observation }}
              type="observation"
              title="Instructional Insight Analysis"
            />
            <Button
              onClick={() => setIsAIModalOpen(true)}
              size="sm"
              className="gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-lg shadow-indigo-500/20 font-bold border-none"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              AI Smart Analysis
            </Button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Assessment Card - Similar to Leader View but read-only for teacher */}
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
                    <span className="text-muted-foreground text-sm font-medium">{observation.date}</span>
                  </div>
                  <CardTitle className="text-3xl font-bold">Instructional Assessment</CardTitle>
                  {observation.learningArea && (
                    <div className="flex flex-wrap gap-3 mt-3">
                      <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 gap-1.5 pl-2 pr-3 py-1 text-xs font-semibold uppercase tracking-wider">
                        <Book className="w-3.5 h-3.5" />
                        Subject: {observation.learningArea}
                      </Badge>
                      {observation.classroom && (
                        <>
                          <Badge variant="outline" className="text-muted-foreground gap-1.5 font-medium">
                            <span className="font-bold text-foreground">Grade:</span> {observation.classroom.grade}
                          </Badge>
                          <Badge variant="outline" className="text-muted-foreground gap-1.5 font-medium">
                            <span className="font-bold text-foreground">Section:</span> {observation.classroom.section}
                          </Badge>
                          <Badge variant="outline" className="text-muted-foreground gap-1.5 font-medium">
                            <span className="font-bold text-foreground">Block:</span> {observation.classroom.block}
                          </Badge>
                        </>
                      )}
                    </div>
                  )}
                  {/* Domain Description */}
                  <div className="mt-4 p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground border border-muted-foreground/10">
                    <p className="flex gap-2">
                      <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                      <span>
                        <strong>About {observation.domain}:</strong> This domain evaluates the effectiveness of teaching strategies,
                        classroom engagement, and the alignment of activities with learning objectives.
                      </span>
                    </p>
                  </div>
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
                  <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Observer</p>
                  <p className="text-lg font-bold">{observation.observerName || "School Leader"}</p>
                  <p className="text-sm text-muted-foreground">{observation.observerRole || "Administrator"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Teacher</p>
                  <p className="text-lg font-bold">{observation.teacher || "Teacher One"}</p>
                </div>
              </div>

              {/* Power BI Style Data Visualization Section */}
              <div className="grid md:grid-cols-2 gap-6">
                {observation.strengths && (
                  <Card className="bg-success/5 border-success/20 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold uppercase tracking-wider text-success flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Strengths Observed
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-medium leading-relaxed text-foreground/90">
                        {observation.strengths}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {observation.improvements && (
                  <Card className="bg-orange-500/5 border-orange-500/20 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold uppercase tracking-wider text-orange-600 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Areas for Growth
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-medium leading-relaxed text-foreground/90">
                        {observation.improvements}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {observation.teachingStrategies && observation.teachingStrategies.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Strategies Observed
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {observation.teachingStrategies.map((strategy, idx) => (
                      <Badge key={idx} variant="secondary" className="px-3 py-1 text-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200">
                        {strategy}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}


              {/* Domain Specific Evidence */}
              {observation.domains && observation.domains.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-primary">
                    <ClipboardCheck className="w-5 h-5" />
                    Domain Evidence & Indicator Ratings
                  </h3>
                  <div className="grid gap-6">
                    {observation.domains.map((dom) => (
                      <Card key={dom.domainId} className="border-muted/30 shadow-sm overflow-hidden">
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
                                <Badge variant={ind.rating === "Highly Effective" ? "default" : ind.rating === "Effective" ? "secondary" : ind.rating === "Basic" ? "outline" : "outline"} className={cn(
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

              {/* Action Steps & Reflection */}
              <div className="grid md:grid-cols-2 gap-8">
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
                      Conversation Reflection
                    </h3>
                    <div className="p-6 rounded-2xl bg-amber-50 border border-amber-100 text-amber-900 leading-relaxed italic">
                      "{observation.teacherReflection}"
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Notes */}
              <div className="space-y-4 pt-4 border-t border-dashed">
                <h3 className="text-lg font-bold flex items-center gap-2 text-primary">
                  <FileCheck className="w-5 h-5" />
                  General Feedback & Notes
                </h3>
                <div className="p-6 rounded-2xl bg-muted/20 border border-muted-foreground/10 text-foreground leading-relaxed italic">
                  "{observation.notes || "No additional feedback provided."}"
                </div>
              </div>

              {/* Meta Tags / Focus Areas */}
              {observation.metaTags && observation.metaTags.length > 0 && (
                <div className="space-y-4 pt-4">
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

              {/* Teacher's Own Reflection Section */}
              {observation.detailedReflection ? (
                <div className="space-y-6 pt-6 border-t-[3px] border-dashed border-muted/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-info/10">
                      <MessageSquare className="w-6 h-6 text-info" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Your Reflection</h3>
                      <p className="text-sm text-muted-foreground">Self-assessment based on Ekya Danielson Framework</p>
                    </div>
                  </div>

                  <Card className="border-info/20 shadow-sm overflow-hidden bg-info/5">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 gap-4 p-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-background rounded-lg border shadow-sm">
                          <span className="block text-xs font-bold text-muted-foreground uppercase mb-1">Strengths</span>
                          <p className="font-medium text-sm">{observation.detailedReflection.strengths}</p>
                        </div>
                        <div className="p-4 bg-background rounded-lg border shadow-sm">
                          <span className="block text-xs font-bold text-muted-foreground uppercase mb-1">Growth Areas</span>
                          <p className="font-medium text-sm">{observation.detailedReflection.improvements}</p>
                        </div>
                        <div className="p-4 bg-background rounded-lg border shadow-sm">
                          <span className="block text-xs font-bold text-muted-foreground uppercase mb-1">Goal</span>
                          <p className="font-medium text-sm">{observation.detailedReflection.goal}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              ) : observation.hasReflection && (
                <div className="space-y-4 pt-6 border-t border-dashed">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-info">
                    <MessageSquare className="w-5 h-5" />
                    Your Reflection
                  </h3>
                  <div className="p-6 rounded-2xl bg-info/5 border border-info/10 text-foreground leading-relaxed">
                    "{observation.reflection}"
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          {/* Sidebar with Actions / Stats */}
          <Card className="border-none shadow-lg sticky top-6 print:hidden">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full gap-2" variant="outline" onClick={() => window.print()}>
                <Download className="w-4 h-4" />
                Download Report
              </Button>
              <div className="p-4 rounded-xl bg-muted/50 text-sm text-muted-foreground">
                If you have questions about this observation, please schedule a debrief with your observer.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

