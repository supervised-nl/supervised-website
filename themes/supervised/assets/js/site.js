(function(){
  document.documentElement.classList.add('js');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Gefingerprint pad naar lenis, aangeleverd door baseof.html.
  var lenisSrc = document.currentScript && document.currentScript.dataset.lenis;

  // Show #scrolltotop after half a viewport scroll.
  function updateScrollState(){
    document.body.classList.toggle('scrolled', window.scrollY > window.innerHeight * 0.5);
  }
  window.addEventListener('scroll', updateScrollState, { passive: true });
  window.addEventListener('resize', updateScrollState, { passive: true });
  updateScrollState();

  // Lenis smooth-scroll: desktop only, reduced-motion respecting.
  if (lenisSrc && window.innerWidth > 1000 && !reduced) {
    var lenisScript = document.createElement('script');
    lenisScript.src = lenisSrc;
    document.body.append(lenisScript);
  }

  // Pointer-driven ambient glow.
  if (!reduced && window.matchMedia('(pointer: fine)').matches) {
    var glow = document.getElementById('glow');
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;

    window.addEventListener('pointermove', function(e){
      tx = (e.clientX / window.innerWidth - 0.5) * 6;
      ty = (e.clientY / window.innerHeight - 0.5) * 6;
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

  // Theme toggle.
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
      themeBtn.textContent = dark ? 'licht' : 'donker';
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

  // Navigation overlays.
  var panelItems = Array.prototype.slice.call(document.querySelectorAll('#menu .has-panel'));
  if (panelItems.length) {
    var closeTimer = null;
    var mobileToggle = document.getElementById('mobile-menu-toggle');
    var mobileMenu = document.getElementById('mobile-menu');

    function setOpen(item) {
      clearTimeout(closeTimer);
      panelItems.forEach(function(other) {
        var open = other === item;
        var link = other.querySelector('.nav-link');
        other.classList.toggle('is-open', open);
        if (link) link.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      document.body.classList.add('nav-open');
    }

    function closePanels() {
      clearTimeout(closeTimer);
      panelItems.forEach(function(item) {
        var link = item.querySelector('.nav-link');
        item.classList.remove('is-open');
        if (link) link.setAttribute('aria-expanded', 'false');
      });
      document.body.classList.remove('nav-open');
    }

    function setMobileMenu(open) {
      if (open) closePanels();
      document.body.classList.toggle('mobile-nav-open', open);
      if (mobileToggle) {
        mobileToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        mobileToggle.setAttribute('aria-label', open ? 'Sluit menu' : 'Open menu');
      }
      if (mobileMenu) mobileMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
    }

    panelItems.forEach(function(item) {
      item.addEventListener('pointerenter', function(event) {
        if (event.pointerType !== 'touch') setOpen(item);
      });
      item.addEventListener('pointerleave', function() {
        closeTimer = setTimeout(closePanels, 120);
      });
      item.addEventListener('focusin', function() {
        setOpen(item);
      });
      item.addEventListener('focusout', function() {
        closeTimer = setTimeout(function() {
          if (!item.contains(document.activeElement)) closePanels();
        }, 0);
      });
    });

    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') {
        closePanels();
        setMobileMenu(false);
      }
    });
    document.addEventListener('pointerdown', function(event) {
      if (document.body.classList.contains('mobile-nav-open') && !event.target.closest('header') && !event.target.closest('#mobile-menu')) {
        setMobileMenu(false);
      }
      if (!event.target.closest('header')) closePanels();
    }, { passive: true });

    if (mobileToggle && mobileMenu) {
      mobileToggle.addEventListener('click', function() {
        setMobileMenu(!document.body.classList.contains('mobile-nav-open'));
      });
      mobileMenu.addEventListener('click', function(event) {
        if (event.target.closest('a')) setMobileMenu(false);
      });
    }
  }
})();
