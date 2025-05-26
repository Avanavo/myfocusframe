'use client';

import { Card, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit3, Trash2, AlertTriangle, CheckCircle, Sparkles, XCircle } from 'lucide-react';
import type { ActionItem, BucketType } from '@/types';

interface ActionItemCardProps {
  item: ActionItem;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, itemId: string) => void;
  onEdit: (item: ActionItem) => void;
  onDelete: (itemId: string) => void;
  onApplySuggestion: (itemId: string, newBucket: BucketType) => void;
  onDismissSuggestion: (itemId: string) => void;
}

export function ActionItemCard({
  item,
  onDragStart,
  onEdit,
  onDelete,
  onApplySuggestion,
  onDismissSuggestion
}: ActionItemCardProps) {
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    onDragStart(e, item.id);
  };

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      className="mb-3 cursor-grab active:cursor-grabbing shadow-md hover:shadow-lg transition-shadow duration-150 bg-card"
      aria-label={`Action item: ${item.content}`}
    >
      <CardContent className="p-4">
        <p className="text-sm text-card-foreground mb-2">{item.content}</p>
        <div className="text-xs text-muted-foreground">
          Added: {new Date(item.createdAt).toLocaleDateString()}
        </div>
      </CardContent>
      {item.suggestion && (
        <CardFooter className="p-3 pt-0 border-t border-border/50 bg-accent/10">
          <div className="w-full">
            <div className="flex items-center gap-2 text-sm font-medium text-accent-foreground mb-1">
              <Sparkles className="w-4 h-4 text-accent" />
              <span>AI Suggestion</span>
            </div>
            <p className="text-xs text-accent-foreground/90 mb-2">
              Move to <Badge variant="outline" className="bg-accent/20 text-accent-foreground border-accent/50 mx-1">{item.suggestion.suggestedBucket}</Badge>?
              Reason: {item.suggestion.reasoning}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="bg-green-500/20 hover:bg-green-500/30 border-green-500/50 text-green-700 hover:text-green-800"
                onClick={() => onApplySuggestion(item.id, item.suggestion!.suggestedBucket)}
                aria-label={`Apply suggestion to move to ${item.suggestion.suggestedBucket}`}
              >
                <CheckCircle className="mr-1 h-3.5 w-3.5" /> Apply
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-red-500/20 hover:bg-red-500/30 border-red-500/50 text-red-700 hover:text-red-800"
                onClick={() => onDismissSuggestion(item.id)}
                aria-label="Dismiss suggestion"
              >
                <XCircle className="mr-1 h-3.5 w-3.5" /> Dismiss
              </Button>
            </div>
          </div>
        </CardFooter>
      )}
      <CardFooter className={`p-3 flex justify-end gap-2 ${item.suggestion ? '' : 'border-t border-border/50'}`}>
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
