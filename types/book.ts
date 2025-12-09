

export type BookStatus = 'want-to-read' | 'reading' | 'read' | 'rereading';

export interface Book {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  userId: string;
  coverUrl?: string;
  rating?: number;
  notes?: string;
  startedAt?: string;
  finishedAt?: string;
  displayOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookUpdateData {
  title?: string;
  author?: string;
  status?: BookStatus;
  rating?: number;
  notes?: string;
  startedAt?: string;
  finishedAt?: string;
  displayOrder?: number;
}

