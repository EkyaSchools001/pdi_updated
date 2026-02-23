import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { learningFestivalService, LearningFestival, LearningFestivalApplication } from '@/services/learningFestivalService';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { Role } from '@/components/RoleBadge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { Calendar, Award, Clock, Target } from 'lucide-react';
import { format } from 'date-fns';

export function LearningFestivalPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [festivals, setFestivals] = useState<LearningFestival[]>([]);
    const [myApplications, setMyApplications] = useState<LearningFestivalApplication[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [fests, apps] = await Promise.all([
                learningFestivalService.getFestivals(),
                learningFestivalService.getApplications()
            ]);
            setFestivals(fests.filter(f => f.status === 'Upcoming' || f.status === 'Active'));
            setMyApplications(apps);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Draft': return <Badge variant="outline">Draft</Badge>;
            case 'Submitted': return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Submitted</Badge>;
            case 'Under Review': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Under Review</Badge>;
            case 'Shortlisted': return <Badge className="bg-green-600 hover:bg-green-700">Shortlisted</Badge>;
            case 'Confirmed': return <Badge className="bg-emerald-600 hover:bg-emerald-700">Confirmed</Badge>;
            case 'Rejected': return <Badge variant="destructive">Not Selected</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto px-4 py-8">
            <PageHeader
                title="Learning Festivals"
                subtitle="Discover upcoming professional learning events, apply to showcase your growth, and engage with the community."
            />

            {/* Active Festivals Section */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    Open for Application
                </h2>

                {festivals.length === 0 ? (
                    <Card className="bg-gray-50 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <Target className="w-12 h-12 text-gray-300 mb-4" />
                            <p className="text-gray-500 font-medium">No active Learning Festivals at the moment.</p>
                            <p className="text-sm text-gray-400 mt-1">Check back later for new opportunities to grow.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {festivals.map(festival => {
                            const application = myApplications.find(a => a.festivalId === festival.id);

                            return (
                                <Card key={festival.id} className="relative overflow-hidden hover:shadow-lg transition-all border-l-4 border-l-primary">
                                    <CardHeader className="pb-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                                {festival.theme}
                                            </Badge>
                                            {application && getStatusBadge(application.status)}
                                        </div>
                                        <CardTitle className="text-xl font-bold line-clamp-2">{festival.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <p className="text-sm text-muted-foreground line-clamp-3">
                                            {festival.description || 'Join our upcoming learning festival to showcase your journey.'}
                                        </p>

                                        <div className="space-y-2 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-primary opacity-70" />
                                                <span>{format(new Date(festival.startDate), 'MMM do, yyyy')} - {format(new Date(festival.endDate), 'MMM do, yyyy')}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-orange-500 opacity-70" />
                                                <span className="font-semibold text-orange-600">
                                                    Apply by: {format(new Date(festival.applyDeadline), 'MMM do, yyyy')}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t">
                                            {application ? (
                                                <Button variant="secondary" className="w-full" onClick={() => navigate(`/teacher/festival/${festival.id}/application`)}>
                                                    View My Application
                                                </Button>
                                            ) : (
                                                <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => navigate(`/teacher/festival/${festival.id}/apply`)}>
                                                    Apply Now
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* My History Section */}
            {myApplications.length > 0 && (
                <div className="space-y-6 pt-8">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                        <Clock className="w-5 h-5 text-gray-500" />
                        My Application History
                    </h2>
                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                                    <tr>
                                        <th className="px-6 py-4">Festival Name</th>
                                        <th className="px-6 py-4">Applied On</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {myApplications.map(app => (
                                        <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {app.festival?.name || 'Unknown Festival'}
                                                <div className="text-xs text-gray-500 mt-1">{app.festival?.theme}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {app.appliedAt ? format(new Date(app.appliedAt), 'MMM dd, yyyy') : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(app.status)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button variant="ghost" size="sm" onClick={() => navigate(`/teacher/festival/${app.festivalId}/application`)}>
                                                    View Details
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
