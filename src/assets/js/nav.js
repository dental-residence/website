/*
 * Navigation behaviour — vanilla replacement for the Weebly runtime
 * (jQuery 1.8.3 + main.js initPublishedFlyoutMenus + theme custom.js/mobile.js).
 *
 * Contract with the theme CSS (main_style.css / sites.css), unchanged from the
 * original site:
 *   - body.postload           set after load (layout min-height rules)
 *   - body.menu-open          toggled by .hamburger; slides in .navmobile-wrapper
 *   - #wsite-menus            body-level container that desktop flyout menus are
 *                             moved into (flyouts can't render inside #navigation
 *                             because it has overflow:hidden)
 *   - .wsite-menu-slide / .wsite-menu-back-item / .wsite-menu-master-item /
 *     .wsite-menu-mobile-arrow  mobile drill-down menu structure
 */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    document.body.classList.add('postload');

    // ---- Hamburger toggles the mobile menu panel
    document.querySelectorAll('.hamburger').forEach(function (h) {
      h.addEventListener('click', function () {
        document.body.classList.toggle('menu-open');
      });
    });

    // ---- Mobile panel clears the fixed header
    var header = document.getElementById('header');
    var navmobileWrapper = document.querySelector('.navmobile-wrapper');
    if (header && navmobileWrapper) {
      navmobileWrapper.style.paddingTop = (header.offsetHeight + 20) + 'px';
    }

    initDesktopFlyouts();
    initMobileMenu();
  });

  // ---------------------------------------------------------------- desktop
  function initDesktopFlyouts() {
    var navigation = document.getElementById('navigation');
    if (!navigation) return;

    var menus = document.createElement('div');
    menus.id = 'wsite-menus';
    document.body.appendChild(menus);

    var hideTimer = null;
    var openWraps = [];

    function hideFrom(level) {
      for (var i = openWraps.length - 1; i >= level; i--) {
        openWraps[i].style.display = 'none';
      }
      openWraps.length = level;
    }
    function scheduleHide() {
      hideTimer = setTimeout(function () { hideFrom(0); }, 200);
    }
    function cancelHide() {
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    }

    // Move every flyout wrap out to #wsite-menus (as Weebly's runtime did) and
    // wire its owner <li> for hover.
    function wire(li, wrap, level) {
      wrap.parentNode.removeChild(wrap);
      wrap.style.position = 'absolute';
      menus.appendChild(wrap);

      li.addEventListener('mouseenter', function () {
        cancelHide();
        hideFrom(level);
        var r = li.getBoundingClientRect();
        var x = window.pageXOffset, y = window.pageYOffset;
        if (level === 0) {
          wrap.style.left = (r.left + x) + 'px';
          wrap.style.top = (r.bottom + y) + 'px';
        } else {
          wrap.style.left = (r.right + x) + 'px';
          wrap.style.top = (r.top + y) + 'px';
        }
        wrap.style.display = 'block';
        openWraps[level] = wrap;
        openWraps.length = level + 1;
      });
      li.addEventListener('mouseleave', scheduleHide);
      wrap.addEventListener('mouseenter', cancelHide);
      wrap.addEventListener('mouseleave', scheduleHide);
    }

    // level 0: top-level items in #navigation
    navigation.querySelectorAll(':scope > ul > li').forEach(function (li) {
      var wrap = li.querySelector(':scope > .wsite-menu-wrap');
      if (wrap) {
        // nested flyouts first (they sit inside this wrap before it moves)
        wireNested(wrap, 1);
        wire(li, wrap, 0);
      }
      li.addEventListener('mouseenter', function () {
        if (!wrap) hideFrom(0);
      });
    });

    function wireNested(wrap, level) {
      wrap.querySelectorAll(':scope > ul > li').forEach(function (li) {
        var sub = li.querySelector(':scope > .wsite-menu-wrap');
        if (sub) {
          wireNested(sub, level + 1);
          wire(li, sub, level);
        } else {
          li.addEventListener('mouseenter', function () { hideFrom(level); });
        }
      });
    }
  }

  // ----------------------------------------------------------------- mobile
  // Rebuilds the Weebly slide/drill menu inside #navmobile: the root <ul> and
  // each submenu become absolutely-positioned "slides"; tapping a parent item
  // slides its submenu in, "Back" slides out.
  function initMobileMenu() {
    var navmobile = document.getElementById('navmobile');
    if (!navmobile) return;
    var rootUl = navmobile.querySelector('.wsite-menu-default');
    if (!rootUl) return;

    var menu = document.createElement('div');
    menu.className = 'wsite-mobile-menu';
    rootUl.parentNode.insertBefore(menu, rootUl);

    var slider = document.createElement('div');
    slider.className = 'wsite-animation-wrap';
    slider.style.position = 'relative';
    slider.style.height = '100%';
    menu.appendChild(slider);

    var slideCSS = { position: 'absolute', top: '0', left: '0', width: '100%' };
    function makeSlide(el) {
      el.classList.add('wsite-menu-slide');
      Object.assign(el.style, slideCSS);
      el.style.transition = 'transform 300ms linear';
    }

    makeSlide(rootUl);
    slider.appendChild(rootUl);

    var current = rootUl;
    var moving = false;

    function goTo(oldSlide, newSlide, rightToLeft) {
      if (moving) return;
      moving = true;
      var w = menu.offsetWidth || 275;
      var sign = rightToLeft ? 1 : -1;
      newSlide.style.transition = 'none';
      newSlide.style.transform = 'translate3d(' + (sign * w) + 'px, 0, 0)';
      newSlide.style.display = 'block';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          oldSlide.style.transition = newSlide.style.transition = 'transform 300ms linear';
          oldSlide.style.transform = 'translate3d(' + (-sign * w) + 'px, 0, 0)';
          newSlide.style.transform = 'translate3d(0, 0, 0)';
          setTimeout(function () {
            oldSlide.style.display = 'none';
            oldSlide.style.transform = '';
            current = newSlide;
            moving = false;
          }, 320);
        });
      });
    }

    navmobile.querySelectorAll('.wsite-menu-wrap').forEach(function (wrap) {
      var parentAnchor = wrap.previousElementSibling; // the <a> of the parent item
      var ul = wrap.querySelector(':scope > ul');
      var parentSlide = wrap.parentNode.closest('.wsite-menu-slide') || rootUl;

      // Back link
      var back = document.createElement('li');
      back.className = 'wsite-menu-back-item';
      back.innerHTML = '<a><span class="wsite-menu-mobile-arrow"></span><span class="wsite-menu-back">Back</span></a>';
      back.addEventListener('click', function (ev) {
        ev.preventDefault();
        goTo(wrap, parentSlide, false);
      });

      // Master link (the parent page itself, tappable inside its submenu)
      if (parentAnchor && parentAnchor.getAttribute('href')) {
        var master = document.createElement('li');
        master.className = 'wsite-menu-master-item';
        master.appendChild(parentAnchor.cloneNode(true));
        ul.insertBefore(master, ul.firstChild);
      }
      ul.insertBefore(back, ul.firstChild);

      if (parentAnchor) {
        var arrow = document.createElement('span');
        arrow.className = 'wsite-menu-mobile-arrow';
        parentAnchor.appendChild(arrow);
        parentAnchor.addEventListener('click', function (ev) {
          ev.preventDefault();
          goTo(parentSlide, wrap, true);
        });
      }

      makeSlide(wrap);
      wrap.style.display = 'none';
      wrap.style.left = '0';
      slider.appendChild(wrap);
    });

    menu.style.display = 'block';
  }
})();
