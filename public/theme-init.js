// Applies the saved theme before first paint to avoid a flash. Non-sensitive preference only.
;(function () {
  try {
    var raw = localStorage.getItem('devcipher:theme')
    var pref = raw ? JSON.parse(raw) : 'dark'
    var dark = pref === 'dark' || (pref === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
  } catch (e) {}
})()
