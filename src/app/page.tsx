
'use client';

import { useState, useEffect, type DragEvent } from 'react';
import { Header } from '@/components/focusframe/Header';
import { BucketColumn } from '@/components/focusframe/BucketColumn';
import { AddItemModal } from '@/components/focusframe/AddItemModal';
import { ConfirmDialog } from '@/components/focusframe/ConfirmDialog'; // Corrected import path
import type { Item, BucketType } from '@/types'; 
import { 
  getItemsStream, 
  addItem, 
  updateItem, 
  deleteItem  
} from '@/lib/firestoreService';
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

export default function FocusFramePage() {
  const { currentUser, loading: authLoading, signInWithGoogle } = useAuth();
  const [items, setItems] = useState<Item[]>([]); 
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Item | null>(null); 
  const [defaultBucketForModal, setDefaultBucketForModal] = useState<BucketType>('control');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [collapsedBuckets, setCollapsedBuckets] = useState<Record<BucketType, boolean>>({
    control: true, // Collapsed by default
    influence: true, // Collapsed by default
    acceptance: true, // Collapsed by default
  });

  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true); 

    if (!currentUser?.uid) {
      setItems([]); 
      setIsLoadingItems(false);
      return;
    }

    setIsLoadingItems(true);
    const unsubscribe = getItemsStream( 
      currentUser.uid,
      (loadedItems) => { 
        setItems(loadedItems);
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

  const handleSaveItem = async (content: string, bucket: BucketType, idToUpdate?: string) => { 
    if (!currentUser?.uid) {
      toast({ title: 'Not Signed In', description: 'You must be signed in to add items.', variant: 'destructive' });
      return;
    }
    try {
      if (idToUpdate) { 
        await updateItem(currentUser.uid, idToUpdate, { content, bucket }); 
      } else { 
        const newItemData = { content, bucket };
        await addItem(currentUser.uid, newItemData); 
      }
    } catch (error) {
      console.error("Error saving item:", error);
      toast({ title: 'Error Saving Item', description: 'Could not save item to Firestore.', variant: 'destructive' });
    }
    setItemToEdit(null);
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

    const itemToMove = items.find(item => item.id === draggedItemId); 
    if (itemToMove && itemToMove.bucket !== targetBucket) {
      try {
        await updateItem(currentUser.uid, draggedItemId, { bucket: targetBucket }); 
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
  
  const openEditModal = (item: Item) => { 
    if (!currentUser?.uid) return;
    setItemToEdit(item);
    setDefaultBucketForModal(item.bucket);
    setIsModalOpen(true);
  };

  const handleDeleteRequest = (itemId: string) => {
    if (!currentUser?.uid) return;
    setItemToDeleteId(itemId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteItem = async () => {
    if (itemToDeleteId && currentUser?.uid) {
      try {
        await deleteItem(currentUser.uid, itemToDeleteId); 
      } catch (error) {
        console.error("Error deleting item:", error);
        toast({ title: 'Error Deleting Item', description: 'Could not delete item from Firestore.', variant: 'destructive' });
      }
      setItemToDeleteId(null);
    }
  };

  const toggleBucketCollapse = (bucketType: BucketType) => {
    setCollapsedBuckets(prev => ({
      ...prev,
      [bucketType]: !prev[bucketType],
    }));
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
          <h2 className="text-2xl font-semibold mb-4 text-foreground">Welcome to your FocusFrame</h2>
          
          <Button onClick={signInWithGoogle} size="lg" className="mt-2">
            <LogIn className="mr-2 h-5 w-5" />
            Sign in with Google
          </Button>
        </main>
      </div>
    );
  }

  if (!isClient || (isLoadingItems && items.length === 0 && currentUser)) { 
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

  const itemNameToDelete = itemToDeleteId ? items.find(i => i.id === itemToDeleteId)?.content.substring(0,30) + "..." : "this item"; 


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start"> 
          {BUCKET_TYPES.map(bucketType => {
            const itemsInBucket = items.filter(item => item.bucket === bucketType); 
            return (
              <BucketColumn
                key={bucketType}
                bucketType={bucketType}
                title={BUCKET_TITLES[bucketType]}
                items={itemsInBucket}
                itemCount={itemsInBucket.length}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragStartCard={handleDragStart}
                onOpenAddModal={openAddModal}
                onEditItem={openEditModal}
                onDeleteItem={handleDeleteRequest}
                isCollapsed={collapsedBuckets[bucketType]}
                onToggleCollapse={toggleBucketCollapse}
              />
            );
          })}
        </div>
      </main>

      <AddItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveItem} 
        itemToEdit={itemToEdit}
        defaultBucket={defaultBucketForModal}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDeleteItem}
        title="Are you sure?"
        description={`This action will permanently delete "${itemNameToDelete}". This cannot be undone.`}
        confirmButtonText="Delete Item"
        confirmButtonVariant="destructive"
      />
    </div>
  );
}
