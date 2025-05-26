
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
  type CollectionReference,
  type DocumentData,
} from 'firebase/firestore';
import type { ActionItem, ActionItemSuggestion, BucketType } from '@/types';

// Helper function to get the user-specific action items collection reference
const getUserActionItemsCollectionRef = (userId: string): CollectionReference<DocumentData> => {
  return collection(db, 'users', userId, 'actionItems');
};

// Type for Firestore document data, excluding 'id' and ensuring createdAt is a Timestamp for Firestore
interface ActionItemDocumentData {
  content: string;
  bucket: BucketType;
  createdAt: FieldValue; // Use FieldValue for serverTimestamp()
  suggestion?: ActionItemSuggestion | null;
}

// Type for data coming from Firestore, where createdAt might be a server Timestamp
interface ActionItemFromFirestore extends Omit<ActionItem, 'createdAt' | 'id' | 'userId'> {
  id?: string; // id is not part of the document data itself
  createdAt: Timestamp; // Firestore specific timestamp
  // Ensure all other expected fields from ActionItem (excluding id, userId, createdAt) are here
  content: string;
  bucket: BucketType;
  suggestion?: ActionItemSuggestion | null;
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
      const data = docSnapshot.data() as Partial<ActionItemFromFirestore>; // Use Partial to handle potentially missing fields

      // Check if createdAt exists and is a Firestore Timestamp
      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        items.push({
          // Safely access properties with fallbacks if necessary, though `id` comes from docSnapshot
          id: docSnapshot.id,
          userId: userId,
          content: data.content || '', // Provide fallback for content
          bucket: data.bucket || 'acceptance', // Provide fallback for bucket
          createdAt: data.createdAt.toDate().toISOString(),
          suggestion: data.suggestion !== undefined ? data.suggestion : null,
        });
      } else {
        // Log a warning for items with missing or invalid createdAt field
        console.warn(
          `Action item with ID ${docSnapshot.id} has an invalid or missing 'createdAt' field. Skipping item. Data:`,
          data
        );
      }
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
    const dataForFirestore: ActionItemDocumentData = {
      content: itemData.content,
      bucket: itemData.bucket,
      createdAt: serverTimestamp(), // This will be a server-side timestamp
    };

    // Only include suggestion if it's explicitly provided and not undefined
    // Firestore handles 'null' correctly if you want to store it as null.
    // If you want to omit the field if suggestion is null/undefined, check for it.
    if (itemData.suggestion !== undefined) {
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
    const itemDocRef = doc(db, 'users', userId, 'actionItems', itemId);
    // Ensure 'createdAt' and 'userId' are not part of the updates sent to Firestore,
    // as these are typically not mutable or managed differently.
    const { createdAt, userId: RuserId, ...validUpdates } = updates as any;
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
  } catch (error)
{
    console.error("Error deleting action item: ", error);
    throw error;
  }
}
