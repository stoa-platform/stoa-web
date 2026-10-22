// Synchronous head initializer: CSS follows the system without an explicit choice.
(function () {
  try {
    var saved = document.cookie.split(';').map(function (part) { return part.trim(); })
      .find(function (part) { return /^stoa-theme=(light|dark)$/.test(part); });
    if (saved) document.documentElement.dataset.theme = saved.split('=')[1];
  } catch (_) { /* Cookies may be unavailable; keep the system preference. */ }
})();
