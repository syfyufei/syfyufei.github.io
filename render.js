// Generic JSON -> <template> renderer.
// Usage in a page:
//   <section id="list"></section>
//   <template id="item">...<h3 data-field="title"></h3>...</template>
//   <script>renderList("data/foo.json", "#list", "#item", {key: "items"});</script>
//
// Template conventions:
//   [data-field="foo"]         -> textContent = item.foo
//   [data-link="url,title"]    -> wraps its children in <a href={item.url}> if url truthy
//   [data-tags]                -> fills with <span class="tag"> per item.tags[]
//   [data-if="foo"]            -> removed from DOM if !item.foo
//   [data-attr="href:url"]     -> sets href attribute to item.url
//
// Groups: if the JSON root has multiple arrays (e.g. publications.json with journal_en, journal_zh, ...),
// pass {groups: [{key, title}, ...]} instead of {key}.

async function renderList(jsonPath, listSel, tplSel, opts = {}) {
  const listEl = document.querySelector(listSel);
  const tpl = document.querySelector(tplSel);
  if (!listEl || !tpl) return;
  try {
    const data = await fetch(jsonPath).then(r => r.json());
    if (opts.groups) {
      listEl.innerHTML = "";
      for (const g of opts.groups) {
        const arr = data[g.key] || [];
        if (!arr.length) continue;
        const h = document.createElement("div");
        h.className = "pub-group";
        h.innerHTML = `<h2>${g.title}</h2>`;
        const inner = document.createElement("div");
        inner.className = "list";
        for (const item of arr) inner.appendChild(renderItem(tpl, item));
        h.appendChild(inner);
        listEl.appendChild(h);
      }
    } else {
      const arr = data[opts.key || "items"] || [];
      listEl.innerHTML = "";
      for (const item of arr) listEl.appendChild(renderItem(tpl, item));
    }
  } catch (err) {
    listEl.innerHTML = `<p class="loading">Failed to load ${jsonPath}: ${err.message}</p>`;
  }
}

function renderItem(tpl, item) {
  const node = tpl.content.cloneNode(true);

  node.querySelectorAll("[data-if]").forEach(el => {
    const key = el.getAttribute("data-if");
    if (!item[key]) el.remove();
  });

  node.querySelectorAll("[data-field]").forEach(el => {
    const key = el.getAttribute("data-field");
    if (item[key] != null && item[key] !== "") el.textContent = item[key];
    else el.remove();
  });

  node.querySelectorAll("[data-attr]").forEach(el => {
    const spec = el.getAttribute("data-attr");
    spec.split(",").forEach(pair => {
      const [attr, key] = pair.split(":").map(s => s.trim());
      if (item[key]) el.setAttribute(attr, item[key]);
    });
  });

  node.querySelectorAll("[data-link]").forEach(el => {
    const key = el.getAttribute("data-link") || "url";
    const url = item[key];
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    while (el.firstChild) a.appendChild(el.firstChild);
    el.appendChild(a);
  });

  node.querySelectorAll("[data-tags]").forEach(el => {
    const tags = item.tags || [];
    el.innerHTML = tags.map(t => `<span class="tag">${t}</span>`).join("");
    if (!tags.length) el.remove();
  });

  return node;
}
