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
  currentImage = "";
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
const categories = (window.GARIMPANDO_CONTENT?.categories || []).filter(
  (c) => c.count > 0 && c.slug !== "destaques",
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
  $("#postId").value = "";
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
    `<div class="gallery-thumb"><img src="${esc(url)}" alt="Foto adicional"><button type="button" data-remove-saved="${index}" aria-label="Remover foto">×</button></div>`,
  );
  const selected = selectedGalleryFiles.map((file, index) =>
    `<div class="gallery-thumb"><img src="${URL.createObjectURL(file)}" alt="Nova foto"><button type="button" data-remove-new="${index}" aria-label="Remover foto">×</button></div>`,
  );
  $("#galleryPreview").innerHTML = saved.length || selected.length
    ? saved.concat(selected).join("")
    : "<span>Nenhuma foto adicional selecionada</span>";
  document.querySelectorAll("[data-remove-saved]").forEach((button) => {
    button.onclick = () => {
      currentGalleryUrls.splice(Number(button.dataset.removeSaved), 1);
      renderGalleryPreview();
    };
  });
  document.querySelectorAll("[data-remove-new]").forEach((button) => {
    button.onclick = () => {
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
  selectedGalleryFiles.push(...files);
  e.target.value = "";
  renderGalleryPreview();
  toast(`${files.length} ${files.length === 1 ? "foto adicionada" : "fotos adicionadas"}`);
});
$("#excerpt").addEventListener(
  "input",
  (e) => ($("#excerptCount").textContent = e.target.value.length),
);
document.querySelectorAll(".toolbar button").forEach((b) =>
  b.addEventListener("click", () => {
    const field = $("#body"),
      tag = b.dataset.tag,
      start = field.selectionStart,
      end = field.selectionEnd,
      selected = field.value.slice(start, end) || "texto";
    const value =
      tag === "a"
        ? `<a href="${prompt("Cole o endereço do link:") || "#"}">${selected}</a>`
        : `<${tag}>${selected}</${tag}>`;
    field.setRangeText(value, start, end, "end");
    field.focus();
  }),
);
function galleryMarkup(urls) {
  return urls.length
    ? `<section class="article-gallery" aria-label="Galeria de fotos">${urls.map((url) => `<img loading="lazy" src="${esc(url)}" alt="Foto da matéria">`).join("")}</section>`
    : "";
}
function htmlContent(galleryUrls = currentGalleryUrls) {
  const body = $("#body")
    .value.split(/\n{2,}/)
    .map((x) =>
      x.trim().startsWith("<") ? x : `<p>${x.replace(/\n/g, "<br>")}</p>`,
    )
    .join("");
  return body + galleryMarkup(galleryUrls);
}
async function uploadImage() {
  if (!selectedImage)
    return $("#imageUrl").value.trim() || currentImage || null;
  const {
      data: { user },
    } = await db.auth.getUser(),
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
  const {
    data: { user },
  } = await db.auth.getUser();
  return Promise.all(selectedGalleryFiles.map(async (file, index) => {
    const safe = file.name.normalize("NFD").replace(/[^a-zA-Z0-9._-]/g, "-"),
      path = `${user.id}/${Date.now()}-${index}-${safe}`,
      { error } = await db.storage.from("blog-images").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
    if (error) throw error;
    return db.storage.from("blog-images").getPublicUrl(path).data.publicUrl;
  }));
}
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const button = e.submitter;
  button.disabled = true;
  button.textContent = "Publicando...";
  try {
    const image_url = await uploadImage(),
      newGalleryUrls = await uploadGalleryImages(),
      galleryUrls = currentGalleryUrls.concat(newGalleryUrls),
      id = $("#postId").value,
      category_id = Number($("#category").value),
      category = categories.find((c) => c.id === category_id),
      payload = {
        title: $("#title").value.trim(),
        slug: id
          ? undefined
          : slugify($("#title").value) + "-" + Date.now().toString().slice(-6),
        excerpt: $("#excerpt").value.trim(),
        content: htmlContent(galleryUrls),
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
        ? db.from("blog_posts").update(payload).eq("id", id)
        : db.from("blog_posts").insert(payload).select("id").single(),
      { data, error } = await query;
    if (error) throw error;
    if (!id) $("#postId").value = data.id;
    selectedImage = null;
    selectedGalleryFiles = [];
    currentGalleryUrls = galleryUrls;
    currentImage = image_url || "";
    renderGalleryPreview();
    $("#saveState").textContent = "Publicado online";
    toast("Matéria publicada para todos!");
  } catch (error) {
    console.error(error);
    toast("Não foi possível publicar. Confira o Supabase.");
  } finally {
    button.disabled = false;
    button.textContent = "Publicar matéria";
  }
});
async function showList() {
  editor.classList.add("hidden");
  list.classList.remove("hidden");
  $("#items").innerHTML = "<p>Carregando matérias...</p>";
  const { data, error } = await db
    .from("blog_posts")
    .select("*")
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
async function edit(id) {
  const { data: p, error } = await db
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return toast("Não foi possível abrir a matéria");
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
  currentGalleryUrls = [...p.content.matchAll(/<section class="article-gallery"[^>]*>([\s\S]*?)<\/section>/g)]
    .flatMap((section) => [...section[1].matchAll(/<img[^>]+src="([^"]+)"/g)].map((image) => image[1]));
  const contentWithoutGallery = p.content.replace(/<section class="article-gallery"[^>]*>[\s\S]*?<\/section>/g, "");
  $("#body").value = contentWithoutGallery
    .replace(/<p>/g, "")
    .replace(/<\/p>/g, "\n\n")
    .replace(/<br\s*\/?>/g, "\n")
    .trim();
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
$("#newPost").onclick = reset;
$("#showPosts").onclick = () => configured && showList();
$("#previewBtn").onclick = () => {
  const category = categories.find(
    (x) => x.id === Number($("#category").value),
  );
  $("#previewTitle").textContent = $("#title").value || "Título da matéria";
  $("#previewCategory").textContent = category?.name || "Blog";
  $("#previewExcerpt").textContent = $("#excerpt").value;
  $("#previewBody").innerHTML = htmlContent();
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
