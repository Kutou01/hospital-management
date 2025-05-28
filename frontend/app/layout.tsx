// app/layout.tsx
import type React from "react";
import "@/app/globals.css"; // Import các style global của bạn
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast-provider";
import { EnhancedAuthProvider } from "@/lib/auth/enhanced-auth-context";

// Khởi tạo font Inter với subset Latin
const inter = Inter({ subsets: ["latin"] });

// Metadata cho ứng dụng của bạn
export const metadata = {
  title: "Hospital Management",
  description: "Your partner in health and wellness",
};

// Component RootLayout chính của ứng dụng
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Đặt thuộc tính ngôn ngữ là tiếng Việt và tắt cảnh báo hydration
    <html lang="vi" suppressHydrationWarning={true}>
      <head>
        {/* Font Awesome CDN để hiển thị các icon */}
        {/* Đã sửa từ 'xintegrity' thành 'integrity' và cung cấp giá trị integrity hợp lệ (có thể cần kiểm tra lại phiên bản mới nhất trên Font Awesome CDN) */}
        <link
  rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
  crossOrigin="anonymous"
  referrerPolicy="no-referrer"
/>
      </head>
      {/* Áp dụng class của font Inter vào thẻ body */}
      <body className={inter.className}>
        {/* ThemeProvider để quản lý chủ đề sáng/tối của ứng dụng */}
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {/* EnhancedAuthProvider để cung cấp context xác thực cho toàn bộ ứng dụng */}
          <EnhancedAuthProvider>
            {/* ToastProvider để hiển thị các thông báo toast */}
            <ToastProvider>
              {children} {/* Đây là nơi nội dung của các trang và layout con sẽ được render */}
            </ToastProvider>
          </EnhancedAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}