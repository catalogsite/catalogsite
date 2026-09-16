'use client';

import { useState, type ReactNode } from 'react';
import { Button } from './button';

/**
 * Lightweight confirm dialog for destructive actions (delete brand/product/catalog).
 * Wraps a trigger; renders a modal overlay when open.
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = 'Delete',
  onConfirm,
}: {
  trigger: ReactNode;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
            {description && <p className="mt-2 text-sm text-neutral-500">{description}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  await onConfirm();
                  setLoading(false);
                  setOpen(false);
                }}
              >
                {loading ? 'Working…' : confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
