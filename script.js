const data = window.GARIMPANDO_CONTENT || {
    posts: [],
    pages: [],
    categories: [],
  },
  localPosts = JSON.parse(localStorage.getItem("garimpando_posts") || "[]"),
  posts = [...localPosts, ...data.posts],
  pages = data.pages,
  categories = data.categories,
  cfg = window.GARIMPANDO_SUPABASE || {},
  dbReady =
    cfg.url?.startsWith("https://") &&
    !cfg.url.includes("COLE_AQUI") &&
    cfg.anonKey &&
    !cfg.anonKey.includes("COLE_AQUI"),
  publicDb = dbReady
    ? window.supabase.createClient(cfg.url, cfg.anonKey)
    : null;
const editorialCorrections = window.GARIMPANDO_EDITORIAL_CORRECTIONS || {};
const savedArticlePhotos = (html) =>
  (String(html || "").match(/<figure class="article-inline-image"[^>]*>[\s\S]*?<\/figure>/g) || []).join("") +
  (String(html || "").match(/<section class="article-gallery"[^>]*>[\s\S]*?<\/section>/g) || []).join("");
async function loadOnlinePosts() {
  if (!publicDb) return;
  const { data: online, error } = await publicDb
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .order("published_at", { ascending: false });
  if (error) {
    console.warn("Banco do blog indisponível", error.message);
    return;
  }
  const ids = new Set(posts.map((p) => String(p.id)));
  online.reverse().forEach((p) => {
    if (!ids.has(String(p.id))) {
      const correction = p.title.trim().toLowerCase() === "cariri"
        ? editorialCorrections[p.slug]
        : null;
      const resolvedCategory =
        categories.find((c) => c.id === p.category_id) ||
        categories.find(
          (c) =>
            normalizeSlug(c.name) === normalizeSlug(p.category_name || ""),
        );
      posts.unshift({
        id: p.id,
        slug: p.slug,
        date: p.published_at,
        title: correction?.title || p.title,
        excerpt: correction?.excerpt || p.excerpt,
        content: correction ? correction.content + savedArticlePhotos(p.content) : p.content,
        categories: resolvedCategory ? [resolvedCategory.id] : [],
        categoryName: p.category_name || resolvedCategory?.name || "Blog",
        categorySlug:
          resolvedCategory?.slug || normalizeSlug(p.category_name || "blog"),
        image: correction?.image || p.image_url || "",
        isFeatured: correction?.is_featured || Boolean(p.is_featured),
        imageAlt: correction?.title || p.title,
        originalUrl: "",
      });
    }
  });
  renderCategoryMenu();
  route();
}
const app = document.querySelector("#app"),
  menu = document.querySelector("#menu");
let shown = 18;
const esc = (s) =>
  String(s || "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[c],
  );
const date = (s) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(s));
const normalizeSlug = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const cat = (id) => categories.find((c) => c.id === id);
const categoryForPost = (post) =>
  cat(post.categories?.[0]) ||
  categories.find((c) => c.slug === post.categorySlug) ||
  categories.find(
    (c) => normalizeSlug(c.name) === normalizeSlug(post.categoryName),
  );
const belongsToCategory = (post, category) => {
  const resolved = categoryForPost(post);
  return (
    post.categories?.includes(category.id) ||
    resolved?.slug === category.slug ||
    normalizeSlug(post.categoryName) === category.slug
  );
};
const categoryMenu = document.querySelector("#categoryMenu");
const categoryCount = (category) =>
  posts.filter((post) => belongsToCategory(post, category)).length;
