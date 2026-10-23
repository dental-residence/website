/*
 * Plays only chosen stretches of a self-hosted <video>, muted and on repeat.
 *
 * Markup: <video src="..." data-clips="0.2-3.3,8-9.4" autoplay muted playsinline></video>
 * Whenever playback leaves the current clip it jumps to the next one, wrapping
 * back to the first, so the captions burned into the CEREC film between those
 * stretches are never shown. The video is faded out across each jump.
 * Unlike yt-clips.js this works on phones too, since the file is our own.
 * Load it from a page with "videoClips": true in its front matter.
 */
(function () {
  document.querySelectorAll('video[data-clips]').forEach(function (v) {
    var clips = v.getAttribute('data-clips').split(',').map(function (pair) {
      var p = pair.split('-');
      return { start: parseFloat(p[0]), end: parseFloat(p[1]) };
    });
    var i = 0;
    var seeking = false;

    function jump(k) {
      i = k;
      seeking = true;
      v.style.opacity = '0';
      v.currentTime = clips[i].start;
    }
    v.addEventListener('seeked', function () {
      seeking = false;
      v.style.opacity = '1';
    });
    v.addEventListener('ended', function () { jump(0); v.play(); });

    (function tick() {
      if (!seeking && !v.paused) {
        var t = v.currentTime;
        var c = clips[i];
        if (t >= c.end || t < c.start - 0.3) jump((i + 1) % clips.length);
      }
      requestAnimationFrame(tick);
    })();

    jump(0);
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  });
})();
