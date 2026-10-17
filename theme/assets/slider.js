/* prev/next buttons for scroll-snap sliders ([data-slider-btn]); loaded by the sections that render a slider */
(() => {
  /* scroll sliders with prev/next buttons */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-slider-btn]');
    if (!b) return;
    const slider = document.getElementById(b.getAttribute('aria-controls'));
    if (!slider) return;
    const item = slider.firstElementChild;
    const step = item ? item.getBoundingClientRect().width + 24 : slider.clientWidth * 0.8;
    slider.scrollBy({ left: b.dataset.sliderBtn === 'next' ? step : -step, behavior: 'smooth' });
  });
})();
