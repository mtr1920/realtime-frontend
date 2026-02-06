/**
 * Admin Page
 *
 * Administration dashboard using Card primitive with variant="crystalline".
 * Features: geometric accents, hover reveals, staggered animations.
 */

import { useState } from 'react';
import { Settings, FileText, Database, ArrowRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';

import { Card, CardStripe, CardAccent, CardCorner } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

// =============================================================================
// Card Configuration
// =============================================================================

interface AdminCardConfig {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  gradient: string;
}

const adminCards: AdminCardConfig[] = [
  {
    title: 'Domain Configs',
    description: 'Manage domain configurations and settings',
    icon: Settings,
    href: '/admin/domain-configs',
    gradient: 'from-violet-400 to-purple-500',
  },
  {
    title: 'Audit Logs',
    description: 'View system activity and audit trail',
    icon: FileText,
    href: '/admin/audit-logs',
    gradient: 'from-sky-400 to-blue-500',
  },
  {
    title: 'System Health',
    description: 'Monitor system status and performance',
    icon: Database,
    href: '/admin/health',
    gradient: 'from-emerald-400 to-teal-500',
  },
];

// =============================================================================
// Admin Card Component
// =============================================================================

interface AdminCardProps {
  config: AdminCardConfig;
  index: number;
}

function AdminCard({ config, index }: AdminCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { title, description, icon: Icon, href, gradient } = config;

  return (
    <Link to={href}>
      <Card
        variant="crystalline"
        tall
        staggerIndex={index}
        isHovered={isHovered}
        className="h-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Geometric accent - diagonal stripe */}
        <CardAccent gradient={gradient} isHovered={isHovered} />

        {/* Status indicator stripe */}
        <CardStripe gradient={gradient} isHovered={isHovered} />

        {/* Content */}
        <div className="relative p-6 pl-7">
          {/* Icon container */}
          <div
            className={cn(
              'flex items-center justify-center',
              'w-12 h-12 mb-4 rounded-xl',
              'bg-accent dark:bg-primary/15',
              'transition-colors duration-200',
              'group-hover:bg-accent/80 dark:group-hover:bg-primary/25'
            )}
          >
            <Icon className="w-6 h-6 text-primary" />
          </div>

          {/* Title with arrow */}
          <div className="group/link inline-flex items-center gap-2 transition-colors duration-200 mb-2">
            <h3
              className={cn(
                'text-lg font-semibold tracking-tight',
                'text-foreground',
                'group-hover/link:text-primary',
                'transition-colors duration-200'
              )}
            >
              {title}
            </h3>
            <ArrowRight
              className={cn(
                'h-4 w-4 text-muted-foreground/50',
                'transition-all duration-200',
                'opacity-0 -translate-x-1',
                'group-hover:opacity-100 group-hover:translate-x-0',
                'group-hover:text-primary'
              )}
              aria-hidden
            />
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {/* Subtle corner accent */}
        <CardCorner />
      </Card>
    </Link>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function AdminPage() {
  return (
    <div className="space-y-4">
      {/* Admin Cards Grid */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {adminCards.map((config, index) => (
          <AdminCard key={config.href} config={config} index={index} />
        ))}
      </div>
    </div>
  );
}
