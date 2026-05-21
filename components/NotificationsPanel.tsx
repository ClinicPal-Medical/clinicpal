'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, AlertOctagon, AlertTriangle, AlertCircle, Info,
  X, Check, CheckCheck, RotateCcw,
} from 'lucide-react';

type Urgency = 'INFO' | 'WARNING' | 'URGENT' | 'CRITICAL';

type Notification = {
  id: string;
  title: string;
  body: string;
  urgency: Urgency;
  actionUrl: string | null;
  actionLabel: string | null;
  readAt: string | null;
  createdAt: string;
};

const URGENCY_CONFIG: Record<Urgency, {
  border: string;
  bg: string;
  readBg: string;
  icon: React.ElementType;
  iconColor: string;
  actionClass: string;
  label: string;
}> = {
  CRITICAL: {
    border: 'border-l-red-500',
    bg: 'bg-red-50',
    readBg: 'bg-white',
    icon: AlertOctagon,
    iconColor: 'text-red-500',
    actionClass: 'bg-red-100 text-red-700 hover:bg-red-200',
    label: 'Critical',
  },
  URGENT: {
    border: 'border-l-orange-400',
    bg: 'bg-orange-50',
    readBg: 'bg-white',
    icon: AlertTriangle,
    iconColor: 'text-orange-400',
    actionClass: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
    label: 'Urgent',
  },
  WARNING: {
    border: 'border-l-amber-400',
    bg: 'bg-amber-50',
    readBg: 'bg-white',
    icon: AlertCircle,
    iconColor: 'text-amber-400',
    actionClass: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
    label: 'Warning',
  },
  INFO: {
    border: 'border-l-blue-400',
    bg: 'bg-blue-50',
    readBg: 'bg-white',
    icon: Info,
    iconColor: 'text-blue-400',
    actionClass: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    label: 'Info',
  },
};

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationsPanel() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) setNotifications(await res.json());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const patchNotification = async (id: string, action: 'read' | 'dismiss') => {
    await fetch(`/api/notifications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (action === 'dismiss') {
      setNotifications(prev => prev.filter(n => n.id !== id));
    } else {
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n)
      );
    }
  };

  const handleAction = async (n: Notification) => {
    if (!n.readAt) await patchNotification(n.id, 'read');
    if (n.actionUrl) router.push(n.actionUrl);
  };

  const markAllRead = () => {
    const unread = notifications.filter(n => !n.readAt);
    Promise.all(unread.map(n => patchNotification(n.id, 'read')));
  };

  const unreadCount = notifications.filter(n => !n.readAt).length;

  return (
    <div className="w-80 shrink-0 sticky top-6 self-start">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

        {/* Header */}
        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={17} className="text-slate-500" />
            <span className="font-bold text-slate-800 text-sm">Notifications</span>
            {unreadCount > 0 && (
              <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
            >
              <CheckCheck size={13} />
              Mark all read
            </button>
          )}
        </div>

        {/* Body */}
        <div className="max-h-[72vh] overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse h-[72px] bg-slate-100 rounded-xl" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <div className="mx-auto w-12 h-12 bg-emerald-50 text-emerald-400 rounded-full flex items-center justify-center mb-3">
                <Check size={22} />
              </div>
              <p className="font-semibold text-slate-700 text-sm">You&apos;re all caught up</p>
              <p className="text-xs text-slate-400 mt-1">No active notifications.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map(n => {
                const cfg = URGENCY_CONFIG[n.urgency];
                const Icon = cfg.icon;
                const isRead = !!n.readAt;
                return (
                  <div
                    key={n.id}
                    className={`border-l-4 ${cfg.border} ${isRead ? cfg.readBg : cfg.bg} transition-colors`}
                  >
                    <div className="px-4 pt-3 pb-2 flex items-start gap-2.5">
                      <Icon size={15} className={`${cfg.iconColor} shrink-0 mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <p className={`text-sm leading-snug ${isRead ? 'font-medium text-slate-600' : 'font-bold text-slate-800'}`}>
                            {n.title}
                          </p>
                          <button
                            onClick={() => patchNotification(n.id, 'dismiss')}
                            title="Dismiss"
                            className="shrink-0 text-slate-300 hover:text-slate-500 transition-colors -mt-0.5 p-0.5 rounded"
                          >
                            <X size={13} />
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-snug line-clamp-2">
                          {n.body}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>

                    {/* Action row */}
                    {(n.actionUrl || !isRead) && (
                      <div className="px-4 pb-3 pl-10 flex items-center gap-2">
                        {n.actionUrl && (
                          <button
                            onClick={() => handleAction(n)}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${cfg.actionClass}`}
                          >
                            {n.actionLabel ?? 'View'}
                          </button>
                        )}
                        {!isRead && (
                          <button
                            onClick={() => patchNotification(n.id, 'read')}
                            className="text-xs font-medium text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
                          >
                            <Check size={11} />
                            Mark read
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div className="px-4 py-2.5 border-t border-slate-100 flex justify-center">
            <button
              onClick={() => fetchNotifications(true)}
              disabled={refreshing}
              className="text-xs font-medium text-slate-400 hover:text-slate-600 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RotateCcw size={11} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
