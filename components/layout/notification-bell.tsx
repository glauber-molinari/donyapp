"use client";

import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/notifications";
import { fetchDeadlineNotifications } from "@/lib/notifications";

const NOTIFICATION_STORAGE_KEY = "donyapp-notifications-read";

export function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const supabase = createClient();
        const deadlineNotifs = await fetchDeadlineNotifications(supabase);
        
        const readIds = getReadNotifications();
        const notificationsWithReadState = deadlineNotifs.map(n => ({
          ...n,
          read: readIds.includes(n.id),
        }));
        
        setNotifications(notificationsWithReadState);
      } catch (error) {
        console.error("Erro ao carregar notificações:", error);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
    
    const interval = setInterval(loadNotifications, 60000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-notification-container]')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const getReadNotifications = (): string[] => {
    try {
      const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveReadNotifications = (ids: string[]) => {
    try {
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(ids));
    } catch {
      /* ignore */
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    const readIds = getReadNotifications();
    if (!readIds.includes(id)) {
      saveReadNotifications([...readIds, id]);
    }
  };

  const handleMarkAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    saveReadNotifications(allIds);
  };

  const handleNotificationClick = (notification: Notification) => {
    handleMarkAsRead(notification.id);
    setIsOpen(false);
    
    if (notification.jobId) {
      router.push('/board');
    } else if (notification.taskId) {
      router.push('/tasks');
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="relative" data-notification-container>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative rounded-ds-xl p-2 transition-colors duration-ds ease-out",
          isOpen
            ? "bg-ds-cream text-ds-ink"
            : "text-ds-muted hover:bg-ds-cream/80 hover:text-ds-ink"
        )}
        aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
        aria-expanded={isOpen}
      >
        <Bell className="h-5 w-5" aria-hidden />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ds-accent opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-ds-accent" />
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-ds-2xl border border-app-border bg-app-sidebar shadow-lg">
          <div className="flex items-center justify-between border-b border-app-border px-4 py-3">
            <h2 className="text-sm font-semibold text-ds-ink">Notificações</h2>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-xs font-medium text-ds-accent hover:text-ds-accent/80 transition-colors"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center">
                <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-ds-muted border-t-ds-accent" />
                <p className="mt-2 text-sm text-ds-muted">Carregando...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="mx-auto h-8 w-8 text-ds-subtle opacity-50" aria-hidden />
                <p className="mt-2 text-sm font-medium text-ds-muted">
                  Nenhuma notificação
                </p>
                <p className="mt-1 text-xs text-ds-subtle">
                  Você está em dia!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-app-border">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "w-full px-4 py-3 text-left transition-colors hover:bg-ds-cream/50",
                      !notification.read && "bg-ds-cream/30"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {!notification.read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ds-accent" aria-hidden />
                      )}
                      <div className="flex-1 space-y-1">
                        <p className={cn(
                          "text-sm",
                          notification.read ? "text-ds-muted" : "font-medium text-ds-ink"
                        )}>
                          {notification.title}
                        </p>
                        {notification.description && (
                          <p className="text-xs text-ds-subtle line-clamp-2">
                            {notification.description}
                          </p>
                        )}
                        <p className="text-xs text-ds-subtle">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
