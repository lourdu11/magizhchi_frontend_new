import { useState, useEffect } from 'react';

/**
 * Custom hook to prevent multiple POS tabs from being active simultaneously.
 * Uses BroadcastChannel API to sync state across browser tabs.
 */
export function usePosLock(channelName = 'magizhchi_pos_channel') {
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (!window.BroadcastChannel) return; // Fallback if unsupported

    const channel = new BroadcastChannel(channelName);
    let isMaster = true;
    
    // Announce presence when opening a new tab
    channel.postMessage({ type: 'POS_OPENED', id: Date.now() });

    channel.onmessage = (event) => {
      const { type } = event.data;

      if (type === 'POS_OPENED') {
        // We are already here, tell the new tab that we are the master
        if (isMaster) {
          channel.postMessage({ type: 'POS_MASTER_EXISTS' });
        }
      }

      if (type === 'POS_MASTER_EXISTS') {
        // Another tab is already the master, lock this tab
        isMaster = false;
        setIsLocked(true);
      }
    };

    return () => {
      channel.close();
    };
  }, [channelName]);

  return { isLocked };
}
