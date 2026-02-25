import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

export const useObservations = () => {
    const [observations, setObservations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchObservations = async () => {
        setLoading(true);
        try {
            const response = await api.get('/observations');
            setObservations(response.data.data.observations);
        } catch (error) {
            console.error('Error fetching observations:', error);
        } finally {
            setLoading(false);
        }
    };

    const createObservation = async (data: any) => {
        try {
            const response = await api.post('/observations', data);
            setObservations((prev) => [response.data.data.observation, ...prev]);
            toast.success('Observation submitted successfully');
            return response.data.data.observation;
        } catch (error) {
            console.error('Error creating observation:', error);
            throw error;
        }
    };

    useEffect(() => {
        fetchObservations();
    }, []);

    return { observations, loading, fetchObservations, createObservation };
};

export const useGoals = () => {
    const [goals, setGoals] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchGoals = async () => {
        setLoading(true);
        try {
            const response = await api.get('/goals');
            setGoals(response.data.data.goals);
        } catch (error) {
            console.error('Error fetching goals:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateGoalProgress = async (goalId: string, progress: number) => {
        try {
            await api.patch(`/goals/${goalId}`, { progress });
            setGoals((prev) =>
                prev.map((g) => (g.id === goalId ? { ...g, progress } : g))
            );
            toast.success('Goal progress updated');
        } catch (error) {
            console.error('Error updating goal:', error);
        }
    };

    useEffect(() => {
        fetchGoals();
    }, []);

    return { goals, loading, fetchGoals, updateGoalProgress };
};
