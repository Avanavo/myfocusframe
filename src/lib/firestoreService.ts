
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
  type FieldValue,
  type CollectionReference, // Added CollectionReference
  type DocumentData, // Added DocumentData
} from 'firebase/firestore';
import type { ActionItem, ActionItemSuggestion, BucketType } from '@/types';

// Helper function to get the user-specific action items collection reference
const getUserActionItemsCollectionRef = (userId: string): CollectionReference<DocumentData> => {
  return collection(db, 'users', userId, 'actionItems');
};

// Type for Firestore document data, excluding 'id' and ensuring createdAt is a Timestamp for Firestore
// No userId needed in the document itself if using subcollections
interface ActionItemDocumentData {
  content: string;
  bucket: BucketType;
  createdAt: Timestamp; // Firestore timestamp
  suggestion?: ActionItemSuggestion | null;
}

// Type for data coming from Firestore, where createdAt might be a server Timestamp
interface ActionItemFromFirestore extends Omit<ActionItem, 'createdAt' | 'id' | 'userId'> {
  id?: string; // id is not part of the document data itself
  createdAt: Timestamp; // Firestore specific timestamp
}


export function getActionItemsStream(
  userId: string,
  callback: (items: ActionItem[]) => void,
  onError: (error: Error) => void
): () => void { // Returns an unsubscribe function
  if (!userId) {
    onError(new Error("User ID is required to fetch action items."));
    return () => {}; // Return a no-op unsubscribe function
  }
  const userActionItemsRef = getUserActionItemsCollectionRef(userId);
  const q = query(userActionItemsRef, orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const items: ActionItem[] = [];
    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data() as ActionItemFromFirestore;
      items.push({
        ...data,
        id: docSnapshot.id,
        userId: userId, // Add userId to the item for local state if needed, though not stored in subcollection document
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
  userId: string,
  itemData: Omit<ActionItem, 'id' | 'createdAt' | 'suggestion' | 'userId'> & { suggestion?: ActionItemSuggestion | null }
): Promise<string> {
  if (!userId) {
    throw new Error("User ID is required to add an action item.");
  }
  try {
    const dataForFirestore: {
      content: string;
      bucket: BucketType;
      createdAt: FieldValue;
      suggestion?: ActionItemSuggestion;
    } = {
      content: itemData.content,
      bucket: itemData.bucket,
      createdAt: serverTimestamp(),
    };

    if (itemData.suggestion) {
      dataForFirestore.suggestion = itemData.suggestion;
    }
    const userActionItemsRef = getUserActionItemsCollectionRef(userId);
    const docRef = await addDoc(userActionItemsRef, dataForFirestore);
    return docRef.id;
  } catch (error) {
    console.error("Error adding action item: ", error);
    const dataAttempted = {
      content: itemData.content,
      bucket: itemData.bucket,
      createdAt: 'serverTimestamp_placeholder',
      suggestion: itemData.suggestion,
      userId: userId
    };
    console.error("Data attempted:", dataAttempted);
    throw error;
  }
}

export async function updateActionItem(
  userId: string,
  itemId: string,
  updates: Partial<Omit<ActionItem, 'id' | 'createdAt' | 'userId'>>
): Promise<void> {
  if (!userId) {
    throw new Error("User ID is required to update an action item.");
  }
  try {
    // Construct the path to the document within the user's subcollection
    const itemDocRef = doc(db, 'users', userId, 'actionItems', itemId);
    const { createdAt, ...validUpdates } = updates as any; 
    await updateDoc(itemDocRef, validUpdates);
  } catch (error) {
    console.error("Error updating action item: ", error);
    throw error;
  }
}

export async function deleteActionItem(userId: string, itemId: string): Promise<void> {
  if (!userId) {
    throw new Error("User ID is required to delete an action item.");
  }
  try {
    const itemDocRef = doc(db, 'users', userId, 'actionItems', itemId);
    await deleteDoc(itemDocRef);
  } catch (error) {
    console.error("Error deleting action item: ", error);
    throw error;
  }
}
