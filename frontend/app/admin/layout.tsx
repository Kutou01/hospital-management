import EnhancedAdminLayout from "./enhanced-layout"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <EnhancedAdminLayout>{children}</EnhancedAdminLayout>
}
