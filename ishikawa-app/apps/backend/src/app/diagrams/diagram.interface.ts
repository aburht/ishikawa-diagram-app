export interface Bone {
  label: string;
  info?: string; // Made optional to match DTOs
  metadata?: string;
  children?: Bone[];
  status?: 'resolved' | 'issue' | 'pending';
}

export interface Diagram {
  id: string;
  name: string;
  creator: string;
  creatorId: string;
  effectLabel: string;
  effectInfo?: string;
  effectString?: string;
  effectMeta?: string;
  roots: Bone[];
  createdAt?: Date;
  updatedAt?: Date;
}