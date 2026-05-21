'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell } from 'lucide-react';
import { NotificationsCard, useNotifications } from './NotificationsPanel';

export default function NotificationsButton() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const state = useNotifications();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const overlay = (
    <>
      <div
        className={`fixed inset-0 z-60 bg-black/50 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Notifications"
          className="fixed inset-x-4 top-4 z-70"
        >
          <NotificationsCard
            {...state}
            variant="dialog"
            onClose={() => setOpen(false)}
          />
        </div>
      )}
    </>
  );

  return (
    <>
      <button
        type="button"
        aria-label={
          state.unreadCount > 0
            ? `Notifications (${state.unreadCount} unread)`
            : 'Notifications'
        }
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <Bell size={20} className="text-slate-700" />
        {state.unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center leading-none">
            {state.unreadCount > 9 ? '9+' : state.unreadCount}
          </span>
        )}
      </button>

      {mounted && createPortal(overlay, document.body)}
    </>
  );
}
