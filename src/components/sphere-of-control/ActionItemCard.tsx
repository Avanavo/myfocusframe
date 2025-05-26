
'use client';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit3, Trash2 } from 'lucide-react';
import type { ActionItem } from '@/types';

interface ActionItemCardProps {
  item: ActionItem;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, itemId: string) => void;
  onEdit: (item: ActionItem) => void;
  onDelete: (itemId: string) => void;
}

export function ActionItemCard({
  item,
  onDragStart,
  onEdit,
  onDelete,
}: ActionItemCardProps) {
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    onDragStart(e, item.id);
  };

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      className="mb-4 cursor-grab active:cursor-grabbing shadow-md hover:shadow-lg transition-shadow duration-150 bg-card"
      aria-label={`Action item: ${item.content}`}
    >
      <CardContent className="p-5">
        <p className="text-sm text-card-foreground">{item.content}</p>
        <div className="text-xs text-muted-foreground mt-3">
          Added: {new Date(item.createdAt).toLocaleDateString()}
        </div>
      </CardContent>
      <CardFooter className="p-4 flex justify-end gap-2 border-t border-border/50">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-primary"
          onClick={() => onEdit(item)}
          aria-label="Edit item"
        >
          <Edit3 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(item.id)}
          aria-label="Delete item"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
