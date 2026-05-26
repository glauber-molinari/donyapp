"use client";

import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { markTicketRead } from "@/app/(app)/support/actions";
import { NOTIFICATION_KIND_LABEL, fetchAppNotifications } from "@/lib/notifications";
import type { Notification } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const NOTIFICATION_STORAGE_KEY = "donyapp-notifications-read";

export function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const getReadNotifications = useCallback((): string[] => {
    try {
      const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const supabase = createClient();
      const items = await fetchAppNotifications(supabase);

      const readIds = getReadNotifications();
      const withRead = items.map((n) => ({
        ...n,
        read:
          n.kind === "support_reply" || n.kind === "form_new"
            ? false
            : readIds.includes(n.id),
      }));

      setNotifications(withRead);
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    } finally {
      setLoading(false);
    }
  }, [getReadNotifications]);

  useEffect(() => {
    void loadNotifications();
    const interval = setInterval(() => void loadNotifications(), 60000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-notification-container]")) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const saveReadNotifications = (ids: string[]) => {
    try {
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(ids));
    } catch {
      /* ignore */
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const badgeText = unreadCount > 99 ? "99+" : String(unreadCount);

  const handleMarkAllAsRead = async () => {
    if (notifications.length === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      const supabase = createClient();
      const readIds = getReadNotifications();
      const deadlineIds = notifications
        .filter((n) => n.kind !== "support_reply" && n.kind !== "form_new")
        .map((n) => n.id);
      const ticketIds = notifications
        .filter((n) => n.kind === "support_reply" && n.ticketId)
        .map((n) => n.ticketId as string);
      const submissionIds = notifications
        .filter((n) => n.kind === "form_new" && n.submissionId)
        .map((n) => n.submissionId as string);

      await Promise.all(ticketIds.map((tid) => markTicketRead(tid)));
      if (submissionIds.length > 0) {
        const { error: formErr } = await supabase
          .from("form_submissions")
          .update({ viewed: true })
          .in("id", submissionIds);
        if (formErr) console.error("[notifications] marcar formulários:", formErr);
      }

      const merged = Array.from(new Set([...readIds, ...deadlineIds]));
      saveReadNotifications(merged);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      await loadNotifications();
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    const supabase = createClient();

    if (notification.kind === "support_reply" && notification.ticketId) {
      await markTicketRead(notification.ticketId);
    } else if (notification.kind === "form_new" && notification.submissionId) {
      await supabase
        .from("form_submissions")
        .update({ viewed: true })
        .eq("id", notification.submissionId);
    } else {
      const readIds = getReadNotifications();
      if (!readIds.includes(notification.id)) {
        saveReadNotifications([...readIds, notification.id]);
      }
    }

    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
    );

    setIsOpen(false);

    if (notification.ticketId) {
      router.push(`/support/${notification.ticketId}`);
    } else if (notification.submissionId) {
      router.push("/formularios/recebidos");
    } else if (notification.jobId) {
      router.push("/board");
    } else if (notification.taskId) {
      router.push("/tasks");
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Agora";
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    return date.toLocaleDateString("pt-BR");
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
        aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ""}`}
        aria-expanded={isOpen}
      >
        <Bell className="h-5 w-5" aria-hidden />
        {unreadCount > 0 && (
          <span
            className={cn(
              "absolute -right-0.5 -top-0.5 flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-ds-accent px-1 text-[10px] font-semibold leading-none text-white tabular-nums",
              badgeText.length >= 2 && "px-1.5"
            )}
            aria-hidden
          >
            {badgeText}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-ds-2xl border border-ds-border bg-ds-surface shadow-lg">
          <div className="flex items-center justify-between border-b border-ds-border px-4 py-3">
            <h2 className="text-sm font-semibold text-ds-ink">Notificações</h2>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void handleMarkAllAsRead()}
                disabled={markingAll}
                className="text-xs font-medium text-ds-accent transition-colors hover:text-ds-accent/80 disabled:opacity-50"
              >
                {markingAll ? "Marcando…" : "Marcar todas como lidas"}
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
                <Bell className="mx-auto h-8 w-8 text-ds-muted-2 opacity-50" aria-hidden />
                <p className="mt-2 text-sm font-medium text-ds-muted">Nenhuma notificação</p>
                <p className="mt-1 text-xs text-ds-muted-2">Prazos em dia e caixa zerada.</p>
              </div>
            ) : (
              <div className="divide-y divide-ds-border">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => void handleNotificationClick(notification)}
                    className={cn(
                      "w-full px-4 py-3 text-left transition-colors hover:bg-ds-cream/50",
                      !notification.read && "bg-ds-cream/30"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {!notification.read && (
                        <span
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ds-accent"
                          aria-hidden
                        />
                      )}
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-ds-muted-2">
                          {NOTIFICATION_KIND_LABEL[notification.kind]}
                        </p>
                        <p
                          className={cn(
                            "text-sm",
                            notification.read ? "text-ds-muted" : "font-medium text-ds-ink"
                          )}
                        >
                          {notification.title}
                        </p>
                        {notification.description && (
                          <p className="text-xs text-ds-muted-2 line-clamp-2">
                            {notification.description}
                          </p>
                        )}
                        <p className="text-xs text-ds-muted-2">
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
