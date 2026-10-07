const cfg = window.GARIMPANDO_SUPABASE || {},
  configured =
    cfg.url?.startsWith("https://") &&
    !cfg.url.includes("COLE_AQUI") &&
    cfg.anonKey &&
    !cfg.anonKey.includes("COLE_AQUI");
const db = configured
    ? window.supabase.createClient(cfg.url, cfg.anonKey)
    : null,
  form = document.querySelector("#postForm"),
  editor = document.querySelector("#editor"),
  list = document.querySelector("#postList");
let selectedImage = null,
  selectedGalleryFiles = [],
  currentGalleryUrls = [],
  currentImage = "",
  brandItems = [],
  brandSettingsId = null,
  editingLegacySlug = "";
const $ = (s) => document.querySelector(s),
  esc = (s) =>
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
    ),
  slugify = (s) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
const toast = (message) => {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2800);
};
const hiddenCategorySlugs = new Set([
  "pedro-mariano",
  "adolfo-stulman",
  "prosperidade-por-marcelo-e-cesario",
  "joka-finardi",
  "laura-wie",
  "silvia-percussi",
  "gabi-goulart",
]);
const defaultPartnerBrands = [
  { name: "Beeva Brazil", image: "images/parceiro-beeva.png", url: "https://www.beevabrazil.com/" },
  { name: "Pedras do Patacho", image: "images/parceiro-pedras.png", url: "https://www.pedrasdopatacho.com.br/" },
  { name: "Oceanic", image: "images/parceiro-oceanic.jpg", url: "https://www.oceanic.com.br/" },
  { name: "Entreposto", image: "images/parceiro-entreposto.jpg", url: "https://www.entreposto.com.br/" },
  { name: "Dona Deôla", image: "https://www.google.com/s2/favicons?domain_url=https://donadeola.com.br&sz=256", url: "https://www.donadeola.com.br/" },
  { name: "Ótica Brasolin", image: "https://www.google.com/s2/favicons?domain_url=https://brasolin.com.br&sz=256", url: "https://www.brasolin.com.br/" },
  { name: "Diasi Massas Artesanais", image: "images/logo-diasi.png", url: "https://diasimassasartesanais.com.br/" },
  { name: "Kangaroo Brasil", image: "images/logo-kangaroo.png", url: "https://www.kangaroo.com.br/" },
  { name: "Mister Travel", image: "images/logo-mister-travel.png", url: "https://www.mistertravel.com.br/" },
  { name: "UNIT", image: "https://www.google.com/s2/favicons?domain_url=https://unit.br&sz=256", url: "https://www.unit.br/" },
  { name: "GNC Suécia Salvador", image: "https://www.google.com/s2/favicons?domain_url=https://gncsuecia.com.br&sz=256", url: "https://www.gncsuecia.com.br/" },
  { name: "Sais Beach Hotel Maceió", image: "https://www.google.com/s2/favicons?domain_url=https://saishotel.com.br&sz=256", url: "https://www.saishotel.com.br/" },
  { name: "Ricardo Almeida", image: "images/logo-ricardo-almeida.png", url: "https://www.ricardoalmeida.com.br/" },
  { name: "Sococo", image: "https://www.google.com/s2/favicons?domain_url=https://sococo.com.br&sz=256", url: "https://www.sococo.com.br/" },
  { name: "Jacques Janine Granja Viana", image: "https://www.google.com/s2/favicons?domain_url=https://jacquesjanine.com.br&sz=256", url: "https://jacquesjanine.com.br/unidade/granja-viana/" },
  { name: "àMesa Gastronomia", image: "images/parceiro-a-mesa-gastronomia.jpg", url: "https://www.instagram.com/amesa.gastronomia/" },
  { name: "Hyundai", image: "images/parceiro-hyundai.webp", url: "https://www.hyundai.com.br/" },
];
const categories = (window.GARIMPANDO_CONTENT?.categories || []).filter(
  (c) => c.count > 0 && c.slug !== "destaques" && !hiddenCategorySlugs.has(c.slug),
);
$("#category").innerHTML = categories
  .map((c) => `<option value="${c.id}">${c.name}</option>`)
  .join("");
