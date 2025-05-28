# Troubleshooting Guide - Universal Sidebar

## 🐛 Common Issues and Solutions

### ❌ Error: Element type is invalid - AdminLayout

**Problem:**
```
Error: Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined.
```

**Cause:**
Conflict between legacy `AdminLayout` and new Universal `AdminLayout` exports.

**Solution:**
Import directly from Universal Layout instead of from components index:

```tsx
// ❌ Wrong - causes conflict
import { AdminLayout } from "@/components"

// ✅ Correct - direct import
import { AdminLayout } from "@/components/layout/UniversalLayout"
```

### ❌ Error: Cannot resolve module '@/components'

**Problem:**
Import errors when trying to use Universal Layout components.

**Solution:**
Use specific imports:

```tsx
// For Universal Layout components
import { AdminLayout, DoctorLayout, PatientLayout } from "@/components/layout/UniversalLayout"
import { UniversalSidebar } from "@/components/layout/UniversalSidebar"
import { getSidebarConfig } from "@/components/layout/SidebarConfig"

// For legacy components (if needed)
import { LegacyAdminLayout } from "@/components"
```

### ❌ Error: activePage not highlighting correctly

**Problem:**
Menu items not showing active state.

**Solution:**
Ensure `activePage` prop matches the `page` value in `SidebarConfig.ts`:

```tsx
// In SidebarConfig.ts
{
  icon: BarChart3,
  label: 'Dashboard',
  href: '/admin/dashboard',
  page: 'dashboard', // ← This value
}

// In your page component
<AdminLayout activePage="dashboard" /> // ← Must match
```

### ❌ Error: Sidebar not responsive on mobile

**Problem:**
Sidebar doesn't collapse on mobile devices.

**Solution:**
Ensure you're using the Universal Layout components, not legacy ones:

```tsx
// ✅ Universal Layout (responsive)
import { AdminLayout } from "@/components/layout/UniversalLayout"

// ❌ Legacy Layout (not fully responsive)
import { AdminLayout } from "@/components/layout/AdminLayout"
```

### ❌ Error: TypeScript errors with props

**Problem:**
TypeScript complaining about missing or incorrect props.

**Solution:**
Check the interface definitions:

```tsx
// AdminLayout, DoctorLayout, PatientLayout props
interface LayoutProps {
  children: React.ReactNode;
  title: string;
  activePage: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  className?: string;
  sidebarProps?: Partial<UniversalSidebarProps>;
}
```

### ❌ Error: User menu not showing

**Problem:**
User avatar and menu not appearing in sidebar.

**Solution:**
Ensure authentication context is properly set up:

```tsx
// Check if useEnhancedAuth is working
const { user } = useEnhancedAuth();
console.log('User:', user); // Should not be null/undefined
```

## 🔧 Quick Fixes

### 1. Import Issues
```tsx
// Replace all these imports:
import { AdminLayout } from "@/components"
import { DoctorLayout } from "@/components"
import { PatientLayout } from "@/components"

// With these:
import { AdminLayout, DoctorLayout, PatientLayout } from "@/components/layout/UniversalLayout"
```

### 2. Page Wrapper for Admin
```tsx
// Use AdminPageWrapper for admin pages
import { AdminPageWrapper } from "../page-wrapper"

export default function AdminPage() {
  return (
    <AdminPageWrapper
      title="Page Title"
      activePage="page-key"
      subtitle="Optional subtitle"
      headerActions={<Button>Action</Button>}
    >
      <div>Content</div>
    </AdminPageWrapper>
  )
}
```

### 3. Direct Layout Usage
```tsx
// For doctor/patient pages
import { DoctorLayout } from "@/components/layout/UniversalLayout"

export default function DoctorPage() {
  return (
    <DoctorLayout
      title="Page Title"
      activePage="page-key"
      subtitle="Optional subtitle"
      headerActions={<Button>Action</Button>}
    >
      <div>Content</div>
    </DoctorLayout>
  )
}
```

## 🚀 Migration Checklist

- [ ] Replace `import { AdminLayout } from "@/components"` with direct imports
- [ ] Replace `import { DoctorLayout } from "@/components"` with direct imports
- [ ] Replace `import { PatientLayout } from "@/components"` with direct imports
- [ ] Ensure `activePage` prop matches config values
- [ ] Add `subtitle` and `headerActions` props where needed
- [ ] Test responsive behavior on mobile
- [ ] Verify user menu functionality
- [ ] Check all navigation links work correctly

## 📚 Reference

### Correct Import Patterns
```tsx
// Universal Layout Components
import {
  AdminLayout,
  DoctorLayout,
  PatientLayout,
  UniversalLayout,
  UniversalSidebar
} from "@/components/layout/UniversalLayout"

// Sidebar Configuration
import {
  getSidebarConfig,
  adminSidebarConfig,
  doctorSidebarConfig,
  patientSidebarConfig
} from "@/components/layout/SidebarConfig"

// Legacy Components (if needed)
import { LegacyAdminLayout } from "@/components"
```

### File Structure
```
components/
├── layout/
│   ├── UniversalSidebar.tsx      # Main sidebar component
│   ├── UniversalLayout.tsx       # Layout wrapper + role-specific layouts
│   ├── SidebarConfig.ts          # Menu configuration
│   ├── DashboardLayout.tsx       # Dashboard layout
│   ├── PublicLayout.tsx          # Public pages layout
│   ├── RoleBasedLayout.tsx       # Role-based layout wrapper
│   └── UserMenu.tsx              # User menu component
└── index.ts                      # Exports (cleaned up)
```

## 🆘 Still Having Issues?

1. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **Check browser console** for additional error details

3. **Verify file paths** and imports are correct

4. **Test with demo page** at `/demo/sidebar` first

5. **Check TypeScript errors** in your IDE
