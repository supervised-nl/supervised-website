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

  // Theme switch.
  var themeButtons = Array.prototype.slice.call(document.querySelectorAll('[data-theme-choice]'));
  if (themeButtons.length) {
    function isDarkActive() {
      var t = document.documentElement.getAttribute('data-theme');
      if (t) return t === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    function setTheme(next) {
      if (next !== 'light' && next !== 'dark') return;
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.documentElement.classList.add('theme-transitioning');
        setTimeout(function() { document.documentElement.classList.remove('theme-transitioning'); }, 400);
      }
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      syncToggle();
    }
    function syncToggle() {
      var active = isDarkActive() ? 'dark' : 'light';
      themeButtons.forEach(function(button) {
        button.setAttribute('aria-pressed', button.dataset.themeChoice === active ? 'true' : 'false');
      });
    }
    themeButtons.forEach(function(button) {
      button.addEventListener('click', function() {
        setTheme(button.dataset.themeChoice);
      });
    });
    syncToggle();
    var colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
    if (colorScheme.addEventListener) colorScheme.addEventListener('change', syncToggle);
    else if (colorScheme.addListener) colorScheme.addListener(syncToggle);
  }

  // Navigation overlays.
  var panelItems = Array.prototype.slice.call(document.querySelectorAll('#menu .has-panel'));
  if (panelItems.length) {
    var closeTimer = null;
    var mobileToggle = document.getElementById('mobile-menu-toggle');
    var mobileMenu = document.getElementById('mobile-menu');
    var main = document.getElementById('content');
    var footer = document.querySelector('footer');
    var headerRegions = Array.prototype.slice.call(document.querySelectorAll('header > :not(#mobile-menu-toggle)'));

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
      var wasOpen = document.body.classList.contains('mobile-nav-open');
      var focusWasInMenu = mobileMenu && mobileMenu.contains(document.activeElement);
      if (open) closePanels();
      document.body.classList.toggle('mobile-nav-open', open);
      if (mobileToggle) {
        mobileToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        mobileToggle.setAttribute('aria-label', open ? 'Sluit menu' : 'Open menu');
      }
      if (mobileMenu) mobileMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
      [main, footer].forEach(function(region) {
        if (!region) return;
        if (open) region.setAttribute('inert', '');
        else region.removeAttribute('inert');
      });
      headerRegions.forEach(function(region) {
        if (open) region.setAttribute('inert', '');
        else region.removeAttribute('inert');
      });
      if (open && !wasOpen && mobileMenu) {
        var firstLink = mobileMenu.querySelector('a');
        if (firstLink) firstLink.focus();
      } else if (!open && wasOpen && focusWasInMenu && mobileToggle) {
        mobileToggle.focus();
      }
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
