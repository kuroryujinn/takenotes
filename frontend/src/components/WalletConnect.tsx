import React from 'react';
import '../styles/Togglee.css';

interface WalletConnectProps {
  address: string | null;
  isTogglingConnection: boolean;
  isRefreshing: boolean;
  onToggleConnection: (nextConnected: boolean) => Promise<void>;
  encryptionSecret: string;
  onEncryptionSecretChange: (value: string) => void;
}

export default function WalletConnect({
  address,
  isTogglingConnection,
  isRefreshing,
  onToggleConnection,
  encryptionSecret,
  onEncryptionSecretChange,
}: WalletConnectProps) {
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-6)}` : null;
  const isConnected = Boolean(address);

  const handleToggleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    void onToggleConnection(event.target.checked);
  };

  return (
    <section className="panel wallet-panel">
      <h2>Wallet</h2>
      <p className="muted">
        {address
          ? 'Wallet is currently connected.'
          : 'Connect your Freighter wallet to start creating on-chain notes.'}
      </p>
      {shortAddress ? <p className="muted">Active address: {shortAddress}</p> : null}
      {shortAddress ? <p className="muted">Switch account in Freighter, then click Refresh Wallet Now.</p> : null}
      <div className="wallet-toggle-row">
        <span className="muted">Wallet connection</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            id="lock"
            type="checkbox"
            checked={isConnected}
            onChange={handleToggleChange}
            disabled={isTogglingConnection}
            aria-label={isConnected ? 'Disconnect wallet' : 'Connect wallet'}
          />
          <label htmlFor="lock" className="lock-label" aria-hidden>
            <div className="lock-wrapper">
              <div className="shackle" />
              <div className="lock-body" />
            </div>
          </label>
          <span className="muted">{isTogglingConnection ? 'Updating...' : isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
      <label className="secret-field">
        Encryption secret
        <input
          className="input"
          type="password"
          value={encryptionSecret}
          onChange={(event) => onEncryptionSecretChange(event.target.value)}
          placeholder="Used locally to encrypt and decrypt notes"
        />
      </label>
      {/* Refresh handled by toggle; no separate button */}
      {/* no additional freighter authorization note */}
    </section>
  );
}
