import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm md:text-base text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
