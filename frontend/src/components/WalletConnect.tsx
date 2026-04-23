import React from 'react';

interface WalletConnectProps {
  address: string | null;
  isConnecting: boolean;
  isRefreshing: boolean;
  onConnect: () => Promise<void>;
  onRefresh: () => Promise<void>;
  encryptionSecret: string;
  onEncryptionSecretChange: (value: string) => void;
}

export default function WalletConnect({
  address,
  isConnecting,
  isRefreshing,
  onConnect,
  onRefresh,
  encryptionSecret,
  onEncryptionSecretChange,
}: WalletConnectProps) {
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-6)}` : null;

  return (
    <section className="panel wallet-panel">
      <h2>Wallet</h2>
      <p className="muted">
        {address
          ? 'Wallet is currently connected.'
          : 'Connect your Freighter wallet to start creating on-chain notes.'}
      </p>
      {shortAddress ? <p className="muted">Active address: {shortAddress}</p> : null}
      {shortAddress ? <p className="muted">Switch account in Freighter, then click Reconnect Wallet.</p> : null}
      <label className="secret-field">
        Encryption secret
        <input
          type="password"
          value={encryptionSecret}
          onChange={(event) => onEncryptionSecretChange(event.target.value)}
          placeholder="Used locally to encrypt and decrypt notes"
        />
      </label>
      <button type="button" className="primary" onClick={onConnect} disabled={isConnecting}>
        {isConnecting ? 'Connecting...' : address ? 'Reconnect Wallet' : 'Connect Freighter'}
      </button>
      {address ? (
        <button type="button" className="secondary" onClick={onRefresh} disabled={isRefreshing || isConnecting}>
          {isRefreshing ? 'Refreshing...' : 'Refresh Wallet Now'}
        </button>
      ) : null}
    </section>
  );
}
