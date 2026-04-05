/**
 * useWallet.js
 * Simple React hook wrapping window.solana (Phantom's injected provider).
 * Avoids the wallet-adapter package dependency entirely.
 */
import { useState, useEffect, useCallback } from 'react';

export function usePhantomWallet() {
  const [publicKey, setPublicKey] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [hasPhantom, setHasPhantom] = useState(false);

  useEffect(() => {
    const phantom = window.solana;
    if (phantom?.isPhantom) {
      setHasPhantom(true);

      // Auto-connect if previously connected
      phantom.connect({ onlyIfTrusted: true }).then(({ publicKey: pk }) => {
        setPublicKey(pk.toString());
        setConnected(true);
      }).catch(() => {/* not previously trusted – ignore */});

      const handleConnect = (pk) => { setPublicKey(pk.toString()); setConnected(true); };
      const handleDisconnect = () => { setPublicKey(null); setConnected(false); };

      phantom.on('connect', handleConnect);
      phantom.on('disconnect', handleDisconnect);

      return () => {
        phantom.off('connect', handleConnect);
        phantom.off('disconnect', handleDisconnect);
      };
    }
  }, []);

  const connect = useCallback(async () => {
    if (!window.solana?.isPhantom) {
      window.open('https://phantom.app/', '_blank');
      return;
    }
    try {
      setConnecting(true);
      const { publicKey: pk } = await window.solana.connect();
      setPublicKey(pk.toString());
      setConnected(true);
    } catch (e) {
      console.warn('Wallet connect rejected', e);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (window.solana?.isPhantom) {
      await window.solana.disconnect();
    }
    setPublicKey(null);
    setConnected(false);
  }, []);

  /** Shorten publicKey for display, e.g. "9BeB...cdpU" */
  const displayKey = publicKey
    ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`
    : null;

  const signTransaction = useCallback(async (transaction) => {
    if (!window.solana?.isPhantom) throw new Error("Phantom not connected");
    return await window.solana.signTransaction(transaction);
  }, []);

  return { publicKey, connected, connecting, hasPhantom, displayKey, connect, disconnect, signTransaction };
}
