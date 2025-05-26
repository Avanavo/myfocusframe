'use client';

import { useState, useEffect, type DragEvent } from 'react';
import { Header } from '@/components/sphere-of-control/Header';
import { BucketColumn } from '@/components/sphere-of-control/BucketColumn';
import { VoiceInput } from '@/components/sphere-of-control/VoiceInput';
import { AddActionItemModal } from '@/components/sphere-of-control/AddActionItemModal';
import { ConfirmDeleteDialog } from '@/components/sphere-of-control/ConfirmDeleteDialog';
import type { ActionItem, BucketType, ActionItemSuggestion } from '@/types';
import { loadActionItems, saveActionItems } from '@/lib/localStorage';
import { suggestRecategorization, type SuggestRecategorizationInput } from '@/ai/flows/suggest-recategorization';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const BUCKET_TYPES: BucketType[] = ['control', 'influence', 'acceptance'];
const BUCKET_TITLES: Record<BucketType, string> = {
  control: 'Control',
  influence: 'Influence',
  acceptance: 'Acceptance',
};

export default function SphereOfControlPage() {
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
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
    setIsClient(true); // Indicate client-side rendering is complete
    setActionItems(loadActionItems());
  }, []);

  useEffect(() => {
    if (isClient) { // Only save to localStorage on client
        saveActionItems(actionItems);
    }
  }, [actionItems, isClient]);

  const getAiSuggestion = async (itemContent: string, currentBucket: BucketType, itemId: string) => {
    setIsLoadingAi(true);
    try {
      const input: SuggestRecategorizationInput = { actionItem: itemContent, currentBucket };
      const suggestionResult = await suggestRecategorization(input);
      
      if (suggestionResult.suggestedBucket && suggestionResult.reasoning) {
        setActionItems(prevItems => prevItems.map(itm => 
          itm.id === itemId 
            ? { ...itm, suggestion: { suggestedBucket: suggestionResult.suggestedBucket as BucketType, reasoning: suggestionResult.reasoning! } } 
            : itm
        ));
        toast({ title: 'AI Suggestion', description: `AI has a suggestion for item: "${itemContent.substring(0,20)}..."`});
      }
    } catch (error) {
      console.error('Error getting AI suggestion:', error);
      toast({ title: 'AI Suggestion Error', description: 'Could not get AI suggestion.', variant: 'destructive' });
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleAddItem = (content: string, bucket: BucketType, idToUpdate?: string) => {
    if (idToUpdate) { // Editing existing item
      setActionItems(prevItems => 
        prevItems.map(item => 
          item.id === idToUpdate ? { ...item, content, bucket, suggestion: null } : item
        )
      );
      toast({ title: 'Item Updated', description: `"${content.substring(0,30)}..." updated.` });
      getAiSuggestion(content, bucket, idToUpdate);
    } else { // Adding new item
      const newItem: ActionItem = {
        id: Date.now().toString(), // Simple ID generation
        content,
        bucket,
        createdAt: new Date().toISOString(),
        suggestion: null,
      };
      setActionItems(prevItems => [...prevItems, newItem]);
      toast({ title: 'Item Added', description: `"${content.substring(0,30)}..." added to ${bucket}.` });
      getAiSuggestion(content, bucket, newItem.id);
    }
    setItemToEdit(null);
  };

  const handleTranscriptionComplete = (text: string) => {
    // Add transcribed text to 'influence' bucket by default, or open modal
    // For simplicity, directly add to 'influence'
    handleAddItem(text, 'influence');
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, itemId: string) => {
    setDraggedItemId(itemId);
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', itemId); // Necessary for Firefox
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, targetBucket: BucketType) => {
    e.preventDefault();
    if (!draggedItemId) return;

    const itemToMove = actionItems.find(item => item.id === draggedItemId);
    if (itemToMove && itemToMove.bucket !== targetBucket) {
      setActionItems(prevItems =>
        prevItems.map(item =>
          item.id === draggedItemId ? { ...item, bucket: targetBucket, suggestion: null } : item
        )
      );
      toast({ title: 'Item Moved', description: `Item moved to ${targetBucket}.` });
      if (itemToMove) { // Check if itemToMove is defined
        getAiSuggestion(itemToMove.content, targetBucket, itemToMove.id);
      }
    }
    setDraggedItemId(null);
  };

  const openAddModal = (bucket: BucketType) => {
    setItemToEdit(null);
    setDefaultBucketForModal(bucket);
    setIsModalOpen(true);
  };
  
  const openEditModal = (item: ActionItem) => {
    setItemToEdit(item);
    setDefaultBucketForModal(item.bucket); // Not strictly needed as item.bucket is used
    setIsModalOpen(true);
  };

  const handleDeleteItem = (itemId: string) => {
    setItemToDeleteId(itemId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteItem = () => {
    if (itemToDeleteId) {
      const item = actionItems.find(it => it.id === itemToDeleteId);
      setActionItems(prevItems => prevItems.filter(item => item.id !== itemToDeleteId));
      toast({ title: 'Item Deleted', description: `"${item?.content.substring(0,30)}..." deleted.`, variant: 'destructive' });
      setItemToDeleteId(null);
    }
  };
  
  const handleApplySuggestion = (itemId: string, newBucket: BucketType) => {
    const itemToUpdate = actionItems.find(item => item.id === itemId);
    if (itemToUpdate) {
      setActionItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, bucket: newBucket, suggestion: null } : item
        )
      );
      toast({ title: 'Suggestion Applied', description: `Item moved to ${newBucket}.`});
    }
  };

  const handleDismissSuggestion = (itemId: string) => {
     setActionItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, suggestion: null } : item
        )
      );
    toast({ title: 'Suggestion Dismissed'});
  };


  if (!isClient) {
    // Render a loading state or null during SSR/SSG to avoid hydration mismatch with localStorage
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-6 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
              items={actionItems.filter(item => item.bucket === bucketType).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())}
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
