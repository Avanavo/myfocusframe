
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
import type { Item, BucketType } from '@/types'; // Renamed from ActionItem

// Helper function to get the user-specific items collection reference
// Firestore collection name remains 'actionItems' internally to avoid data migration
const getUserItemsCollectionRef = (userId: string): CollectionReference<DocumentData> => {
  return collection(db, 'users', userId, 'actionItems'); 
};

// Type for Firestore document data, excluding 'id' and ensuring createdAt is a Timestamp for Firestore
interface ItemDocumentData { // Renamed from ActionItemDocumentData
  content: string;
  bucket: BucketType;
  createdAt: FieldValue; 
}

// Type for data coming from Firestore, where createdAt might be a server Timestamp
interface ItemFromFirestore extends Omit<Item, 'createdAt' | 'id'> { // Renamed from ActionItemFromFirestore
  id?: string; 
  createdAt: Timestamp; 
  content: string;
  bucket: BucketType;
}


export function getItemsStream( // Renamed from getActionItemsStream
  userId: string,
  callback: (items: Item[]) => void, // Renamed from ActionItem
  onError: (error: Error) => void
): () => void { 
  if (!userId) {
    callback([]); 
    return () => {}; 
  }
  const userItemsRef = getUserItemsCollectionRef(userId); // Renamed from userActionItemsRef
  const q = query(userItemsRef, orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const items: Item[] = []; // Renamed from ActionItem
    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data() as Partial<ItemFromFirestore>; 

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
          `Item with ID ${docSnapshot.id} has an invalid or missing 'createdAt' field. Skipping item. Data:`, // Changed "Action item" to "Item"
          data
        );
      }
    });
    callback(items);
  }, (error) => {
    console.error("Error fetching items: ", error); // Changed "action items" to "items"
    onError(error);
  });

  return unsubscribe;
}

export async function addItem( // Renamed from addActionItem
  userId: string,
  itemData: Omit<Item, 'id' | 'createdAt' | 'userId'> // Renamed from ActionItem
): Promise<string> {
  if (!userId) {
    throw new Error("User ID is required to add an item."); // Changed "action item" to "item"
  }
  try {
    const dataForFirestore: ItemDocumentData = { // Renamed from ActionItemDocumentData
      content: itemData.content,
      bucket: itemData.bucket,
      createdAt: serverTimestamp(),
    };

    const userItemsRef = getUserItemsCollectionRef(userId); // Renamed from userActionItemsRef
    const docRef = await addDoc(userItemsRef, dataForFirestore);
    return docRef.id;
  } catch (error) {
    console.error("Error adding item: ", error); // Changed "action item" to "item"
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

export async function updateItem( // Renamed from updateActionItem
  userId: string,
  itemId: string,
  updates: Partial<Omit<Item, 'id' | 'createdAt' | 'userId'>> // Renamed from ActionItem
): Promise<void> {
  if (!userId) {
    throw new Error("User ID is required to update an item."); // Changed "action item" to "item"
  }
  try {
    const itemDocRef = doc(db, 'users', userId, 'actionItems', itemId); // Collection path remains 'actionItems'
    const { createdAt, userId: RuserId, ...validUpdates } = updates as any; 
    await updateDoc(itemDocRef, validUpdates);
  } catch (error) {
    console.error("Error updating item: ", error); // Changed "action item" to "item"
    throw error;
  }
}

export async function deleteItem(userId: string, itemId: string): Promise<void> { // Renamed from deleteActionItem
  if (!userId) {
    throw new Error("User ID is required to delete an item."); // Changed "action item" to "item"
  }
  try {
    const itemDocRef = doc(db, 'users', userId, 'actionItems', itemId); // Collection path remains 'actionItems'
    await deleteDoc(itemDocRef);
  } catch (error) {
    console.error("Error deleting item: ", error); // Changed "action item" to "item"
    throw error;
  }
}

export async function deleteAllUserItems(userId: string): Promise<void> { // Renamed from deleteAllUserActionItems
  if (!userId) {
    throw new Error("User ID is required to delete all items."); // Changed "action items" to "items"
  }
  try {
    const userItemsRef = getUserItemsCollectionRef(userId); // Renamed from userActionItemsRef
    const q = query(userItemsRef);
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return; // No items to delete
    }

    const batch = writeBatch(db);
    querySnapshot.forEach((docSnapshot) => {
      batch.delete(docSnapshot.ref);
    });
    await batch.commit();
    console.log(`Successfully deleted all items for user ${userId}`); // Changed "action items" to "items"
  } catch (error) {
    console.error(`Error deleting all items for user ${userId}: `, error); // Changed "action items" to "items"
    throw error;
  }
}
