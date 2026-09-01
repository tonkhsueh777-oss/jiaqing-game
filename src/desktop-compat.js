(function (root) {
  function installArrayAt() {
    if (typeof Array.prototype.at === 'function') return false;
    Object.defineProperty(Array.prototype, 'at', {
      configurable: true,
      writable: true,
      value: function at(index) {
        var length = this == null ? 0 : Number(this.length) || 0;
        var relative = Number(index) || 0;
        if (relative < 0) relative = length + relative;
        if (relative < 0 || relative >= length) return undefined;
        return this[relative];
      }
    });
    return true;
  }

  function errorText(errorLike) {
    if (!errorLike) return '未知错误';
    if (typeof errorLike === 'string') return errorLike;
    if (errorLike.message) return String(errorLike.message);
    try { return String(errorLike); } catch (_) { return '未知错误'; }
  }

  function showBootError(message) {
    var doc = root && root.document;
    if (!doc || !doc.body) return;
    var id = 'desktop-boot-error';
    var panel = doc.getElementById(id);
    if (!panel) {
      panel = doc.createElement('div');
      panel.id = id;
      panel.setAttribute('role', 'alert');
      panel.style.position = 'fixed';
      panel.style.left = '18px';
      panel.style.right = '18px';
      panel.style.bottom = '18px';
      panel.style.zIndex = '999999';
      panel.style.padding = '14px 16px';
      panel.style.borderRadius = '12px';
      panel.style.background = 'rgba(72, 12, 12, 0.96)';
      panel.style.color = '#fff4e8';
      panel.style.fontFamily = '-apple-system, BlinkMacSystemFont, sans-serif';
      panel.style.fontSize = '14px';
      panel.style.lineHeight = '1.55';
      panel.style.boxShadow = '0 12px 36px rgba(0,0,0,.45)';
      panel.style.pointerEvents = 'auto';
      doc.body.appendChild(panel);
    }
    panel.textContent = '游戏启动错误：' + errorText(message);
  }

  function installDiagnostics() {
    if (!root || typeof root.addEventListener !== 'function') return false;
    root.addEventListener('error', function (event) {
      showBootError(event && (event.error || event.message));
    });
    root.addEventListener('unhandledrejection', function (event) {
      showBootError(event && event.reason);
    });
    return true;
  }

  installArrayAt();
  installDiagnostics();

  root.JQDesktopCompat = {
    installArrayAt: installArrayAt,
    installDiagnostics: installDiagnostics,
    showBootError: showBootError
  };
})(typeof window !== 'undefined' ? window : this);
