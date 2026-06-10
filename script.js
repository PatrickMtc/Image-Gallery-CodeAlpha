/* ── Photo Data ── */
const photos = [
  { id: 1,  title: "Mountain sunrise",  category: "nature",   sub: "Alpine ridge, 3800m",    bg: "#7a9e7e", emoji: "🏔" },
  { id: 2,  title: "City at dusk",      category: "urban",    sub: "Downtown skyline",       bg: "#5a6e8c", emoji: "🌆" },
  { id: 3,  title: "Ocean waves",       category: "nature",   sub: "Pacific coast, CA",      bg: "#3d7fa5", emoji: "🌊" },
  { id: 4,  title: "Street market",     category: "urban",    sub: "Local vendors, 7am",     bg: "#a07850", emoji: "🏪" },
  { id: 5,  title: "Forest path",       category: "nature",   sub: "Morning mist",           bg: "#4a7a5a", emoji: "🌲" },
  { id: 6,  title: "Portrait study",    category: "portrait", sub: "Studio, diffused light", bg: "#7a5a8c", emoji: "🎨" },
  { id: 7,  title: "Café corner",       category: "urban",    sub: "Espresso & afternoon",   bg: "#8c7a5a", emoji: "☕" },
  { id: 8,  title: "Desert dunes",      category: "nature",   sub: "Sahara, golden hour",    bg: "#c4a265", emoji: "🏜" },
  { id: 9,  title: "Golden hour",       category: "portrait", sub: "Warm tones, outdoors",   bg: "#b87a4a", emoji: "🌅" },
  { id: 10, title: "Glass tower",       category: "urban",    sub: "Midtown architecture",   bg: "#6e7a8c", emoji: "🏛" },
  { id: 11, title: "Wildflowers",       category: "nature",   sub: "Spring meadow, May",     bg: "#9c8a4a", emoji: "🌸" },
  { id: 12, title: "Studio mood",       category: "portrait", sub: "Soft shadows, ISO 400",  bg: "#6e5a8c", emoji: "📸" },
];

/* ── Canvas Placeholder Generator ──
   Replace getSrc() with real image URLs when you have actual photos.
   e.g. function getSrc(p) { return p.src; }
   and add a `src: "images/photo1.jpg"` field to each photo object above.
─────────────────────────────────────── */
const srcCache = {};

function makePlaceholder(p) {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext("2d");

  // background tint
  ctx.fillStyle = p.bg + "28";
  ctx.fillRect(0, 0, 800, 600);

  // subtle grid texture
  ctx.strokeStyle = p.bg + "18";
  ctx.lineWidth = 1;
  for (let x = 0; x < 800; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 600); ctx.stroke();
  }
  for (let y = 0; y < 600; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(800, y); ctx.stroke();
  }

  // coloured bottom band
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 480, 800, 120);

  // emoji
  ctx.font = "bold 120px serif";
  ctx.textAlign = "center";
  ctx.fillText(p.emoji, 400, 340);

  // title & subtitle
  ctx.fillStyle = "#fff";
  ctx.font = "500 22px Inter, sans-serif";
  ctx.fillText(p.title, 400, 520);
  ctx.font = "400 14px Inter, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.fillText(p.sub, 400, 548);

  return canvas.toDataURL();
}

function getSrc(p) {
  if (!srcCache[p.id]) srcCache[p.id] = makePlaceholder(p);
  return srcCache[p.id];
}

/* ── State ── */
let activeFilter = "all";
let filtered = [...photos];
let lbIndex = 0;

/* ── DOM References ── */
const filterBar  = document.getElementById("filter-bar");
const grid       = document.getElementById("gallery-grid");
const countLabel = document.getElementById("count-label");
const lightbox   = document.getElementById("lightbox");
const lbImg      = document.getElementById("lb-img");
const lbTitle    = document.getElementById("lb-title");
const lbSub      = document.getElementById("lb-sub");
const lbCounter  = document.getElementById("lb-counter");
const lbDots     = document.getElementById("lb-dots");

/* ── Filter Rendering ── */
const categories = ["all", ...new Set(photos.map(p => p.category))];

