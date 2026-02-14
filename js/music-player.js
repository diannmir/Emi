const player = document.getElementById("mainPlayer");
const prevBtn = document.getElementById("prevTrackBtn");
const nextBtn = document.getElementById("nextTrackBtn");
const nowPlaying = document.getElementById("nowPlaying");
const trackNodes = document.querySelectorAll("#trackData button[data-src]");

if (player && trackNodes.length > 0) {
  const tracks = [...trackNodes].map((n) => ({
    src: n.getAttribute("data-src") || "",
    title: n.getAttribute("data-title") || "track",
  }));

  let index = 0;

  function renderTrack(autoplay = false) {
    const current = tracks[index];
    player.src = current.src;
    if (nowPlaying) {
      nowPlaying.innerHTML = `<span class="marquee-text">NOW PLAYING: ${current.title}</span>`;
      const textEl = nowPlaying.querySelector(".marquee-text");
      const needsMarquee = !!textEl && textEl.scrollWidth > nowPlaying.clientWidth;
      nowPlaying.classList.toggle("is-marquee", needsMarquee);
    }
    if (autoplay) {
      player.play().catch(() => {
        // Ignore autoplay restrictions.
      });
    }
  }

  prevBtn?.addEventListener("click", () => {
    index = (index - 1 + tracks.length) % tracks.length;
    renderTrack(true);
  });

  nextBtn?.addEventListener("click", () => {
    index = (index + 1) % tracks.length;
    renderTrack(true);
  });

  renderTrack(false);
}
