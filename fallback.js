// Check if browser supports type=module
(function() {
  var s = document.createElement('script');
  if (!('noModule' in s)) {
    var el = document.getElementById('vue-error');
    var msg = document.getElementById('vue-error-msg');
    if (el) el.style.display = 'flex';
    if (msg) msg.textContent = 'المتصفح لا يدعم التطبيق. يرجى استخدام متصفح حديث.';
  }
})();
