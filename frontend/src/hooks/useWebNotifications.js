import { useState, useEffect, useCallback, useRef } from "react";
import axios from "../services/axios.jsx";
import { useStore } from "../zustand/store.jsx";

/**
 * useWebNotifications
 * 
 * Provides:
 * - Native Browser Web Notification API support (requestPermission, dispatch notifications)
 * - Polling-based background sync (no WebSockets)
 * - Unread count state & notification feed management
 * - In-app notification CRUD methods (fetch, markRead, markAllRead, dismiss)
 */
export function useWebNotifications(options = {}) {
  const {
    autoPoll = true,
    pollInterval = 45000, // 45 seconds interval
    triggerWebAlerts = true,
  } = options;

  const currentUser = useStore((state) => state.user);
  const [permission, setPermission] = useState(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "unsupported";
  });

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

  const prevUnreadIdsRef = useRef(new Set());
  const isFirstLoadRef = useRef(true);

  // Check and update permission status
  const checkPermission = useCallback(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
      return Notification.permission;
    }
    setPermission("unsupported");
    return "unsupported";
  });

  // Request browser Notification permission
  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }
    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      return res;
    } catch (err) {
      console.error("Error requesting Web Notification permission:", err);
      return "denied";
    }
  }, []);

  // Display a native browser notification
  const showNativeNotification = useCallback(
    ({ title, message, action_url, type = "info" }) => {
      if (
        typeof window === "undefined" ||
        !("Notification" in window) ||
        Notification.permission !== "granted"
      ) {
        return null;
      }

      try {
        const notif = new Notification(title || "RealBell Notification", {
          body: message || "",
          icon: "/logo.png",
          badge: "/logo.png",
          tag: `rbf-notif-${Date.now()}`,
          renotify: true,
        });

        notif.onclick = (e) => {
          e.preventDefault();
          window.focus();
          if (action_url) {
            window.location.href = action_url;
          } else {
            window.location.href = "/notifications";
          }
          notif.close();
        };

        return notif;
      } catch (err) {
        console.warn("Could not display Web Notification:", err);
        return null;
      }
    },
    []
  );

  // Fetch notifications from server (CRUD: Read)
  const fetchNotifications = useCallback(
    async (fetchOpts = {}) => {
      if (!currentUser || !currentUser._id) return;
      const {
        page = 1,
        limit = 20,
        unreadOnly = false,
        search = "",
        type = "",
      } = fetchOpts;

      setLoading(true);
      try {
        const params = new URLSearchParams({
          page,
          limit,
          unreadOnly: String(unreadOnly),
        });
        if (search) params.set("search", search);
        if (type) params.set("type", type);

        const res = await axios.get(`/notifications/my?${params.toString()}`);
        if (res.data.status === 1) {
          const list = res.data.notifications || [];
          const count = res.data.unreadCount || 0;
          setNotifications(list);
          setUnreadCount(count);
          setPagination(res.data.pagination || { total: 0, page: 1, pages: 1 });

          // If triggerWebAlerts is enabled, alert user about newly arrived unread notifications
          if (triggerWebAlerts && permission === "granted") {
            const currentUnreadIds = new Set(
              list.filter((n) => !n.isRead).map((n) => n._id)
            );

            if (!isFirstLoadRef.current) {
              list.forEach((notif) => {
                if (
                  !notif.isRead &&
                  !prevUnreadIdsRef.current.has(notif._id)
                ) {
                  showNativeNotification({
                    title: notif.title,
                    message: notif.message,
                    action_url: notif.action_url,
                    type: notif.type,
                  });
                }
              });
            }
            prevUnreadIdsRef.current = currentUnreadIds;
            isFirstLoadRef.current = false;
          }
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    },
    [currentUser, triggerWebAlerts, permission, showNativeNotification]
  );

  // Mark single notification as read (CRUD: Update)
  const markAsRead = useCallback(
    async (id) => {
      try {
        const res = await axios.patch(`/notifications/${id}/read`);
        if (res.data.status === 1) {
          setNotifications((prev) =>
            prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
          return true;
        }
      } catch (err) {
        console.error("Error marking notification as read:", err);
      }
      return false;
    },
    []
  );

  // Mark all notifications as read (CRUD: Update)
  const markAllAsRead = useCallback(async () => {
    try {
      const res = await axios.patch(`/notifications/read-all`);
      if (res.data.status === 1) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        );
        setUnreadCount(0);
        return true;
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
    return false;
  }, []);

  // Dismiss / Delete notification from personal feed (CRUD: Delete)
  const dismissNotification = useCallback(
    async (id) => {
      try {
        const res = await axios.delete(`/notifications/${id}`);
        if (res.data.status === 1) {
          const removed = notifications.find((n) => n._id === id);
          setNotifications((prev) => prev.filter((n) => n._id !== id));
          if (removed && !removed.isRead) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
          return true;
        }
      } catch (err) {
        console.error("Error dismissing notification:", err);
      }
      return false;
    },
    [notifications]
  );

  // Initial fetch and auto-polling
  useEffect(() => {
    if (!currentUser || !currentUser._id) return;
    fetchNotifications();

    if (!autoPoll) return;
    const interval = setInterval(() => {
      fetchNotifications();
    }, pollInterval);

    const onFocus = () => {
      fetchNotifications();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [currentUser, autoPoll, pollInterval, fetchNotifications]);

  return {
    permission,
    requestPermission,
    checkPermission,
    showNativeNotification,
    notifications,
    unreadCount,
    loading,
    pagination,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  };
}

export default useWebNotifications;
