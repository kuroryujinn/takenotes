export interface Note {
  id: number;
  title: string;
  content: string;
  timestamp: number;
}

export interface NoteDraft {
  id: number;
  title: string;
  content: string;
}

export interface WalletSession {
  address: string;
  networkPassphrase: string;
}
