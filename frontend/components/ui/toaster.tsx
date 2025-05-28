"use client";

import { useToast } from "@/hooks/use-toast";

export function Toaster() {
  const { toasts } = useToast();

  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            p-4 rounded-lg shadow-lg max-w-md transition-all duration-300
            ${toast.variant === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : ''}
            ${toast.variant === 'destructive' ? 'bg-red-50 border border-red-200 text-red-800' : ''}
            ${toast.variant === 'default' ? 'bg-white border border-gray-200 text-gray-900' : ''}
          `}
        >
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-sm">{toast.title}</h4>
              <p className="text-sm opacity-90 mt-1">{toast.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}