import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Calendar as CalendarIcon, Clock, Lock, Unlock, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface GoalWindow {
    phase: string;
    status: 'OPEN' | 'CLOSED';
    startDate?: string;
    endDate?: string;
}

export const GoalGovernance = () => {
    const [windows, setWindows] = useState<GoalWindow[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchWindows = async () => {
        try {
            const res = await api.get('/goal-windows');
            if (res.data.status === 'success') {
                setWindows(res.data.data.windows);
            }
        } catch (err) {
            toast.error("Failed to fetch windows");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchWindows();
    }, []);

    const handleUpdateWindow = async (phase: string, data: Partial<GoalWindow>) => {
        try {
            const res = await api.patch(`/goal-windows/${phase}`, data);
            if (res.data.status === 'success') {
                toast.success(`${phase.replace('_', ' ')} window updated`);
                fetchWindows();
            }
        } catch (err) {
            toast.error("Update failed");
        }
    };

    const notifyTeachers = async () => {
        try {
            await api.post('/goals/notify-window-open');
            toast.success("Notifications sent to all teachers");
        } catch (err) {
            toast.error("Failed to send notifications");
        }
    };

    if (isLoading) return <div className="p-8 text-center"><RefreshCw className="animate-spin inline-block mr-2" /> Loading windows...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-info bg-clip-text text-transparent">Workflow Governance</h3>
                    <p className="text-sm text-muted-foreground">Manage active windows for form submissions</p>
                </div>
                <Button variant="outline" size="sm" onClick={notifyTeachers} className="gap-2">
                    <Clock className="w-4 h-4" />
                    Notify Teachers
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {windows.map((win) => (
                    <Card key={win.phase} className="border-none shadow-lg bg-background/50 backdrop-blur-sm overflow-hidden group">
                        <div className={`h-1 w-full ${win.status === 'OPEN' ? 'bg-emerald-500' : 'bg-muted'}`} />
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-base font-bold text-foreground">
                                    {win.phase.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                                </CardTitle>
                                <Badge variant={win.status === 'OPEN' ? 'outline' : 'secondary'} className="rounded-md">
                                    {win.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-2">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="space-y-1">
                                    <Label className="text-[10px] text-muted-foreground uppercase">Start Date</Label>
                                    <Input
                                        type="date"
                                        className="h-7 text-xs px-1"
                                        value={win.startDate ? format(new Date(win.startDate), 'yyyy-MM-dd') : ''}
                                        onChange={(e) => handleUpdateWindow(win.phase, { startDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] text-muted-foreground uppercase">End Date</Label>
                                    <Input
                                        type="date"
                                        className="h-7 text-xs px-1"
                                        value={win.endDate ? format(new Date(win.endDate), 'yyyy-MM-dd') : ''}
                                        onChange={(e) => handleUpdateWindow(win.phase, { endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <Button
                                variant={win.status === 'OPEN' ? 'outline' : 'default'}
                                size="sm"
                                className="w-full h-8 gap-2"
                                onClick={() => handleUpdateWindow(win.phase, { status: win.status === 'OPEN' ? 'CLOSED' : 'OPEN' })}
                            >
                                {win.status === 'OPEN' ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                {win.status === 'OPEN' ? 'Close Window' : 'Open Window'}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};
