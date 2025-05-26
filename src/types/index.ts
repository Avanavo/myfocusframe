
export type BucketType = 'control' | 'influence' | 'acceptance';

export interface ActionItemSuggestion {
  suggestedBucket: BucketType;
  reasoning: string;
}

export interface ActionItem {
  id: string;
  userId: string; // Added userId to track ownership on the client-side if needed
  content: string;
  bucket: BucketType;
  createdAt: string; // ISO string for easier serialization
  suggestion?: ActionItemSuggestion | null;
}
