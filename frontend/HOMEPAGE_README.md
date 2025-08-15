# Hospital Management System - Homepage

## Tổng quan

Trang Homepage mới được thiết kế theo yêu cầu của Senior Frontend Engineer & UX Lead với các tính năng hiện đại, responsive và accessibility cao.

## Công nghệ sử dụng

- **Next.js 15** (App Router)
- **React 18** với TypeScript
- **Tailwind CSS** cho styling
- **Radix UI** cho components
- **Lucide Icons** cho icon system
- **Dark Mode** support
- **i18n** (Tiếng Việt & English)
- **Mock Supabase Auth** cho demo

## Cấu trúc thư mục

```
frontend/
├── app/(marketing)/
│   ├── page.tsx              # Trang Homepage chính
│   ├── layout.tsx            # Layout với metadata SEO
│   └── sitemap.ts            # Sitemap tự động
├── components/homepage/
│   ├── Header.tsx            # Header với navigation
│   ├── Hero.tsx              # Hero section
│   ├── BookingWidget.tsx     # Widget đặt lịch
│   ├── DoctorCard.tsx        # Card hiển thị bác sĩ
│   ├── DepartmentCard.tsx    # Card hiển thị khoa
│   ├── NewsList.tsx          # Danh sách tin tức
│   ├── RoleShortcuts.tsx     # Shortcuts theo role
│   ├── Footer.tsx            # Footer
│   ├── CommandPalette.tsx    # Tìm kiếm toàn cục
│   └── AccessibilityFeatures.tsx # Tính năng trợ năng
├── lib/
│   ├── mock.ts               # Mock data
│   ├── i18n.ts               # Hệ thống i18n
│   ├── dicts.ts              # Từ điển ngôn ngữ
│   └── auth/mock-session.ts  # Mock authentication
└── public/
    ├── manifest.json         # PWA manifest
    └── robots.txt            # SEO robots
```

## Tính năng chính

### 1. Responsive Design
- **Mobile-first** approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Grid system linh hoạt
- Touch-friendly trên mobile

### 2. Accessibility (A11Y)
- **WCAG 2.1 AA** compliance
- Screen reader support
- Keyboard navigation
- Focus management
- High contrast mode
- Font size adjustment
- Reduced motion support
- Skip links
- ARIA labels và landmarks

### 3. SEO Optimization
- Structured metadata
- Open Graph tags
- Twitter Cards
- Sitemap tự động
- Robots.txt
- Semantic HTML
- Performance optimization

### 4. Internationalization (i18n)
- Hỗ trợ Tiếng Việt và English
- Language switcher
- Locale-aware formatting
- RTL support ready

### 5. Role-based Content
- **Guest**: CTA đăng nhập/đăng ký
- **Patient**: Lịch khám, hồ sơ bệnh án
- **Doctor**: Lịch làm việc, tư vấn
- **Admin**: Thống kê, quản trị hệ thống

### 6. Smart Features
- **Command Palette** (Ctrl/⌘ + K)
- **Booking Widget** với conflict checking
- **Real-time** availability
- **Dark/Light** mode
- **PWA** support

## Demo & Testing

### URL Parameters cho Demo
Thêm `?role=` vào URL để test các role:

- `/?role=guest` - Khách
- `/?role=patient` - Bệnh nhân  
- `/?role=doctor` - Bác sĩ
- `/?role=admin` - Quản trị viên

### Test Accounts
```
patient@hospital.com / Patient123.
doctor@hospital.com / Doctor123.
admin@hospital.com / Admin123.
```

### Keyboard Shortcuts
- `Ctrl/⌘ + K`: Mở Command Palette
- `Alt + A`: Mở menu Accessibility
- `Alt + +/-`: Thay đổi cỡ chữ
- `Alt + C`: Toggle high contrast
- `Alt + M`: Toggle reduced motion

## Performance

### Lighthouse Scores (Target)
- **Performance**: ≥ 90
- **Accessibility**: ≥ 95
- **Best Practices**: ≥ 90
- **SEO**: ≥ 95

### Optimization Techniques
- Lazy loading images
- Dynamic imports
- Route prefetching
- Component code splitting
- Optimized fonts
- Compressed assets

## Deployment

### Environment Variables
```env
NEXT_PUBLIC_SITE_URL=https://hospital-management.com
NEXT_PUBLIC_APP_ENV=production
GOOGLE_SITE_VERIFICATION=your_verification_code
```

### Build Commands
```bash
# Development
npm run dev

# Production build
npm run build
npm run start

# Linting
npm run lint
```

## Browser Support

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+
- **Mobile Safari**: 14+
- **Chrome Mobile**: 90+

## Accessibility Features

### Built-in
- Semantic HTML5
- ARIA labels và roles
- Focus indicators
- Color contrast compliance
- Screen reader optimization

### User Controls
- Font size: 80% - 150%
- High contrast mode
- Reduced motion
- Keyboard navigation
- Screen reader announcements

## Mock Data

### Doctors (6 featured)
- Bác sĩ Tim mạch, Nhi khoa, Chấn thương chỉnh hình
- Rating, kinh nghiệm, giá khám
- Availability status

### Departments (8 khoa)
- Tim mạch, Nhi khoa, Chấn thương chỉnh hình, Da liễu
- ENT, Nội tiết, Thần kinh, Cấp cứu
- Services và mô tả

### News & Announcements (3 bài)
- Telemedicine services
- COVID-19 vaccination
- New cardiac surgery wing

## Future Enhancements

### Phase 2
- [ ] Real Supabase integration
- [ ] Payment gateway integration
- [ ] Video consultation
- [ ] Push notifications
- [ ] Offline support

### Phase 3
- [ ] AI chatbot
- [ ] Voice search
- [ ] Advanced analytics
- [ ] Multi-language expansion
- [ ] Mobile app

## Support

### Documentation
- [Design System](./docs/design-system.md)
- [Component Library](./docs/components.md)
- [API Integration](./docs/api.md)

### Contact
- **Email**: dev@hospital-management.com
- **Slack**: #frontend-team
- **Issues**: GitHub Issues

---

**Lưu ý**: Đây là phiên bản demo với mock data. Để tích hợp production, cần cập nhật authentication và API endpoints thực tế.
