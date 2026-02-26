import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { User, userService } from "@/services/userService";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import { UnifiedObservationForm } from "@/components/UnifiedObservationForm";
import { useAuth } from "@/hooks/useAuth";
import { GrowthLayout } from "@/components/growth/GrowthLayout";
import api from "@/lib/api";
import { toast } from "sonner";
import { Observation } from "@/types/observation";

const DanielsonFrameworkPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { teacherId: paramTeacherId } = useParams();
    const [searchParams] = useSearchParams();
    const teacherId = paramTeacherId || searchParams.get("teacherId");


    const [teachers, setTeachers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [initialData, setInitialData] = useState<Partial<Observation>>({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const fetchedTeachers = await userService.getTeachers();
                setTeachers(fetchedTeachers);

                if (teacherId) {
                    const selectedTeacher = fetchedTeachers.find(t => t.id === teacherId);
                    if (selectedTeacher) {
                        setInitialData({
                            teacherId: selectedTeacher.id,
                            teacher: selectedTeacher.fullName,
                            teacherEmail: selectedTeacher.email,
                            campus: selectedTeacher.campus,
                        });
                    }
                }
            } catch (err) {
                console.error("Failed to fetch dashboard data:", err);
                toast.error("Failed to load required data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [teacherId]);

    if (!user) return null;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const formattedTeachers = teachers.map(t => ({
        id: t.id,
        name: t.fullName,
        role: t.role,
        email: t.email,
        academics: t.academics
    }));

    return (
        <DashboardLayout role={user.role.toLowerCase() as any} userName={user.fullName}>
            <GrowthLayout allowedRoles={['LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN']}>
                <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="flex items-center gap-4 mb-8">
                        <PageHeader
                            title="Ekya Danielson Framework"
                            subtitle="Unified Observation, Feedback & Improvement Form"
                        />
                    </div>

                    <div className="max-w-5xl mx-auto">
                        <UnifiedObservationForm
                            teachers={formattedTeachers}
                            initialData={initialData}
                            onCancel={() => navigate(teacherId ? `/leader/danielson-framework?teacherId=${teacherId}` : "/leader/danielson-framework")}
                            onSubmit={async (data) => {
                                try {
                                    const payload = {
                                        teacherId: data.teacherId,
                                        moduleType: "DANIELSON",
                                        academicYear: "AY 25-26",
                                        formPayload: data,
                                        status: "SUBMITTED"
                                    };

                                    await api.post('/growth/observations', payload);
                                    toast.success(`Observation for ${data.teacher} recorded successfully!`);
                                    navigate(`/leader/growth/${data.teacherId}`);
                                } catch (error) {
                                    console.error("Failed to save observation:", error);
                                    toast.error("Failed to save observation");
                                }
                            }}
                        />
                    </div>
                </div>
            </GrowthLayout>
        </DashboardLayout>
    );
};

export default DanielsonFrameworkPage;
