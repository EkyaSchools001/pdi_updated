import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Activity, Palette, Heart, MessageSquare, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NonCoreModulesProps {
    teacherId?: string;
}

const NonCoreModules: React.FC<NonCoreModulesProps> = ({ teacherId }) => {
    const navigate = useNavigate();

    const modules = [
        {
            title: "Quick Feedback Master",
            description: "Fast, actionable feedback loops for non-core subjects.",
            icon: MessageSquare,
            path: teacherId ? `/leader/quick-feedback/${teacherId}` : "/leader/quick-feedback",
            color: "bg-indigo-500",
        },
        {
            title: "Performing Arts Observation",
            description: "Music, Dance, and Drama specialized observation master.",
            icon: Music,
            path: teacherId ? `/leader/observe?teacherId=${teacherId}&template=performing-arts` : "/teacher/observations",
            color: "bg-purple-500",
        },
        {
            title: "Life Skills Observation",
            description: "Evaluating soft skills and student wellbeing facilitators.",
            icon: Heart,
            path: teacherId ? `/leader/observe?teacherId=${teacherId}&template=life-skills` : "/teacher/observations",
            color: "bg-rose-500",
        },
        {
            title: "Physical Education Observation",
            description: "Sports and physical health instruction framework.",
            icon: Activity,
            path: teacherId ? `/leader/observe?teacherId=${teacherId}&template=pe` : "/teacher/observations",
            color: "bg-green-500",
        },
        {
            title: "Visual Arts Observation",
            description: "Fine arts, craftsmanship, and visual literacy assessment.",
            icon: Palette,
            path: teacherId ? `/leader/observe?teacherId=${teacherId}&template=visual-arts` : "/teacher/observations",
            color: "bg-orange-500",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => (
                <Card key={module.title} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary group">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className={`p-3 rounded-xl ${module.color} text-white group-hover:scale-110 transition-transform`}>
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
                            onClick={() => navigate(module.path)}
                        >
                            Access Module
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default NonCoreModules;
