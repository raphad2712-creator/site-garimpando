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
        title: p.title,
        excerpt: p.excerpt,
        content: p.content,
        categories: resolvedCategory ? [resolvedCategory.id] : [],
        categoryName: p.category_name || resolvedCategory?.name || "Blog",
        categorySlug:
          resolvedCategory?.slug || normalizeSlug(p.category_name || "blog"),
        image: p.image_url || "",
        isFeatured: Boolean(p.is_featured),
        imageAlt: p.title,
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
  categoryMenu.innerHTML = categories
    .filter((c) => categoryCount(c) > 0 && c.slug !== "destaques")
    .map(
      (c) =>
        `<a href="#categoria/${c.slug}"><b>${esc(c.name)}</b><span>${categoryCount(c)}</span></a>`,
    )
    .join("");
}
renderCategoryMenu();
const categoryToggle = document.querySelector("#categoryToggle");
categoryToggle.addEventListener("click", (event) => {
  event.stopPropagation();
  const dropdown = event.currentTarget.closest(".nav-dropdown");
  const open = dropdown.classList.toggle("open");
  event.currentTarget.setAttribute("aria-expanded", String(open));
});
categoryMenu.addEventListener("click", () => {
  menu.classList.remove("show");
  categoryToggle.closest(".nav-dropdown").classList.remove("open");
  categoryToggle.setAttribute("aria-expanded", "false");
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
  return (
    '<aside><h3>Para Você</h3><a class="ad" href="https://www.pedrasdopatacho.com.br/" target="_blank"><img src="images/sobre.jpg"><span>Experiências especiais</span></a><h3>Marcas Parceiras</h3><div class="partners"><a href="https://www.beevabrazil.com/" target="_blank"><img src="images/parceiro-beeva.png" alt="Beeva Brazil"></a><a href="http://www.massasricci.com.br" target="_blank"><img src="images/parceiro-massas.jpg" alt="Massas Ricci"></a><a href="https://www.forthousemoveis.com.br/" target="_blank"><img src="images/parceiro-forthouse.png" alt="Forthouse"></a><a href="https://www.pedrasdopatacho.com.br/" target="_blank"><img src="images/parceiro-pedras.png" alt="Pedras do Patacho"></a><a><img src="images/parceiro-oceanic.jpg" alt="Oceanic"></a><a><img src="images/parceiro-entreposto.jpg" alt="Entreposto"></a></div><h3>Categorias</h3><ul>' +
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
    heroLink = featured ? `#post/${featured.slug}` : "#categoria/viagens",
    heroCategory = featuredCategory?.name || "Viagens";
  archive("Últimas matérias", latest, intro);
  const built = app.innerHTML;
  app.innerHTML =
    `<section class="hero"><a class="hero-link" href="${heroLink}"><img src="${esc(heroImage)}" alt="${esc(heroTitle)}"><div><h1>${esc(heroTitle)}</h1><p><span>${esc(heroCategory)}</span></p></div></a></section><section class="icons"><a href="#categoria/viagens"><b>✈</b><span>Viagens</span></a><a href="#categoria/garimpos"><b>◇</b><span>Garimpos</span></a><a href="#colaboradores"><b>✦</b><span>Colaboradores</span></a><a href="#produtos"><b>◈</b><span>Produtos</span></a></section>` +
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
    ".post-list article,.icons a,.page-title,.article-body,aside",
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
    const c = categories.find((x) => x.slug === "colaboradores"),
      items = c ? posts.filter((p) => belongsToCategory(p, c)) : [];
    archive(
      "Colaboradores",
      items,
      "Histórias, experiências e diferentes olhares de quem faz parte do Garimpando Life.",
    );
  } else if (parts[0] === "materia") {
    const p = posts.find((x) => x.slug === parts.slice(1).join("/"));
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
