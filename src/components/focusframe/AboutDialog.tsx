
'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Logo } from './Logo';

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutDialog({ isOpen, onClose }: AboutDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center items-center">
          <Logo className="h-10 w-10 mb-3" />
          <DialogTitle className="text-2xl">My FocusFrame</DialogTitle>
          <DialogDescription className="px-4 py-2 text-center">
            Version 1.0.0
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 px-2 text-sm text-foreground text-center space-y-3">
          <p>
            <strong>My FocusFrame</strong> helps you gain clarity and manage your tasks and thoughts by categorizing them into what you can:
          </p>
          <ul className="list-disc list-inside text-left pl-4 space-y-1">
            <li><strong>Control:</strong> Items you have direct power over.</li>
            <li><strong>Influence:</strong> Items you can affect but not fully control.</li>
            <li><strong>Acceptance:</strong> Items you cannot change and must accept.</li>
          </ul>
          <p className="pt-2">
            This approach, often referred to as the CIA (Control, Influence, Acceptance) framework, helps you direct your energy effectively and find peace of mind. It's a concept widely discussed in personal development and stress management literature.
          </p>
        </div>
        <DialogFooter className="flex flex-col items-center space-y-3 pt-4">
          {/* "Created by" paragraph is the first child, so it will be on top in flex-col */}
          <p className="text-sm text-muted-foreground"> {/* Changed to text-sm */}
            Created by <a href="https://avanavo.eu" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Avanavo</a>
          </p>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
