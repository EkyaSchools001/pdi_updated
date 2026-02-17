import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  LayoutDashboard,
  Eye,
  Target,
  Calendar,
  Book,
  Clock,
  Lightbulb,
  Users,
  FileText,
  FileCheck,
  Settings,
  LogOut,
  ChevronLeft,
  GraduationCap,
  TrendingUp,
  X,
  Building2,
  HeartPulse,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";
import { Role, RoleBadge } from "../RoleBadge";
import { Button } from "../ui/button";

interface DashboardSidebarProps {
  role: Role;
  userName: string;
  collapsed: boolean;
  onToggle: () => void;
}

const teacherNav = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/teacher" },
  { title: "Observations", icon: Eye, path: "/teacher/observations" },
  { title: "Goals", icon: Target, path: "/teacher/goals" },
  { title: "Training & PD Calendar", icon: Calendar, path: "/teacher/calendar" },
  { title: "Attendance", icon: ClipboardList, path: "/teacher/attendance" },
  { title: "Courses", icon: Book, path: "/teacher/courses" },
  { title: "PD Hours", icon: Clock, path: "/teacher/hours" },
  { title: "Documents", icon: FileCheck, path: "/teacher/documents" },
  { title: "Insights", icon: Lightbulb, path: "/teacher/insights" },
  { title: "My Profile", icon: Users, path: "/teacher/profile" },
];

const leaderNav = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/leader" },
  { title: "Observe Teacher", icon: Eye, path: "/leader/observe" },
  { title: "Team Overview", icon: Users, path: "/leader/team" },
  { title: "Set Goals", icon: Target, path: "/leader/goals" },
  { title: "PD Participation", icon: Clock, path: "/leader/participation" },
  { title: "Performance", icon: TrendingUp, path: "/leader/performance" },
  { title: "Training & PD Calendar", icon: Calendar, path: "/leader/calendar" },
  { title: "Attendance Register", icon: ClipboardList, path: "/leader/attendance" },
  { title: "Reports", icon: FileText, path: "/leader/reports" },
];

const adminNav = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { title: "User Management", icon: Users, path: "/admin/users" },
  { title: "Form Templates", icon: FileText, path: "/admin/forms" },
  { title: "Course Catalogue", icon: Book, path: "/admin/courses" },
  { title: "Training & PD Calendar", icon: Calendar, path: "/admin/calendar" },
  { title: "Attendance Register", icon: ClipboardList, path: "/admin/attendance" },
  { title: "Documents", icon: FileCheck, path: "/admin/documents" },
  { title: "Reports", icon: FileText, path: "/admin/reports" },
  { title: "Settings", icon: Settings, path: "/admin/settings" },
];

const managementNav = [
  { title: "Overview", icon: LayoutDashboard, path: "/management/overview" },
  { title: "PDI Health", icon: HeartPulse, path: "/management/pdi-health" },
  { title: "Campus Performance", icon: Building2, path: "/management/campus-performance" },
  { title: "Pillars", icon: Target, path: "/management/pillars" },
  { title: "PD Impact", icon: TrendingUp, path: "/management/pd-impact" },
  { title: "Leadership", icon: Users, path: "/management/leadership" },
  { title: "Risk & Intervention", icon: AlertTriangle, path: "/management/risk" },
  { title: "Reports", icon: FileText, path: "/management/reports" },
];

const navByRole = {
  teacher: teacherNav,
  leader: leaderNav,
  school_leader: leaderNav,
  admin: adminNav,
  superadmin: adminNav, // Use admin navigation for superadmin for now
  management: managementNav,
};

export function DashboardSidebar({ role, userName, collapsed, onToggle }: DashboardSidebarProps) {
  const location = useLocation();
  const isMobile = useIsMobile();
  const navItems = navByRole[role.toLowerCase() as keyof typeof navByRole];

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-[60] h-screen bg-sidebar transition-all duration-300 shadow-xl print:hidden",
        collapsed
          ? isMobile
            ? "-translate-x-full"
            : "w-16 translate-x-0"
          : "translate-x-0 w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border h-16">
          {(!collapsed || isMobile) && (
            <div className="flex items-center gap-2 animate-in fade-in duration-300">
              <div className="p-2 rounded-lg bg-sidebar-primary">
                <GraduationCap className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <span className="font-semibold text-sidebar-foreground truncate">PD Platform</span>
            </div>
          )}
          {collapsed && !isMobile && (
            <div className="mx-auto bg-sidebar-primary p-2 rounded-lg">
              <GraduationCap className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn(
              "text-sidebar-foreground hover:bg-sidebar-accent",
              collapsed && !isMobile && "absolute -right-3 top-20 bg-sidebar border border-sidebar-border rounded-full shadow-md z-50 h-6 w-6"
            )}
          >
            {isMobile ? (
              <X className="w-5 h-5" />
            ) : (
              <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
            )}
          </Button>
        </div>

        {/* User Info */}
        {!collapsed && (
          <div className="p-4 border-b border-sidebar-border animate-in fade-in duration-300">
            <p className="font-medium text-sidebar-foreground truncate">{userName}</p>
            <div className="mt-2">
              <RoleBadge role={role} />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-hide">
          {navItems.map((item) => {
            const rootPaths = ["/teacher", "/leader", "/admin", "/management"];
            const isActive = location.pathname === item.path || (!rootPaths.includes(item.path) && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  "text-sidebar-foreground hover:bg-sidebar-accent hover:translate-x-1",
                  isActive && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:translate-x-0 shadow-lg shadow-sidebar-primary/20"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0 transition-transform", !isActive && "group-hover:scale-110")} />
                {!collapsed && <span className="text-sm font-medium animate-in fade-in duration-300">{item.title}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border">
          <NavLink
            to="/"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
              "text-sidebar-foreground hover:bg-destructive hover:text-destructive-foreground"
            )}
          >
            <LogOut className="w-5 h-5 shrink-0 group-hover:rotate-180 transition-transform duration-500" />
            {!collapsed && <span className="text-sm font-medium animate-in fade-in duration-300">Sign Out</span>}
          </NavLink>
        </div>
      </div>
    </aside>
  );
}
