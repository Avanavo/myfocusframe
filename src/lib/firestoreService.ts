
import { db } from './firebase';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import type { ActionItem, ActionItemSuggestion, BucketType } from '@/types';

const ACTION_ITEMS_COLLECTION = 'actionItems';

// Type for Firestore document data, excluding 'id' and ensuring createdAt is a Timestamp for Firestore
interface ActionItemDocumentData {
  content: string;
  bucket: BucketType;
  createdAt: Timestamp; // Firestore timestamp
  suggestion?: ActionItemSuggestion | null;
}

// Type for data coming from Firestore, where createdAt might be a server Timestamp
interface ActionItemFromFirestore extends Omit<ActionItem, 'createdAt' | 'id'> {
  id?: string; // id is not part of the document data itself
  createdAt: Timestamp; // Firestore specific timestamp
}


export function getActionItemsStream(
  callback: (items: ActionItem[]) => void,
  onError: (error: Error) => void
): () => void { // Returns an unsubscribe function
  const q = query(collection(db, ACTION_ITEMS_COLLECTION), orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const items: ActionItem[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as ActionItemFromFirestore;
      items.push({
        ...data,
        id: doc.id,
        createdAt: data.createdAt.toDate().toISOString(), // Convert Firestore Timestamp to ISO string
      });
    });
    callback(items);
  }, (error) => {
    console.error("Error fetching action items: ", error);
    onError(error);
  });

  return unsubscribe;
}

export async function addActionItem(
  itemData: Omit<ActionItem, 'id' | 'createdAt' | 'suggestion'> & { suggestion?: ActionItemSuggestion | null }
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, ACTION_ITEMS_COLLECTION), {
      ...itemData,
      createdAt: serverTimestamp(), // Use server timestamp
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding action item: ", error);
    throw error;
  }
}

export async function updateActionItem(
  itemId: string,
  updates: Partial<Omit<ActionItem, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    const itemDocRef = doc(db, ACTION_ITEMS_COLLECTION, itemId);
    // If createdAt is part of updates, it should be a serverTimestamp or already a Firestore Timestamp
    // For simplicity, we are not allowing direct update of createdAt here.
    // If you need to update createdAt, handle its conversion to Firestore Timestamp carefully.
    const { createdAt, ...validUpdates } = updates as any; 
    await updateDoc(itemDocRef, validUpdates);
  } catch (error) {
    console.error("Error updating action item: ", error);
    throw error;
  }
}

export async function deleteActionItem(itemId: string): Promise<void> {
  try {
    const itemDocRef = doc(db, ACTION_ITEMS_COLLECTION, itemId);
    await deleteDoc(itemDocRef);
  } catch (error) {
    console.error("Error deleting action item: ", error);
    throw error;
  }
}
