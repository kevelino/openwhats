const { ipcRenderer } = require('electron');

function ensureItem(payload) {
    let el = document.querySelector(`[data-path="${CSS.escape(payload.savePath)}"]`);
    if (el) return el;
    const list = document.getElementById('list');
    el = document.createElement('div');
    el.className = 'item';
    el.setAttribute('data-path', payload.savePath);
    el.innerHTML = `<div class="name">${payload.filename}</div><div class="meta">${payload.context} — ${payload.savePath}</div><div class="bar"><div class="fill"></div></div>`;
    list.prepend(el);
    return el;
}

ipcRenderer.on('download:started', (event, payload) => {
    ensureItem(payload);
});

ipcRenderer.on('download:progress', (event, payload) => {
    const el = document.querySelector(`[data-path="${CSS.escape(payload.savePath)}"]`);
    if (!el) return;
    const fill = el.querySelector('.fill');
    if (payload.totalBytes > 0) {
        fill.style.width = Math.round((payload.receivedBytes / payload.totalBytes) * 100) + '%';
    }
    const meta = el.querySelector('.meta');
    meta.textContent = `${payload.state} — ${payload.receivedBytes}/${payload.totalBytes} bytes`;
});

ipcRenderer.on('download:done', (event, payload) => {
    const el = document.querySelector(`[data-path="${CSS.escape(payload.savePath)}"]`);
    if (!el) return;
    const fill = el.querySelector('.fill');
    fill.style.width = payload.state === 'completed' ? '100%' : '0%';
    const meta = el.querySelector('.meta');
    meta.textContent = `${payload.state} — ${payload.savePath}`;
});