function updateCategoryDestination() {
  const category = categories.find(
    (c) => c.id === Number($("#category").value),
  );
  $("#categoryDestination").textContent = category
    ? `Esta matéria aparecerá em Blog → ${category.name}.`
    : "Escolha onde a matéria deve aparecer no site.";
}
$("#category").addEventListener("change", updateCategoryDestination);
updateCategoryDestination();
$("#date").value = new Date().toISOString().slice(0, 10);
function lock() {
  document.body.classList.add("locked");
  $("#loginGate").classList.remove("hidden");
}
function unlock() {
  document.body.classList.remove("locked");
  $("#loginGate").classList.add("hidden");
}
async function start() {
  if (!configured) {
    $("#loginError").textContent =
      "Configure o arquivo supabase-config.js antes de entrar.";
    return;
  }
  const { data } = await db.auth.getSession();
  data.session ? unlock() : lock();
}
$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!configured) return;
  const button = e.submitter,
    error = $("#loginError");
  button.disabled = true;
  button.textContent = "Entrando...";
  const { error: authError } = await db.auth.signInWithPassword({
    email: $("#adminEmail").value.trim(),
    password: $("#adminPassword").value,
  });
  button.disabled = false;
  button.textContent = "Entrar no painel";
  if (authError) {
    error.textContent = "E-mail ou senha incorretos.";
    return;
  }
  error.textContent = "";
  $("#adminPassword").value = "";
  unlock();
  toast("Acesso autorizado");
});
$("#logoutBtn").addEventListener("click", async () => {
  await db?.auth.signOut();
  location.reload();
});
function reset() {
  form.reset();
  $("#body").innerHTML = "";
  $("#postId").value = "";
  editingLegacySlug = "";
  $("#date").value = new Date().toISOString().slice(0, 10);
  selectedImage = null;
  selectedGalleryFiles = [];
  currentGalleryUrls = [];
  currentImage = "";
  $("#imagePreview").innerHTML = "<span>Nenhuma imagem selecionada</span>";
  renderGalleryPreview();
  $("#editorTitle").textContent = "Nova matéria";
  $("#saveState").textContent = "Não salva";
  $("#excerptCount").textContent = "0";
  $("#featured").checked = false;
  updateCategoryDestination();
  editor.classList.remove("hidden");
  list.classList.add("hidden");
  $("#brandEditor").classList.add("hidden");
}
function previewImage(src) {
  currentImage = src || "";
  $("#imagePreview").innerHTML = src
    ? `<img src="${esc(src)}" alt="Prévia">`
    : "<span>Nenhuma imagem selecionada</span>";
}
$("#imageUrl").addEventListener("change", (e) => {
  selectedImage = null;
  previewImage(e.target.value);
});
$("#imageFile").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    toast("Escolha uma imagem menor que 5 MB");
    e.target.value = "";
    return;
  }
  selectedImage = file;
  previewImage(URL.createObjectURL(file));
  toast("Imagem pronta para enviar");
});
function renderGalleryPreview() {
  const saved = currentGalleryUrls.map((url, index) =>
    `<div class="gallery-thumb"><img src="${esc(url)}" alt="Foto adicional"><button class="remove-photo" type="button" data-remove-saved="${index}" aria-label="Remover foto">×</button></div>`,
  );
  const selected = selectedGalleryFiles.map((item, index) =>
    `<div class="gallery-thumb"><img src="${item.preview}" alt="Nova foto"><button class="remove-photo" type="button" data-remove-new="${index}" aria-label="Remover foto">×</button></div>`,
  );
  $("#galleryPreview").innerHTML = saved.length || selected.length
    ? saved.concat(selected).join("")
    : "<span>Nenhuma foto escolhida</span>";
  document.querySelectorAll("[data-remove-saved]").forEach((button) => {
    button.onclick = () => {
      currentGalleryUrls.splice(Number(button.dataset.removeSaved), 1);
      renderGalleryPreview();
    };
  });
  document.querySelectorAll("[data-remove-new]").forEach((button) => {
    button.onclick = () => {
      const item = selectedGalleryFiles[Number(button.dataset.removeNew)];
      URL.revokeObjectURL(item.preview);
      selectedGalleryFiles.splice(Number(button.dataset.removeNew), 1);
      renderGalleryPreview();
    };
  });
}
$("#galleryFiles").addEventListener("change", (e) => {
  const files = [...e.target.files];
  if (files.some((file) => file.size > 5 * 1024 * 1024)) {
    toast("Cada foto deve ter menos de 5 MB");
    e.target.value = "";
    return;
  }
  selectedGalleryFiles.push(...files.map((file) => ({
    file,
    preview: URL.createObjectURL(file),
  })));
  e.target.value = "";
  renderGalleryPreview();
  toast(`${files.length} ${files.length === 1 ? "foto pronta" : "fotos prontas"} para publicar`);
});
$("#excerpt").addEventListener(
  "input",
  (e) => ($("#excerptCount").textContent = e.target.value.length),
);
document.querySelectorAll(".toolbar button").forEach((button) => {
  button.addEventListener("mousedown", (event) => event.preventDefault());
  button.addEventListener("click", () => {
    const editor = $("#body"),
      command = button.dataset.command;
    editor.focus();
    if (command === "createLink") {
      let address = prompt("Cole o endereço do link:");
      if (!address) return;
      address = address.trim();
      if (!/^(https?:\/\/|mailto:|tel:|#)/i.test(address)) address = "https://" + address;
      document.execCommand("createLink", false, address);
    } else {
      document.execCommand(command, false, null);
    }
  });
});
function sanitizedEditorHtml() {
  const holder = document.createElement("div");
  holder.innerHTML = $("#body").innerHTML.trim();
  holder.querySelectorAll("script,style,iframe,object,embed").forEach((element) => element.remove());
  const allowed = new Set(["P", "DIV", "BR", "B", "STRONG", "I", "EM", "A", "TABLE", "TBODY", "TR", "TD", "IMG"]);
  [...holder.querySelectorAll("*")].forEach((element) => {
    if (!allowed.has(element.tagName)) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const linkAddress = element.tagName === "A" ? element.getAttribute("href") || "" : "";
    const imageSource = element.tagName === "IMG" ? element.getAttribute("src") || "" : "";
    const imageAlt = element.tagName === "IMG" ? element.getAttribute("alt") || "Imagem relacionada" : "";
    [...element.attributes].forEach((attribute) => element.removeAttribute(attribute.name));
    if (element.tagName === "IMG") {
      if (!/^https?:\/\//i.test(imageSource)) {
        element.remove();
        return;
      }
      element.setAttribute("src", imageSource);
      element.setAttribute("alt", imageAlt);
    }
    if (element.tagName === "A") {
      if (!/^(https?:\/\/|mailto:|tel:|#)/i.test(linkAddress)) {
        element.replaceWith(...element.childNodes);
        return;
      }
      element.setAttribute("href", linkAddress);
      element.setAttribute("target", "_blank");
      element.setAttribute("rel", "noopener");
    }
  });
  const result = holder.innerHTML.trim();
  return result && !/<(p|div)[\s>]/i.test(result) ? `<p>${result}</p>` : result;
}
function galleryMarkup(urls) {
  return urls.length
    ? `<section class="article-gallery" aria-label="Galeria de fotos">${urls.map((url) => `<img loading="lazy" src="${esc(url)}" alt="Foto da matéria">`).join("")}</section>`
    : "";
}
function htmlContent(newImages = []) {
  const body = sanitizedEditorHtml();
  return body + galleryMarkup(currentGalleryUrls.concat(newImages.map((image) => image.url)));
}
async function uploadImage() {
  if (!selectedImage)
    return $("#imageUrl").value.trim() || currentImage || null;
  const user = await authenticatedUser(),
    safe = selectedImage.name.normalize("NFD").replace(/[^a-zA-Z0-9._-]/g, "-"),
    path = `${user.id}/${Date.now()}-${safe}`;
  const { error } = await db.storage
    .from("blog-images")
    .upload(path, selectedImage, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  return db.storage.from("blog-images").getPublicUrl(path).data.publicUrl;
}
async function uploadGalleryImages() {
  if (!selectedGalleryFiles.length) return [];
  const user = await authenticatedUser();
  return Promise.all(selectedGalleryFiles.map(async (item, index) => {
    const safe = item.file.name.normalize("NFD").replace(/[^a-zA-Z0-9._-]/g, "-"),
      path = `${user.id}/${Date.now()}-${index}-${safe}`,
      { error } = await db.storage.from("blog-images").upload(path, item.file, {
        cacheControl: "3600",
        upsert: false,
      });
    if (error) throw error;
    return { token: item.token, url: db.storage.from("blog-images").getPublicUrl(path).data.publicUrl };
  }));
}
async function authenticatedUser() {
  const { data, error } = await db.auth.getUser();
  if (error || !data?.user) {
    const sessionError = new Error("Sua sessão expirou. Entre novamente no painel.");
    sessionError.code = "SESSION_EXPIRED";
    throw sessionError;
  }
  return data.user;
}
function publishErrorMessage(error) {
  const message = String(error?.message || "").trim();
  if (error?.code === "SESSION_EXPIRED" || /jwt|session|not authenticated/i.test(message)) {
    return "Sua sessão expirou. Entre novamente e publique a matéria.";
  }
  if (/row-level security|permission|policy/i.test(message)) {
    return "O Supabase bloqueou a gravação. Verifique as permissões do administrador.";
  }
  if (/bucket|storage|object/i.test(message)) {
    return "Não foi possível enviar uma das imagens ao Supabase.";
  }
  if (/fetch|network|offline|timeout/i.test(message)) {
    return "Falha de conexão com o Supabase. Verifique a internet e tente novamente.";
  }
  return message
    ? `Não foi possível publicar: ${message.slice(0, 140)}`
    : "Não foi possível publicar. Tente novamente.";
}
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!$("#body").textContent.trim()) {
    toast("Escreva o texto da matéria");
    $("#body").focus();
    return;
  }
  const button = e.submitter;
  button.disabled = true;
  button.textContent = "Publicando...";
  let savedPost = null;
  try {
    const image_url = await uploadImage(),
      inlineImages = await uploadGalleryImages(),
      id = $("#postId").value,
      category_id = Number($("#category").value),
      category = categories.find((c) => c.id === category_id),
      payload = {
        title: $("#title").value.trim(),
        slug: id
          ? undefined
          : editingLegacySlug || slugify($("#title").value) + "-" + Date.now().toString().slice(-6),
        excerpt: $("#excerpt").value.trim() || $("#body").textContent.trim().slice(0, 440),
        content: htmlContent(inlineImages),
        category_id,
        category_name: category?.name || "Blog",
        image_url,
        is_featured: $("#featured").checked,
        published: true,
        published_at: $("#date").value + "T12:00:00",
      };
    if (id) delete payload.slug;
    if (payload.is_featured) {
      const { error: coverError } = await db
        .from("blog_posts")
        .update({ is_featured: false })
        .eq("is_featured", true);
      if (coverError) throw coverError;
    }
    const query = id
        ? db.from("blog_posts").update(payload).eq("id", id).select("*").single()
        : db.from("blog_posts").insert(payload).select("*").single(),
      { data, error } = await query;
    if (error) throw error;
    savedPost = data;
  } catch (error) {
    console.error(error);
    toast(publishErrorMessage(error));
    if (error?.code === "SESSION_EXPIRED") lock();
    return;
  } finally {
    button.disabled = false;
    button.textContent = "Publicar matéria";
  }

  try {
    selectedImage = null;
    selectedGalleryFiles.forEach((item) => URL.revokeObjectURL(item.preview));
    selectedGalleryFiles = [];
    toast(id ? "Alterações e fotos salvas!" : "Matéria publicada para todos!");
    await edit(savedPost.id);
  } catch (error) {
    console.error(error);
    // A matéria já foi salva. Uma falha ao recarregar o editor não deve
    // ser apresentada como erro de publicação nem incentivar duplicações.
    $("#saveState").textContent = "Salva online";
  }
});
async function showList() {
  editor.classList.add("hidden");
  list.classList.remove("hidden");
  $("#brandEditor").classList.add("hidden");
  $("#items").innerHTML = "<p>Carregando matérias...</p>";
  const { data, error } = await db
    .from("blog_posts")
    .select("*")
    .neq("slug", "config-marcas-parceiras")
    .order("published_at", { ascending: false });
  if (error) {
    toast("Erro ao carregar matérias");
    return;
  }
  $("#postCount").textContent =
    `${data.length} ${data.length === 1 ? "matéria" : "matérias"}`;
  $("#items").innerHTML = data.length
    ? data
        .map(
          (p) =>
            `<article class="post-item"><img src="${esc(p.image_url || "images/hero.png")}"><div><h2>${esc(p.title)}</h2><p>${new Date(p.published_at).toLocaleDateString("pt-BR")} · ${esc(p.category_name)}${p.is_featured ? " · Destaque na capa" : ""}</p></div><div class="item-actions"><button data-edit="${p.id}">Editar</button><button class="delete" data-delete="${p.id}">Excluir</button></div></article>`,
        )
        .join("")
    : "<p>Nenhuma matéria criada no banco de dados.</p>";
  document
    .querySelectorAll("[data-edit]")
    .forEach((b) => (b.onclick = () => edit(b.dataset.edit)));
  document
    .querySelectorAll("[data-delete]")
    .forEach((b) => (b.onclick = () => remove(b.dataset.delete)));
}
function categoryForLegacyPost(post) {
  return categories.find((category) => (post.categories || []).includes(category.id)) || null;
}
function renderPostItems(items, title, emptyMessage) {
  editor.classList.add("hidden");
  list.classList.remove("hidden");
  $("#brandEditor").classList.add("hidden");
  $("#postCount").textContent = `${items.length} ${items.length === 1 ? "matéria" : "matérias"}`;
  $("#postList .heading small").textContent = title;
  $("#items").innerHTML = items.length
    ? items.map((post) => {
      const category = post.category_name || categoryForLegacyPost(post)?.name || "Blog";
      const image = post.image_url || post.image || "images/hero.png";
      const legacy = Boolean(post.legacy);
      return `<article class="post-item"><img src="${esc(image)}"><div><h2>${esc(post.title)}</h2><p>${post.date ? new Date(post.date).toLocaleDateString("pt-BR") : new Date(post.published_at).toLocaleDateString("pt-BR")} · ${esc(category)}${legacy ? " · Original do site" : ""}</p></div><div class="item-actions"><button ${legacy ? `data-edit-legacy="${esc(post.slug)}"` : `data-edit="${post.id}"`}>Editar</button>${legacy ? "" : `<button class="delete" data-delete="${post.id}">Excluir</button>`}</div></article>`;
    }).join("")
    : `<p>${emptyMessage}</p>`;
  document.querySelectorAll("[data-edit]").forEach((button) => (button.onclick = () => edit(button.dataset.edit)));
  document.querySelectorAll("[data-edit-legacy]").forEach((button) => (button.onclick = () => editLegacy(button.dataset.editLegacy)));
  document.querySelectorAll("[data-delete]").forEach((button) => (button.onclick = () => remove(button.dataset.delete)));
}
async function editLegacy(slug) {
  const { data: saved } = await db.from("blog_posts").select("id").eq("slug", slug).maybeSingle();
  if (saved?.id) return edit(saved.id);
  const post = (window.GARIMPANDO_CONTENT?.posts || []).find((item) => item.slug === slug);
  if (!post) return toast("Não foi possível abrir a matéria original");
  reset();
  const category = categoryForLegacyPost(post);
  editingLegacySlug = post.slug;
  $("#title").value = post.title || "";
  $("#date").value = String(post.date || "").slice(0, 10) || new Date().toISOString().slice(0, 10);
  $("#category").value = category?.id || "";
  updateCategoryDestination();
  $("#excerpt").value = post.excerpt || "";
  $("#excerptCount").textContent = $("#excerpt").value.length;
  $("#body").innerHTML = contentReadyForEditor(post.content);
  $("#imageUrl").value = post.image || editableTravelCovers[post.slug] || "";
  previewImage($("#imageUrl").value);
  $("#editorTitle").textContent = "Editar matéria original";
  $("#saveState").textContent = "Será salva online";
}
function showLegacyCategory(categorySlug, title) {
  const category = categories.find((item) => item.slug === categorySlug);
  const originals = (window.GARIMPANDO_CONTENT?.posts || [])
    .filter((post) => (post.categories || []).includes(category?.id))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map((post) => ({ ...post, legacy: true }));
  renderPostItems(originals, title, "Nenhuma matéria encontrada nesta categoria.");
}

async function edit(id) {
  const { data, error } = await db
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return toast("Não foi possível abrir a matéria");
  const correction = window.GARIMPANDO_EDITORIAL_CORRECTIONS?.[data.slug] || null,
    savedPhotos =
      (String(data.content || "").match(/<figure class="article-inline-image"[^>]*>[\s\S]*?<\/figure>/g) || []).join("") +
      (String(data.content || "").match(/<section class="article-gallery"[^>]*>[\s\S]*?<\/section>/g) || []).join(""),
    p = correction ? { ...data, ...correction, content: correction.content + savedPhotos } : data;
  reset();
  $("#postId").value = p.id;
  $("#title").value = p.title;
  $("#date").value = p.published_at.slice(0, 10);
  const savedCategory =
    categories.find((c) => c.id === p.category_id) ||
    categories.find((c) => c.name === p.category_name);
  $("#category").value = savedCategory?.id || "";
  updateCategoryDestination();
  $("#excerpt").value = p.excerpt;
  const galleryUrls = [...p.content.matchAll(/<section class="article-gallery"[^>]*>([\s\S]*?)<\/section>/g)]
      .flatMap((section) => [...section[1].matchAll(/<img[^>]+src="([^"]+)"/g)].map((image) => image[1])),
    inlineUrls = [...p.content.matchAll(/<figure class="article-inline-image"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"[^>]*>[\s\S]*?<\/figure>/g)]
      .map((image) => image[1]);
  currentGalleryUrls = [...new Set(galleryUrls.concat(inlineUrls))];
  const contentWithoutImages = p.content
    .replace(/<section class="article-gallery"[^>]*>[\s\S]*?<\/section>/g, "")
    .replace(/<figure class="article-inline-image"[^>]*>[\s\S]*?<\/figure>/g, "");
  $("#body").innerHTML = contentWithoutImages.trim();
  $("#imageUrl").value = p.image_url || "";
  $("#featured").checked = Boolean(p.is_featured);
  previewImage(p.image_url);
  renderGalleryPreview();
  $("#editorTitle").textContent = "Editar matéria";
  $("#saveState").textContent = "Salva online";
  $("#excerptCount").textContent = p.excerpt.length;
}
async function remove(id) {
  if (
    !confirm("Excluir esta matéria do site? Essa ação não pode ser desfeita.")
  )
    return;
  const { error } = await db.from("blog_posts").delete().eq("id", id);
  if (error) return toast("Não foi possível excluir");
  await showList();
  toast("Matéria excluída");
}
const editableTravelSlugs = new Set([
  "mexico-entre-o-ceu-e-o-mar",
  "india-um-novo-olhar-sobre-o-mundo",
  "peru-experiencias-sem-fim",
  "peru-um-mistico-encanto",
  "canada-o-pais-que-sorri-para-todos",
  "guatemala-seus-misterios-e-sua-historia",
  "no-coracao-da-amazonia",
  "a-historia-e-o-sol-de-uma-jamaica",
  "marrocos-o-pais-das-mil-e-uma-noites",
  "africa-do-sul-e-mauritius-em-familia",
  "japao-elegante-pais-do-sol-nascente",
  "a-eterna-e-bela-sicilia",
  "parana-uma-terra-de-tradicoes",
  "bahia-de-charme-parte-2",
  "bahia-de-charme-parte-1",
  "minhas-dicas-sol-de-santa",
  "suica-sofisticada-e-saborosa",
  "china-o-imenso-pais-dourado",
]);

const editableTravelCovers = {
  "mexico-entre-o-ceu-e-o-mar": "https://lh3.googleusercontent.com/d/1fy0kqGxST-0oSvX0Pmtd1D5ewg5Klyxa=w1600",
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
  "a-eterna-e-bela-sicilia": "https://lh3.googleusercontent.com/d/1J1IWhzvU-GIqcn7MNPCAyfAseUcPid-F=w1600",
  "parana-uma-terra-de-tradicoes": "https://www.parana.pr.gov.br/sites/default/arquivos_restritos/files/imagem/2024-12/creditos_lucas_franco_viaje_pr_13.jpg",
  "bahia-de-charme-parte-2": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/17/43/ac/8f/pelourinho.jpg?h=-1&s=1&w=1800",
  "bahia-de-charme-parte-1": "https://a.cdn-hotels.com/gdcs/production171/d1145/f5143983-05bb-450c-bea1-9f14b8bb3b96.jpg",
  "minhas-dicas-sol-de-santa": "https://garimpandolife.com.br/wp-content/uploads/2015/12/dicassanta-1.jpg",
  "suica-sofisticada-e-saborosa": "https://admin.europaturism.ro/Files/Pictures/Images/elvetia-9918.jpg",
  "china-o-imenso-pais-dourado": "https://images.rawpixel.com/image_800/cHJpdmF0ZS9zdGF0aWMvaW1hZ2Uvd2Vic2l0ZS8yMDIyLTA0L2xyL3B4NzU5MzMzLWltYWdlLWt3dnY1N2J1LmpwZw.jpg"
};

function contentReadyForEditor(html) {
  const holder = document.createElement("div");
  holder.innerHTML = String(html || "");
  // As tabelas antigas eram apenas painéis de matérias relacionadas.
  // O editor trabalha com texto, links e uma galeria própria de fotos.
  holder.querySelectorAll("script, style, iframe, object, embed, figure, .article-gallery").forEach((element) => element.remove());
  const relatedTitle = /clique nas imagens abaixo[\s\S]*mat[eé]rias relacionadas/i;
  [...holder.querySelectorAll("h1, h2, h3, h4, p, div, span, strong, b")]
    .filter((element) => relatedTitle.test(element.textContent || "") && ![...element.children].some((child) => relatedTitle.test(child.textContent || "")))
    .forEach((element) => element.remove());

  const allowed = new Set(["P", "DIV", "BR", "B", "STRONG", "I", "EM", "A", "TABLE", "TBODY", "TR", "TD", "IMG"]);
  [...holder.querySelectorAll("*")].forEach((element) => {
    if (!allowed.has(element.tagName)) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const href = element.tagName === "A" ? element.getAttribute("href") || "" : "";
    const imageSource = element.tagName === "IMG" ? element.getAttribute("src") || "" : "";
    const imageAlt = element.tagName === "IMG" ? element.getAttribute("alt") || "Imagem relacionada" : "";
    [...element.attributes].forEach((attribute) => element.removeAttribute(attribute.name));
    if (element.tagName === "IMG") {
      if (!/^https?:\/\//i.test(imageSource)) {
        element.remove();
        return;
      }
      element.setAttribute("src", imageSource);
      element.setAttribute("alt", imageAlt);
    } else if (element.tagName === "A" && /^(https?:\/\/|mailto:|tel:|#)/i.test(href)) {
      element.setAttribute("href", href);
      element.setAttribute("target", "_blank");
      element.setAttribute("rel", "noopener");
    } else if (element.tagName === "A") {
      element.replaceWith(...element.childNodes);
    }
  });
  return holder.innerHTML.trim() || "<p>Texto da matéria.</p>";
}

async function importTravelPostsForEditing() {
  if (!configured) return;
  const button = $("#importTravelPosts");
  button.disabled = true;
  button.textContent = "Preparando matérias...";
  try {
    const originals = (window.GARIMPANDO_CONTENT?.posts || [])
      .filter((post) => editableTravelSlugs.has(post.slug));
    if (originals.length !== editableTravelSlugs.size) {
      throw new Error("Não foi possível localizar todas as 18 matérias de viagem.");
    }
    const { data: existing, error: lookupError } = await db
      .from("blog_posts")
      .select("id,slug,image_url")
      .in("slug", [...editableTravelSlugs]);
    if (lookupError) throw lookupError;
    const savedBySlug = new Map((existing || []).map((post) => [post.slug, post]));
    const existingSlugs = new Set(savedBySlug.keys());
    const travelCategory = categories.find((category) => category.slug === "viagem");
    const missing = originals.filter((post) => !existingSlugs.has(post.slug));
    // Uma matéria por vez evita que os textos antigos, muito grandes,
    // excedam o limite de conexão em uma única publicação.
    for (let index = 0; index < missing.length; index += 1) {
      const post = missing[index];
      button.textContent = `Preparando ${index + 1} de ${missing.length}...`;
      const payload = {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || "",
        content: contentReadyForEditor(post.content),
        category_id: travelCategory?.id || 313,
        category_name: travelCategory?.name || "Viagens",
        image_url: editableTravelCovers[post.slug] || post.image || "",
        is_featured: false,
        published: true,
        published_at: post.date || new Date().toISOString(),
      };
      let insertError = null;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const result = await db.from("blog_posts").insert(payload);
        insertError = result.error;
        if (!insertError) break;
        if (!/fetch|network|timeout/i.test(String(insertError.message || ""))) break;
        await new Promise((resolve) => setTimeout(resolve, 700 * (attempt + 1)));
      }
      if (insertError) throw insertError;
    }
    // Se as matérias já haviam sido preparadas antes, atualiza somente as
    // capas com as imagens corretas da categoria Viagens, sem tocar no texto.
    for (const post of originals) {
      const saved = savedBySlug.get(post.slug);
      const cover = editableTravelCovers[post.slug];
      if (!saved || !cover || saved.image_url === cover) continue;
      const { error: coverError } = await db
        .from("blog_posts")
        .update({ image_url: cover })
        .eq("id", saved.id);
      if (coverError) throw coverError;
    }
    await showList();
    toast(missing.length ? "18 viagens prontas para editar!" : "As 18 viagens já estão prontas para editar.");
  } catch (error) {
    console.error(error);
    toast(publishErrorMessage(error));
  } finally {
    button.disabled = false;
    button.textContent = "✦ Preparar/atualizar 18 viagens";
  }
}

$("#newPost").onclick = reset;
$("#showPosts").onclick = () => configured && showList();
$("#showTourismPosts").onclick = () => configured && showLegacyCategory("turismo", "TURISMO");
$("#showGastronomyPosts").onclick = () => configured && showLegacyCategory("gastronomia", "GASTRONOMIA");
$("#showLifestylePosts").onclick = () => configured && showLegacyCategory("estilo-de-vida", "ESTILO DE VIDA");
$("#importTravelPosts").onclick = importTravelPostsForEditing;

function resetBrandForm() {
  $("#brandForm").reset();
  $("#brandIndex").value = "";
  $("#brandForm").querySelector('[type="submit"]').textContent = "Adicionar marca";
}
function renderBrandItems() {
  $("#brandItems").innerHTML = brandItems.length
    ? brandItems.map((brand, index) => `<article class="brand-item"><img src="${esc(brand.image || "images/logo.png")}" alt="Logo ${esc(brand.name)}"><div><b>${esc(brand.name)}</b><small>${esc(brand.url || "Sem link")}</small></div><div class="brand-actions"><button type="button" data-brand-up="${index}" aria-label="Subir marca">↑</button><button type="button" data-brand-down="${index}" aria-label="Descer marca">↓</button><button type="button" data-brand-edit="${index}">Editar</button><button type="button" class="delete" data-brand-delete="${index}">Excluir</button></div></article>`).join("")
    : "<p>Nenhuma marca cadastrada.</p>";
  document.querySelectorAll("[data-brand-edit]").forEach((button) => button.onclick = () => {
    const index = Number(button.dataset.brandEdit), brand = brandItems[index];
    $("#brandIndex").value = index;
    $("#brandName").value = brand.name || "";
    $("#brandUrl").value = brand.url || "";
    $("#brandLogoUrl").value = brand.image || "";
    $("#brandForm").querySelector('[type="submit"]').textContent = "Atualizar marca";
    $("#brandName").focus();
  });
  document.querySelectorAll("[data-brand-delete]").forEach((button) => button.onclick = () => {
    const index = Number(button.dataset.brandDelete);
    if (!confirm(`Excluir a marca ${brandItems[index].name}?`)) return;
    brandItems.splice(index, 1);
    renderBrandItems();
  });
  document.querySelectorAll("[data-brand-up]").forEach((button) => button.onclick = () => {
    const index = Number(button.dataset.brandUp);
    if (!index) return;
    [brandItems[index - 1], brandItems[index]] = [brandItems[index], brandItems[index - 1]];
    renderBrandItems();
  });
  document.querySelectorAll("[data-brand-down]").forEach((button) => button.onclick = () => {
    const index = Number(button.dataset.brandDown);
    if (index >= brandItems.length - 1) return;
    [brandItems[index + 1], brandItems[index]] = [brandItems[index], brandItems[index + 1]];
    renderBrandItems();
  });
}
async function loadBrands() {
  const { data, error } = await db.from("blog_posts").select("id,content").eq("slug", "config-marcas-parceiras").maybeSingle();
  if (error) throw error;
  brandSettingsId = data?.id || null;
  try {
    brandItems = data ? JSON.parse(data.content || "[]") : [...defaultPartnerBrands];
    if (!Array.isArray(brandItems)) throw 0;
  } catch (_) {
    brandItems = [...defaultPartnerBrands];
  }
  defaultPartnerBrands.slice(-2).forEach((requiredBrand) => {
    if (!brandItems.some((brand) => slugify(brand.name) === slugify(requiredBrand.name))) {
      brandItems.push(requiredBrand);
    }
  });
  renderBrandItems();
}
async function showBrands() {
  editor.classList.add("hidden");
  list.classList.add("hidden");
  $("#brandEditor").classList.remove("hidden");
  $("#brandItems").innerHTML = "<p>Carregando marcas...</p>";
  try { await loadBrands(); } catch (error) { console.error(error); toast("Não foi possível carregar as marcas"); }
}
async function uploadBrandLogo(file) {
  const { data: { user } } = await db.auth.getUser();
  const safe = file.name.normalize("NFD").replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${user.id}/marcas/${Date.now()}-${safe}`;
  const { error } = await db.storage.from("blog-images").upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  return db.storage.from("blog-images").getPublicUrl(path).data.publicUrl;
}
$("#brandForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.submitter;
  button.disabled = true;
  try {
    const file = $("#brandLogoFile").files[0];
    const image = file ? await uploadBrandLogo(file) : $("#brandLogoUrl").value.trim();
    if (!image) return toast("Escolha a logo da marca");
    const brand = { name: $("#brandName").value.trim(), url: $("#brandUrl").value.trim(), image };
    const index = $("#brandIndex").value;
    if (index === "") brandItems.push(brand); else brandItems[Number(index)] = brand;
    resetBrandForm();
    renderBrandItems();
    toast("Marca pronta. Agora toque em Salvar marcas no site.");
  } catch (error) { console.error(error); toast("Não foi possível enviar a logo"); }
  finally { button.disabled = false; }
});
$("#cancelBrand").onclick = resetBrandForm;
$("#showBrands").onclick = () => configured && showBrands();
$("#saveBrands").onclick = async () => {
  const button = $("#saveBrands");
  button.disabled = true;
  button.textContent = "Salvando...";
  const payload = {
    title: "Configuração das marcas parceiras",
    slug: "config-marcas-parceiras",
    excerpt: "Configuração interna do site",
    content: JSON.stringify(brandItems),
    category_id: 0,
    category_name: "Configuração",
    image_url: null,
    is_featured: false,
    published: true,
    published_at: new Date().toISOString(),
  };
  try {
    const query = brandSettingsId
      ? db.from("blog_posts").update(payload).eq("id", brandSettingsId).select("id").single()
      : db.from("blog_posts").insert(payload).select("id").single();
    const { data, error } = await query;
    if (error) throw error;
    brandSettingsId = data.id;
    toast("Marcas salvas e atualizadas no site!");
  } catch (error) { console.error(error); toast("Não foi possível salvar as marcas"); }
  finally { button.disabled = false; button.textContent = "Salvar marcas no site"; }
};
$("#previewBtn").onclick = () => {
  const category = categories.find(
    (x) => x.id === Number($("#category").value),
  );
  $("#previewTitle").textContent = $("#title").value || "Título da matéria";
  $("#previewCategory").textContent = category?.name || "Blog";
  $("#previewExcerpt").textContent = $("#excerpt").value;
  $("#previewBody").innerHTML = htmlContent(selectedGalleryFiles
    .map((item) => ({ url: item.preview })));
  const img = $("#previewImage");
  img.src = currentImage || $("#imageUrl").value;
  img.style.display = img.src ? "block" : "none";
  $("#preview").showModal();
};
$("#closePreview").onclick = () => $("#preview").close();
$("#exportBtn").onclick = async () => {
  const { data, error } = await db
    .from("blog_posts")
    .select("*")
    .order("published_at", { ascending: false });
  if (error) return toast("Não foi possível criar o backup");
  const blob = new Blob(
      [JSON.stringify({ version: 2, posts: data }, null, 2)],
      { type: "application/json" },
    ),
    a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download =
    "backup-garimpando-blog-" + new Date().toISOString().slice(0, 10) + ".json";
  a.click();
  URL.revokeObjectURL(a.href);
  toast("Backup baixado");
};
$("#importFile").onchange = (e) => {
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const backup = JSON.parse(reader.result);
      if (!Array.isArray(backup.posts)) throw 0;
      if (!confirm("Restaurar este backup no banco de dados?")) return;
      const clean = backup.posts.map(({ created_at, updated_at, ...p }) => p),
        { error } = await db
          .from("blog_posts")
          .upsert(clean, { onConflict: "id" });
      if (error) throw error;
      await showList();
      toast("Backup restaurado");
    } catch (error) {
      console.error(error);
      toast("Backup inválido ou não autorizado");
    }
  };
  reader.readAsText(e.target.files[0]);
};
start();
