const CONFIG = {
  whatsappNumber: "5491158266751",
  phoneNumber: "5491158266751",
  whatsappGreeting: "Hola, vengo de ZuniKeller.",
  apiUrl: "https://motozuni.com/api/motos",
  fallbackUrl: "./motos.json",
};

document.addEventListener("DOMContentLoaded", () => {
  setActiveNavLink();
  wireFixedActions();

  const catalogRoot = document.getElementById("catalogList");
  if (catalogRoot) {
    initCatalog(catalogRoot);
  }

  const heroCarousel = document.getElementById("heroCarousel");
  if (heroCarousel) {
    initHeroCarousel(heroCarousel);
  }

  const leadForm = document.getElementById("leadForm");
  if (leadForm) {
    initLeadForm(leadForm);
  }

  const branchSearch = document.getElementById("branchSearch");
  if (branchSearch) {
    initBranchSearch(branchSearch);
  }
});

function initBranchSearch(input) {
  const grid = document.getElementById("branchGrid");
  if (!grid) return;
  const cards = Array.from(grid.querySelectorAll(".branch-card"));
  const emptyMessage = document.getElementById("branchEmpty");

  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    let visibleCount = 0;
    cards.forEach((card) => {
      const matches = !query || (card.dataset.search || "").includes(query);
      card.style.display = matches ? "" : "none";
      if (matches) visibleCount += 1;
    });
    if (emptyMessage) {
      emptyMessage.style.display = visibleCount === 0 ? "" : "none";
    }
  });
}

function initLeadForm(form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (!CONFIG.whatsappNumber) {
      return;
    }

    const intro = form.dataset.intro || CONFIG.whatsappGreeting;
    const message = [
      intro,
      `Nombre: ${form.nombre.value.trim()} ${form.apellido.value.trim()}`,
      `Teléfono: ${form.telefono.value.trim()}`,
      `Localidad: ${form.localidad.value.trim()}`,
      `Modelo de interés: ${form.modelo.value}`,
    ].join("\n");

    window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank");
    form.reset();
  });
}

async function loadFeaturedMotos() {
  let motos;
  try {
    motos = await fetchMotos(CONFIG.apiUrl);
  } catch (err) {
    motos = await fetchMotos(CONFIG.fallbackUrl);
  }
  return motos.filter((m) => (m.brand || "").trim().toLowerCase() === "keller");
}

function initHeroCarousel(container) {
  const eyebrowEl = container.querySelector(".hero-eyebrow");
  const titleEl = container.querySelector(".hero-text h1");
  const subEl = container.querySelector(".hero-sub");
  const imageEl = container.querySelector(".hero-image");
  const dotsWrap = container.querySelector(".hero-dots");
  const arrowsWrap = container.querySelector(".hero-arrows");

  if (arrowsWrap) {
    arrowsWrap.style.visibility = "hidden";
  }

  let slides = [];
  let current = 0;
  let timer = null;

  function paint(index) {
    const slide = slides[index];
    if (!slide) return;
    current = index;
    container.classList.add("hero-fade");
    setTimeout(() => {
      eyebrowEl.textContent = slide.eyebrow;
      titleEl.textContent = slide.title;
      subEl.textContent = slide.sub;
      if (slide.image) {
        imageEl.src = slide.image;
        imageEl.alt = slide.title;
        imageEl.hidden = false;
      } else {
        imageEl.hidden = true;
      }
      container.classList.remove("hero-fade");
    }, 220);

    dotsWrap.querySelectorAll("button").forEach((btn, i) => {
      btn.classList.toggle("active", i === index);
    });
  }

  function goTo(index) {
    const next = ((index % slides.length) + slides.length) % slides.length;
    paint(next);
    resetTimer();
  }

  function resetTimer() {
    if (timer) clearInterval(timer);
    if (slides.length > 1) {
      timer = setInterval(() => goTo(current + 1), 6000);
    }
  }

  loadFeaturedMotos()
    .then((motos) => {
      if (!motos.length) return;

      slides = motos.slice(0, 5).map((m) => ({
        eyebrow: `Modelo destacado · ${m.segment || m.type || "Keller"}`,
        title: `Keller ${m.model || ""} ${m.version || ""}`.trim(),
        sub: m.shortDescription || "",
        image: m.images && m.images[0] ? m.images[0].url : "",
      }));

      dotsWrap.innerHTML = slides
        .map((_, i) => `<button aria-label="Ver modelo ${i + 1}"></button>`)
        .join("");
      dotsWrap.querySelectorAll("button").forEach((btn, i) => {
        btn.addEventListener("click", () => goTo(i));
      });

      if (slides.length > 1 && arrowsWrap) {
        arrowsWrap.querySelectorAll(".hero-arrow").forEach((btn) => {
          btn.addEventListener("click", () => goTo(current + Number(btn.dataset.dir)));
        });
        arrowsWrap.style.visibility = "visible";
      }

      paint(0);
      resetTimer();

      container.addEventListener("mouseenter", () => timer && clearInterval(timer));
      container.addEventListener("mouseleave", resetTimer);
    })
    .catch(() => {
      // Se conserva el contenido estático por defecto del hero.
    });
}

