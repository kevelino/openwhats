const { contextBridge, ipcRenderer } = require('electron');

// Badge count from document title.
window.addEventListener('DOMContentLoaded', () => {
    const titleEl = document.querySelector('title');
    if (!titleEl) return;

    const updateBadge = () => {
        const match = document.title.match(/\((\d+)\)/);
        const count = match ? parseInt(match[1], 10) : 0;
        ipcRenderer.send('update-badge-count', count);
    };

    updateBadge();
    const observer = new MutationObserver(updateBadge);
    observer.observe(titleEl, { childList: true, subtree: true, characterData: true });

    // Per-chat download context tracking: capture active chat title on clicks.
    document.addEventListener('click', () => {
        setTimeout(() => {
            try {
                // WhatsApp renders the active chat title in the header; try a few stable-ish selectors.
                const header = document.querySelector('header span[dir="auto"], header span[title]');
                const title = header ? (header.getAttribute('title') || header.textContent || '').trim() : '';
                if (title) {
                    ipcRenderer.send('set-active-download-context', title);
                }
            } catch (e) {
                // ignore
            }
        }, 50);
    }, true);
});

contextBridge.exposeInMainWorld('openwhats', {
    lock: {
        status: () => ipcRenderer.invoke('lock:status'),
        setPasscode: (passcode) => ipcRenderer.invoke('lock:set-passcode', passcode),
        disable: () => ipcRenderer.invoke('lock:disable'),
        verify: (passcode) => ipcRenderer.invoke('lock:verify', passcode),
        lockNow: () => ipcRenderer.invoke('lock:lock-now'),
    },
    downloads: {
        open: () => ipcRenderer.invoke('downloads:open'),
    },
});