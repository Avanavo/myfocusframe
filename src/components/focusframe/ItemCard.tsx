
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit3, Trash2 } from 'lucide-react';
import type { Item } from '@/types';

interface ItemCardProps {
  item: Item;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, itemId: string) => void;
  onEdit: (item: Item) => void;
  onDelete: (itemId: string) => void;
}

export function ItemCard({
  item,
  onDragStart,
  onEdit,
  onDelete,
}: ItemCardProps) {
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    onDragStart(e, item.id);
  };

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      className="mb-2 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow duration-150 bg-card"
      aria-label={`Item: ${item.content}`}
    >
      <CardContent className="p-2 flex items-center justify-between"> {/* Reduced padding, added flex for single line */}
        <p className="text-sm text-card-foreground truncate flex-grow mr-2"> {/* Truncate for long text, flex-grow */}
          {item.content}
        </p>
        <div className="flex items-center flex-shrink-0"> {/* Buttons container, no shrink */}
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
            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(item.id)}
            aria-label="Delete item"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
      {/* CardFooter and creation date removed */}
    </Card>
  );
}
