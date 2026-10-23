/*
 * Plays only chosen stretches of a YouTube video, muted and on repeat.
 *
 * Markup: <div data-yt="VIDEO_ID" data-clips="2.8-6.3,16.6-19.8" data-title="..."></div>
 * The div is replaced by a YouTube player (privacy-enhanced host). Whenever
 * playback leaves the current clip it jumps to the next one, wrapping back to
 * the first, so text overlays that sit between the clips are never shown.
 * The player is faded out during each jump (YouTube can land a few frames off
 * the requested time) and faded back in once it is inside the clip.
 * Used for the CEREC film on crowns.html, whose captions we can't edit.
 * Wrap players in an element with the inert attribute: otherwise the player
 * can take focus inside its frame and the browser scrolls the page to it.
 */
(function () {
  var targets = document.querySelectorAll('[data-yt][data-clips]');
  if (!targets.length) return;

  function parseClips(s) {
    return s.split(',').map(function (pair) {
      var p = pair.split('-');
      return { start: parseFloat(p[0]), end: parseFloat(p[1]) };
    });
  }

  function start() {
    targets.forEach(function (el) {
      var clips = parseClips(el.getAttribute('data-clips'));
      var i = 0;
      var busyUntil = 0; // ignore stale times for a moment after each seek
      function setVisible(on) {
        var f = player.getIframe && player.getIframe();
        if (f) f.style.opacity = on ? '1' : '0';
      }
      function jump(k) {
        i = k;
        setVisible(false);
        busyUntil = Date.now() + 700;
        player.seekTo(clips[i].start, true);
        player.playVideo();
      }
      var player = new YT.Player(el, {
        host: 'https://www.youtube-nocookie.com',
        videoId: el.getAttribute('data-yt'),
        playerVars: {
          autoplay: 1, mute: 1, controls: 0, disablekb: 1, playsinline: 1,
          rel: 0, modestbranding: 1, fs: 0, iv_load_policy: 3,
          start: Math.floor(clips[0].start)
        },
        events: {
          onReady: function (e) {
            var f = e.target.getIframe();
            f.setAttribute('title', el.getAttribute('data-title') || 'Video');
            if (el.hasAttribute('data-decorative')) {
              f.setAttribute('tabindex', '-1');
              f.setAttribute('aria-hidden', 'true');
            }
            e.target.mute();
            jump(0);
          },
          onStateChange: function (e) {
            if (e.data === YT.PlayerState.ENDED || e.data === YT.PlayerState.PAUSED) jump(i);
          }
        }
      });
      setInterval(function () {
        if (!player.getCurrentTime || Date.now() < busyUntil) return;
        var t = player.getCurrentTime();
        var c = clips[i];
        if (t >= c.end || t < c.start - 0.5) jump((i + 1) % clips.length);
        else if (t >= c.start - 0.05) setVisible(true);
      }, 80);
    });
  }

  var prev = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = function () {
    if (prev) prev();
    start();
  };
  var s = document.createElement('script');
  s.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(s);
})();
