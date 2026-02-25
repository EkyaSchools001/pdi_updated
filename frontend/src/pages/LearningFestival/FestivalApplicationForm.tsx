import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { learningFestivalService, LearningFestival, LearningFestivalApplication } from '@/services/learningFestivalService';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/layout/PageHeader';
import { ChevronLeft, Send, AlertCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';

export function FestivalApplicationForm() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [festival, setFestival] = useState<LearningFestival | null>(null);
    const [existingApp, setExistingApp] = useState<LearningFestivalApplication | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        statementOfPurpose: '',
        relevantExperience: '',
        preferredStrand: ''
    });

    useEffect(() => {
        const load = async () => {
            if (!id) return;
            try {
                const [fests, apps] = await Promise.all([
                    learningFestivalService.getFestivals(),
                    learningFestivalService.getApplications({ festivalId: id })
                ]);

                const fest = fests.find(f => f.id === id);
                if (fest) setFestival(fest);

                // apps should ideally return this user's app if role=TEACHER
                const myApp = apps.find(a => a.userId === user?.id);
                if (myApp) {
                    setExistingApp(myApp);
                    setFormData({
                        statementOfPurpose: myApp.statementOfPurpose || '',
                        relevantExperience: myApp.relevantExperience || '',
                        preferredStrand: myApp.preferredStrand || ''
                    });
                }
            } catch (error) {
                console.error(error);
                toast.error("Failed to load festival constraints.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, user?.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;

        setSubmitting(true);
        try {
            await learningFestivalService.applyToFestival(id, formData);
            toast.success("Application submitted successfully!");
            navigate('/teacher/festival');
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || "Failed to submit application");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    if (!festival) {
        return <div className="p-8 text-center">Festival not found.</div>;
    }

    const isReadOnly = !!existingApp;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-6 animate-in fade-in">
            <Button variant="ghost" onClick={() => navigate('/teacher/festival')} className="-ml-4 mb-4">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back to Festivals
            </Button>

            <PageHeader
                title={`Application: ${festival.name}`}
                subtitle={`Theme: ${festival.theme}`}
            />

            {existingApp && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-blue-900">Application Submitted</h4>
                        <p className="text-sm text-blue-800 mt-1">
                            Your application is currently marked as <strong>{existingApp.status}</strong>.
                        </p>
                        {existingApp.feedback && (
                            <div className="mt-3 p-3 bg-white/60 rounded-lg text-sm italic text-gray-700">
                                "{existingApp.feedback}"
                                <span className="block mt-1 text-xs text-gray-500 font-bold">- Reviewer Feedback</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <Card className="shadow-premium border-none">
                <CardHeader className="bg-primary/5 pb-8 border-b border-primary/10">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        Application Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-gray-600">Teacher Name</Label>
                                <div className="font-semibold text-lg">{user?.fullName}</div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-600">Campus</Label>
                                <div className="font-semibold text-lg">{user?.campusId || 'Main Campus'}</div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-bold">Preferred Learning Strand <span className="text-red-500">*</span></Label>
                            <Select
                                disabled={isReadOnly}
                                value={formData.preferredStrand}
                                onValueChange={(v) => setFormData({ ...formData, preferredStrand: v })}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a Strand" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Pedagogy Innovation">Pedagogy Innovation</SelectItem>
                                    <SelectItem value="Technology Integration">Technology Integration</SelectItem>
                                    <SelectItem value="Student Well-being">Student Well-being</SelectItem>
                                    <SelectItem value="Leadership in Class">Leadership in Class</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-bold">Statement of Purpose <span className="text-red-500">*</span></Label>
                            <p className="text-xs text-gray-500">Why do you want to participate in this Learning Festival and what do you hope to achieve?</p>
                            <Textarea
                                disabled={isReadOnly}
                                required
                                rows={5}
                                placeholder="Describe your goals and motivation..."
                                value={formData.statementOfPurpose}
                                onChange={(e) => setFormData({ ...formData, statementOfPurpose: e.target.value })}
                                className="resize-none"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-bold">Relevant Prior Experience</Label>
                            <p className="text-xs text-gray-500">Mention any previous PD courses or achievements related to your selected strand (Optional).</p>
                            <Textarea
                                disabled={isReadOnly}
                                rows={3}
                                placeholder="E.g., Completed Advanced Pedagogy Certification..."
                                value={formData.relevantExperience}
                                onChange={(e) => setFormData({ ...formData, relevantExperience: e.target.value })}
                                className="resize-none"
                            />
                        </div>

                        {!isReadOnly && (
                            <div className="pt-6 border-t mt-8 flex justify-end">
                                <Button type="submit" disabled={submitting} className="min-w-[150px] bg-primary hover:bg-primary/90">
                                    {submitting ? 'Submitting...' : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" />
                                            Submit Application
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
