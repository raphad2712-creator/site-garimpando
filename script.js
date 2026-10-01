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
  "golden-night-by-palacio-tangara": "images/arquivo-original/palacio-tangara.jpg",
  "uma-viagem-pela-alma-meu-roteiro-espiritual-pela-italia": "images/italia.jpg",
  "aeromexico-celebra-seus-90-anos-com-coquetel-em-sao-paulo-no-hilton-morumbi": "images/aeromexico.jpg",
  "paz-e-bem-estar": "images/arquivo-original/paz-e-bem-estar.jpg",
  "sergipe-cultura-educacao-e-muita-tradicao": "images/sergipe.jpeg",
  "comidinhas-de-inverno": "images/arquivo-original/comidinhas.jpg",
  "norma": "images/arquivo-original/norma.jpg",
  "taboula-charme-e-gastronomia-especial": "images/arquivo-original/taboula.jpg",
  "paes-jordanianos": "images/arquivo-original/paes-jordanianos.jpg",
  "grecia-destino-dos-sonhos": "images/grecia-destino-original.jpg",
  "hotelaria-em-mikonos": "https://lh3.googleusercontent.com/d/1h4VuiOou--vcDx3CNh-0HvclFhH7wJuT=w1600",
  "hotelaria-em-santorini": "https://lh3.googleusercontent.com/d/1r_Bf6LZnC2vxfgneBZm_fRPaGduJapY5=w1600",
  "wadi-rum-um-deserto-de-tirar-o-folego": "images/arquivo-original/wadi-rum.jpg",
  "a-melhor-comida-caseira-jordaniana": "images/arquivo-original/comida-jordaniana.jpg",
  // Matérias antigas sem uma capa própria válida no WordPress. As escolhas
  // abaixo usam fotos do mesmo destino/ensaio no acervo original do Drive.
  "nos-templos-sikhs": "https://lh3.googleusercontent.com/d/1FuD8c7hnW00JBO3DFf7W5vM9cYbpgOCL=w1600",
  "um-paraiso-na-costa-de-portugal": "https://lh3.googleusercontent.com/d/1I-HnZ6rXG56xfZg4jvj0IZTgJ6HTR-sW=w1600",
  "nara-e-essencia-do-budismo": "https://lh3.googleusercontent.com/d/14Uurv-dbZcs7qykS_QqgvBUp5GFVGNXA=w1600",
  "o-veu-e-as-mulheres-no-egito-atual": "https://lh3.googleusercontent.com/d/1WX9S96knuD8c0-oOwLiEcdxT8llUcczq=w1600",
  "no-vale-sagrado": "https://lh3.googleusercontent.com/d/1LRfQ85-Bz5yEvg_wEeEjo2xU05pFprI1=w1600",
  "na-cidade-2": "https://lh3.googleusercontent.com/d/1ITOOZ0Mcz6khBq9XLIcyKfcP3aSuCzsA=w1600",
  "nos-campos-vales-e-montanhas": "https://lh3.googleusercontent.com/d/1OvTVpVi6gb9d7I1gD_56EZZl4n79djqI=w1600",
  "comidas-nas-cidades": "https://lh3.googleusercontent.com/d/19RGuWEd7FINqc_OTgVZhMWlMCgf1_F5j=w1600",
  "mexico-entre-o-ceu-e-o-mar": "https://lh3.googleusercontent.com/d/1fy0kqGxST-0oSvX0Pmtd1D5ewg5Klyxa=w1600",
  "a-eterna-e-bela-sicilia": "https://lh3.googleusercontent.com/d/1J1IWhzvU-GIqcn7MNPCAyfAseUcPid-F=w1600",
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
function linkedPostFromUrl(url) {
  const value = String(url || "").trim();
  if (!value || value.startsWith("#")) return null;
  let parsed;
  try {
    parsed = new URL(value, location.href);
  } catch (error) {
    return null;
  }
  if (!/(^|\.)garimpandolife\.com\.br$/i.test(parsed.hostname)) return null;
  const segments = decodeURIComponent(parsed.pathname)
    .replace(/\(abrir em uma nova aba\)/gi, "")
    .split("/")
    .filter(Boolean);
  const slug = normalizeSlug(segments.at(-1) || "");
  return posts.find((post) => post.slug === slug) || null;
}
function prepareArticleContent(html, currentPost = null) {
  const template = document.createElement("template");
  template.innerHTML = String(html || "");

  const relatedPosts = [];
  const relatedSlugs = new Set();
  template.content.querySelectorAll("a[href]").forEach((link) => {
    const related = linkedPostFromUrl(link.getAttribute("href"));
    if (!related) return;
    link.setAttribute("href", `#materia/${related.slug}`);
    link.removeAttribute("target");
    link.removeAttribute("rel");
    if (related.slug !== currentPost?.slug && !relatedSlugs.has(related.slug)) {
      relatedSlugs.add(related.slug);
      relatedPosts.push(related);
    }
  });

  let gallery = template.content.querySelector(".article-gallery");
  if (!gallery) {
    const galleryPhotos = [];
    const usedPhotos = new Set();
    const addPhoto = (source, alt) => {
      const restored = restoreImageUrl(source);
      if (!restored || usedPhotos.has(restored)) return false;
      usedPhotos.add(restored);
      galleryPhotos.push({ source: restored, alt: alt || currentPost?.title || "Foto da matéria" });
      return true;
    };

    [...template.content.querySelectorAll("img")].forEach((image) => {
      if (image.closest('a[href*="#materia/"]')) return;
      const source = image.getAttribute("data-src") || image.getAttribute("src") || "";
      if (/(?:banner|logo|selo|publicidade|advert)/i.test(source)) return;
      if (addPhoto(source, image.getAttribute("alt"))) image.remove();
    });

    if (galleryPhotos.length < 2 && relatedPosts.length > 1) {
      galleryPhotos.length = 0;
      usedPhotos.clear();
      relatedPosts.forEach((post) => addPhoto(postCover(post), post.title));
    }

    if (galleryPhotos.length > 1) {
      gallery = document.createElement("section");
      gallery.className = "article-gallery";
      gallery.setAttribute("aria-label", "Galeria de fotos da matéria");
      galleryPhotos.forEach((photo) => {
        const image = document.createElement("img");
        image.setAttribute("src", photo.source);
        image.setAttribute("alt", photo.alt);
        gallery.appendChild(image);
      });
      template.content.appendChild(gallery);
      [...template.content.querySelectorAll("figure, p, td, tr, tbody, table")].reverse().forEach((element) => {
        if (!element.textContent.trim() && !element.querySelector("img, video, iframe")) element.remove();
      });
    }
  }

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
  "village-barra-um-hotel-encantador-para-a-familia": "images/garimpos-restauradas/village-barra.png",
};
// O backup antigo associa esta matéria à foto de outro artigo. Como não há
// nenhuma foto do Ladera/Andes no acervo, a capa editorial com o próprio
// título é mais correta do que publicar uma pessoa ou um destino errado.
const neutralCoverSlugs = new Set([
  "ano-novo-hotel-prepara-festa-em-rooftop-com-vista-para-a-cordilheira-dos-andes",
]);
const travelCoverBySlug = {
  "jordania-apaixonante-jordania": "https://res.cloudinary.com/startup-grind/image/fetch/c_scale%2Cw_2560/c_crop%2Ch_650%2Cw_2560%2Cy_0.41_mul_h_sub_0.41_mul_650/c_crop%2Ch_650%2Cw_2560/c_fill%2Cdpr_2.0%2Cf_auto%2Cg_center%2Cq_auto%3Agood/https%3A/res.cloudinary.com/startup-grind/image/upload/c_fill%2Cdpr_2.0%2Cf_auto%2Cg_center%2Cq_auto%3Agood/v1/gcs/platform-data-startupgrind/chapter_banners/22861395_1623315001061887_8517170722413525260_o%2520%25281%2529_Hd5zIfa.jpg",
  "petra-magnifica": "images/petra-magnifica-v3.jpg",
  "colombia-colorida-e-magica": "https://lp-cms-production.imgix.net/2023-03/colombia-shutterstock_617151572-rfc.jpeg?auto=format%2Ccompress&fit=crop&q=72",
  "grecia-destino-dos-sonhos": "images/grecia-destino-original.jpg",
  "chapada-diamantina-um-encontro-com-a-mais-poetica-das-regioes-brasileiras": "https://cdn.audleytravel.com/1060/756/60/1340177-chapada-diamantina-national-park.jpg",
  "lindo-e-delicioso-hotel-de-lencois": "https://www.journeylatinamerica.com/app/uploads/hotels-boats/brazil/salvador-da-bahia-and-the-chapada-diamantina/hotel-de-lencois/bra_salvador_hoteldelencois-2-1024x680-c-center.jpg",
  "uvva-orgullho-baiano-da-chapada-diamantina": "https://aloalobahia.com/images/p/vinicolcaresteuvaas_alo_alo_bahia.jpg",
  "refugio-na-serra-surpreende-em-todos-os-cantos": "https://www.veloso.com/media/qbsdwjks/hotel-01.jpg?anchor=%27center%27&format=jpg&height=630&mode=crop&width=1200",
  "sabores-especiais-de-lencois": "https://www.chapadaadventure.com.br/wp-content/uploads/2025/03/gastronomia-chapada-diamantina-11.jpg",
  "um-icone-gastronomico-em-olinda": "https://imagens.ne10.uol.com.br/veiculos/_midias/jpg/2024/12/04/salao_climatizado_gabriele_lima__1_-33275157.jpg",
  "meus-preferidos-restaurantes-de-recife": "https://cdn.folhape.com.br/img/c/1200/900/dn_arquivo/2023/11/leite-1-1.jpg",
  "pernambuco-destino-de-luz-arte-e-gastronomia": "https://a.cdn-hotels.com/gdcs/production173/d1802/a586e63e-779b-49fc-86a3-0eff604edeef.jpg",
  "alagoas-caribe-brasileiro": "https://ondeir360.com.br/wp-content/uploads/2022/07/praia-de-maragogi01-820x1024.jpg",
  "russia-exuberante-e-encantadora": "https://cdn.tripster.ru/photos/44177688-78bd-4a0d-92f6-06ffd497b3f6.jpg",
  "sao-francisco-cultura-e-diversao": "https://a0.muscache.com/im/pictures/Mt/MtTemplate-6067337/original/bd8be29f-2ff7-4c85-af94-17ec0030fb8f.jpeg?im_w=720",
  "o-paraiso-alter-do-chao-para": "https://uploads.diariodopara.com.br/2025/10/WhatsApp-Image-2025-10-16-at-16.27.18-984x553.jpeg",
  "o-melhor-do-verao-em-portugal": "https://famango.de/assets/img/camp/1046/urlaub-mit-kindern-europa-strand-portugal.jpg",
  "roma-em-familia": "https://media1.thrillophilia.com/filestore/5qlj2d6vo6w6rqytqidvvkgwi3og_shutterstock_2239747461.jpg",
  "de-barco-no-coracao-da-amazonia": "https://artprintcave.hu/images/tapet/ft-nw-40954972/2/l/fototapeta-amazonas-folyó-dzsungel-fak.jpg",
  "a-magia-de-rapa-nui-em-familia": "https://i0.wp.com/www.toonsarah-travels.blog/wp-content/uploads/2020/10/12-59-Rapa-Nui-2016-Tongariki-for-feature.jpg?fit=1166%2C812&ssl=1",
  "mexico-entre-o-ceu-e-o-mar": "https://www.budgetyourtrip.com/blog/wp-content/uploads/2020/07/beach-2441199-scaled.jpg",
  "india-um-novo-olhar-sobre-o-mundo": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Taj_Mahal%2C_Agra%2C_India_edit2.jpg/1280px-Taj_Mahal%2C_Agra%2C_India_edit2.jpg",
  "peru-experiencias-sem-fim": "https://www.intrepidtravel.com/v3/assets/blt0de87ff52d9c34a8/blteb7ce82977c15f0b/67be345072be043efd6b1706/Intrepid-Travel-Peru-Aguas-Calientes-Machu-Picchu-lookout-leader-Interaction-570334.jpg?branch=prd",
  "peru-um-mistico-encanto": "https://cdn.kimkim.com/files/a/images/20c38be0d29bd041df07edcc1a2a0476e38a56c7/big-f897bc98b7dd767c9db19eab6c1e2685.jpg",
  "canada-o-pais-que-sorri-para-todos": "https://www.yonder.fr/sites/default/files/contenu/news/visuel-voyage-au-canada-5-activites-a-decouvrir-en-famille.jpg",
  "guatemala-seus-misterios-e-sua-historia": "https://ssl.tzoo-img.com/images/tzoo.103677.0.1346888.LakeAtitlan_Guatemala_iStock-870585478.jpg?width=1080",
  "no-coracao-da-amazonia": "https://img.rezdy.com/PRODUCT_IMAGE/149616/Amazon_clipper_lg.jpg",
  "a-historia-e-o-sol-de-uma-jamaica": "https://static.independent.co.uk/2024/09/06/11/Sandals-South-Coast-Beach.jpg?fit=crop&height=900&width=1200",
  "marrocos-o-pais-das-mil-e-uma-noites": "https://www.christophorus.at/app/uploads/2020/02/kamel-expedition-marokko-marrakesch-1024x576.jpg",
  "africa-do-sul-e-mauritius-em-familia": "https://img.wiki.ac.mu/images/2026/04/family-enjoying-a-peaceful-walk-along-a-mauritius-beach-at-sunset.jpg",
  "japao-elegante-pais-do-sol-nascente": "https://images.moneycontrol.com/static-mcnews/2023/09/Mount-Fuji-is-covered-in-snow-half-the-year-Photo-Credit-Hannes-via-Wikimedia-Commons.jpg?height=900&impolicy=website&width=1600",
  "a-eterna-e-bela-sicilia": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Aerial_image_of_the_coast_of_Taormina_%28view_from_the_southeast%29.jpg/2560px-Aerial_image_of_the_coast_of_Taormina_%28view_from_the_southeast%29.jpg",
  "parana-uma-terra-de-tradicoes": "https://www.parana.pr.gov.br/sites/default/arquivos_restritos/files/imagem/2024-12/creditos_lucas_franco_viaje_pr_13.jpg",
  "bahia-de-charme-parte-2": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/17/43/ac/8f/pelourinho.jpg?h=-1&s=1&w=1800",
  "bahia-de-charme-parte-1": "https://a.cdn-hotels.com/gdcs/production171/d1145/f5143983-05bb-450c-bea1-9f14b8bb3b96.jpg",
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
  const isTravel = post.categories?.includes(313);
  const isParty = post.categories?.includes(312);
  if (localCoverBySlug[post.slug]) post.image = localCoverBySlug[post.slug];
  // Em Viagens, várias capas do backup antigo eram apenas logos ou banners
  // pequenos. As fotos de destino revisadas têm prioridade para evitar
  // pixelização e recortes sem sentido na listagem.
  else if (isTravel && travelCoverBySlug[post.slug]) post.image = travelCoverBySlug[post.slug];
  // O arquivo do WordPress agora foi reconstruído diretamente a partir da
  // pasta uploads do Drive. A foto original da própria matéria tem prioridade.
  else if (archiveGarimpoCoverBySlug[post.slug]) post.image = archiveGarimpoCoverBySlug[post.slug];
  else if (isParty && partyCoverBySlug[post.slug]) post.image = partyCoverBySlug[post.slug];
  else if (garimpoCoverBySlug[post.slug]) post.image = garimpoCoverBySlug[post.slug];
  else if (!post.image && partyCoverBySlug[post.slug]) post.image = partyCoverBySlug[post.slug];
  else if (!post.image && travelCoverBySlug[post.slug]) post.image = travelCoverBySlug[post.slug];
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
      image:
        correction?.image ||
        localCoverBySlug[p.slug] ||
        (resolvedCategory?.slug === "viagem" ? travelCoverBySlug[p.slug] : "") ||
        (resolvedCategory?.slug === "festas" ? partyCoverBySlug[p.slug] : "") ||
        p.image_url ||
        archiveGarimpoCoverBySlug[p.slug] ||
        garimpoCoverBySlug[p.slug] ||
        partyCoverBySlug[p.slug] ||
        travelCoverBySlug[p.slug] ||
        "",
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
const localCoverPools = {
  309: ["images/sergipe.jpeg", "images/petra-magnifica-v3.jpg", "images/wadi-rum.jpg"],
  310: ["images/bemestar.jpg", "images/norma-teatro.jpg", "images/sobre.jpg"],
  311: ["images/arquivo-original/comidinhas.jpg", "images/arquivo-original/taboula.jpg", "images/arquivo-original/comida-jordaniana.jpg"],
  312: ["images/norma-teatro.jpg", "images/sobre.jpg", "images/hero.png"],
  313: ["images/petra-magnifica-v3.jpg", "images/sergipe.jpeg", "images/wadi-rum.jpg"],
  330: [
    "images/arquivo-original/comidinhas.jpg", "images/arquivo-original/taboula.jpg", "images/arquivo-original/comida-jordaniana.jpg",
    "images/arquivo-original/paes-jordanianos.jpg", "images/bemestar.jpg", "images/norma-teatro.jpg",
    "images/sergipe.jpeg", "images/petra-magnifica-v3.jpg", "images/wadi-rum.jpg",
    "images/sobre.jpg", "images/unique.jpg", "images/arquivo-original/palacio-tangara.jpg",
    "images/garimpos-restauradas/village-barra.png", "images/garimpos-restauradas/sunset-a-beira-mar.jpg",
    "images/grecia-destino-original.jpg", "images/italia.jpg", "images/cariri-capa-single.jpg",
    "images/aeromexico.jpg", "images/arquivo-original/paz-e-bem-estar.jpg",
  ],
};
const garimpoTopicPhotos = {
  food: ["images/arquivo-original/taboula.jpg", "images/arquivo-original/comidinhas.jpg", "images/arquivo-original/comida-jordaniana.jpg", "images/arquivo-original/paes-jordanianos.jpg", "images/garimpos-restauradas/village-barra.png"],
  hotel: ["images/unique.jpg", "images/arquivo-original/palacio-tangara.jpg", "images/arquivo-original/paz-e-bem-estar.jpg"],
  culture: ["images/norma-teatro.jpg", "images/cariri-capa-single.jpg", "images/sergipe.jpeg"],
};
let assignedGarimpoCovers;
let assignedGarimpoCount = -1;
let assignedGarimpoFirst = "";
function garimpoFallbacks() {
  // A ordem editorial define as escolhas: a mesma matéria mantém sua capa em todas as telas.
  if (assignedGarimpoCovers && assignedGarimpoCount === posts.length && assignedGarimpoFirst === posts[0]?.slug) {
    return assignedGarimpoCovers;
  }
  const assignments = new Map();
  const lastUsed = new Map();
  const garimpos = posts.filter((item) => item.categories?.includes(330));
  const fixedPhoto = (item) => localCoverBySlug[item.slug] ||
    (String(item.image || "").startsWith("images/") ? item.image : "");
  garimpos.forEach((item, position) => {
    const fixed = fixedPhoto(item);
    if (fixed) {
      assignments.set(item.slug, fixed);
      lastUsed.set(fixed, position);
      return;
    }
    const topic = `${item.slug || ""} ${item.title || ""}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const preferred = /tempero|comida|cozinha|restaurante|gastronomia|sabor|culinaria|prato|vinho/.test(topic)
      ? garimpoTopicPhotos.food
      : /hotel|resort|radisson|intercontinental|palacio tangara|live aqua|coral beach|hospedagem|pousada|cancun/.test(topic)
        ? garimpoTopicPhotos.hotel
        : /teatro|espetaculo|musical|show|concerto|festival/.test(topic)
          ? garimpoTopicPhotos.culture : [];
    const candidates = preferred.length ? preferred : localCoverPools[330];
    // Se a seleção temática já foi usada recentemente, prefere uma foto diferente.
    const upcoming = new Set(garimpos.slice(position + 1, position + 13).map(fixedPhoto).filter(Boolean));
    const available = candidates.filter((image) => position - (lastUsed.get(image) ?? -999) > 12 && !upcoming.has(image));
    const thematicAvailable = preferred.filter((image) => available.includes(image));
    const chosen = (available.length ? available : candidates)
      .filter((image) => !thematicAvailable.length || thematicAvailable.includes(image))
      .reduce((best, image) => (lastUsed.get(image) ?? -999) < (lastUsed.get(best) ?? -999) ? image : best);
    assignments.set(item.slug, chosen);
    lastUsed.set(chosen, position);
  });
  assignedGarimpoCovers = assignments;
  assignedGarimpoCount = posts.length;
  assignedGarimpoFirst = posts[0]?.slug;
  return assignments;
}
function postCoverFallback(post) {
  const category = categories.find((item) => post?.categories?.includes(item.id));
  return postCoverPlaceholder(
    post?.title || "Garimpando Life",
    category?.name || post?.categoryName || "Matéria",
  );
}
function postCover(post) {
  if (neutralCoverSlugs.has(post?.slug)) return postCoverFallback(post);
  const source = restoreImageUrl(post?.image || firstArticleImage(post) || "");
  // Mantém a imagem original da própria matéria. Se ela falhar, o onerror usa
  // uma capa neutra exclusiva com o título, sem reciclar fotos de outros temas.
  return source || postCoverFallback(post);
}
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
  if (image.dataset.coverFallback && image.dataset.localFallbackUsed !== "true") {
    image.dataset.localFallbackUsed = "true";
    image.src = image.dataset.coverFallback;
    return;
  }
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
            `<a class="mega-card" href="#materia/${post.slug}"><img src="${esc(postCover(post) || postCoverPlaceholder(post.title, category.name))}" data-cover-fallback="${esc(postCoverFallback(post))}" data-cover-title="${esc(post.title)}" data-cover-category="${esc(category.name)}" alt="${esc(post.title)}" onerror="replacePostCover(this)"><strong>${esc(post.title)}</strong></a>`,
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
      cards = [...track.querySelectorAll(".company-card")];
    if (!cards.length) return;
    if (window.matchMedia("(max-width: 900px), (pointer: coarse)").matches) {
      carousel.classList.add("companies-carousel-single");
      let mobileCurrent = 0;
      let mobileTimer;
      let touchStartX = 0;
      const showMobile = (index) => {
        mobileCurrent = (index + cards.length) % cards.length;
        cards.forEach((card, cardIndex) => {
          const active = cardIndex === mobileCurrent;
          card.classList.toggle("company-active", active);
          card.setAttribute("aria-hidden", String(!active));
          if (active) card.removeAttribute("tabindex");
          else card.tabIndex = -1;
        });
      };
      const stopMobileTimer = () => clearInterval(mobileTimer);
      const startMobileTimer = () => {
        stopMobileTimer();
        mobileTimer = setInterval(() => showMobile(mobileCurrent + 1), 4200);
      };
      previous.onclick = () => {
        showMobile(mobileCurrent - 1);
        startMobileTimer();
      };
      next.onclick = () => {
        showMobile(mobileCurrent + 1);
        startMobileTimer();
      };
      track.addEventListener("touchstart", (event) => {
        touchStartX = event.changedTouches[0]?.clientX || 0;
        stopMobileTimer();
      }, { passive: true });
      track.addEventListener("touchend", (event) => {
        const distance = (event.changedTouches[0]?.clientX || touchStartX) - touchStartX;
        if (Math.abs(distance) > 35) showMobile(mobileCurrent + (distance < 0 ? 1 : -1));
        startMobileTimer();
      }, { passive: true });
      carousel.addEventListener("pointerenter", stopMobileTimer);
      carousel.addEventListener("pointerleave", startMobileTimer);
      showMobile(0);
      startMobileTimer();
      return;
    }
    let current = 0;
    const nearestCard = () => {
      const center = track.scrollLeft + track.clientWidth / 2;
      return cards.reduce((best, card, index) => {
        const cardCenter = card.offsetLeft - track.offsetLeft + card.offsetWidth / 2;
        const distance = Math.abs(cardCenter - center);
        return distance < best.distance ? { index, distance } : best;
      }, { index: 0, distance: Infinity }).index;
    };
    const positionFor = (index) => {
      const card = cards[index];
      const centered = card.offsetLeft - track.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;
      const limit = Math.max(0, track.scrollWidth - track.clientWidth);
      return Math.max(0, Math.min(centered, limit));
    };
    const show = (index, behavior = "smooth") => {
      current = (index + cards.length) % cards.length;
      track.scrollTo({ left: positionFor(current), behavior });
    };
    previous.onclick = () => show(nearestCard() - 1);
    next.onclick = () => show(nearestCard() + 1);
    let timer;
    let settleTimer;
    const stopTimer = () => clearInterval(timer);
    const startTimer = () => {
      clearInterval(timer);
      timer = setInterval(() => show(nearestCard() + 1), 4200);
    };
    const settleOnCard = () => {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        const nearest = nearestCard();
        current = nearest;
        if (Math.abs(track.scrollLeft - positionFor(nearest)) > 1) show(nearest);
      }, 160);
    };
    track.addEventListener("scroll", settleOnCard, { passive: true });
    track.addEventListener("pointerdown", stopTimer, { passive: true });
    track.addEventListener("pointerup", () => {
      settleOnCard();
      startTimer();
    }, { passive: true });
    track.addEventListener("touchend", settleOnCard, { passive: true });
    carousel.addEventListener("pointerenter", stopTimer);
    carousel.addEventListener("pointerleave", startTimer);
    window.addEventListener("resize", () => show(nearestCard(), "auto"), { passive: true });
    startTimer();
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
          '" data-cover-slug="' +
          esc(p.slug) +
          '" data-cover-title="' +
          esc(p.title) +
          '" data-cover-fallback="' +
          esc(postCoverFallback(p)) +
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
  const sortedPosts = [...posts].sort(
    (first, second) => new Date(second.date) - new Date(first.date),
  );
  const latestTravelPost = sortedPosts.find(
    (post) => categoryForPost(post)?.slug === "viagem",
  );
  const featuredPost =
    latestTravelPost ||
    sortedPosts.find((post) => post.isFeatured) ||
    sortedPosts[0];
  const garimposCategory = categories.find(
    (category) => category.slug === "ultimos-garimpos",
  );
  const latestPosts = garimposCategory
    ? sortedPosts
      .filter(
        (post) =>
          post !== featuredPost && belongsToCategory(post, garimposCategory),
      )
      .slice(0, 4)
    : [];
  const featuredCategory = featuredPost ? categoryForPost(featuredPost) : null;
  const featuredImage = featuredPost
    ? postCover(featuredPost) ||
      postCoverPlaceholder(featuredPost.title, featuredCategory?.name)
    : "images/hero.png";
  app.innerHTML =
    (featuredPost
      ? `<section class="hero hero-single"><a class="hero-link" href="#materia/${featuredPost.slug}"><img src="${esc(featuredImage)}" data-cover-fallback="${esc(postCoverFallback(featuredPost))}" data-cover-title="${esc(featuredPost.title)}" data-cover-category="${esc(featuredCategory?.name || "Matéria")}" alt="${esc(featuredPost.imageAlt || featuredPost.title)}" onerror="replacePostCover(this)"><div><p><span>${esc(featuredCategory?.name || "Garimpando Life")}</span></p><h1>${esc(featuredPost.title)}</h1></div></a></section>`
      : "") +
    '<section class="icons" aria-label="Áreas do site"><a href="#categoria/viagem"><b><svg viewBox="0 0 48 48" aria-hidden="true"><path d="m43 22-16-9V5c0-2-1-4-3-4s-3 2-3 4v8L5 22v5l16-5v11l-6 4v4l9-3 9 3v-4l-6-4V22l16 5v-5Z"/></svg></b><span>Viagens</span></a><a href="#categoria/ultimos-garimpos"><b><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M9 17 16 7h16l7 10-15 23L9 17Z"/><path d="m9 17 15 23 15-23M16 7l8 33 8-33M9 17h30"/></svg></b><span>Garimpos</span></a><a href="#colaboradores"><b><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="18" cy="16" r="7"/><circle cx="34" cy="18" r="5"/><path d="M5 40c0-8 5-13 13-13s13 5 13 13M29 29c2-2 4-3 7-3 5 0 8 4 8 10"/></svg></b><span>Colaboradores</span></a><a href="#produtos"><b><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M7 17 24 7l17 10-17 10L7 17Z"/><path d="M7 17v18l17 10 17-10V17M24 27v18"/></svg></b><span>Produtos</span></a></section>' +
    '<section class="home-latest"><div class="home-section-title"><span>Novidades</span><h2>Últimas matérias</h2><p>Confira os conteúdos mais recentes da categoria Garimpos.</p></div><div class="latest-grid">' +
    latestPosts.map((post) => {
      const category = garimposCategory || categoryForPost(post);
      return `<article><a class="latest-photo" href="#materia/${post.slug}"><img loading="lazy" src="${esc(postCover(post) || postCoverPlaceholder(post.title, category?.name))}" data-cover-fallback="${esc(postCoverFallback(post))}" data-cover-title="${esc(post.title)}" data-cover-category="${esc(category?.name || "Matéria")}" alt="${esc(post.imageAlt || post.title)}" onerror="replacePostCover(this)"></a><div><a class="category" href="#categoria/${category?.slug || "ultimos-garimpos"}">${esc(category?.name || "Garimpando Life")}</a><h3><a href="#materia/${post.slug}">${esc(post.title)}</a></h3><small>${date(post.date)}</small><a class="more" href="#materia/${post.slug}">Leia mais →</a></div></article>`;
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

  const areaLabels = new Set(["viagens", "turismo", "gastronomia", "estilo-de-vida"]);
  const labelPattern = /(?:^|\s)(?:viagens|turismo|gastronomia|estilo\s+de\s+vida)\s*:/i;
  const matterLinkSelector = 'a[href*="#materia/"]';
  const blocksBeforeGallery = [];
  for (let block = content.firstElementChild; block && block !== gallery; block = block.nextElementSibling) {
    blocksBeforeGallery.push(block);
  }

  const navigationBlocks = [];
  const alreadyMoved = new Set();
  blocksBeforeGallery.forEach((block) => {
    const firstLink = block.querySelector(matterLinkSelector);
    if (!firstLink || alreadyMoved.has(block)) return;

    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    let labelNode = null;
    let labelMatch = null;
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const match = String(node.textContent || "").match(labelPattern);
      const linkComesAfter =
        node === firstLink ||
        Boolean(node.compareDocumentPosition(firstLink) & Node.DOCUMENT_POSITION_FOLLOWING);
      if (match && linkComesAfter) {
        labelNode = node;
        labelMatch = match;
        break;
      }
    }

    if (labelNode && labelMatch) {
      if (labelMatch.index > 0) labelNode = labelNode.splitText(labelMatch.index);
      let startNode = labelNode;
      const parent = labelNode.parentElement;
      if (
        parent?.matches("strong, b") &&
        parent.textContent.trim() === labelNode.textContent.trim()
      ) startNode = parent;

      const navigation = block.cloneNode(false);
      const range = document.createRange();
      range.setStartBefore(startNode);
      range.setEndAfter(block.lastChild);
      navigation.appendChild(range.extractContents());
      while (block.lastChild?.nodeName === "BR") block.lastChild.remove();
      if (!block.textContent.trim() && !block.querySelector("img, video, iframe")) block.remove();
      navigationBlocks.push(navigation);
      return;
    }

    const previous = block.previousElementSibling;
    if (
      previous &&
      previous !== gallery &&
      !alreadyMoved.has(previous) &&
      areaLabels.has(normalizeSlug(previous.textContent || ""))
    ) {
      alreadyMoved.add(previous);
      navigationBlocks.push(previous);
    }
    alreadyMoved.add(block);
    navigationBlocks.push(block);
  });

  if (!navigationBlocks.length) return;

  const insertionPoint = gallery.nextSibling;
  navigationBlocks.forEach((block) => content.insertBefore(block, insertionPoint));
}
function article(p) {
  const c = categoryForPost(p);
  const articleImage = p.articleImage
    ? restoreImageUrl(p.articleImage)
    : postCover(p);
  const isCaririCover = articleImage.includes("cariri-capa");
  const coverClass = isCaririCover
    ? "article-cover article-cover-full"
    : "article-cover";
  const coverMarkup =
    '<img class="' + coverClass + '" src="' + esc(articleImage || postCoverFallback(p)) +
    '" data-cover-fallback="' + esc(postCoverFallback(p)) +
    '" data-cover-title="' + esc(p.title) +
    '" data-cover-category="' + esc(c?.name || "Matéria") +
    '" alt="' + esc(p.imageAlt || p.title) + '" onerror="replacePostCover(this)">';
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
    prepareArticleContent(p.content, p) +
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
    prepareArticleContent(p.content, p) +
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
    // Capas já têm onerror próprio. Registrar outro handler aqui fazia a foto
    // local ser trocada pela arte com texto antes de terminar de carregar.
    if (image.dataset.coverTitle) return;
    const replaceBrokenImage = () => {
      if (image.closest(".article-body > div")) {
        image.style.display = "none";
        return;
      }
      if (!image.src.endsWith("/images/hero.png")) {
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
