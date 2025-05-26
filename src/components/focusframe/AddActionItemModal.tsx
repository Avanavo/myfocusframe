
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Item, BucketType } from '@/types'; // Renamed from ActionItem

interface AddActionItemModalProps { // Interface name can be kept if it refers to the modal's purpose
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string, bucket: BucketType, id?: string) => void;
  itemToEdit?: Item | null; // Renamed from ActionItem
  defaultBucket: BucketType;
}

export function AddActionItemModal({
  isOpen,
  onClose,
  onSave,
  itemToEdit,
  defaultBucket,
}: AddActionItemModalProps) {
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
            <DialogTitle>{itemToEdit ? 'Edit Item' : 'Add New Item'}</DialogTitle> {/* Changed "Action Item" to "Item" */}
            <DialogDescription>
              {itemToEdit ? "Update the details of your item." : `Adding to "${defaultBucket}" bucket. You can change it later.`} {/* Changed "action item" to "item" */}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="content" className="text-right">
                Content
              </Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Finalize project proposal"
                required
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">{itemToEdit ? 'Save Changes' : 'Add Item'}</Button> {/* Changed "Add Item" */}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