function renderCategoryMenu() {
  const preferred = ["estilo-de-vida", "gastronomia", "turismo"],
    available = categories.filter(
      (category) => categoryCount(category) > 0 && category.slug !== "destaques",
    ),
    menuCategories = preferred
      .map((slug) => available.find((category) => category.slug === slug))
      .filter(Boolean),
    selected = menuCategories[0] || available[0];
  categoryMenu.innerHTML =
    `<div class="mega-categories">${menuCategories
      .map(
        (category, index) =>
          `<button type="button" data-mega-category="${category.slug}" class="${index === 0 ? "active" : ""}">${esc(category.name)}</button>`,
      )
      .join("")}</div><div class="mega-posts" id="megaPosts"></div>`;
  if (selected) renderMegaPosts(selected);
}
function renderMegaPosts(category) {
  const selectedPosts = posts
    .filter((post) => belongsToCategory(post, category))
    .slice(0, 3);
  document.querySelector("#megaPosts").innerHTML = selectedPosts.length
    ? selectedPosts
        .map(
          (post) =>
            `<a class="mega-card" href="#materia/${post.slug}"><img src="${esc(post.image || "images/hero.png")}" alt="${esc(post.title)}"><strong>${esc(post.title)}</strong></a>`,
        )
        .join("")
    : `<a class="mega-empty" href="#categoria/${category.slug}">Ver matérias de ${esc(category.name)}</a>`;
}
renderCategoryMenu();
const categoryToggle = document.querySelector("#categoryToggle");
categoryToggle.addEventListener("click", (event) => {
  event.stopPropagation();
  const dropdown = event.currentTarget.closest(".nav-dropdown");
  const open = dropdown.classList.toggle("open");
  event.currentTarget.setAttribute("aria-expanded", String(open));
});
categoryMenu.addEventListener("click", (event) => {
  const categoryButton = event.target.closest("[data-mega-category]");
  if (categoryButton) {
    const category = categories.find(
      (item) => item.slug === categoryButton.dataset.megaCategory,
    );
    categoryMenu
      .querySelectorAll("[data-mega-category]")
      .forEach((button) => button.classList.toggle("active", button === categoryButton));
    if (category) renderMegaPosts(category);
    return;
  }
  if (event.target.closest("a")) {
    menu.classList.remove("show");
    categoryToggle.closest(".nav-dropdown").classList.remove("open");
    categoryToggle.setAttribute("aria-expanded", "false");
  }
});
categoryMenu.addEventListener("mouseover", (event) => {
  const categoryButton = event.target.closest("[data-mega-category]");
  if (categoryButton) categoryButton.click();
});
document
  .querySelector("#menuBtn")
  .addEventListener("click", () => menu.classList.toggle("show"));
document
  .querySelectorAll(".nav a")
  .forEach((a) =>
    a.addEventListener("click", () => menu.classList.remove("show")),
  );
