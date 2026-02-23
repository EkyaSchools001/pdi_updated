import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Loader2, Download, Filter } from 'lucide-react';
import { surveyService, Survey, SurveyAnalytics } from '@/services/surveyService';
import { toast } from 'sonner';
import { SurveyManagementView } from './SurveyManagementView';
import { useAuth } from '@/hooks/useAuth';

interface SurveyAnalyticsDashboardProps {
    survey: Survey;
}

export const SurveyAnalyticsDashboard = ({ survey }: SurveyAnalyticsDashboardProps) => {
    const { user } = useAuth();
    const [analytics, setAnalytics] = useState<SurveyAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedCampus, setSelectedCampus] = useState<string>('All');

    useEffect(() => {
        fetchAnalytics();
    }, [survey.id]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const data = await surveyService.getAnalytics(survey.id);
            setAnalytics(data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (!analytics) return <div>No data available</div>;

    // Transform data for charts
    const completionData = analytics.completionStats.filter(s => selectedCampus === 'All' || s.campus === selectedCampus);

    // Leadership Support (Assuming Q11 is leadership/observation feedback related based on prompt)
    // Actually, prompt says "Average Leadership Support Score (From Q11 rating)" which is "Rate effectiveness of classroom observation feedback"
    // Let's find Q11 in questionStats
    const leadershipQuestion = analytics.questionStats.find(q => q.question.includes('observation feedback'));

    // Refresh function for the management view
    const handleSurveyUpdate = () => {
        fetchAnalytics(); // Re-fetch data which includes questions
    };

    const handleExport = async () => {
        try {
            toast.info('Generating CSV...');
            const blob = await surveyService.exportResults(survey.id);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `survey_results_${survey.id}.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            toast.success('Download started');
        } catch (error) {
            console.error(error);
            toast.error('Failed to export CSV');
        }
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
                <div>
                    <h2 className="text-xl font-bold">Survey: {survey.title}</h2>
                    <p className="text-sm text-muted-foreground">{survey.academicYear} Term {survey.term}</p>
                </div>
                <div className="flex gap-2">
                    <Select value={selectedCampus} onValueChange={setSelectedCampus}>
                        <SelectTrigger className="w-[180px]">
                            <Filter className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Filter Campus" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Campuses</SelectItem>
                            {analytics.completionStats.map(s => (
                                <SelectItem key={s.campus} value={s.campus}>{s.campus}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" /> Export CSV
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="analytics" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="analytics">Analytics Dashboard</TabsTrigger>
                    {['ADMIN', 'SUPERADMIN'].includes(user?.role || '') && (
                        <TabsTrigger value="questions">Manage Questions</TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="analytics" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Completion Rate Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Survey Completion Rate</CardTitle>
                                <CardDescription>Percentage of teachers who completed the survey</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={completionData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="campus" />
                                        <YAxis domain={[0, 100]} />
                                        <Tooltip />
                                        <Bar dataKey="rate" name="Completion %" fill="#8884d8">
                                            {completionData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Leadership/Observation Feedback Score */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Leadership Support Score</CardTitle>
                                <CardDescription>Avg. rating for observation feedback (1-5)</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                {leadershipQuestion ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={leadershipQuestion.data.filter(d => selectedCampus === 'All' || d.campus === selectedCampus)}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="campus" />
                                            <YAxis domain={[0, 5]} />
                                            <Tooltip />
                                            <Bar dataKey="avg" name="Avg Score" fill="#82ca9d" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        Metric not found
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* All Metrics Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Detailed Metrics by Question</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {analytics.questionStats.map((q, i) => (
                                    <div key={i} className="space-y-2">
                                        <h4 className="font-semibold text-sm">{q.question}</h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                            {q.data.filter(d => selectedCampus === 'All' || d.campus === selectedCampus).map(d => (
                                                <div key={d.campus} className="bg-secondary/20 p-2 rounded text-xs">
                                                    <span className="font-medium">{d.campus}:</span> {d.avg.toFixed(1)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {['ADMIN', 'SUPERADMIN'].includes(user?.role || '') && (
                    <TabsContent value="questions">
                        {/* Lazy load or just render */}
                        <SurveyManagementView survey={survey} onUpdate={handleSurveyUpdate} />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
};