function setActiveNavLink() {
  const path = window.location.pathname.split("/").pop() || "index.html";
  const activeLink =
    document.querySelector(`.menu a[href="${path}"]`) ||
    document.querySelector('.menu a[href="index.html"]');
  if (activeLink) {
    activeLink.classList.add("active");
  }
}

function wireFixedActions() {
  const waLinks = document.querySelectorAll("[data-whatsapp-link]");
  const callLinks = document.querySelectorAll("[data-call-link]");

  waLinks.forEach((link) => {
    const detail = link.dataset.whatsappMessage || "";
    const message = detail ? `${CONFIG.whatsappGreeting} ${detail}` : CONFIG.whatsappGreeting;
    if (CONFIG.whatsappNumber) {
      const text = message ? `?text=${encodeURIComponent(message)}` : "";
      link.href = `https://wa.me/${CONFIG.whatsappNumber}${text}`;
      link.classList.remove("is-disabled");
    } else {
      link.href = "#";
      link.classList.add("is-disabled");
      link.title = "Cargá el número de WhatsApp en app.js (CONFIG.whatsappNumber)";
    }
  });

  callLinks.forEach((link) => {
    if (CONFIG.phoneNumber) {
      link.href = `tel:+${CONFIG.phoneNumber}`;
      link.classList.remove("is-disabled");
    } else {
      link.href = "#";
      link.classList.add("is-disabled");
      link.title = "Cargá el número de teléfono en app.js (CONFIG.phoneNumber)";
    }
  });
}

async function fetchMotos(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Respuesta no válida del servidor");
  }
  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Formato de datos inesperado");
  }
  return data;
}

// El catálogo ya viene pre-renderizado en el HTML (ver modelos.html) para que
// exista contenido real aunque el fetch a la API falle o Google no ejecute JS.
// Esta función solo agrega interactividad (filtro) y, si puede, refresca los
// datos en segundo plano — nunca borra el contenido bueno ante un error.
function initCatalog(root) {
  const select = root.querySelector(".catalog-select");
  const countLabel = root.querySelector(".catalog-count");
  const list = root.querySelector(".catalog-list");
  let currentMotos = [];

  function paint(segment) {
    const filtered = segment === "Todos" ? currentMotos : currentMotos.filter((m) => m.segment === segment);
    if (countLabel) {
      countLabel.textContent = `${filtered.length} modelo${filtered.length === 1 ? "" : "s"} Keller`;
    }
    renderMotos(list, filtered);
  }

  if (select) {
    select.addEventListener("change", () => paint(select.value));
  }

  loadFeaturedMotos()
    .then((motos) => {
      if (!motos.length) return;
      currentMotos = motos;
      paint(select ? select.value : "Todos");
    })
    .catch(() => {
      // Fetch y fallback local fallaron: se conserva el catálogo ya escrito en el HTML.
    });
}

function renderMotos(list, motos) {
  list.innerHTML = "";
  motos.forEach((moto) => list.appendChild(buildMotoCard(moto)));
  wireFixedActions();
}

function buildMotoCard(moto) {
  const title = `Keller ${moto.model || ""} ${moto.version || ""}`.trim();
  const image = moto.images && moto.images.length ? moto.images[0].url : "";
  const altText = (moto.images && moto.images[0] && moto.images[0].altText) || title;
  const detailUrl = moto.urlSlug ? `modelos/${moto.urlSlug}/index.html` : "modelos.html";

  const card = document.createElement("article");
  card.className = "product-card";

  card.innerHTML = `
    <div class="product-media">
      ${image ? `<img src="${image}" alt="${altText}" loading="lazy">` : '<div class="product-media-placeholder">Sin imagen</div>'}
      <span class="product-badge">${moto.segment || moto.type || ""}</span>
    </div>
    <div class="product-body">
      <h3><a href="${detailUrl}">${title}</a></h3>
      <p class="product-desc">${moto.shortDescription || ""}</p>
      <div class="meta">
        <span><strong>Motor:</strong> ${moto.engine || "-"} (${moto.displacement || "-"})</span>
        <span><strong>Combustible:</strong> ${moto.fuelType || "-"}${moto.fuelTank ? ` · ${moto.fuelTank} L` : ""}</span>
        <span><strong>Autonomía:</strong> ${moto.autonomy || "-"}</span>
        <span><strong>Peso:</strong> ${moto.weight ? `${moto.weight} kg` : "-"}</span>
      </div>
      <a class="product-link" href="${detailUrl}">Ver ficha técnica completa</a>
    </div>
    <div class="product-actions">
      <a class="button" href="credito.html">Simular crédito</a>
      <a class="link-button" data-whatsapp-link data-whatsapp-message="Quiero consultar por la ${title}" href="#">Consultar por WhatsApp</a>
    </div>
  `;

  return card;
}
