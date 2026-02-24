import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, TrendingUp, Info, BookOpen } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ObservationCard } from "@/components/ObservationCard";
import { ReflectionForm } from "@/components/ReflectionForm";
import api from "@/lib/api";
import { Observation, DetailedReflection } from "@/types/observation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const GrowthPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [observations, setObservations] = useState<Observation[]>([]);
    const [selectedReflectObs, setSelectedReflectObs] = useState<Observation | null>(null);

    useEffect(() => {
        if (user) {
            if (user.role === 'TEACHER') {
                fetchObservations();
            } else if (user.role === 'LEADER' || user.role === 'SCHOOL_LEADER') {
                navigate("/leader/growth");
            } else if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
                navigate("/admin/growth-analytics");
            } else {
                setLoading(false);
            }
        }
    }, [user, navigate]);

    const fetchObservations = async () => {
        try {
            const response = await api.get('/observations');
            if (response.data?.status === 'success') {
                const apiObservations = (response.data?.data?.observations || []).map((obs: any) => ({
                    ...obs,
                    teacher: obs.teacher?.fullName || obs.teacherEmail || 'Unknown Teacher'
                }));

                const teacherObservations = apiObservations.filter(
                    (obs: Observation) => obs.teacherId === user?.id || obs.teacherEmail === user?.email || obs.teacher === user?.fullName
                );
                setObservations(teacherObservations);
            }
        } catch (err) {
            console.error("Failed to fetch observations:", err);
            toast.error("Failed to load observations");
        } finally {
            setLoading(false);
        }
    };

    const handleReflectionSubmit = async (reflection: DetailedReflection) => {
        if (!selectedReflectObs) return;
        try {
            await api.patch(`/observations/${selectedReflectObs.id}`, {
                hasReflection: true,
                teacherReflection: reflection.comments,
                detailedReflection: reflection,
                status: "Submitted"
            });

            setObservations(prev => prev.map(obs =>
                obs.id === selectedReflectObs.id
                    ? { ...obs, hasReflection: true, teacherReflection: reflection.comments, detailedReflection: reflection, status: "Submitted" }
                    : obs
            ));
            setSelectedReflectObs(null);
            toast.success("Reflection submitted successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to submit reflection");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user || user.role !== 'TEACHER') {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold">Growth Module</h1>
                <p className="text-muted-foreground">Redirecting to appropriate dashboard...</p>
            </div>
        );
    }

    return (
        <DashboardLayout role={user.role.toLowerCase() as any} userName={user.fullName}>
            <div className="p-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col gap-1 mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">My Observations</h1>
                    <p className="text-muted-foreground">
                        Manage and reflect on your classroom observations
                    </p>
                </div>

                <div className="grid gap-8">
                    {/* Information Card about the Framework */}
                    <Card className="border-none shadow-sm bg-blue-50/50 border border-blue-100">
                        <CardContent className="p-6">
                            <div className="flex gap-4">
                                <div className="p-2 rounded-lg bg-blue-100 h-fit">
                                    <Info className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-blue-900">Ekya Danielson Framework</h3>
                                    <p className="text-sm text-blue-700 leading-relaxed">
                                        This dashboard utilizes the <strong>Unified Observation, Feedback & Improvement Form</strong>.
                                        It is a standard Danielson-based academic observation framework designed to support your professional growth through structured feedback and collaborative reflection.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Eye className="w-5 h-5 text-primary" />
                                Observation History
                            </h2>
                            <Badge variant="outline" className="font-medium">
                                {observations.length} Observations Recorded
                            </Badge>
                        </div>

                        <div className="grid gap-4">
                            {observations.length > 0 ? (
                                observations.map((obs) => (
                                    <ObservationCard
                                        key={obs.id}
                                        observation={obs}
                                        onReflect={() => setSelectedReflectObs(obs)}
                                        onView={() => navigate(`/teacher/observations/${obs.id}`)}
                                    />
                                ))
                            ) : (
                                <Card className="border-dashed py-12">
                                    <CardContent className="flex flex-col items-center justify-center text-center space-y-3">
                                        <div className="p-4 rounded-full bg-muted/50">
                                            <BookOpen className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium text-foreground">No observations yet</p>
                                            <p className="text-sm text-muted-foreground max-w-xs">
                                                Your classroom observations will appear here once they are recorded by your school leader.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {/* Reflection Dialog */}
            {selectedReflectObs && (
                <ReflectionForm
                    isOpen={!!selectedReflectObs}
                    onClose={() => setSelectedReflectObs(null)}
                    onSubmit={handleReflectionSubmit}
                    observation={selectedReflectObs}
                    teacherName={user.fullName}
                    teacherEmail={user.email || ""}
                />
            )}
        </DashboardLayout>
    );
};

export default GrowthPage;
