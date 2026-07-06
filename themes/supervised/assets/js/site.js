(function(){
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Gefingerprint pad naar lenis, aangeleverd door baseof.html.
  var lenisSrc = document.currentScript && document.currentScript.dataset.lenis;

  // 1. Scroll-state classes , show #scrolltotop after half a viewport scroll
  function updateScrollState(){
    var y = window.scrollY;
    document.documentElement.classList.toggle('scrollstart', y > 0);
    document.body.classList.toggle('scrolled', y > window.innerHeight * 0.5);
  }
  window.addEventListener('scroll', updateScrollState, { passive: true });
  window.addEventListener('resize', updateScrollState, { passive: true });
  updateScrollState();

  // End-of-page sentinel
  var footer = document.querySelector('footer');
  if (footer) {
    new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        document.body.classList.toggle('scrolledend', e.isIntersecting);
      });
    }, { rootMargin: '0px 0px -1px 0px' }).observe(footer);
  }

  // 2. Lenis smooth-scroll , desktop + reduced-motion-respecting
  if (lenisSrc && window.innerWidth > 1000 && !reduced) {
    var lenisScript = document.createElement('script');
    lenisScript.src = lenisSrc;
    document.body.append(lenisScript);
  }

  // 3. Pointer-driven ambient glow
  if (!reduced && window.matchMedia('(pointer: fine)').matches) {
    var glow = document.getElementById('glow');
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;

    window.addEventListener('pointermove', function(e){
      tx = (e.clientX / window.innerWidth - 0.5) * 6;   // ±3vw
      ty = (e.clientY / window.innerHeight - 0.5) * 6;  // ±3vh
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });

    function tick(){
      raf = null;
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      if (glow) {
        glow.style.setProperty('--glow-x', cx.toFixed(2) + 'vw');
        glow.style.setProperty('--glow-y', cy.toFixed(2) + 'vh');
      }
      if (Math.abs(tx - cx) > 0.01 || Math.abs(ty - cy) > 0.01) {
        raf = requestAnimationFrame(tick);
      }
    }
  }

  // 4. Theme toggle
  var themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    function isDarkActive() {
      var t = document.documentElement.getAttribute('data-theme');
      if (t) return t === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    function syncToggle() {
      var dark = isDarkActive();
      themeBtn.setAttribute('data-active', dark ? 'dark' : 'light');
      themeBtn.setAttribute('aria-label', dark ? 'Schakel naar licht' : 'Schakel naar donker');
    }
    themeBtn.addEventListener('click', function() {
      var next = isDarkActive() ? 'light' : 'dark';
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.documentElement.classList.add('theme-transitioning');
        setTimeout(function() { document.documentElement.classList.remove('theme-transitioning'); }, 400);
      }
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      syncToggle();
    });
    syncToggle();
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncToggle);
  }
})();
