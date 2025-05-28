'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSidebarConfig, type SidebarConfig, type MenuItem, type MenuSection } from './SidebarConfig';

export interface UniversalSidebarProps {
  role: string;
  activePage: string;
  user?: {
    full_name?: string;
    email?: string;
    avatar_url?: string;
    role?: string;
  };
  onLogout?: () => void;
  className?: string;
  customConfig?: SidebarConfig;
}

interface SidebarItemProps {
  item: MenuItem;
  active: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ item, active, onClick }) => {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center justify-between px-4 py-3 mx-2 rounded-lg transition-all duration-200 group',
        active
          ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600 shadow-sm'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      )}
    >
      <div className="flex items-center space-x-3">
        <Icon
          size={20}
          className={cn(
            'transition-colors',
            active ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
          )}
        />
        <span className="font-medium">{item.label}</span>
      </div>
      {item.badge && (
        <Badge
          variant={item.badgeVariant || 'default'}
          className="text-xs"
        >
          {item.badge}
        </Badge>
      )}
    </Link>
  );
};

interface SidebarSectionProps {
  section: MenuSection;
  activePage: string;
  onItemClick?: () => void;
}

const SidebarSection: React.FC<SidebarSectionProps> = ({ section, activePage, onItemClick }) => {
  return (
    <div className="space-y-1">
      {section.title && (
        <div className="px-4 py-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {section.title}
          </h3>
        </div>
      )}
      {section.items.map((item) => (
        <SidebarItem
          key={item.page}
          item={item}
          active={activePage === item.page}
          onClick={onItemClick}
        />
      ))}
    </div>
  );
};



export const UniversalSidebar: React.FC<UniversalSidebarProps> = ({
  role,
  activePage,
  user,
  onLogout,
  className,
  customConfig,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const config = customConfig || getSidebarConfig(role);

  const closeMobileSidebar = () => setIsMobileOpen(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="bg-white shadow-md"
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out flex flex-col',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        className
      )}>
        {/* Header */}
        <div className={cn('p-6 border-b', config.branding.bgColor)}>
          <div className="flex items-center gap-3">
            {config.branding.logo}
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {config.branding.title}
              </h1>
              <p className="text-sm text-gray-600">
                {config.branding.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {config.sections.map((section, index) => (
            <SidebarSection
              key={index}
              section={section}
              activePage={activePage}
              onItemClick={closeMobileSidebar}
            />
          ))}
        </nav>
      </div>
    </>
  );
};
