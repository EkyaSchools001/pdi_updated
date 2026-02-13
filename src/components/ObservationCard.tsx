import { cn } from "@/lib/utils";
import { Calendar, User, Tag, MessageSquare, Eye, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";

interface ObservationCardProps {
  observation: {
    id: string;
    date: string;
    observerName?: string;
    observerRole?: string;
    domain: string;
    score?: number;
    notes?: string;
    hasReflection?: boolean;
    reflection?: string;
  };
  onReflect?: () => void;
  onView?: () => void;
  className?: string;
}

export function ObservationCard({ observation, onReflect, onView, className }: ObservationCardProps) {
  return (
    <div className={cn("dashboard-card p-5 group hover:border-primary/50 transition-all", className)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            {observation.date}
          </span>
        </div>
        {observation.score !== undefined && (
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-success/10 text-success font-bold">
            {observation.score}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{observation.observerName || "School Leader"}</span>
          <span className="text-muted-foreground">• {observation.observerRole || "Administrator"}</span>
        </div>

        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-muted-foreground" />
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
            {observation.domain}
          </span>
        </div>

        {observation.notes && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {observation.notes}
          </p>
        )}
      </div>

      <div className="mt-4 pt-4 border-t flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" onClick={onView} className="text-muted-foreground hover:text-primary gap-2 p-0 h-auto hover:bg-transparent">
          <Eye className="w-4 h-4" />
          View Full Report
        </Button>

        {observation.hasReflection ? (
          <div className="flex items-center gap-2 text-sm text-success font-medium bg-success/5 px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Reflected
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={onReflect} className="gap-1.5">
            <MessageSquare className="w-4 h-4" />
            Add Reflection
          </Button>
        )}
      </div>
    </div>
  );
}
