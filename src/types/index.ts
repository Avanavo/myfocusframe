
export type BucketType = 'control' | 'influence' | 'acceptance';

export interface ActionItem {
  id: string;
  userId: string; 
  content: string;
  bucket: BucketType;
  createdAt: string; // ISO string for easier serialization
}
