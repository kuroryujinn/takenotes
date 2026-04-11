export interface Note {
  id: number;
  title: string;
  content: string;
  contentCid?: string;
  isEncrypted?: boolean;
  tags: string[];
  category: string;
  isPinned: boolean;
  priority: number;
  timestamp: number;
}

export interface NoteHistoryEntry {
  noteId: number;
  version: number;
  action: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  isPinned: boolean;
  priority: number;
  timestamp: number;
}

export interface ActivityEvent {
  noteId: number;
  action: string;
  timestamp: number;
}

export interface NoteDraft {
  id: number;
  title: string;
  content: string;
  tags: string[];
  category: string;
  isPinned: boolean;
  priority: number;
}

export interface WalletSession {
  address: string;
  networkPassphrase: string;
}
