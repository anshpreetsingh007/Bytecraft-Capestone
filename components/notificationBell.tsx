"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCircle2, AlertTriangle, ClipboardList } from "lucide-react";
import { useAuth } from "../Context/AuthContext";
import { Notification, NotificationType } from "../types/notification";
import "./notification-bell.css";

// TODO: move to NEXT_PUBLIC_NOTIFICATION_SERVICE_URL once the rest of the
// frontend adopts env-based service URLs (currently other pages hardcode
// localhost too).
const NOTIFICATION_SERVICE_URL = "http://localhost:3005";

const POLL_INTERVAL_MS = 30_000;

function iconFor(type: NotificationType) {
  switch (type) {
    case "estimate_approved":
      return <CheckCircle2 size={16} />;
    case "low_stock":
      return <AlertTriangle size={16} />;
    case "inspection_request_submitted":
      return <ClipboardList size={16} />;
    default:
      return <Bell size={16} />;
  }
}

function timeAgo(isoDate: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString("en-CA");
}

export default function NotificationBell() {
  const { role, userId } = useAuth();

  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!role || !userId) return;
    try {
      const res = await fetch(
        `${NOTIFICATION_SERVICE_URL}/api/notifications/unread-count?recipientType=${role}&recipientId=${userId}`
      );
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(data.count ?? 0);
    } catch (err) {
      console.error("Failed to fetch unread notification count:", err);
    }
  }, [role, userId]);

  const fetchNotifications = useCallback(async () => {
    if (!role || !userId) return;
    setLoadingList(true);
    try {
      const res = await fetch(
        `${NOTIFICATION_SERVICE_URL}/api/notifications?recipientType=${role}&recipientId=${userId}&limit=20`
      );
      if (!res.ok) return;
      setNotifications(await res.json());
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoadingList(false);
    }
  }, [role, userId]);

  // Poll unread count in the background regardless of whether the panel is open.
  useEffect(() => {
    if (!role || !userId) return;

    fetchUnreadCount();
    pollRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [role, userId, fetchUnreadCount]);

  function togglePanel() {
    const next = !open;
    setOpen(next);
    if (next) fetchNotifications();
  }

  async function markOneRead(notification: Notification) {
    if (notification.is_read) return;

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.notification_id === notification.notification_id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const res = await fetch(
        `${NOTIFICATION_SERVICE_URL}/api/notifications/${notification.notification_id}/read`,
        { method: "PATCH" }
      );
      if (!res.ok) throw new Error("Failed to mark as read");
    } catch (err) {
      console.error(err);
      // Revert on failure
      fetchNotifications();
      fetchUnreadCount();
    }
  }

  async function markAllRead() {
    if (!role || !userId || unreadCount === 0) return;
    setMarkingAll(true);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      const res = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/read-all`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientType: role, recipientId: userId }),
      });
      if (!res.ok) throw new Error("Failed to mark all as read");
    } catch (err) {
      console.error(err);
      fetchNotifications();
      fetchUnreadCount();
    } finally {
      setMarkingAll(false);
    }
  }

  // Not resolved to a real recipient yet (e.g. role/userId still loading) — render nothing.
  if (!role || !userId) return null;

  return (
    <>
      <button className="notif-bell-trigger" onClick={togglePanel} aria-label="Notifications">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notif-bell-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <>
          <div className="notif-bell-overlay" onClick={() => setOpen(false)} />

          <div className="notif-bell-panel">
            <div className="notif-bell-header">
              <h3>Notifications</h3>
              <button
                className="notif-bell-mark-all"
                onClick={markAllRead}
                disabled={markingAll || unreadCount === 0}
              >
                Mark all read
              </button>
            </div>

            <div className="notif-bell-list">
              {loadingList ? (
                <p className="notif-bell-empty">Loading…</p>
              ) : notifications.length === 0 ? (
                <p className="notif-bell-empty">You're all caught up.</p>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification.notification_id}
                    className={`notif-bell-item ${notification.is_read ? "" : "unread"}`}
                    onClick={() => markOneRead(notification)}
                  >
                    {!notification.is_read && <span className="notif-bell-dot" />}
                    <p className="notif-bell-item-title">
                      {iconFor(notification.type)} {notification.title}
                    </p>
                    {notification.message && (
                      <p className="notif-bell-item-message">{notification.message}</p>
                    )}
                    <p className="notif-bell-item-time">{timeAgo(notification.created_at)}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}