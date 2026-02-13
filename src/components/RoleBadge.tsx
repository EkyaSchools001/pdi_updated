import { cn } from "@/lib/utils";
import { GraduationCap, Users, Shield, Crown, Building2 } from "lucide-react";

export type Role = "teacher" | "leader" | "admin" | "superadmin" | "management";

interface RoleBadgeProps {
  role: Role;
  showIcon?: boolean;
  className?: string;
}

const roleConfig = {
  teacher: { label: "Teacher", icon: GraduationCap, className: "role-teacher" },
  leader: { label: "School Leader", icon: Users, className: "role-leader" },
  admin: { label: "Admin", icon: Shield, className: "role-admin" },
  superadmin: { label: "Superadmin", icon: Crown, className: "bg-purple-600/10 text-purple-600 border-purple-600/20" },
  management: { label: "Management", icon: Building2, className: "bg-blue-600/10 text-blue-600 border-blue-600/20" },
};

export function RoleBadge({ role, showIcon = true, className }: RoleBadgeProps) {
  const normalizedRole = (role?.toLowerCase() || "teacher") as keyof typeof roleConfig;
  const config = roleConfig[normalizedRole] || roleConfig.teacher;
  const Icon = config.icon;

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", config.className, className)}>
      {showIcon && <Icon className="w-3.5 h-3.5" />}
      {config.label}
    </span>
  );
}
