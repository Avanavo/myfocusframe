
'use client';

import { useState, useEffect, type DragEvent, useCallback } from 'react';
import { Header } from '@/components/sphere-of-control/Header';
import { BucketColumn } from '@/components/sphere-of-control/BucketColumn';
import { VoiceInput } from '@/components/sphere-of-control/VoiceInput';
import { AddActionItemModal } from '@/components/sphere-of-control/AddActionItemModal';
import { ConfirmDeleteDialog } from '@/components/sphere-of-control/ConfirmDeleteDialog';
import type { ActionItem, BucketType, ActionItemSuggestion } from '@/types';
import { 
  getActionItemsStream, 
  addActionItem, 
  updateActionItem, 
  deleteActionItem 
} from '@/lib/firestoreService';
import { suggestRecategorization, type SuggestRecategorizationInput } from '@/ai/flows/suggest-recategorization';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext'; 
import { Button } from '@/components/ui/button';

const BUCKET_TYPES: BucketType[] = ['control', 'influence', 'acceptance'];
const BUCKET_TITLES: Record<BucketType, string> = {
  control: 'Control',
  influence: 'Influence',
  acceptance: 'Acceptance',
};

export default function SphereOfControlPage() {
  const { currentUser, loading: authLoading, signInWithGoogle } = useAuth();
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<ActionItem | null>(null);
  const [defaultBucketForModal, setDefaultBucketForModal] = useState<BucketType>('control');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true); 

    if (!currentUser?.uid) {
      setActionItems([]); 
      setIsLoadingItems(false);
      return;
    }

    setIsLoadingItems(true);
    const unsubscribe = getActionItemsStream(
      currentUser.uid, // Pass user ID
      (items) => {
        setActionItems(items);
        setIsLoadingItems(false);
      },
      (error) => {
        console.error("Failed to load items:", error);
        toast({ title: 'Error Loading Items', description: 'Could not fetch items from Firestore.', variant: 'destructive' });
        setIsLoadingItems(false);
      }
    );
    return () => unsubscribe();
  }, [currentUser, toast]);

  const getAiSuggestion = useCallback(async (itemContent: string, currentBucket: BucketType, itemId: string) => {
    if (!currentUser?.uid) return; 
    setIsLoadingAi(true);
    try {
      const input: SuggestRecategorizationInput = { actionItem: itemContent, currentBucket };
      const suggestionResult = await suggestRecategorization(input);
      
      if (suggestionResult.suggestedBucket && suggestionResult.reasoning) {
        const suggestion: ActionItemSuggestion = { 
          suggestedBucket: suggestionResult.suggestedBucket as BucketType, 
          reasoning: suggestionResult.reasoning! 
        };
        await updateActionItem(currentUser.uid, itemId, { suggestion }); // Pass user ID
        toast({ title: 'AI Suggestion', description: `AI has a suggestion for item: "${itemContent.substring(0,20)}..."`});
      }
    } catch (error) {
      console.error('Error getting AI suggestion:', error);
      toast({ title: 'AI Suggestion Error', description: 'Could not get AI suggestion.', variant: 'destructive' });
    } finally {
      setIsLoadingAi(false);
    }
  }, [currentUser, toast]); 

  const handleAddItem = async (content: string, bucket: BucketType, idToUpdate?: string) => {
    if (!currentUser?.uid) {
      toast({ title: 'Not Signed In', description: 'You must be signed in to add items.', variant: 'destructive' });
      return;
    }
    try {
      if (idToUpdate) { 
        await updateActionItem(currentUser.uid, idToUpdate, { content, bucket, suggestion: null }); // Pass user ID
        toast({ title: 'Item Updated', description: `"${content.substring(0,30)}..." updated.` });
        getAiSuggestion(content, bucket, idToUpdate);
      } else { 
        const newItemData = { content, bucket, suggestion: null };
        // addActionItem now takes userId as the first argument
        const newId = await addActionItem(currentUser.uid, newItemData); // Pass user ID
        toast({ title: 'Item Added', description: `"${content.substring(0,30)}..." added to ${bucket}.` });
        getAiSuggestion(content, bucket, newId);
      }
    } catch (error) {
      console.error("Error saving item:", error);
      toast({ title: 'Error Saving Item', description: 'Could not save item to Firestore.', variant: 'destructive' });
    }
    setItemToEdit(null);
  };

  const handleTranscriptionComplete = (text: string) => {
    if (!currentUser?.uid) {
       toast({ title: 'Not Signed In', description: 'Please sign in to add items via voice.', variant: 'destructive' });
      return;
    }
    handleAddItem(text, 'influence');
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, itemId: string) => {
    setDraggedItemId(itemId);
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', itemId);
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>, targetBucket: BucketType) => {
    e.preventDefault();
    if (!draggedItemId || !currentUser?.uid) return;

    const itemToMove = actionItems.find(item => item.id === draggedItemId);
    if (itemToMove && itemToMove.bucket !== targetBucket) {
      try {
        await updateActionItem(currentUser.uid, draggedItemId, { bucket: targetBucket, suggestion: null }); // Pass user ID
        toast({ title: 'Item Moved', description: `Item moved to ${targetBucket}.` });
        getAiSuggestion(itemToMove.content, targetBucket, itemToMove.id);
      } catch (error) {
        console.error("Error moving item:", error);
        toast({ title: 'Error Moving Item', description: 'Could not update item in Firestore.', variant: 'destructive' });
      }
    }
    setDraggedItemId(null);
  };

  const openAddModal = (bucket: BucketType) => {
    if (!currentUser?.uid) {
       toast({ title: 'Not Signed In', description: 'Please sign in to add items.', variant: 'destructive' });
      return;
    }
    setItemToEdit(null);
    setDefaultBucketForModal(bucket);
    setIsModalOpen(true);
  };
  
  const openEditModal = (item: ActionItem) => {
    if (!currentUser?.uid) return;
    setItemToEdit(item);
    setDefaultBucketForModal(item.bucket);
    setIsModalOpen(true);
  };

  const handleDeleteItem = (itemId: string) => {
    if (!currentUser?.uid) return;
    setItemToDeleteId(itemId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteItem = async () => {
    if (itemToDeleteId && currentUser?.uid) {
      const item = actionItems.find(it => it.id === itemToDeleteId);
      try {
        await deleteActionItem(currentUser.uid, itemToDeleteId); // Pass user ID
        toast({ title: 'Item Deleted', description: `"${item?.content.substring(0,30)}..." deleted.`, variant: 'destructive' });
      } catch (error) {
        console.error("Error deleting item:", error);
        toast({ title: 'Error Deleting Item', description: 'Could not delete item from Firestore.', variant: 'destructive' });
      }
      setItemToDeleteId(null);
    }
  };
  
  const handleApplySuggestion = async (itemId: string, newBucket: BucketType) => {
    if (!currentUser?.uid) return;
    try {
      await updateActionItem(currentUser.uid, itemId, { bucket: newBucket, suggestion: null }); // Pass user ID
      toast({ title: 'Suggestion Applied', description: `Item moved to ${newBucket}.`});
    } catch (error) { 
      console.error("Error applying suggestion:", error);
      toast({ title: 'Error Applying Suggestion', description: 'Could not update item.', variant: 'destructive' });
    }
  };

  const handleDismissSuggestion = async (itemId: string) => {
    if (!currentUser?.uid) return;
    try {
      await updateActionItem(currentUser.uid, itemId, { suggestion: null }); // Pass user ID
      toast({ title: 'Suggestion Dismissed'});
    } catch (error) {
      console.error("Error dismissing suggestion:", error);
      toast({ title: 'Error Dismissing Suggestion', description: 'Could not update item.', variant: 'destructive' });
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-6 flex flex-col items-center justify-center text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Authenticating...</p>
        </main>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header /> 
        <main className="flex-grow container mx-auto px-4 py-6 flex flex-col items-center justify-center text-center">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">Welcome to Sphere of Control</h2>
          <p className="mb-6 text-muted-foreground">Please sign in with Google to manage your action items.</p>
          <Button onClick={signInWithGoogle} size="lg">
            <LogIn className="mr-2 h-5 w-5" />
            Sign in with Google
          </Button>
        </main>
      </div>
    );
  }

  if (!isClient || (isLoadingItems && actionItems.length === 0)) { 
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-6 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-muted-foreground">Loading your items...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6">
        <VoiceInput onTranscriptionComplete={handleTranscriptionComplete} />
        
        {isLoadingAi && (
          <div className="fixed top-4 right-4 bg-primary text-primary-foreground p-3 rounded-md shadow-lg flex items-center z-50">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>AI is thinking...</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {BUCKET_TYPES.map(bucketType => (
            <BucketColumn
              key={bucketType}
              bucketType={bucketType}
              title={BUCKET_TITLES[bucketType]}
              items={actionItems.filter(item => item.bucket === bucketType)}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragStartCard={handleDragStart}
              onOpenAddModal={openAddModal}
              onEditItem={openEditModal}
              onDeleteItem={handleDeleteItem}
              onApplySuggestion={handleApplySuggestion}
              onDismissSuggestion={handleDismissSuggestion}
            />
          ))}
        </div>
      </main>

      <AddActionItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddItem}
        itemToEdit={itemToEdit}
        defaultBucket={defaultBucketForModal}
      />

      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDeleteItem}
        itemName={actionItems.find(i => i.id === itemToDeleteId)?.content.substring(0,30) + "..."}
      />
    </div>
  );
}
