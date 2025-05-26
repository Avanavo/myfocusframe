
'use client';

import type React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Target, Megaphone, Anchor } from 'lucide-react';
import { ActionItemCard } from './ActionItemCard';
import type { ActionItem, BucketType } from '@/types';

interface BucketColumnProps {
  bucketType: BucketType;
  title: string;
  items: ActionItem[];
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, bucket: BucketType) => void;
  onDragStartCard: (e: React.DragEvent<HTMLDivElement>, itemId: string) => void;
  onOpenAddModal: (bucket: BucketType) => void;
  onEditItem: (item: ActionItem) => void;
  onDeleteItem: (itemId: string) => void;
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
  onDragOver,
  onDrop,
  onDragStartCard,
  onOpenAddModal,
  onEditItem,
  onDeleteItem,
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
      className="flex-1 flex flex-col min-w-[300px] max-w-md h-[calc(100vh-200px)] bg-card/80 backdrop-blur-sm shadow-xl rounded-lg"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      aria-labelledby={`bucket-title-${bucketType}`}
    >
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <IconComponent className="w-7 h-7 text-primary" />
          <CardTitle id={`bucket-title-${bucketType}`} className="text-2xl font-semibold text-foreground">{title}</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-primary hover:text-primary/80"
          onClick={() => onOpenAddModal(bucketType)}
          aria-label={`Add item to ${title} bucket`}
        >
          <PlusCircle className="w-6 h-6" />
        </Button>
      </CardHeader>
      <ScrollArea className="flex-grow">
        <CardContent className="p-4">
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No items in this bucket yet.</p>
          )}
          {items.map((item) => (
            <ActionItemCard
              key={item.id}
              item={item}
              onDragStart={onDragStartCard}
              onEdit={onEditItem}
              onDelete={onDeleteItem}
            />
          ))}
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
