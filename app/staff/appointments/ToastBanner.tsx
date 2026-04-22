'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { CheckCircle2, X } from 'lucide-react';

/**
 * Reads ?toast= from the URL, displays a dismissible banner for 6 seconds,
 * then clears the param from the URL so the toast doesn't re-appear on refresh.
 */
export default function ToastBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const toast = searchParams.get('toast');
    if (toast) {
      setMessage(toast);
      // Strip the param from the URL without another navigation
      const params = new URLSearchParams(searchParams.toString());
      params.delete('toast');
      const newUrl = params.size ? `${pathname}?${params.toString()}` : pathname;
      router.replace(newUrl, { scroll: false });

      const timer = setTimeout(() => setMessage(null), 6000);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!message) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 18px',
        borderRadius: 12,
        backgroundColor: '#0f172a',
        border: '1px solid rgba(34,197,94,0.3)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        color: '#f1f5f9',
        fontSize: 13,
        fontWeight: 500,
        maxWidth: 480,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      <CheckCircle2 size={16} style={{ color: '#22c55e', flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={() => setMessage(null)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2 }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
