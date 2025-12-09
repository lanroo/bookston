/**
 * Note Types
 * Single Responsibility: Note and folder related types
 */

export interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  name: string;
  userId: string;
  color?: string;
  noteCount: number;
  createdAt: string;
  updatedAt: string;
}

