import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Info, AlertTriangle, CheckCircle2, XCircle, BellOff } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { notificationService, Notification } from '@/services/notificationService';
import { getSocket } from '@/lib/socket';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const NotificationBell: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        fetchNotifications();

        // Socket listener for new notifications
        const socket = getSocket();
        socket.on('notification:new', (newNotification: Notification) => {
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
            toast.info(`${newNotification.title}: ${newNotification.message.substring(0, 50)}${newNotification.message.length > 50 ? '...' : ''}`, {
                action: {
                    label: 'View',
                    onClick: () => {
                        // Handle view logic if needed
                    }
                }
            });
        });

        return () => {
            socket.off('notification:new');
        };
    }, []);

    const fetchNotifications = async () => {
        try {
            const data = await notificationService.getNotifications();
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.isRead).length);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            toast.error('Failed to mark as read');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            toast.success('All notifications marked as read');
        } catch (error) {
            toast.error('Failed to mark all as read');
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            await notificationService.deleteNotification(id);
            const deletedNotification = notifications.find(n => n.id === id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            if (deletedNotification && !deletedNotification.isRead) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            toast.error('Failed to delete notification');
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'SUCCESS': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'WARNING': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            case 'ERROR': return <XCircle className="w-4 h-4 text-red-500" />;
            default: return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-primary/5">
                    <Bell className="w-5 h-5 text-gray-500" />
                    {unreadCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] min-w-[1.2rem] flex justify-center items-center h-4 bg-red-500 border-2 border-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 mr-4 mt-2" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-bold text-sm text-gray-900">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            className="text-[10px] h-7 px-2 font-bold text-primary uppercase tracking-wider hover:bg-primary/5"
                        >
                            Mark all read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[350px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                                <BellOff className="w-6 h-6 text-gray-300" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900">All caught up!</p>
                                <p className="text-xs text-gray-400 mt-1">No notifications to show right now.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                                    className={cn(
                                        "group flex items-start gap-3 p-4 hover:bg-gray-50/50 cursor-pointer transition-colors relative border-b last:border-0",
                                        !notification.isRead && "bg-blue-50/30"
                                    )}
                                >
                                    <div className="mt-0.5">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0 pr-6">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className={cn("text-sm font-bold truncate", !notification.isRead ? "text-gray-900" : "text-gray-600")}>
                                                {notification.title}
                                            </p>
                                            {!notification.isRead && (
                                                <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-2 font-medium">
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => handleDelete(e, notification.id)}
                                        className="absolute right-2 top-4 opacity-0 group-hover:opacity-100 h-8 w-8 text-gray-400 hover:text-red-500 transition-opacity"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="p-2 border-t text-center">
                    <Button variant="ghost" className="w-full text-[10px] font-bold text-gray-500 uppercase tracking-widest h-8">
                        View All History
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};
