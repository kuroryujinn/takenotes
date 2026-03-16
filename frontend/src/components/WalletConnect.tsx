import React from 'react';

interface WalletConnectProps {
  address: string | null;
  isConnecting: boolean;
  onConnect: () => Promise<void>;
}

export default function WalletConnect({ address, isConnecting, onConnect }: WalletConnectProps) {
  return (
    <section className="panel wallet-panel">
      <h2>Wallet</h2>
      <p className="muted">
        {address
          ? 'Wallet is currently connected.'
          : 'Connect your Freighter wallet to start creating on-chain notes.'}
      </p>
      <button type="button" className="primary" onClick={onConnect} disabled={isConnecting}>
        {isConnecting ? 'Connecting...' : address ? 'Reconnect Wallet' : 'Connect Freighter'}
      </button>
    </section>
  );
}
