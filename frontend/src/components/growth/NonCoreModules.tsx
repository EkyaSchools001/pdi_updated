import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Activity, Palette, Heart, MessageSquare, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NonCoreModulesProps {
    teacherId?: string;
    teacherName?: string;
    teacherEmail?: string;
}

const NonCoreModules: React.FC<NonCoreModulesProps> = ({ teacherId, teacherName, teacherEmail }) => {
    const navigate = useNavigate();

    const getPath = (basePath: string) => {
        const params = new URLSearchParams();
        if (teacherId) params.set("teacherId", teacherId);
        if (teacherName) params.set("teacherName", teacherName);
        if (teacherEmail) params.set("teacherEmail", teacherEmail);
        const queryString = params.toString();
        return queryString ? `${basePath}?${queryString}` : basePath;
    };

    const modules = [
        {
            title: "Quick Feedback Master",
            description: "Fast, actionable feedback loops for non-core subjects.",
            icon: MessageSquare,
            path: getPath("/leader/quick-feedback"),
            color: "bg-indigo-500",
            disabled: false,
        },
        {
            title: "Performing Arts Observation",
            description: "Music, Dance, and Drama specialized observation master.",
            icon: Music,
            path: getPath("/leader/performing-arts-obs"),
            color: "bg-purple-500",
            disabled: false,
        },
        {
            title: "Life Skills Observation",
            description: "Evaluating soft skills and student wellbeing facilitators.",
            icon: Heart,
            path: getPath("/leader/life-skills-obs"),
            color: "bg-rose-500",
            disabled: false,
        },
        {
            title: "Physical Education Observation",
            description: "Sports and physical health instruction framework.",
            icon: Activity,
            path: getPath("/leader/pe-obs"),
            color: "bg-green-500",
            disabled: false,
        },
        {
            title: "Visual Arts Observation",
            description: "Fine arts, craftsmanship, and visual literacy assessment.",
            icon: Palette,
            path: getPath("/leader/va-obs"),
            color: "bg-orange-500",
            disabled: false,
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => (
                <Card
                    key={module.title}
                    className={`transition-all duration-300 border-l-4 border-l-primary hover:shadow-lg group`}
                >
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div
                            className={`p-3 rounded-xl text-white ${module.color} group-hover:scale-110 transition-transform`}
                        >
                            <module.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">{module.title}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <CardDescription className="mb-4 h-10 overflow-hidden line-clamp-2">
                            {module.description}
                        </CardDescription>
                        <Button
                            className="w-full justify-between"
                            variant="outline"
                            disabled={module.disabled}
                            onClick={module.disabled ? undefined : () => navigate(module.path)}
                        >
                            {module.disabled ? "Coming Soon" : "Access Module"}
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default NonCoreModules;