function renderFilters() {
  filterBar.innerHTML = "";
  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "filter-btn" + (cat === activeFilter ? " active" : "");
    btn.textContent = cat === "all" ? "All photos" : cat.charAt(0).toUpperCase() + cat.slice(1);
    btn.setAttribute("aria-pressed", cat === activeFilter);
    btn.addEventListener("click", () => {
      activeFilter = cat;
      renderFilters();
      renderGrid();
    });
    filterBar.appendChild(btn);
  });
}

/* ── Grid Rendering ── */
function renderGrid() {
  filtered = activeFilter === "all"
    ? photos
    : photos.filter(p => p.category === activeFilter);

  grid.innerHTML = "";
  countLabel.textContent = `${filtered.length} photo${filtered.length !== 1 ? "s" : ""}`;

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No photos in this category.";
    grid.appendChild(empty);
    return;
  }

  filtered.forEach((photo, index) => {
    const card = document.createElement("div");
    card.className = "gallery-card";
    card.setAttribute("role", "listitem");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", `${photo.title} — ${photo.category}`);

    const img = document.createElement("img");
    img.src = getSrc(photo);
    img.alt = photo.title;
    img.loading = "lazy";

    const overlay = document.createElement("div");
    overlay.className = "card-overlay";
    overlay.innerHTML = `
      <div class="card-info">
        <span class="card-title">${photo.title}</span>
        <span class="card-tag">${photo.category}</span>
      </div>`;

    const badge = document.createElement("div");
    badge.className = "card-index";
    badge.textContent = index + 1;

    card.appendChild(img);
    card.appendChild(overlay);
    card.appendChild(badge);

    card.addEventListener("click", () => openLightbox(index));
    card.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openLightbox(index);
      }
    });

    grid.appendChild(card);
  });
}

/* ── Lightbox ── */
function openLightbox(index) {
  lbIndex = index;
  updateLightbox(false);
  lightbox.classList.add("open");
  document.body.style.overflow = "hidden";
  document.addEventListener("keydown", handleKey);
  document.getElementById("lb-close").focus();
}

function closeLightbox() {
  lightbox.classList.remove("open");
  document.body.style.overflow = "";
  document.removeEventListener("keydown", handleKey);
}

function navigate(direction) {
  lbIndex = (lbIndex + direction + filtered.length) % filtered.length;
  updateLightbox(true);
}

function updateLightbox(animate) {
  const photo = filtered[lbIndex];

  if (animate) {
    lbImg.classList.add("fade");
    setTimeout(() => {
      lbImg.src = getSrc(photo);
      lbImg.alt = photo.title;
      lbImg.classList.remove("fade");
    }, 180);
  } else {
    lbImg.src = getSrc(photo);
    lbImg.alt = photo.title;
  }

  lbTitle.textContent = photo.title;
  lbSub.textContent   = `${photo.sub} · ${photo.category}`;
  lbCounter.textContent = `${lbIndex + 1} / ${filtered.length}`;

  // rebuild dots
  lbDots.innerHTML = "";
  filtered.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "lb-dot" + (i === lbIndex ? " active" : "");
    dot.setAttribute("aria-label", `Photo ${i + 1}`);
    dot.addEventListener("click", () => {
      lbIndex = i;
      updateLightbox(true);
    });
    lbDots.appendChild(dot);
  });
}

function handleKey(e) {
  if (e.key === "Escape")     closeLightbox();
  if (e.key === "ArrowRight") navigate(1);
  if (e.key === "ArrowLeft")  navigate(-1);
}

/* ── Event Listeners ── */
document.getElementById("lb-close").addEventListener("click", closeLightbox);
document.getElementById("lb-prev").addEventListener("click", () => navigate(-1));
document.getElementById("lb-next").addEventListener("click", () => navigate(1));
document.getElementById("lb-prev-arrow").addEventListener("click", () => navigate(-1));
document.getElementById("lb-next-arrow").addEventListener("click", () => navigate(1));

lightbox.addEventListener("click", e => {
  if (e.target === lightbox) closeLightbox();
});

/* ── Init ── */
renderFilters();
renderGrid();
