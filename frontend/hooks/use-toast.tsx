// hooks/use-toast.ts
"use client";

import { useState } from "react";

type ToastType = "default" | "destructive" | "success";

interface ToastData {
  title: string;
  description: string;
  variant?: ToastType;
}

export function useToast() {
  const [toasts, setToasts] = useState<Array<ToastData & { id: number }>>([]);

  const toast = ({ title, description, variant = "default" }: ToastData) => {
    const id = Date.now();
    const newToast = { id, title, description, variant };
    
    setToasts([newToast]); // Chỉ hiển thị 1 toast
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts([]);
    }, 5000);
  };

  return { toast, toasts };
}