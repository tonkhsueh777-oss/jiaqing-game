export function installOldWebKitDomCompat() {
  if (typeof Element === 'undefined') return;
  if (typeof Element.prototype.replaceChildren === 'function') return;

  Object.defineProperty(Element.prototype, 'replaceChildren', {
    configurable: true,
    writable: true,
    value(...nodes) {
      while (this.firstChild) this.removeChild(this.firstChild);
      for (const node of nodes) {
        const child = typeof node === 'string' ? document.createTextNode(node) : node;
        if (child != null) this.appendChild(child);
      }
    }
  });
}

installOldWebKitDomCompat();
