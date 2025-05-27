
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
// Input component is no longer used if we only have a textarea
// import { Input } from '@/components/ui/input'; 
// Label component is being removed
// import { Label } from '@/components/ui/label'; 
import { Textarea } from '@/components/ui/textarea';
import type { Item, BucketType } from '@/types';

interface AddItemModalProps { // Renamed from AddActionItemModalProps
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string, bucket: BucketType, id?: string) => void;
  itemToEdit?: Item | null;
  defaultBucket: BucketType;
}

export function AddItemModal({ // Renamed from AddActionItemModal
  isOpen,
  onClose,
  onSave,
  itemToEdit,
  defaultBucket,
}: AddItemModalProps) { // Updated props type
  const [content, setContent] = useState('');

  useEffect(() => {
    if (itemToEdit) {
      setContent(itemToEdit.content);
    } else {
      setContent('');
    }
  }, [itemToEdit, isOpen]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSave(content.trim(), itemToEdit?.bucket || defaultBucket, itemToEdit?.id);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{itemToEdit ? 'Edit Item' : 'Add New Item'}</DialogTitle>
            <DialogDescription>
              {itemToEdit ? "Update the details of your item." : `Adding to "${defaultBucket}" bucket. You can change it later.`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4"> {/* Simplified container for the textarea */}
            <Textarea
              id="content" // id can remain for potential future accessibility uses
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="e.g., Finalize project proposal"
              required
              rows={2} // Changed from 3 to 2
              aria-label="Item content" // Added aria-label as the visual label is removed
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">{itemToEdit ? 'Save Changes' : 'Add Item'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
