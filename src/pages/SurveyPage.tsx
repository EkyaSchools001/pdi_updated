import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { surveyService, Survey, SurveyResponse } from '@/services/surveyService';
import { SurveyWizard } from '@/components/survey/SurveyWizard';
import { SurveyResponseView } from '@/components/survey/SurveyResponseView';
import { SurveyAnalyticsDashboard } from '@/components/survey/SurveyAnalyticsDashboard';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const SurveyPage = () => {
    const { user } = useAuth();
    const [survey, setSurvey] = useState<Survey | null>(null);
    const [myResponse, setMyResponse] = useState<SurveyResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSurveyData = async () => {
        try {
            setLoading(true);
            const data = await surveyService.getActiveSurvey();
            setSurvey(data.survey);
            setMyResponse(data.myResponse || null);
        } catch (err: any) {
            console.error(err);
            // Allow 404 for survey not found to just show empty state
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

    if (!survey) {
        return (
            <div className="p-8">
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

    // ROLE BASED RENDERING

    // 1. ADMIN / MANAGEMENT / SUPERADMIN -> Show Analytics Dashboard (and optionally preview)
    if (['ADMIN', 'MANAGEMENT', 'SUPERADMIN'].includes(user?.role || '')) {
        return (
            <div className="p-6">
                <SurveyAnalyticsDashboard survey={survey} />
            </div>
        );
    }

    // 2. TEACHER / LEADER (School Leader treated as Teacher for survey purposes per req)
    // If submitted, show response view
    if (myResponse?.isCompleted) {
        return (
            <div className="p-6">
                <SurveyResponseView survey={survey} response={myResponse} />
            </div>
        );
    }

    // 3. Otherwise show Wizard
    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <SurveyWizard
                survey={survey}
                initialAnswers={myResponse?.answers} // Pass draft answers if any
                onComplete={fetchSurveyData}
            />
        </div>
    );
};

export default SurveyPage;
