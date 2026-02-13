import { cn } from "@/lib/utils";
import { Calendar, MapPin, Users, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { CheckCircle2 as CheckIcon } from "lucide-react";

interface TrainingEventCardProps {
  event: {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    topic: string;
    spotsLeft: number;
    isRegistered?: boolean;
  };
  onRegister?: () => void;
  className?: string;
}

export function TrainingEventCard({ event, onRegister, className }: TrainingEventCardProps) {
  return (
    <div className={cn("bg-card rounded-[2rem] p-8 border border-muted/20 shadow-xl space-y-6 transition-all hover:shadow-2xl", className)}>
      <div className="flex items-start justify-between">
        <Badge variant="secondary" className="bg-info/10 text-info border-none px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider">
          {event.topic || (event as any).type}
        </Badge>
      </div>

      <h3 className="text-xl font-bold text-foreground leading-tight">{event.title}</h3>

      <div className="space-y-4">
        <div className="flex items-center gap-3 text-muted-foreground group">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
            <Calendar className="w-4 h-4" />
          </div>
          <span className="font-medium">{event.date}</span>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground group">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
            <Clock className="w-4 h-4" />
          </div>
          <span className="font-medium">{event.time}</span>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground group">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
            <MapPin className="w-4 h-4" />
          </div>
          <span className="font-medium">{event.location}</span>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground group">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
            <Users className="w-4 h-4" />
          </div>
          <span className="font-medium">{event.spotsLeft} spots left</span>
        </div>
      </div>

      <div className="pt-6 border-t border-muted/50">
        {event.isRegistered ? (
          <Button variant="outline" className="w-full h-14 rounded-2xl text-lg font-bold border-2 border-emerald-500 text-emerald-600 cursor-default" disabled>
            <CheckCircle2 className="mr-2 w-6 h-6" />
            Registered
          </Button>
        ) : (
          <Button
            className="w-full h-14 rounded-2xl text-lg font-bold bg-[#1e293b] hover:bg-[#0f172a] text-white shadow-lg shadow-slate-900/20 transition-all active:scale-[0.98]"
            onClick={onRegister}
          >
            Register Now
          </Button>
        )}
      </div>
    </div>
  );
}
