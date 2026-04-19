// FAQ accordion — uses event delegation so it keeps working
// after SPA content swaps (new .faq-q elements still get clicks).
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.faq-q');
    if (!btn) return;
    const item = btn.parentElement;
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
});

window.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('loaded');
});
