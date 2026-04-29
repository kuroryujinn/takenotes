import React from 'react';
import '../styles/Togglee.css';

interface WalletConnectProps {
  address: string | null;
  isTogglingConnection: boolean;
  isRefreshing: boolean;
  onToggleConnection: (nextConnected: boolean) => Promise<void>;
}

export default function WalletConnect({
  address,
  isTogglingConnection,
  isRefreshing,
  onToggleConnection,
}: WalletConnectProps) {
  const isConnected = Boolean(address);

  const handleToggleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    void onToggleConnection(event.target.checked);
  };

  return (
    <section className="panel wallet-panel">
      <div className="wallet-toggle-row">
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
    </section>
  );
}
