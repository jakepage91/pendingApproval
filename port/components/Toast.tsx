"use client";

import { useEffect, useState, useCallback } from "react";

export type ToastMessage = {
  id: string;
  message: string;
  type?: "success" | "error" | "info";
};

type ToastProps = {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
};

export function Toast({ toasts, onRemove }: ToastProps) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const enter = requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 200);
    }, 3500);
    return () => {
      cancelAnimationFrame(enter);
      clearTimeout(timer);
    };
  }, [toast.id, onRemove]);

  const accent =
    toast.type === "error" ? "var(--mb-blush)" : "var(--mb-purple)";

  return (
    <div
      style={{
        pointerEvents: "auto",
        background: "var(--bg-surface)",
        border: "1.5px solid var(--mb-black)",
        borderLeft: `5px solid ${accent}`,
        color: "var(--text-primary)",
        borderRadius: 10,
        padding: "10px 14px",
        fontSize: 13,
        fontWeight: 500,
        maxWidth: 340,
        boxShadow: "0 3px 0 0 var(--mb-black)",
        transform: visible ? "translateY(0)" : "translateY(12px)",
        opacity: visible ? 1 : 0,
        transition: "transform 200ms ease, opacity 200ms ease",
      }}
    >
      {toast.message}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (message: string, type: ToastMessage["type"] = "success") => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, message, type }]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}
