'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ArrowRight, Info } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Department } from '@/lib/mock';
import Link from 'next/link';

interface DepartmentCardProps {
  department: Department;
}

export function DepartmentCard({ department }: DepartmentCardProps) {
  const { t, language } = useI18n();

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{department.icon}</div>
            <div>
              <CardTitle className="text-lg leading-tight">
                {language === 'vi' ? department.nameVi : department.name}
              </CardTitle>
            </div>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-sm">
                  {language === 'vi' ? department.briefVi : department.brief}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {language === 'vi' ? department.briefVi : department.brief}
        </p>

        {/* Services */}
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            {t('departments.services')}
            <Badge variant="secondary" className="text-xs">
              {(language === 'vi' ? department.servicesVi : department.services).length}
            </Badge>
          </h4>
          
          <div className="space-y-2">
            {(language === 'vi' ? department.servicesVi : department.services)
              .slice(0, 3)
              .map((service, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <span className="text-muted-foreground">{service}</span>
                </div>
              ))}
            
            {(language === 'vi' ? department.servicesVi : department.services).length > 3 && (
              <div className="text-xs text-muted-foreground pl-3.5">
                +{(language === 'vi' ? department.servicesVi : department.services).length - 3} {language === 'vi' ? 'dịch vụ khác' : 'more services'}
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <Button 
          variant="outline" 
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          asChild
        >
          <Link href={`/departments/${department.id}`}>
            {t('departments.viewServices')}
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>

        {/* Quick Stats */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>ID: {department.id}</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>{language === 'vi' ? 'Hoạt động' : 'Active'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
