import { cn } from "@/lib/utils";
import { Target, Calendar, User } from "lucide-react";
import { Progress } from "./ui/progress";

interface GoalCardProps {
  goal: {
    id: string;
    title: string;
    description?: string;
    actionStep?: string;
    pillar?: string;
    category?: string;
    progress: number;
    dueDate: string;
    assignedBy?: string;
    isSchoolAligned?: boolean;
    teacher?: string;
    reflectionCompleted?: boolean;
    selfReflectionForm?: string;
    goalSettingForm?: string;
    goalCompletionForm?: string;
    academics?: string;
  };
  onReflect?: () => void;
  className?: string;
}

export function GoalCard({ goal, onReflect, className }: GoalCardProps) {
  return (
    <div className={cn("dashboard-card p-5 relative", className)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-accent/10">
            <Target className="w-4 h-4 text-accent" />
          </div>
          {goal.isSchoolAligned && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-info/10 text-info font-medium">
              School Priority
            </span>
          )}
          {goal.reflectionCompleted && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
              Reflected
            </span>
          )}
          {(goal.pillar || goal.category) && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {goal.pillar || goal.category}
            </span>
          )}
          {goal.academics && (
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider",
              goal.academics === "CORE" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
            )}>
              {goal.academics === "NON_CORE" ? "Non-Core Track" : "Core Track"}
            </span>
          )}
        </div>
      </div>

      <h3 className="font-semibold text-foreground mb-2">{goal.title}</h3>
      {goal.description && (
        <div className="mb-4">
          {goal.assignedBy && <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Rationale</p>}
          <p className="text-sm text-muted-foreground leading-relaxed">{goal.description}</p>
        </div>
      )}

      {goal.actionStep && (
        <div className="mb-4 p-3 bg-muted/30 rounded-md border border-muted-foreground/10">
          <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Action Step</p>
          <p className="text-sm italic">{goal.actionStep}</p>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{goal.progress}%</span>
        </div>
        <Progress value={goal.progress} className="h-2" />
      </div>

      <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          Due: {goal.dueDate}
        </span>
        {goal.assignedBy && (
          <span className="flex items-center gap-1.5">
            <User className="w-4 h-4" />
            {goal.assignedBy}
          </span>
        )}
      </div>

      {onReflect && (
        <div className="mt-4 pt-4 border-t flex justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); onReflect(); }}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-colors border",
              goal.selfReflectionForm
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {goal.selfReflectionForm ? "View Reflection" : "Self Reflection"}
          </button>
        </div>
      )}
    </div>
  );
}
