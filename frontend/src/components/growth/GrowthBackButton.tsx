import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GrowthBackButtonProps {
    className?: string;
    fallbackRoute?: string;
}

export const GrowthBackButton: React.FC<GrowthBackButtonProps> = ({
    className,
    fallbackRoute = "/growth"
}) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleBack = () => {
        // 1. Check if we have a stored previous route in sessionStorage
        const storedRoute = sessionStorage.getItem("growth_previous_route");
        const storedQuery = sessionStorage.getItem("growth_previous_query");

        // 2. Determine if the previous route is valid and from the growth module
        // This is a safety check. If the user came from a non-growth page, we go to fallback.
        const isGrowthRoute = (route: string) =>
            route.includes("/growth") ||
            route.includes("/leader/") ||
            route.includes("/admin/growth");

        if (window.history.length > 1 && document.referrer.includes(window.location.host)) {
            // If there's history, try to go back
            navigate(-1);
        } else if (storedRoute && isGrowthRoute(storedRoute)) {
            // If we have a stored route, use it
            navigate(storedRoute + (storedQuery || ""));
        } else {
            // Ultimate fallback
            navigate(fallbackRoute);
        }
    };

    return (
        <div className={cn("flex items-center gap-2 mb-4", className)}>
            <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors p-0 h-auto"
            >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back</span>
            </Button>
            <div className="h-4 w-[1px] bg-slate-200 mx-1" />
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                <span>Growth Module</span>
                {location.pathname.split('/').filter(Boolean).slice(1).map((part, i) => (
                    <React.Fragment key={i}>
                        <span className="opacity-50">/</span>
                        <span className="opacity-80">{part.replace(/-/g, ' ')}</span>
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};
