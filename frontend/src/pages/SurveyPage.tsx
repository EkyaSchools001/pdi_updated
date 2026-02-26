import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { surveyService, Survey, SurveyResponse } from '@/services/surveyService';
import { SurveyWizard } from '@/components/survey/SurveyWizard';
import { SurveyResponseView } from '@/components/survey/SurveyResponseView';
import { SurveyAnalyticsDashboard } from '@/components/survey/SurveyAnalyticsDashboard';
import { SurveyHistoryView } from '@/components/survey/SurveyHistoryView';
import { Loader2, AlertCircle, ClipboardList } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const SurveyPage = () => {
    const { user } = useAuth();
    const [survey, setSurvey] = useState<Survey | null>(null);
    const [myResponse, setMyResponse] = useState<SurveyResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<'active' | 'history' | 'detail'>('active');
    const [selectedHistoryResponse, setSelectedHistoryResponse] = useState<SurveyResponse | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const fetchSurveyData = async () => {
        try {
            setLoading(true);
            const data = await surveyService.getActiveSurvey();
            setSurvey(data.survey);
            setMyResponse(data.myResponse || null);
            setIsEditing(false);
        } catch (err: any) {
            console.error(err);
            if (err.response?.status !== 404) {
                setError('Failed to load survey data.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSurveyData();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Loading survey data...</p>
            </div>
        );
    }

    if (['ADMIN', 'MANAGEMENT', 'SUPERADMIN'].includes(user?.role || '')) {
        if (!survey) {
            return (
                <div className="p-8">
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>No Active Surveys</AlertTitle>
                        <AlertDescription>
                            There are currently no active professional development surveys. Create one from the System Settings or Survey Management panel.
                        </AlertDescription>
                    </Alert>
                </div>
            );
        }
        return (
            <div className="p-6">
                <SurveyAnalyticsDashboard survey={survey} />
            </div>
        );
    }

    if (view === 'history') {
        return (
            <div className="p-6">
                <SurveyHistoryView
                    onViewResponse={(response) => {
                        setSelectedHistoryResponse(response);
                        setView('detail');
                    }}
                    onBack={() => setView('active')}
                />
            </div>
        );
    }

    if (view === 'detail' && selectedHistoryResponse) {
        return (
            <div className="p-6">
                <SurveyResponseView
                    survey={(selectedHistoryResponse as any).survey || survey}
                    response={selectedHistoryResponse}
                    onEdit={() => {
                        if (myResponse && myResponse.id === selectedHistoryResponse.id) {
                            setView('active');
                            setIsEditing(true);
                        } else {
                            alert("You can only edit the currently active survey response.");
                        }
                    }}
                />
                <div className="mt-4 text-center">
                    <Button variant="outline" onClick={() => setView('history')}>
                        Back to History
                    </Button>
                </div>
            </div>
        );
    }

    const Header = () => (
        <div className="flex justify-end mb-4 px-6 pt-4">
            <Button variant="outline" onClick={() => setView('history')}>
                <ClipboardList className="h-4 w-4 mr-2" /> View Submitted Responses
            </Button>
        </div>
    );

    if (!survey) {
        return (
            <div className="p-8">
                <Header />
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Active Surveys</AlertTitle>
                    <AlertDescription>
                        There are currently no active professional development surveys. Please check back later.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (myResponse?.isCompleted && !isEditing) {
        return (
            <div className="pb-6">
                <Header />
                <div className="px-6">
                    <SurveyResponseView
                        survey={survey}
                        response={myResponse}
                        onEdit={() => setIsEditing(true)}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen pb-6">
            <Header />
            <div className="px-6">
                <SurveyWizard
                    survey={survey}
                    initialAnswers={isEditing ? undefined : myResponse?.answers}
                    onComplete={fetchSurveyData}
                />
            </div>
        </div>
    );
};

export default SurveyPage;
