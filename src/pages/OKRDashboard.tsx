import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { okrService, OKRResponse, TeacherOKRData, HOSOKRData, AdminOKRData } from '@/services/okrService';
import { TeacherOKRView } from '@/components/okr/TeacherOKRView';
import { HOSOKRView } from '@/components/okr/HOSOKRView';
import { AdminOKRView } from '@/components/okr/AdminOKRView';
import { Loader2, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function OKRDashboard() {
    const { user } = useAuth();
    const [okrData, setOkrData] = useState<OKRResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const result = await okrService.getOKRData();
                setOkrData(result);
            } catch (err) {
                console.error('Failed to fetch OKR data:', err);
                setError('Failed to load OKR data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    if (!user) return null;

    const role = user.role;
    const layoutRole = (
        role === 'TEACHER' ? 'teacher' :
            role === 'SCHOOL_LEADER' || role === 'LEADER' ? 'leader' :
                role === 'MANAGEMENT' ? 'management' :
                    role === 'SUPERADMIN' ? 'superadmin' : 'admin'
    ) as any;

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-zinc-400 text-sm font-medium">Loading your OKR data...</p>
                </div>
            );
        }

        if (error || !okrData) {
            return (
                <Card className="border-none shadow-xl rounded-2xl">
                    <CardContent className="py-16 text-center">
                        <BarChart3 className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                        <p className="text-zinc-500 font-medium">{error || 'No data available.'}</p>
                    </CardContent>
                </Card>
            );
        }

        if (okrData.role === 'TEACHER') {
            return <TeacherOKRView data={okrData.data as TeacherOKRData} />;
        }
        if (okrData.role === 'HOS') {
            return <HOSOKRView data={okrData.data as HOSOKRData} />;
        }
        if (okrData.role === 'ADMIN' || okrData.role === 'MANAGEMENT') {
            return (
                <AdminOKRView
                    data={okrData.data as AdminOKRData}
                    isManagement={okrData.role === 'MANAGEMENT'}
                />
            );
        }

        return null;
    };

    return (
        <DashboardLayout role={layoutRole} userName={user.fullName}>
            <div className="space-y-6">
                <PageHeader
                    title="OKR Dashboard"
                    subtitle="Objectives & Key Results — role-specific performance indicators"
                />
                {renderContent()}
            </div>
        </DashboardLayout>
    );
}