function sidebar() {
  const partnerBrands = [
    { name: "Beeva Brazil", image: "images/parceiro-beeva.png", url: "https://www.beevabrazil.com/" },
    { name: "Pedras do Patacho", image: "images/parceiro-pedras.png", url: "https://www.pedrasdopatacho.com.br/" },
    { name: "Oceanic", image: "images/parceiro-oceanic.jpg", url: "https://www.oceanic.com.br/" },
    { name: "Entreposto", image: "images/parceiro-entreposto.jpg", url: "https://www.entreposto.com.br/" },
    { name: "Dona Deôla", domain: "donadeola.com.br", url: "https://www.donadeola.com.br/" },
    { name: "Ótica Brasolin", domain: "brasolin.com.br", url: "https://www.brasolin.com.br/" },
    { name: "Diasi Massas Artesanais", image: "images/logo-diasi.png", url: "https://diasimassasartesanais.com.br/" },
    { name: "Kangaroo Brasil", image: "images/logo-kangaroo.png", url: "https://www.kangaroo.com.br/" },
    { name: "Mister Travel", image: "images/logo-mister-travel.png", url: "https://www.mistertravel.com.br/" },
    { name: "UNIT", domain: "unit.br", url: "https://www.unit.br/" },
    { name: "GNC Suécia Salvador", domain: "gncsuecia.com.br", url: "https://www.gncsuecia.com.br/" },
    { name: "Sais Beach Hotel Maceió", domain: "saishotel.com.br", url: "https://www.saishotel.com.br/" },
    { name: "Ricardo Almeida", image: "images/logo-ricardo-almeida.png", url: "https://www.ricardoalmeida.com.br/" },
    { name: "Sococo", domain: "sococo.com.br", url: "https://www.sococo.com.br/" },
    { name: "Jacques Janine Granja Viana", domain: "jacquesjanine.com.br", url: "https://jacquesjanine.com.br/unidade/granja-viana/" },
  ];
  const partnersHtml = partnerBrands
    .map((brand) => {
      const logo = brand.image || (brand.domain
        ? `https://www.google.com/s2/favicons?domain_url=https://${brand.domain}&sz=256`
        : "");
      const visual = logo
        ? `<img class="partner-logo" src="${logo}" alt="Logo ${esc(brand.name)}" onerror="this.style.display='none'">`
        : `<span class="partner-monogram" aria-hidden="true">${esc(brand.initials)}</span>`;
      const content = `${visual}<span class="partner-name">${esc(brand.name)}</span>`;
      return brand.url
        ? `<a href="${brand.url}" target="_blank" rel="noopener" aria-label="${esc(brand.name)}">${content}</a>`
        : `<div class="partner-card">${content}</div>`;
    })
    .join("");
  return (
    '<aside><h3>Para Você</h3><a class="ad" href="https://www.pedrasdopatacho.com.br/" target="_blank"><img src="images/sobre.jpg"><span>Experiências especiais</span></a><h3>Marcas Parceiras</h3><div class="partners">' +
    partnersHtml +
    '</div><h3>Categorias</h3><ul>' +
    categories
      .filter((c) => categoryCount(c) > 0 && c.slug !== "destaques")
      .map(
        (c) =>
          '<li><a href="#categoria/' +
          c.slug +
          '">' +
          esc(c.name) +
          "</a><span>(" +
          categoryCount(c) +
          ")</span></li>",
      )
      .join("") +
    "</ul></aside>"
  );
}
function cards(items) {
  return (
    '<section class="post-list">' +
    items
      .map((p) => {
        const c = categoryForPost(p);
        return (
          '<article><a class="photo" href="#materia/' +
          p.slug +
          '"><img loading="lazy" src="' +
          esc(p.image || "images/hero.png") +
          '" alt="' +
          esc(p.imageAlt || p.title) +
          '"></a><div>' +
          (c
            ? '<a class="category" href="#categoria/' +
              c.slug +
              '">' +
              esc(c.name) +
              "</a>"
            : "") +
          '<h2><a href="#materia/' +
          p.slug +
          '">' +
          esc(p.title) +
          "</a></h2><small>" +
          date(p.date) +
          "</small><p>" +
          esc(p.excerpt) +
          '</p><a class="more" href="#materia/' +
          p.slug +
          '">Leia mais →</a></div></article>'
        );
      })
      .join("") +
    "</section>"
  );
}
function archive(title, items, intro) {
  const visible = items.slice(0, shown);
  app.innerHTML =
    '<section class="page-title"><span>Garimpando Life</span><h1>' +
    esc(title) +
    "</h1>" +
    (intro ? "<p>" + esc(intro) + "</p>" : "") +
    '<label class="search"><span>⌕</span><input id="search" placeholder="Pesquisar nas matérias"></label></section><div class="layout"><div id="results">' +
    cards(visible) +
    (visible.length < items.length
      ? '<button class="view-more" id="more">Carregar mais matérias</button>'
      : "") +
    "</div>" +
    sidebar() +
    "</div>";
  const search = document.querySelector("#search");
  search.addEventListener("input", () => {
    const q = search.value.toLocaleLowerCase("pt-BR").trim(),
      found = q
        ? items.filter((p) =>
            (p.title + " " + p.excerpt).toLocaleLowerCase("pt-BR").includes(q),
          )
        : items.slice(0, shown);
    document.querySelector("#results").innerHTML = cards(found);
  });
  document.querySelector("#more")?.addEventListener("click", () => {
    shown += 18;
    archive(title, items, intro);
  });
}
function home() {
  const latest = posts.slice(0, 12),
    intro = "Uma seleção das publicações mais recentes do Garimpando Life.",
    featured = posts.find((post) => post.isFeatured),
    featuredCategory = featured ? categoryForPost(featured) : null,
    heroImage = featured?.image || "images/hero.png",
    heroTitle = featured?.title || "Jordânia, Apaixonante Jordânia",
    heroLink = featured ? `#materia/${featured.slug}` : "#categoria/viagem",
    heroCategory = featuredCategory?.name || "Viagens",
    heroClass = heroImage.includes("cariri-capa") ? "hero hero-collage" : "hero";
  archive("Últimas matérias", latest, intro);
  const built = app.innerHTML;
  app.innerHTML =
    `<section class="${heroClass}"><a class="hero-link" href="${heroLink}"><img src="${esc(heroImage)}" alt="${esc(heroTitle)}"><div><h1>${esc(heroTitle)}</h1><p><span>${esc(heroCategory)}</span></p></div></a></section><section class="icons"><a href="#categoria/viagem"><b>✈</b><span>Viagens</span></a><a href="#categoria/ultimos-garimpos"><b>◇</b><span>Garimpos</span></a><a href="#colaboradores"><b>✦</b><span>Colaboradores</span></a><a href="#produtos"><b>◈</b><span>Produtos</span></a></section>` +
    built;
  bindArchive("Últimas matérias", latest, intro);
}
function bindArchive(title, items, intro) {
  document.querySelector("#search")?.addEventListener("input", (e) => {
    const q = e.target.value.toLocaleLowerCase("pt-BR").trim(),
      found = q
        ? items.filter((p) =>
            (p.title + " " + p.excerpt).toLocaleLowerCase("pt-BR").includes(q),
          )
        : items.slice(0, shown);
    document.querySelector("#results").innerHTML = cards(found);
  });
  document.querySelector("#more")?.addEventListener("click", () => {
    shown += 18;
    archive(title, items, intro);
  });
}
const collaboratorPosts = [
  {
    slug: "lets-go",
    title: "Let’s Go",
    excerpt: "Conteúdos, experiências e novidades em parceria com o Garimpando Life.",
    content: "<p>Let’s Go reúne conteúdos, experiências e novidades em parceria com o Garimpando Life.</p>",
    date: "2026-09-04T12:00:00",
    categories: [314],
    image: "",
    imageAlt: "Let’s Go",
  },
  {
    slug: "tudo-em-revista",
    title: "Tudo em Revista",
    excerpt: "Informação, comportamento e diferentes olhares para os leitores.",
    content: "<p>Tudo em Revista apresenta informação, comportamento e diferentes olhares para os leitores do Garimpando Life.</p>",
    date: "2026-09-04T12:00:00",
    categories: [314],
    image: "",
    imageAlt: "Tudo em Revista",
  },
];
function collaboratorHighlights() {
  return `<section class="page-title"><span>Garimpando Life</span><h1>Colaboradores</h1><p>Histórias, experiências e diferentes olhares de quem faz parte do Garimpando Life.</p></section><div class="collaborator-layout"><section class="collaborator-highlights" aria-label="Colaboradores">${collaboratorPosts.map((post, index) => `<article><span>${index ? "TR" : "LG"}</span><div><small>COLABORADOR</small><h2><a href="#materia/${post.slug}">${post.title}</a></h2><p>${post.excerpt}</p><a class="more" href="#materia/${post.slug}">Leia mais →</a></div></article>`).join("")}</section>${sidebar()}</div>`;
}
function article(p) {
  const c = categoryForPost(p);
  app.innerHTML =
    '<section class="page-title"><span>' +
    esc(c?.name || "Garimpando Life") +
    "</span><h1>" +
    esc(p.title) +
    "</h1><p>" +
    date(p.date) +
    '</p></section><div class="article-layout"><article class="article-body">' +
    (p.image
      ? '<img class="article-cover" src="' +
        esc(p.image) +
        '" alt="' +
        esc(p.imageAlt || p.title) +
        '">'
      : "") +
    "<div>" +
    p.content +
    '</div><a class="button" href="#inicio">Voltar ao início</a></article>' +
    sidebar() +
    "</div>";
}
function publicPage(p) {
  app.innerHTML =
    '<section class="page-title"><span>Garimpando Life</span><h1>' +
    esc(p.title) +
    '</h1></section><div class="article-layout"><article class="article-body">' +
    (p.image ? '<img class="article-cover" src="' + esc(p.image) + '">' : "") +
    "<div>" +
    p.content +
    "</div></article>" +
    sidebar() +
    "</div>";
}
function contact() {
  app.innerHTML =
    '<section class="page-title"><span>Fale com a gente</span><h1>Contato</h1><p>Críticas, sugestões, parcerias e projetos especiais.</p></section><section class="contact contact-card"><div class="contact-info"><span>GARIMPANDO LIFE</span><h2>Vamos conversar?</h2><p>Empresas interessadas em ações de marketing e publicidade podem contar com nosso suporte para projetos personalizados.</p><a href="tel:+551146173434">+55 11 4617-3434</a><a href="https://wa.me/5511999791784" target="_blank">WhatsApp: +55 11 99979-1784</a><a href="mailto:editorial@marcelosampaio.com">editorial@marcelosampaio.com</a></div><form id="contactForm"><div class="contact-row"><label>Nome<input name="nome" placeholder="Seu nome" required></label><label>E-mail<input name="email" type="email" placeholder="voce@email.com" required></label></div><label>Assunto<input name="assunto" placeholder="Como podemos ajudar?" required></label><label>Mensagem<textarea name="mensagem" placeholder="Escreva sua mensagem..." required></textarea></label><button>Enviar mensagem</button></form></section>';
  document.querySelector("#contactForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(e.target),
      subject = encodeURIComponent(f.get("assunto")),
      body = encodeURIComponent(
        "Nome: " +
          f.get("nome") +
          "\nE-mail: " +
          f.get("email") +
          "\n\n" +
          f.get("mensagem"),
      );
    location.href =
      "mailto:editorial@marcelosampaio.com?subject=" +
      subject +
      "&body=" +
      body;
  });
}
function animatePage() {
  const elements = document.querySelectorAll(
    ".post-list article,.icons a,.page-title,aside,.collaborator-highlights article",
  );
  elements.forEach((el) => el.classList.add("reveal-item"));
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      }),
    { threshold: 0.08 },
  );
  elements.forEach((el) => observer.observe(el));
}
function route() {
  shown = 18;
  const hash = location.hash.slice(1) || "inicio",
    parts = hash.split("/");
  if (hash === "inicio") home();
  else if (hash === "blog")
    archive(
      "Blog",
      posts,
      "Explore as " + posts.length + " matérias do Garimpando Life.",
    );
  else if (hash === "contato") contact();
  else if (hash === "colaboradores") {
    app.innerHTML = collaboratorHighlights();
  } else if (parts[0] === "materia") {
    const p = posts.find((x) => x.slug === parts.slice(1).join("/")) ||
      collaboratorPosts.find((x) => x.slug === parts.slice(1).join("/"));
    p ? article(p) : home();
  } else if (parts[0] === "categoria") {
    const c = categories.find((x) => x.slug === parts.slice(1).join("/")),
      items = c ? posts.filter((p) => belongsToCategory(p, c)) : posts;
    archive(
      c?.name || "Categorias",
      items,
      items.length + " matérias nesta categoria.",
    );
  } else if (hash === "produtos") {
    const c = categories.find((x) => x.slug === "produtos"),
      items = c ? posts.filter((p) => belongsToCategory(p, c)) : [];
    archive("Produtos", items);
  } else {
    const p = pages.find((x) => x.slug === hash);
    p ? publicPage(p) : home();
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
  requestAnimationFrame(animatePage);
}
addEventListener("hashchange", route);
route();
loadOnlinePosts();
