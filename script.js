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
const removedPostSlugs = new Set([
  "uma-viagem-pela-alma-meu-roteiro-espiritual-pela-italia",
  "aeromexico-celebra-seus-90-anos-com-coquetel-em-sao-paulo-no-hilton-morumbi",
  "paz-e-bem-estar",
  "sergipe-cultura-educacao-e-muita-tradicao",
]);
const hiddenCategorySlugs = new Set([
  "pedro-mariano",
  "adolfo-stulman",
  "prosperidade-por-marcelo-e-cesario",
  "joka-finardi",
  "laura-wie",
  "silvia-percussi",
  "gabi-goulart",
]);
const collaboratorPartnerBrands = [
  {
    name: "Let's Go Bahia",
    image: "images/logo-lets-go-bahia-oficial.png",
    url: "https://letsgobahia.com.br/",
  },
  {
    name: "Revista Tudo",
    image: "images/logo-revista-tudo.png",
    url: "https://revistatudo.com.br/",
  },
];
const defaultPartnerBrands = [
  { name: "Beeva Brazil", image: "images/parceiro-beeva-hq.jpeg", url: "https://www.beevabrazil.com/" },
  { name: "Pedras do Patacho", image: "images/parceiro-pedras.png", url: "https://www.pedrasdopatacho.com.br/" },
  { name: "Oceanic", image: "images/parceiro-oceanic.jpg", url: "https://www.oceanic.com.br/" },
  { name: "Entreposto", image: "images/parceiro-entreposto-novo.jpeg", url: "https://www.entreposto.com.br/" },
  { name: "Dona Deôla", image: "images/parceiro-dona-deola.png", url: "https://www.donadeola.com.br/" },
  { name: "Ótica Brasolin", domain: "brasolin.com.br", url: "https://www.brasolin.com.br/" },
  { name: "Diasi Massas Artesanais", image: "images/logo-diasi.png", url: "https://diasimassasartesanais.com.br/" },
  { name: "Kangaroo Brasil", image: "images/logo-kangaroo.png", url: "https://www.kangaroo.com.br/" },
  { name: "Mister Travel", image: "images/parceiro-mister-travel-hq.jpeg", url: "https://www.mistertravel.com.br/" },
  { name: "UNIT", image: "images/parceiro-unit-hq.jpeg", url: "https://www.unit.br/" },
  { name: "GNC Suécia Salvador", image: "images/parceiro-volvo-hq.jpeg", url: "https://www.gncsuecia.com.br/" },
  { name: "Sais Beach Hotel Maceió", domain: "saishotel.com.br", url: "https://www.saishotel.com.br/" },
  { name: "Ricardo Almeida", image: "images/parceiro-ricardo-almeida-novo.png", url: "https://www.ricardoalmeida.com.br/" },
  { name: "Sococo", image: "images/parceiro-sococo.png", url: "https://www.sococo.com.br/" },
  { name: "Jacques Janine Granja Viana", image: "images/parceiro-jacques-janine-hq.png", url: "https://jacquesjanine.com.br/unidade/granja-viana/" },
  ...collaboratorPartnerBrands,
];
const forcedPartnerLogos = {
  "beeva-brazil": "images/parceiro-beeva-hq.jpeg",
  beeva: "images/parceiro-beeva-hq.jpeg",
  "dona-deola": "images/parceiro-dona-deola.png",
  entreposto: "images/parceiro-entreposto-novo.jpeg",
  "entreposto-das-feijoadas": "images/parceiro-entreposto-novo.jpeg",
  "jacques-janine-granja-viana": "images/parceiro-jacques-janine-hq.png",
  "jacques-janine": "images/parceiro-jacques-janine-hq.png",
  "mister-travel": "images/parceiro-mister-travel-hq.jpeg",
  unit: "images/parceiro-unit-hq.jpeg",
  "gnc-suecia-salvador": "images/parceiro-volvo-hq.jpeg",
  volvo: "images/parceiro-volvo-hq.jpeg",
  "ricardo-almeida": "images/parceiro-ricardo-almeida-novo.png",
  sococo: "images/parceiro-sococo.png",
};
let partnerBrands = [...defaultPartnerBrands];
const localCoverBySlug = {
  "uma-viagem-pela-alma-meu-roteiro-espiritual-pela-italia": "images/italia.jpg",
  "aeromexico-celebra-seus-90-anos-com-coquetel-em-sao-paulo-no-hilton-morumbi": "images/aeromexico.jpg",
  "paz-e-bem-estar": "images/bemestar.jpg",
  "sergipe-cultura-educacao-e-muita-tradicao": "images/sergipe.jpeg",
  "comidinhas-de-inverno": "images/comidinhas.jpg",
  "bem-estar-bem-viver": "images/unique.jpg",
  "o-espetacular-monte-nebo": "images/monte-nebo-original.png",
  "a-historica-jerash": "images/jerash-original.png",
  "a-deslumbrante-petra": "images/petra-original.png",
  "paes-jordanianos": "images/paes-jordanianos-v2.jpg",
  "grecia-destino-dos-sonhos": "images/grecia-destino-original.jpg",
  "wadi-rum-um-deserto-de-tirar-o-folego": "images/wadi-rum.jpg",
  "a-melhor-comida-caseira-jordaniana": "images/comida-jordaniana.jpg",
};
const drivePhoto = (id) => `https://lh3.googleusercontent.com/d/${id}=w1600`;
const archiveImageByPath = window.GARIMPANDO_ARCHIVE_IMAGES || {};
function archiveImageKey(url) {
  let decoded = String(url || "");
  try { decoded = decodeURIComponent(decoded); } catch (error) { /* mantém a URL original */ }
  const match = decoded.match(/\/wp-content\/uploads\/((?:\d{4}\/\d{2}|ngg_featured)\/[^\"'?#<>\s]+)/i);
  return match?.[1]?.normalize("NFC").toLowerCase() || "";
}
function optimizedRemoteImage(url) {
  const value = String(url || "").replace(/^http:\/\//i, "https://");
  if (value.includes(".supabase.co/storage/v1/object/public/") && /\.(?:jpe?g|png|webp)(?:[?#]|$)/i.test(value)) {
    const separator = value.includes("?") ? "&" : "?";
    return value.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/") + `${separator}width=1200&quality=78`;
  }
  return value;
}
function restoreImageUrl(url) {
  const id = archiveImageByPath[archiveImageKey(url)];
  return id ? drivePhoto(id) : optimizedRemoteImage(url);
}
function prepareArticleContent(html) {
  const template = document.createElement("template");
  template.innerHTML = String(html || "");
  template.content.querySelectorAll("img").forEach((image) => {
    const source = image.getAttribute("data-src") || image.getAttribute("src") || "";
    if (source) image.setAttribute("src", restoreImageUrl(source));
    image.removeAttribute("data-src");
    image.removeAttribute("srcset");
    image.removeAttribute("data-srcset");
    image.loading = "lazy";
    image.decoding = "async";
  });
  template.content.querySelectorAll(".article-gallery").forEach((gallery) => {
    [...gallery.querySelectorAll("img")].forEach((image, index) => {
      const source = image.getAttribute("src") || "";
      if (index === 0) {
        image.loading = "eager";
        image.fetchPriority = "high";
      } else if (source) {
        image.dataset.src = source;
        image.removeAttribute("src");
      }
    });
  });
  return template.innerHTML;
}
const archiveGarimpoCoverBySlug = Object.fromEntries(
  Object.entries(window.GARIMPANDO_DRIVE_COVERS || {}).map(([slug, id]) => [slug, drivePhoto(id)]),
);
const garimpoCoverBySlug = {
  "sunset-a-beira-mar": "images/garimpos-restauradas/sunset-a-beira-mar.jpg",
  "fasano-um-dos-100-melhores-destinos-do-mundo-pela-time": drivePhoto("1610cyEP6lYFP1cQCYl4m__c1ee7vlnL9"),
  "as-excelentes-acoes-do-turismo": "images/produto-viagem.jpg",
  "as-criativas-vitrines-de-luxo-no-mundo-hype": drivePhoto("1UpE74WBIxLXGfR-gAkZIvOYfmVKbbc9Y"),
  "farmers-market-e-the-groove-amei-em-los-angeles": "images/comidinhas.jpg",
  "o-velho-oeste-americano-autentico-na-rota-66": "images/wadi-rum.jpg",
  "prime-vacation-novo-conceito-em-turismo-familiar": "images/bemestar.jpg",
  "fadas-gigantes-universo-encantado": drivePhoto("16cdKpk2GmRG97CrkbeQe3eQJCSDkP2JI"),
  "village-barra-um-hotel-encantador-para-a-familia": "images/garimpos-restauradas/village-barra.png",
  "o-seguro-e-potente-volvo-s60": drivePhoto("1D3-aCET2VyGNA8fiJKAkYjPzgQ8krad9"),
  "nara-e-essencia-do-budismo": "https://images.moneycontrol.com/static-mcnews/2023/09/Mount-Fuji-is-covered-in-snow-half-the-year-Photo-Credit-Hannes-via-Wikimedia-Commons.jpg?height=900&impolicy=website&width=1600",
};
const travelCoverBySlug = {
  "jordania-apaixonante-jordania": "https://res.cloudinary.com/startup-grind/image/fetch/c_scale%2Cw_2560/c_crop%2Ch_650%2Cw_2560%2Cy_0.41_mul_h_sub_0.41_mul_650/c_crop%2Ch_650%2Cw_2560/c_fill%2Cdpr_2.0%2Cf_auto%2Cg_center%2Cq_auto%3Agood/https%3A/res.cloudinary.com/startup-grind/image/upload/c_fill%2Cdpr_2.0%2Cf_auto%2Cg_center%2Cq_auto%3Agood/v1/gcs/platform-data-startupgrind/chapter_banners/22861395_1623315001061887_8517170722413525260_o%2520%25281%2529_Hd5zIfa.jpg",
  "petra-magnifica": "images/petra-magnifica-v3.jpg",
  "colombia-colorida-e-magica": drivePhoto("1JP8dCylBrbudrEem_Kxa6tC2T1hGFfRQ"),
  "grecia-destino-dos-sonhos": "images/grecia-destino-original.jpg",
  "chapada-diamantina-um-encontro-com-a-mais-poetica-das-regioes-brasileiras": drivePhoto("1Z_GCAZgxKBu77jJULV0RPb-xVFJeR7Cg"),
  "lindo-e-delicioso-hotel-de-lencois": drivePhoto("14AZxU777gWWFNIfgFNzlb_E2simnElvX"),
  "uvva-orgullho-baiano-da-chapada-diamantina": drivePhoto("1yxtAZxwQqHCbIEq8mfIRy_WjtNxTa43k"),
  "refugio-na-serra-surpreende-em-todos-os-cantos": drivePhoto("1610cyEP6lYFP1cQCYl4m__c1ee7vlnL9"),
  "sabores-especiais-de-lencois": drivePhoto("1J3ELEfnLpFRPzJK70VyOkI9XTU65OD8X"),
  "um-icone-gastronomico-em-olinda": drivePhoto("1UpE74WBIxLXGfR-gAkZIvOYfmVKbbc9Y"),
  "meus-preferidos-restaurantes-de-recife": drivePhoto("1Qha4g-oK6evu8yWHpLMJwYlzskJBUU3y"),
  "pernambuco-destino-de-luz-arte-e-gastronomia": drivePhoto("1Ef_7RKci2Kp-CB0zyPZ21dz3t9_e-SxI"),
  "alagoas-caribe-brasileiro": drivePhoto("1X0T17Kqk_ukE3vlO4VufQ0pcwl-Gm7PY"),
  "russia-exuberante-e-encantadora": "https://cdn.tripster.ru/photos/44177688-78bd-4a0d-92f6-06ffd497b3f6.jpg",
  "sao-francisco-cultura-e-diversao": drivePhoto("1D3-aCET2VyGNA8fiJKAkYjPzgQ8krad9"),
  "o-paraiso-alter-do-chao-para": "https://uploads.diariodopara.com.br/2025/10/WhatsApp-Image-2025-10-16-at-16.27.18-984x553.jpeg",
  "o-melhor-do-verao-em-portugal": "https://famango.de/assets/img/camp/1046/urlaub-mit-kindern-europa-strand-portugal.jpg",
  "roma-em-familia": drivePhoto("1mnK1i6tsvZHfInkBG24FahYK_-tMzIiE"),
  "de-barco-no-coracao-da-amazonia": "https://artprintcave.hu/images/tapet/ft-nw-40954972/2/l/fototapeta-amazonas-folyó-dzsungel-fak.jpg",
  "a-magia-de-rapa-nui-em-familia": "https://i0.wp.com/www.toonsarah-travels.blog/wp-content/uploads/2020/10/12-59-Rapa-Nui-2016-Tongariki-for-feature.jpg?fit=1166%2C812&ssl=1",
  "mexico-entre-o-ceu-e-o-mar": drivePhoto("1Ws1UJrinnWnK5F7z9hxOM-1bexeQsEa3"),
  "india-um-novo-olhar-sobre-o-mundo": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Taj_Mahal%2C_Agra%2C_India_edit2.jpg/1280px-Taj_Mahal%2C_Agra%2C_India_edit2.jpg",
  "peru-experiencias-sem-fim": drivePhoto("18oSvGVPKVaCCrjJoLgqxwvM9z3vBMC82"),
  "peru-um-mistico-encanto": drivePhoto("1WKHnmg91gPFBrsrft-VQZCGVyITHezC6"),
  "canada-o-pais-que-sorri-para-todos": "https://www.yonder.fr/sites/default/files/contenu/news/visuel-voyage-au-canada-5-activites-a-decouvrir-en-famille.jpg",
  "guatemala-seus-misterios-e-sua-historia": "https://ssl.tzoo-img.com/images/tzoo.103677.0.1346888.LakeAtitlan_Guatemala_iStock-870585478.jpg?width=1080",
  "no-coracao-da-amazonia": "https://img.rezdy.com/PRODUCT_IMAGE/149616/Amazon_clipper_lg.jpg",
  "a-historia-e-o-sol-de-uma-jamaica": drivePhoto("1ZJMnCq_d2pQkJWnLO2t4oayj06TIbUE3"),
  "marrocos-o-pais-das-mil-e-uma-noites": drivePhoto("113IGPFmbS5lGHI3X4s4cCf00ns9udW_m"),
  "africa-do-sul-e-mauritius-em-familia": "https://img.wiki.ac.mu/images/2026/04/family-enjoying-a-peaceful-walk-along-a-mauritius-beach-at-sunset.jpg",
  "japao-elegante-pais-do-sol-nascente": "https://images.moneycontrol.com/static-mcnews/2023/09/Mount-Fuji-is-covered-in-snow-half-the-year-Photo-Credit-Hannes-via-Wikimedia-Commons.jpg?height=900&impolicy=website&width=1600",
  "a-eterna-e-bela-sicilia": drivePhoto("1Plf1MGV5xiJIiSLDkTJJGUYMfuaQc9xp"),
  "parana-uma-terra-de-tradicoes": drivePhoto("1MFmmqHQH5us29QFCYowSs8inA_-v0tCO"),
  "bahia-de-charme-parte-2": drivePhoto("1MI-6NGngIITKITaegxYBY0FI2s9RLmbo"),
  "bahia-de-charme-parte-1": drivePhoto("1BRojQz52ezldB9bjtFCRvOCCarLIOyq9"),
  "sol-de-santa": "https://cdn-clubecandeias.s3.sa-east-1.amazonaws.com/uploads/images/praias-para-familia-santa-catarina-clube-candeias-florianopolis.jpeg",
  "suica-sofisticada-e-saborosa": "https://admin.europaturism.ro/Files/Pictures/Images/elvetia-9918.jpg",
  "china-o-imenso-pais-dourado": "https://images.rawpixel.com/image_800/cHJpdmF0ZS9zdGF0aWMvaW1hZ2Uvd2Vic2l0ZS8yMDIyLTA0L2xyL3B4NzU5MzMzLWltYWdlLWt3dnY1N2J1LmpwZw.jpg",
};
const partyCoverBySlug = {
  "viva-santo-antonio-sao-pedro-sao-joao": drivePhoto("1h51N464CtAR_O9G_WIdw6S-gmuc2XHGe"),
  "15-anos-do-filhao-em-casa": drivePhoto("1FXr5uz39zBXeH5Zpv8-O7MsjLzcSkCjB"),
  "recebendo-com-amor": drivePhoto("1T-OwOoZWL0U1CAOCo59iuML3MC8w3yq9"),
  "clash-change-the-game": drivePhoto("1lrn_rgb6Sxl5ySHQ8kKOi8U197VwrkdS"),
  "100-anos-de-muito-amor-e-dedicacao": drivePhoto("1XCr9L_eXk5dVF9v_FzHyoHqxkfDcbh-5"),
  "comemorando-em-casa": drivePhoto("1geY4bK-Ghavu7GY5FeDkQFqhrKZZH1ra"),
  "uma-autentica-festa-de-casamento-na-india": drivePhoto("1I3kZYzXW5FEAvkkgdtUt2ImEod22E34x"),
  "bodas-de-prata-em-familia": drivePhoto("1kUIu-OO4PfLQtBw2QQhZIZvIDh-CAiXT"),
  "sunset-party-aos-50": drivePhoto("1pXrbvsJkWncoftKIHMA2tbThFUr5Vfss"),
  "aeromexico-festejando-20-anos-de-brasi": "images/aeromexico.jpg",
  "80-anos-com-um-gigante-coracao": drivePhoto("1XD5S0eu-_q3aBq-xBiDsF39EbohvjHpN"),
  "festa-antonela": drivePhoto("1jLvrL-NheQC3RmZQIsRCPj7CTXcHHOCd"),
  "glamour-do-fundo-do-mar": drivePhoto("16cdKpk2GmRG97CrkbeQe3eQJCSDkP2JI"),
  "moderna-e-inesquecive": drivePhoto("1zR5A-vSUq91gRyEGlubvp6czAW_1sB49"),
  "afro-festa-sofisticada": drivePhoto("1MpnV1xkWFMnSZ4uUj1RrFeeeJonwjIsH"),
  "01-aninho-bem-do-interior": drivePhoto("1nzgOxZ8QAe_POjnpdL-xli9cP3qhHiqC"),
  "receber-em-casa": drivePhoto("1O56PdgbP_jSqTVgBtbWVF6fuN08CgSdj"),
  "festa-hype-do-vinho": drivePhoto("1fxdg9W-eQkKbDnQ1xwggUuCboGx3Torc"),
  "festas-no-interior": drivePhoto("1TvRJrvi7eTWFdJSFb-bpsh9BtOHgiGnk"),
  "casamento-em-casa-de-familia": drivePhoto("1oVnNFFm3JqVhJH3vdY05y06v6EkBjQVv"),
  "moulin-rouge-noite-da-seducao": drivePhoto("1WPLgKLKvFfsqzSq5gokZFB-QgSNgJOC7"),
  "15-anos-pop": drivePhoto("1rMgIP3t5QVlU5AZi4tzvC8tN8-G9cmv8"),
  "o-oriente-dentro-de-casa": drivePhoto("1pHLOv5mRe9eG8wzj-te4u9u2lXKxuQXa"),
  "festa-gotica": drivePhoto("1oRuoGEjZ88h-ZeVl8Ilp5JM5hkTSbRVq"),
};
posts.forEach((post) => {
  if (archiveGarimpoCoverBySlug[post.slug]) post.image = archiveGarimpoCoverBySlug[post.slug];
  else if (partyCoverBySlug[post.slug]) post.image = partyCoverBySlug[post.slug];
  else if (travelCoverBySlug[post.slug]) post.image = travelCoverBySlug[post.slug];
  else if (garimpoCoverBySlug[post.slug]) post.image = garimpoCoverBySlug[post.slug];
  else if (localCoverBySlug[post.slug]) post.image = localCoverBySlug[post.slug];
});
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
  const brandSettings = online.find((p) => p.slug === "config-marcas-parceiras");
  if (brandSettings) {
    try {
      const savedBrands = JSON.parse(brandSettings.content || "[]");
      if (Array.isArray(savedBrands)) {
        partnerBrands = savedBrands.map((brand) => ({
          ...brand,
          image: forcedPartnerLogos[normalizeSlug(brand.name || "")] || brand.image,
        }));
      }
    } catch (error) {
      console.warn("Configuração das marcas inválida", error);
    }
  }
  collaboratorPartnerBrands.forEach((collaborator) => {
    const alreadyListed = partnerBrands.some(
      (brand) => normalizeSlug(brand.name || "") === normalizeSlug(collaborator.name),
    );
    if (!alreadyListed) partnerBrands.push(collaborator);
  });
  online
    .filter((p) => p.slug !== "config-marcas-parceiras" && !removedPostSlugs.has(normalizeSlug(p.slug)))
    .reverse()
    .forEach((p) => {
    const correction = editorialCorrections[p.slug] || null;
    const isCaririMain =
      normalizeSlug(correction?.title || p.title) ===
      "cariri-arte-e-cultura-do-ceara";
    const resolvedCategory =
      categories.find((c) => c.id === p.category_id) ||
      categories.find(
        (c) =>
          normalizeSlug(c.name) === normalizeSlug(p.category_name || ""),
      );
    const onlinePost = {
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
      image: partyCoverBySlug[p.slug] || travelCoverBySlug[p.slug] || localCoverBySlug[p.slug] || correction?.image || p.image_url || "",
      articleImage: isCaririMain ? "images/cariri-capa-single.jpg" : "",
      isFeatured: correction?.is_featured || Boolean(p.is_featured),
      imageAlt: correction?.title || p.title,
      originalUrl: "",
    };
    const sameMatter = (existing) =>
      String(existing.id) === String(p.id) ||
      existing.slug === p.slug ||
      normalizeSlug(existing.title) === normalizeSlug(onlinePost.title);
    const correctedVersionExists = posts.some(
      (existing) =>
        sameMatter(existing) && editorialCorrections[existing.slug],
    );
    if (!correction && correctedVersionExists) return;
    for (let index = posts.length - 1; index >= 0; index -= 1) {
      if (sameMatter(posts[index])) posts.splice(index, 1);
    }
    posts.unshift(onlinePost);
  });
  removeRepeatedPosts();
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
const firstArticleImage = (post) => {
  const match = String(post?.content || "").match(/<img[^>]+src=["']([^"']+)["']/i);
  return restoreImageUrl(match?.[1] || "");
};
const postCover = (post) =>
  restoreImageUrl(post?.image || firstArticleImage(post) || "");
function postCoverPlaceholder(title = "Garimpando Life", category = "MATÉRIA") {
  const label = String(title || "Garimpando Life").trim().slice(0, 72);
  const eyebrow = String(category || "MATÉRIA").trim().toUpperCase().slice(0, 28);
  let seed = 0;
  for (const character of label) seed = (seed * 31 + character.charCodeAt(0)) >>> 0;
  const hue = seed % 42 + 18;
  const safe = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  })[character]);
  const words = label.split(/\s+/);
  const lines = [""];
  words.forEach((word) => {
    const current = lines[lines.length - 1];
    if ((current + " " + word).trim().length > 24 && lines.length < 3) lines.push(word);
    else lines[lines.length - 1] = (current + " " + word).trim();
  });
  const text = lines.map((line, index) =>
    `<text x="50%" y="${47 + index * 11}%" text-anchor="middle">${safe(line)}</text>`,
  ).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="680" viewBox="0 0 900 680"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="hsl(${hue} 72% 36%)"/><stop offset="1" stop-color="hsl(${(hue + 38) % 360} 55% 18%)"/></linearGradient></defs><rect width="900" height="680" fill="url(#g)"/><circle cx="760" cy="100" r="180" fill="white" opacity=".07"/><circle cx="100" cy="650" r="260" fill="white" opacity=".05"/><text x="50%" y="25%" text-anchor="middle" fill="#efb45b" font-family="Arial,sans-serif" font-size="25" font-weight="700" letter-spacing="5">${safe(eyebrow)}</text><g fill="white" font-family="Georgia,serif" font-size="48" font-weight="700">${text}</g><path d="M340 570h220" stroke="#efb45b" stroke-width="5"/><text x="50%" y="91%" text-anchor="middle" fill="white" opacity=".8" font-family="Arial,sans-serif" font-size="20" letter-spacing="4">GARIMPANDO LIFE</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
function replacePostCover(image) {
  image.onerror = null;
  image.src = postCoverPlaceholder(image.dataset.coverTitle, image.dataset.coverCategory);
}
const isVisibleCategory = (category) =>
  category && !hiddenCategorySlugs.has(category.slug);
const cat = (id) => categories.find((c) => c.id === id && isVisibleCategory(c));
const categoryForPost = (post) =>
  post.categories?.map(cat).find(Boolean) ||
  categories.find((c) => c.slug === post.categorySlug && isVisibleCategory(c)) ||
  categories.find(
    (c) => isVisibleCategory(c) && normalizeSlug(c.name) === normalizeSlug(post.categoryName),
  );
const belongsToCategory = (post, category) => {
  const resolved = categoryForPost(post);
  return (
    post.categories?.includes(category.id) ||
    resolved?.slug === category.slug ||
    normalizeSlug(post.categoryName) === category.slug
  );
};
function removeRepeatedPosts() {
  const usedIds = new Set();
  const usedSlugs = new Set();
  const usedTitles = new Set();
  const uniquePosts = posts.filter((post) => {
    const id = String(post.id || "");
    const slug = normalizeSlug(post.slug);
    const title = normalizeSlug(post.title);
    const repeated =
      removedPostSlugs.has(slug) ||
      (id && usedIds.has(id)) ||
      (slug && usedSlugs.has(slug)) ||
      (title && usedTitles.has(title));
    if (repeated) return false;
    if (id) usedIds.add(id);
    if (slug) usedSlugs.add(slug);
    if (title) usedTitles.add(title);
    return true;
  });
  posts.splice(0, posts.length, ...uniquePosts);
}
const categoryMenu = document.querySelector("#categoryMenu");
const categoryCount = (category) =>
  posts.filter((post) => belongsToCategory(post, category)).length;
function renderCategoryMenu() {
  const preferred = ["estilo-de-vida", "gastronomia", "turismo"],
    available = categories.filter(
      (category) => isVisibleCategory(category) && categoryCount(category) > 0 && category.slug !== "destaques",
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
            `<a class="mega-card" href="#materia/${post.slug}"><img src="${esc(postCover(post) || postCoverPlaceholder(post.title, category.name))}" data-cover-title="${esc(post.title)}" data-cover-category="${esc(category.name)}" alt="${esc(post.title)}" onerror="replacePostCover(this)"><strong>${esc(post.title)}</strong></a>`,
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
  return (
    '<aside><h3>Para Você</h3><a class="ad" href="https://www.pedrasdopatacho.com.br/" target="_blank"><img src="images/sobre.jpg"><span>Experiências especiais</span></a><h3>Categorias</h3><ul>' +
    categories
      .filter((c) => isVisibleCategory(c) && categoryCount(c) > 0 && c.slug !== "destaques")
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
function partnerLogo(brand, large = false) {
  const logo = brand.image || (brand.domain
    ? `https://www.google.com/s2/favicons?domain_url=https://${brand.domain}&sz=256`
    : "");
  const visual = logo
    ? `<img class="partner-logo" src="${esc(logo)}" alt="Logo ${esc(brand.name)}" onerror="this.style.display='none'">`
    : `<span class="partner-monogram" aria-hidden="true">${esc(brand.initials || brand.name?.slice(0, 2) || "GL")}</span>`;
  const content = `${visual}<span class="partner-name">${esc(brand.name)}</span>`;
  const className = large ? ' class="company-card"' : "";
  return brand.url
    ? `<a${className} href="${esc(brand.url)}" target="_blank" rel="noopener" aria-label="Visitar site ou Instagram de ${esc(brand.name)}">${content}</a>`
    : `<div${className}>${content}</div>`;
}
function brandsCarousel(className = "") {
  return (
    `<section class="companies-carousel ${className}" aria-label="Marcas parceiras"><div class="companies-heading"><span>Garimpando Life</span><h2>Marcas parceiras</h2></div><button class="company-arrow company-previous" type="button" aria-label="Marcas anteriores">‹</button><div class="companies-track">` +
    partnerBrands.map((brand) => partnerLogo(brand, true)).join("") +
    '</div><button class="company-arrow company-next" type="button" aria-label="Próximas marcas">›</button></section>'
  );
}
function companiesPage() {
  app.innerHTML =
    '<section class="page-title"><span>Garimpando Life</span><h1>Empresas garimpeiras</h1><p>Conheça as marcas parceiras do Garimpando Life.</p></section>' +
    brandsCarousel();
}
function initCompanyCarousels() {
  document.querySelectorAll(".companies-carousel").forEach((carousel) => {
    const track = carousel.querySelector(".companies-track"),
      previous = carousel.querySelector(".company-previous"),
      next = carousel.querySelector(".company-next"),
      move = (direction) => track.scrollBy({ left: direction * Math.max(track.clientWidth * .82, 250), behavior: "smooth" });
    previous.onclick = () => move(-1);
    next.onclick = () => move(1);
    let timer = setInterval(() => {
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
      track.scrollTo({ left: atEnd ? 0 : track.scrollLeft + Math.max(track.clientWidth * .82, 250), behavior: "smooth" });
    }, 4200);
    carousel.addEventListener("pointerenter", () => clearInterval(timer));
    carousel.addEventListener("pointerleave", () => {
      clearInterval(timer);
      timer = setInterval(() => next.click(), 4200);
    });
  });
}
function openBrandViewer(card) {
  let viewer = document.querySelector("#brand-viewer");
  if (!viewer) {
    viewer = document.createElement("div");
    viewer.id = "brand-viewer";
    viewer.className = "brand-viewer";
    viewer.hidden = true;
    viewer.setAttribute("role", "dialog");
    viewer.setAttribute("aria-modal", "true");
    viewer.setAttribute("aria-label", "Logo ampliada");
    viewer.innerHTML = '<div class="brand-viewer-panel"><button class="brand-viewer-close" type="button" aria-label="Fechar ampliação">×</button><img alt=""><h3></h3><a class="brand-site-link" target="_blank" rel="noopener">Visitar site</a></div>';
    document.body.appendChild(viewer);
    viewer.querySelector(".brand-viewer-close").addEventListener("click", () => closeBrandViewer());
    viewer.addEventListener("click", (event) => {
      if (event.target === viewer) closeBrandViewer();
    });
  }
  const name = card.dataset.brandName || "Marca parceira";
  const image = viewer.querySelector("img");
  const siteLink = viewer.querySelector(".brand-site-link");
  image.src = card.dataset.brandLogo;
  image.alt = `Logo ${name}`;
  viewer.querySelector("h3").textContent = name;
  if (card.dataset.brandUrl) {
    siteLink.href = card.dataset.brandUrl;
    siteLink.hidden = false;
  } else {
    siteLink.hidden = true;
  }
  viewer.hidden = false;
  document.body.classList.add("brand-viewer-open");
  viewer.querySelector(".brand-viewer-close").focus();
}
function closeBrandViewer() {
  const viewer = document.querySelector("#brand-viewer");
  if (!viewer) return;
  viewer.hidden = true;
  document.body.classList.remove("brand-viewer-open");
}
function initPartnerCarousels() {
  document.querySelectorAll(".partners-carousel").forEach((carousel) => {
    const track = carousel.querySelector(".partners"),
      previous = carousel.querySelector(".partners-previous"),
      next = carousel.querySelector(".partners-next"),
      cards = [...track.children];
    if (!cards.length) return;
    let current = 0;
    const show = (index) => {
      current = (index + cards.length) % cards.length;
      track.scrollTo({ left: current * track.clientWidth, behavior: "smooth" });
    };
    previous.onclick = () => show(current - 1);
    next.onclick = () => show(current + 1);
    let timer = setInterval(() => show(current + 1), 4000);
    carousel.addEventListener("pointerenter", () => clearInterval(timer));
    carousel.addEventListener("pointerleave", () => {
      clearInterval(timer);
      timer = setInterval(() => show(current + 1), 4000);
    });
  });
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
          esc(postCover(p) || postCoverPlaceholder(p.title, c?.name)) +
          '" alt="' +
          esc(p.imageAlt || p.title) +
          '" data-cover-title="' +
          esc(p.title) +
          '" data-cover-category="' +
          esc(c?.name || "Matéria") +
          '" onerror="replacePostCover(this)"></a><div>' +
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
  const latestPosts = [...posts]
    .sort((first, second) => new Date(second.date) - new Date(first.date))
    .slice(0, 4);
  const isCaririMatter = (post) => {
    const expectedSlug = "cariri-arte-e-cultura-do-ceara";
    return (
      normalizeSlug(post.slug || "").startsWith(expectedSlug) ||
      normalizeSlug(post.title || "") === expectedSlug
    );
  };
  const featuredPost = posts.find(isCaririMatter) || latestPosts[0];
  const featuredCategory = featuredPost ? categoryForPost(featuredPost) : null;
  const isCaririFeatured = featuredPost && isCaririMatter(featuredPost);
  const featuredImage = isCaririFeatured
    ? "images/cariri-capa-single.jpg"
    : featuredPost
      ? postCover(featuredPost) ||
        postCoverPlaceholder(featuredPost.title, featuredCategory?.name)
      : "images/hero.png";
  app.innerHTML =
    (featuredPost
      ? `<section class="hero hero-single"><a class="hero-link" href="#materia/${featuredPost.slug}"><img src="${esc(featuredImage)}" data-cover-title="${esc(featuredPost.title)}" data-cover-category="${esc(featuredCategory?.name || "Matéria")}" alt="${esc(featuredPost.imageAlt || featuredPost.title)}" onerror="replacePostCover(this)"><div><p><span>${esc(featuredCategory?.name || "Garimpando Life")}</span></p><h1>${esc(featuredPost.title)}</h1></div></a></section>`
      : "") +
    '<section class="icons" aria-label="Áreas do site"><a href="#categoria/viagem"><b><svg viewBox="0 0 48 48" aria-hidden="true"><path d="m43 22-16-9V5c0-2-1-4-3-4s-3 2-3 4v8L5 22v5l16-5v11l-6 4v4l9-3 9 3v-4l-6-4V22l16 5v-5Z"/></svg></b><span>Viagens</span></a><a href="#categoria/ultimos-garimpos"><b><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M9 17 16 7h16l7 10-15 23L9 17Z"/><path d="m9 17 15 23 15-23M16 7l8 33 8-33M9 17h30"/></svg></b><span>Garimpos</span></a><a href="#colaboradores"><b><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="18" cy="16" r="7"/><circle cx="34" cy="18" r="5"/><path d="M5 40c0-8 5-13 13-13s13 5 13 13M29 29c2-2 4-3 7-3 5 0 8 4 8 10"/></svg></b><span>Colaboradores</span></a><a href="#produtos"><b><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M7 17 24 7l17 10-17 10L7 17Z"/><path d="M7 17v18l17 10 17-10V17M24 27v18"/></svg></b><span>Produtos</span></a></section>' +
    '<section class="home-latest"><div class="home-section-title"><span>Novidades</span><h2>Últimas matérias</h2><p>Confira os conteúdos mais recentes do Garimpando Life.</p></div><div class="latest-grid">' +
    latestPosts.map((post) => {
      const category = categoryForPost(post);
      return `<article><a class="latest-photo" href="#materia/${post.slug}"><img loading="lazy" src="${esc(postCover(post) || postCoverPlaceholder(post.title, category?.name))}" data-cover-title="${esc(post.title)}" data-cover-category="${esc(category?.name || "Matéria")}" alt="${esc(post.imageAlt || post.title)}" onerror="replacePostCover(this)"></a><div><a class="category" href="#categoria/${category?.slug || "ultimos-garimpos"}">${esc(category?.name || "Garimpando Life")}</a><h3><a href="#materia/${post.slug}">${esc(post.title)}</a></h3><small>${date(post.date)}</small><a class="more" href="#materia/${post.slug}">Leia mais →</a></div></article>`;
    }).join("") +
    '</div></section>' +
    brandsCarousel();
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
    logo: "images/logo-lets-go-bahia-oficial.png",
    url: "https://letsgobahia.com.br/",
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
    logo: "images/logo-revista-tudo.png",
    url: "https://revistatudo.com.br/",
  },
];
function collaboratorHighlights() {
  return `<section class="page-title"><span>Garimpando Life</span><h1>Colaboradores</h1><p>Histórias, experiências e diferentes olhares de quem faz parte do Garimpando Life.</p></section><div class="collaborator-layout"><section class="collaborator-highlights" aria-label="Colaboradores">${collaboratorPosts.map((post) => `<article><a class="collaborator-logo" href="${post.url}" target="_blank" rel="noopener" aria-label="Acessar ${post.title}"><img src="${post.logo}" alt="Logo ${post.title}"></a><div><small>COLABORADOR</small><h2><a href="${post.url}" target="_blank" rel="noopener">${post.title}</a></h2><p>${post.excerpt}</p><a class="more" href="${post.url}" target="_blank" rel="noopener">Visitar site →</a></div></article>`).join("")}</section>${sidebar()}</div>`;
}
function openPhotoViewer(image) {
  let viewer = document.querySelector("#photoViewer");
  if (!viewer) {
    viewer = document.createElement("dialog");
    viewer.id = "photoViewer";
    viewer.className = "photo-viewer";
    viewer.innerHTML =
      '<button type="button" aria-label="Fechar foto">×</button><img alt="Foto ampliada">';
    document.body.appendChild(viewer);
    viewer.querySelector("button").onclick = () => viewer.close();
    viewer.onclick = (event) => {
      if (event.target === viewer) viewer.close();
    };
  }
  viewer.querySelector("img").src = image.src;
  viewer.querySelector("img").alt = image.alt || "Foto ampliada";
  viewer.showModal();
}
function initArticleGalleries(fallbackImage = "images/hero.png") {
  document.querySelectorAll(".article-gallery").forEach((gallery) => {
    if (gallery.dataset.carouselReady) return;
    gallery.dataset.carouselReady = "true";
    const images = [...gallery.querySelectorAll("img")];
    if (!images.length) return;
    const loadImage = (image) => {
      if (!image?.getAttribute("src") && image?.dataset.src) {
        image.setAttribute("src", image.dataset.src);
        image.removeAttribute("data-src");
      }
    };
    const track = document.createElement("div");
    track.className = "gallery-track";
    images.forEach((image) => track.appendChild(image));
    gallery.appendChild(track);
    images.forEach((image) => {
      image.tabIndex = 0;
      image.title = "Clique para ampliar";
      image.onclick = () => openPhotoViewer(image);
      image.onkeydown = (event) => {
        if (event.key === "Enter" || event.key === " ") openPhotoViewer(image);
      };
    });
    let current = 0;
    const availableIndex = (start, direction = 1) => {
      for (let offset = 0; offset < images.length; offset += 1) {
        const candidate = (start + offset * direction + images.length * 2) % images.length;
        if (images[candidate].dataset.failed !== "true") return candidate;
      }
      return -1;
    };
    const showFallback = () => {
      const image = images[0];
      if (!fallbackImage || image.dataset.fallbackUsed) return;
      image.dataset.failed = "false";
      image.dataset.fallbackUsed = "true";
      image.removeAttribute("data-src");
      image.src = fallbackImage;
      current = 0;
      track.scrollTo({ left: 0, behavior: "auto" });
    };
    const show = (index, behavior = "smooth") => {
      const direction = index < current ? -1 : 1;
      const nextIndex = availableIndex((index + images.length) % images.length, direction);
      if (nextIndex < 0) {
        showFallback();
        return;
      }
      current = nextIndex;
      loadImage(images[current]);
      track.scrollTo({ left: current * track.clientWidth, behavior });
    };
    images.forEach((image) => {
      image.addEventListener("error", () => {
        if (image.dataset.fallbackUsed) return;
        image.dataset.failed = "true";
        image.removeAttribute("src");
        if (images[current] === image) show(current + 1, "auto");
      });
    });
    show(0, "auto");
    if (images.length < 2) return;
    const previous = document.createElement("button");
    const next = document.createElement("button");
    previous.type = next.type = "button";
    previous.className = "gallery-arrow gallery-previous";
    next.className = "gallery-arrow gallery-next";
    previous.setAttribute("aria-label", "Foto anterior");
    next.setAttribute("aria-label", "Próxima foto");
    previous.textContent = "‹";
    next.textContent = "›";
    gallery.append(previous, next);
    track.addEventListener("scroll", () => {
      if (track.clientWidth) current = Math.round(track.scrollLeft / track.clientWidth);
    });
    previous.onclick = () => show(current - 1);
    next.onclick = () => show(current + 1);
    let timer = setInterval(() => show(current + 1), 4500);
    gallery.addEventListener("pointerenter", () => clearInterval(timer));
    gallery.addEventListener("pointerleave", () => {
      clearInterval(timer);
      timer = setInterval(() => show(current + 1), 4500);
    });
  });
}
function positionArticleGalleryBelowText() {
  const content = document.querySelector(".article-body > div");
  const gallery = content?.querySelector(".article-gallery");
  if (!content || !gallery) return;

  const areaLabels = new Set(["estilo-de-vida", "turismo", "gastronomia"]);
  const formattedLabel = [...content.querySelectorAll("strong, b")].find((label) =>
    areaLabels.has(normalizeSlug(label.textContent || "")),
  );
  const plainLabelBlock = [...content.children].find((block) =>
    block !== gallery && areaLabels.has(normalizeSlug(block.textContent || "")),
  );
  const linksBlock = formattedLabel?.closest("p, div") || plainLabelBlock;
  if (
    !linksBlock ||
    !(linksBlock.compareDocumentPosition(gallery) & Node.DOCUMENT_POSITION_FOLLOWING)
  ) return;

  // No texto do Cariri, a introdução e os links das áreas foram salvos no
  // mesmo parágrafo. Separa os dois para o carrossel ficar exatamente entre
  // o texto principal e os links de Estilo de Vida, Turismo e Gastronomia.
  if (
    formattedLabel &&
    linksBlock.contains(formattedLabel) &&
    linksBlock.firstChild !== formattedLabel
  ) {
    const intro = linksBlock.cloneNode(false);
    while (linksBlock.firstChild && linksBlock.firstChild !== formattedLabel) {
      intro.appendChild(linksBlock.firstChild);
    }
    while (intro.lastChild?.nodeName === "BR") intro.lastChild.remove();
    if (intro.textContent.trim()) content.insertBefore(intro, linksBlock);
  }
  content.insertBefore(gallery, linksBlock);
}
function article(p) {
  const c = categoryForPost(p);
  const articleImage = restoreImageUrl(p.articleImage || p.image || "");
  const isCaririCover = articleImage.includes("cariri-capa");
  const coverClass = isCaririCover
    ? "article-cover article-cover-full"
    : "article-cover";
  const coverMarkup = articleImage
    ? '<img class="' + coverClass + '" src="' + esc(articleImage) + '" alt="' + esc(p.imageAlt || p.title) + '">'
    : "";
  app.innerHTML =
    '<section class="page-title"><span>' +
    esc(c?.name || "Garimpando Life") +
    "</span><h1>" +
    esc(p.title) +
    "</h1><p>" +
    date(p.date) +
    '</p></section><div class="article-layout"><article class="article-body">' +
    coverMarkup +
    "<div>" +
    prepareArticleContent(p.content) +
    '</div><a class="button" href="#inicio">Voltar ao início</a></article>' +
    sidebar() +
    "</div>";
  positionArticleGalleryBelowText();
  initArticleGalleries(articleImage || "images/hero.png");
}
function publicPage(p) {
  app.innerHTML =
    '<section class="page-title"><span>Garimpando Life</span><h1>' +
    esc(p.title) +
    '</h1></section><div class="article-layout"><article class="article-body">' +
    (p.image ? '<img class="article-cover" src="' + esc(restoreImageUrl(p.image)) + '">' : "") +
    "<div>" +
    prepareArticleContent(p.content) +
    "</div></article>" +
    sidebar() +
    "</div>";
}
function contact() {
  app.innerHTML =
    '<section class="page-title"><span>Fale com a gente</span><h1>Contato</h1><p>Críticas, sugestões, parcerias e projetos especiais.</p></section><section class="contact contact-card"><div class="contact-info"><span>GARIMPANDO LIFE</span><h2>Vamos conversar?</h2><p>Empresas interessadas em ações de marketing e publicidade podem contar com nosso suporte para projetos personalizados.</p><a href="https://wa.me/5511999791784" target="_blank">WhatsApp: +55 11 99979-1784</a><a href="mailto:editorial@marcelosampaio.com">editorial@marcelosampaio.com</a></div><form id="contactForm"><div class="contact-row"><label>Nome<input name="nome" placeholder="Seu nome" required></label><label>E-mail<input name="email" type="email" placeholder="voce@email.com" required></label></div><label>Assunto<input name="assunto" placeholder="Como podemos ajudar?" required></label><label>Mensagem<textarea name="mensagem" placeholder="Escreva sua mensagem..." required></textarea></label><button>Enviar mensagem</button></form></section>';
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
function protectImages() {
  document.querySelectorAll("img").forEach((image) => {
    if (image.closest(".article-gallery")) return;
    const replaceBrokenImage = () => {
      if (image.closest(".article-body > div")) {
        image.style.display = "none";
        return;
      }
      if (image.dataset.coverTitle) replacePostCover(image);
      else if (!image.src.endsWith("/images/hero.png")) {
        image.onerror = null;
        image.src = "images/hero.png";
      }
    };
    image.addEventListener("error", replaceBrokenImage, { once: true });
    if (image.complete && image.naturalWidth === 0) replaceBrokenImage();
  });
}
function route() {
  shown = 18;
  const hash = location.hash.slice(1) || "inicio",
    parts = hash.split("/");
  if (hash === "inicio") home();
  else if (hash === "contato") contact();
  else if (hash === "colaboradores") {
    app.innerHTML = collaboratorHighlights();
  } else if (hash === "empresas") {
    companiesPage();
  } else if (parts[0] === "materia") {
    const p = posts.find((x) => x.slug === parts.slice(1).join("/")) ||
      collaboratorPosts.find((x) => x.slug === parts.slice(1).join("/"));
    p ? article(p) : home();
  } else if (parts[0] === "categoria") {
    const c = categories.find((x) => isVisibleCategory(x) && x.slug === parts.slice(1).join("/")),
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
  protectImages();
  initPartnerCarousels();
  initCompanyCarousels();
  window.scrollTo({ top: 0, behavior: "smooth" });
  requestAnimationFrame(animatePage);
}
addEventListener("hashchange", route);
async function startSite() {
  removeRepeatedPosts();
  if (publicDb) {
    app.innerHTML =
      '<section class="page-title"><span>Garimpando Life</span><h1>Carregando matérias...</h1></section>';
    await loadOnlinePosts();
  }
  renderCategoryMenu();
  route();
}
startSite();
