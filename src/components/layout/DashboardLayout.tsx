import { ReactNode, useState } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { Role } from "../RoleBadge";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, GraduationCap } from "lucide-react";
import { Button } from "../ui/button";

interface DashboardLayoutProps {
  children: ReactNode;
  role: Role;
  userName: string;
}

export function DashboardLayout({ children, role, userName }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row overflow-x-hidden">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-sidebar-border bg-sidebar h-16 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-sidebar-primary">
            <GraduationCap className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <span className="font-semibold text-sidebar-foreground">PD Platform</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-sidebar-foreground"
        >
          <Menu className="w-6 h-6" />
        </Button>
      </div>

      <DashboardSidebar
        role={role}
        userName={userName}
        collapsed={isMobile ? !mobileMenuOpen : collapsed}
        onToggle={isMobile ? () => setMobileMenuOpen(false) : () => setCollapsed(!collapsed)}
      />

      {/* Mobile Overlay */}
      {isMobile && mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 transition-opacity animate-in fade-in duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <main
        className={cn(
          "flex-1 transition-all duration-300 min-h-screen overflow-x-hidden print:ml-0",
          !isMobile && (collapsed ? "ml-16" : "ml-64")
        )}
      >
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
