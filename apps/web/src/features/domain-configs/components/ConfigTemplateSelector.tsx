/**
 * ConfigTemplateSelector Component
 *
 * Allows users to select a pre-defined configuration template
 * as a starting point for their domain configuration.
 */

import { useState, useMemo } from 'react';
import { Check, FileCode, Tag, Sparkles } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  ScrollArea,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import { domainTypeLabels, type DomainType } from '../types/domain-configs.types';
import {
  configTemplates,
  getTemplatesForDomain,
  type ConfigTemplate,
} from '../data/config-templates';

// =============================================================================
// Types
// =============================================================================

interface ConfigTemplateSelectorProps {
  /** Currently selected domain type (optional filter) */
  domainType?: DomainType;
  /** Callback when a template is selected */
  onSelect: (template: ConfigTemplate) => void;
  /** Currently selected template ID */
  selectedTemplateId?: string;
  /** Additional class name */
  className?: string;
}

interface TemplateCardProps {
  template: ConfigTemplate;
  isSelected: boolean;
  onSelect: () => void;
}

// =============================================================================
// Template Card
// =============================================================================

function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-primary'
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-pressed={isSelected}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'p-2 rounded-md',
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              <FileCode className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">{template.name}</CardTitle>
              <Badge variant="outline" className="mt-1 text-xs">
                {domainTypeLabels[template.domainType]}
              </Badge>
            </div>
          </div>
          {isSelected && (
            <div className="p-1 rounded-full bg-primary text-primary-foreground">
              <Check className="h-4 w-4" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-sm">
          {template.description}
        </CardDescription>
        <div className="flex flex-wrap gap-1 mt-3">
          {template.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              <Tag className="h-3 w-3 mr-1" />
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Component
// =============================================================================

export function ConfigTemplateSelector({
  domainType,
  onSelect,
  selectedTemplateId,
  className,
}: ConfigTemplateSelectorProps) {
  const [filterTag, setFilterTag] = useState<string | null>(null);

  // Get templates based on domain type filter
  const templates = useMemo(() => {
    return domainType ? getTemplatesForDomain(domainType) : configTemplates;
  }, [domainType]);

  // Get unique tags from available templates
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    templates.forEach((t) => t.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [templates]);

  // Filter templates by tag
  const filteredTemplates = useMemo(() => {
    if (!filterTag) return templates;
    return templates.filter((t) => t.tags.includes(filterTag));
  }, [templates, filterTag]);

  if (templates.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        <FileCode className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No templates available for this domain type.</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-medium">Start from a Template</h3>
      </div>

      {/* Tag Filters */}
      {availableTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterTag === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterTag(null)}
          >
            All
          </Button>
          {availableTags.map((tag) => (
            <Button
              key={tag}
              variant={filterTag === tag ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterTag(tag)}
            >
              {tag}
            </Button>
          ))}
        </div>
      )}

      {/* Template Grid */}
      <ScrollArea className="h-[400px] pr-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedTemplateId === template.id}
              onSelect={() => onSelect(template)}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Selected template info */}
      {selectedTemplateId && (
        <div className="p-3 rounded-md bg-muted/50 text-sm">
          <span className="text-muted-foreground">Selected: </span>
          <span className="font-medium">
            {templates.find((t) => t.id === selectedTemplateId)?.name}
          </span>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Compact Selector (for dialog/modal use)
// =============================================================================

interface CompactTemplateSelectorProps {
  domainType: DomainType;
  onSelect: (configJson: Record<string, unknown>) => void;
  className?: string;
}

export function CompactTemplateSelector({
  domainType,
  onSelect,
  className,
}: CompactTemplateSelectorProps) {
  const templates = useMemo(() => getTemplatesForDomain(domainType), [domainType]);

  if (templates.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-sm text-muted-foreground">
        Quick start with a template:
      </p>
      <div className="flex flex-wrap gap-2">
        {templates.map((template) => (
          <Button
            key={template.id}
            variant="outline"
            size="sm"
            onClick={() => onSelect(template.configJson)}
            className="gap-1"
          >
            <FileCode className="h-3 w-3" />
            {template.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
