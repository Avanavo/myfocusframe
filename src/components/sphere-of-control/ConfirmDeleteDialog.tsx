
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button"; // For custom action button text

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmButtonText?: string;
  confirmButtonVariant?: "default" | "destructive";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmButtonText = "Confirm",
  confirmButtonVariant = "default",
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirm();
              onClose(); // Close dialog after confirmation
            }}
            // This allows applying variant directly if AlertDialogAction supported it.
            // For now, we might need to use a regular Button for full variant control if needed.
            // className={cn(buttonVariants({ variant: confirmButtonVariant }))}
            // Using default styling for now, can be customized if AlertDialogAction is limited.
          >
             {/* If AlertDialogAction doesn't take variant prop, we use its default styling.
                 For explicit destructive styling, we'd need to ensure the parent sets the right context
                 or a custom component. ShadCN's AlertDialogAction is typically styled based on context.
                 The default action is often primary. We'll make it visually destructive for 'Forget Me' via prop.
             */}
            <Button 
              onClick={() => {
                onConfirm();
                onClose();
              }}
              variant={confirmButtonVariant}
            >
              {confirmButtonText}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
