
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
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import type { ActionItem, BucketType } from '@/types';

// Helper function to get the user-specific action items collection reference
const getUserActionItemsCollectionRef = (userId: string): CollectionReference<DocumentData> => {
  return collection(db, 'users', userId, 'actionItems');
};

// Type for Firestore document data, excluding 'id' and ensuring createdAt is a Timestamp for Firestore
interface ActionItemDocumentData {
  content: string;
  bucket: BucketType;
  createdAt: FieldValue; // Use FieldValue for serverTimestamp()
}

// Type for data coming from Firestore, where createdAt might be a server Timestamp
interface ActionItemFromFirestore extends Omit<ActionItem, 'createdAt' | 'id'> {
  id?: string; // id is not part of the document data itself
  createdAt: Timestamp; // Firestore specific timestamp
  content: string;
  bucket: BucketType;
}


export function getActionItemsStream(
  userId: string,
  callback: (items: ActionItem[]) => void,
  onError: (error: Error) => void
): () => void { // Returns an unsubscribe function
  if (!userId) {
    //onError(new Error("User ID is required to fetch action items.")); // Caller handles no user state
    callback([]); // Return empty list if no user
    return () => {}; // Return a no-op unsubscribe function
  }
  const userActionItemsRef = getUserActionItemsCollectionRef(userId);
  const q = query(userActionItemsRef, orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const items: ActionItem[] = [];
    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data() as Partial<ActionItemFromFirestore>; 

      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        items.push({
          id: docSnapshot.id,
          userId: userId,
          content: data.content || '', 
          bucket: data.bucket || 'acceptance', 
          createdAt: data.createdAt.toDate().toISOString(),
        });
      } else {
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
  itemData: Omit<ActionItem, 'id' | 'createdAt' | 'userId'>
): Promise<string> {
  if (!userId) {
    throw new Error("User ID is required to add an action item.");
  }
  try {
    const dataForFirestore: ActionItemDocumentData = {
      content: itemData.content,
      bucket: itemData.bucket,
      createdAt: serverTimestamp(),
    };

    const userActionItemsRef = getUserActionItemsCollectionRef(userId);
    const docRef = await addDoc(userActionItemsRef, dataForFirestore);
    return docRef.id;
  } catch (error) {
    console.error("Error adding action item: ", error);
    const dataAttempted = {
      content: itemData.content,
      bucket: itemData.bucket,
      createdAt: 'serverTimestamp_placeholder',
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
  } catch (error) {
    console.error("Error deleting action item: ", error);
    throw error;
  }
}

export async function deleteAllUserActionItems(userId: string): Promise<void> {
  if (!userId) {
    throw new Error("User ID is required to delete all action items.");
  }
  try {
    const userActionItemsRef = getUserActionItemsCollectionRef(userId);
    const q = query(userActionItemsRef);
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return; // No items to delete
    }

    const batch = writeBatch(db);
    querySnapshot.forEach((docSnapshot) => {
      batch.delete(docSnapshot.ref);
    });
    await batch.commit();
    console.log(`Successfully deleted all action items for user ${userId}`);
  } catch (error) {
    console.error(`Error deleting all action items for user ${userId}: `, error);
    throw error;
  }
}
