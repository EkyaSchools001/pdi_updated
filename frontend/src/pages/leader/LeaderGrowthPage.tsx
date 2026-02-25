import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { User, userService } from "@/services/userService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2, Users } from "lucide-react";
import TeacherSelection from "@/components/growth/TeacherSelection";
import CoreModules from "@/components/growth/CoreModules";
import NonCoreModules from "@/components/growth/NonCoreModules";
import { toast } from "sonner";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";

const LeaderGrowthPage = () => {
    const { user } = useAuth();
    if (!user) return null;

    const navigate = useNavigate();
    const { teacherId } = useParams();
    const [teachers, setTeachers] = useState<User[]>([]);
    const [selectedTeacher, setSelectedTeacher] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const data = await userService.getTeachers();
                setTeachers(data);

                const teacher = teacherId ? data.find(t => t.id === teacherId) : null;
                setSelectedTeacher(teacher || null);
            } catch (err) {
                toast.error("Failed to load teachers");
            } finally {
                setLoading(false);
            }
        };
        fetchTeachers();
    }, [teacherId]);

    const handleTeacherSelect = (teacher: User) => {
        navigate(`/leader/growth/${teacher.id}`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <DashboardLayout role={user.role.toLowerCase() as any} userName={user.fullName}>
            <div className="p-0 animate-in fade-in duration-500">
                {!selectedTeacher ? (
                    <>
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold tracking-tight">Growth Module</h1>
                            <p className="text-muted-foreground">Select a teacher to view their professional growth modules.</p>
                        </div>

                        <Card className="border-none shadow-none bg-transparent">
                            <CardHeader className="px-0">
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-primary" />
                                    Teachers Registry
                                </CardTitle>
                                <CardDescription>Select a teacher from your campus.</CardDescription>
                            </CardHeader>
                            <CardContent className="px-0">
                                <TeacherSelection teachers={teachers} onSelect={handleTeacherSelect} />
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <div className="animate-in slide-in-from-left-4 duration-500">
                        <Button
                            variant="ghost"
                            className="mb-6 -ml-2 text-muted-foreground hover:text-primary"
                            onClick={() => navigate("/leader/growth")}
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Back to Teachers List
                        </Button>

                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">{selectedTeacher.fullName}</h1>
                                <p className="text-muted-foreground font-medium">{selectedTeacher.department} • {selectedTeacher.academics === 'CORE' ? 'Core Academic' : 'Non-Core Academic'}</p>
                            </div>
                            <div className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm ${selectedTeacher.academics === 'CORE'
                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                : 'bg-purple-100 text-purple-700 border border-purple-200'
                                }`}>
                                {selectedTeacher.academics === 'CORE' ? 'Ekya ED Track' : 'Specialist Track'}
                            </div>
                        </div>

                        <section className="space-y-6">
                            <div className="flex items-center gap-2 pb-2 border-b">
                                <h2 className="text-xl font-semibold">Focused Growth Modules</h2>
                            </div>
                            {selectedTeacher.academics === 'CORE'
                                ? <CoreModules teacherId={selectedTeacher.id} />
                                : <NonCoreModules teacherId={selectedTeacher.id} />
                            }
                        </section>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default LeaderGrowthPage;
