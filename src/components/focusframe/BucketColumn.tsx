
'use client';

import type React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Target, Megaphone, Anchor, ChevronDown, ChevronUp } from 'lucide-react';
import { ItemCard } from './ItemCard'; // Updated import
import type { Item, BucketType } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface BucketColumnProps {
  bucketType: BucketType;
  title: string;
  items: Item[];
  itemCount: number;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, bucket: BucketType) => void;
  onDragStartCard: (e: React.DragEvent<HTMLDivElement>, itemId: string) => void;
  onOpenAddModal: (bucket: BucketType) => void;
  onEditItem: (item: Item) => void;
  onDeleteItem: (itemId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: (bucketType: BucketType) => void;
}

const BUCKET_ICONS: Record<BucketType, React.ElementType> = {
  control: Target,
  influence: Megaphone,
  acceptance: Anchor,
};

export function BucketColumn({
  bucketType,
  title,
  items,
  itemCount,
  onDragOver,
  onDrop,
  onDragStartCard,
  onOpenAddModal,
  onEditItem,
  onDeleteItem,
  isCollapsed,
  onToggleCollapse,
}: BucketColumnProps) {
  const IconComponent = BUCKET_ICONS[bucketType];

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    onDragOver(e);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    onDrop(e, bucketType);
  };

  return (
    <Card
      className={cn(
        "flex flex-col max-w-md bg-card/80 backdrop-blur-sm shadow-xl rounded-lg transition-all duration-300 ease-in-out",
        isCollapsed ? "h-auto" : "h-[calc(100vh-200px)]"
      )}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      aria-labelledby={`bucket-title-${bucketType}`}
    >
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <IconComponent className="w-7 h-7 text-primary" />
          <CardTitle id={`bucket-title-${bucketType}`} className="text-xl font-semibold text-foreground">{title}</CardTitle>
          {isCollapsed && (
            <Badge variant="secondary" className="ml-1 text-xs">
              {itemCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center">
           <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={() => onToggleCollapse(bucketType)}
            aria-label={isCollapsed ? `Expand ${title} bucket` : `Collapse ${title} bucket`}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary hover:text-primary/80"
            onClick={() => onOpenAddModal(bucketType)}
            aria-label={`Add item to ${title} bucket`}
          >
            <PlusCircle className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>
      {!isCollapsed && (
        <ScrollArea className="flex-grow">
          <CardContent className="p-4">
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No items in this bucket yet.</p>
            )}
            {items.map((item) => (
              <ItemCard // Updated component usage
                key={item.id}
                item={item}
                onDragStart={onDragStartCard}
                onEdit={onEditItem}
                onDelete={onDeleteItem}
              />
            ))}
          </CardContent>
        </ScrollArea>
      )}
    </Card>
  );
}
