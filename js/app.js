(async () => {
  "use strict";
  const products = await (window.MINIMALI_PRODUCTS_READY ??
    Promise.resolve(window.MINIMALI_PRODUCTS));
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [
    ...root.querySelectorAll(selector),
  ];
  const money = (value) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  const escape = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char],
    );
  const icon = (name) =>
    `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const findProduct = (id) => products.find((product) => product.id === id);
  const read = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  };
  const savedCart = read("minimali.cart.v1", []);
  const savedFavorites = read("minimali.favorites.v1", []);
  const cart = Array.isArray(savedCart)
    ? savedCart
        .filter(
          (item) =>
            item &&
            findProduct(item.id) &&
            Number.isInteger(item.quantity) &&
            item.quantity > 0 &&
            item.quantity <= 99 &&
            typeof item.note === "string",
        )
        .slice(0, 100)
        .map((item) => ({
          id: item.id,
          quantity: item.quantity,
          note: item.note.slice(0, 300),
        }))
    : [];
  const favorites = new Set(
    Array.isArray(savedFavorites)
      ? savedFavorites.filter((id) => findProduct(id))
      : [],
  );
  const state = {
    category: "all",
    tab: "all",
    query: "",
    favorites: false,
    sort: "default",
  };
  const categoryNames = {
    all: "Todos os produtos",
    topos: "Topos de bolo",
    canecas: "Canecas",
    papelaria: "Papelaria",
    impressos: "Impressos",
    lembrancinhas: "Lembrancinhas",
  };
  let activeProduct = null;
  let activeProductTrigger = null;
  let detailQuantity = 1;
  let toastTimer;
  let storageWarningShown = false;
  let lastDialogTrigger = null;
  let searchTimer;
  let heroPosition = 0;
  let heroTimer;
  const mobileMenu = $(".mobile-menu");
  const mainNav = $("#main-nav");
  const normalize = (text) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const placeholderStyle = (product) =>
    `--placeholder-color:${product.placeholderColor}`;

  function updateHeroDots(position) {
    const active = position === 3 ? 0 : position;
    $$("[data-hero-slide]").forEach((dot, index) => {
      const selected = index === active;
      dot.classList.toggle("active", selected);
      dot.setAttribute("aria-pressed", String(selected));
    });
  }

  function updateHeroAccessibility(position) {
    $$(".hero-slide").forEach((slide, index) => {
      const active = position !== 3 && index === position;
      slide.toggleAttribute("inert", !active);
      if (active) slide.removeAttribute("aria-hidden");
      else slide.setAttribute("aria-hidden", "true");
    });
  }

  function showHeroSlide(position, animate = true) {
    const track = $(".hero-track");
    if (!track) return;
    heroPosition = position;
    track.classList.toggle("no-transition", !animate);
    // A faixa tem quatro telas lado a lado (400% da largura do hero).
    // Percentuais do transform usam a largura da própria faixa, portanto
    // cada slide corresponde a 25% do deslocamento total.
    track.style.transform = `translateX(-${position * 25}%)`;
    updateHeroDots(position);
    updateHeroAccessibility(position);
  }

  function stopHeroRotation() {
    clearInterval(heroTimer);
  }

  function startHeroRotation() {
    stopHeroRotation();
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    heroTimer = setInterval(() => showHeroSlide(heroPosition + 1), 5500);
  }

  function setMobileMenu(open) {
    if (!mobileMenu || !mainNav) return;
    mainNav.classList.toggle("is-open", open);
    mobileMenu.setAttribute("aria-expanded", String(open));
    mobileMenu.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  }

  function toast(message) {
    $("#toast").textContent = message;
    $("#toast").classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(
      () => $("#toast").classList.remove("visible"),
      3200,
    );
  }

  function persist() {
    try {
      localStorage.setItem("minimali.cart.v1", JSON.stringify(cart));
      localStorage.setItem(
        "minimali.favorites.v1",
        JSON.stringify([...favorites]),
      );
    } catch {
      if (!storageWarningShown) {
        storageWarningShown = true;
        toast(
          "Seu navegador não permitiu salvar. A seleção fica disponível nesta visita.",
        );
      }
    }
  }

  function renderProducts() {
    const visible = products.filter(
      (product) =>
        (state.category === "all" || product.category === state.category) &&
        (state.tab !== "new" || product.isNew) &&
        (state.tab !== "featured" || product.featured) &&
        (!state.favorites || favorites.has(product.id)) &&
        (!state.query ||
          normalize(
            `${product.name} ${product.label} ${product.description} ${categoryNames[product.category]}`,
          ).includes(normalize(state.query))),
    );
    if (state.sort === "price-asc") visible.sort((a, b) => a.price - b.price);
    if (state.sort === "price-desc") visible.sort((a, b) => b.price - a.price);
    if (state.sort === "name")
      visible.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    $("#product-grid").innerHTML = visible
      .map(
        (product) => `<article class="product-card">
      <button class="product-picture" data-product="${product.id}" aria-label="Ver detalhes de ${escape(product.name)}"><span class="image-placeholder" style="${placeholderStyle(product)}"><span class="placeholder-label">PLACEHOLDER</span></span></button>
      ${product.badge ? `<span class="product-badge ${product.isNew ? "new" : ""}">${escape(product.badge)}</span>` : ""}
      <button class="favorite-toggle" data-favorite="${product.id}" aria-label="${favorites.has(product.id) ? "Remover" : "Adicionar"} ${escape(product.name)} ${favorites.has(product.id) ? "dos" : "aos"} favoritos" aria-pressed="${favorites.has(product.id)}">${icon("heart")}</button>
      <div class="product-info"><p class="product-label">${escape(product.label)}</p><h3 class="product-title"><button data-product="${product.id}">${escape(product.name)}</button></h3><div class="product-price-row"><span class="product-price"><small>A PARTIR DE</small>${money(product.price)}</span><button class="quick-add" data-product="${product.id}" aria-label="Personalizar ${escape(product.name)}">${icon("plus")}</button></div></div>
    </article>`,
      )
      .join("");
    $("#empty-state").hidden = visible.length !== 0;
    $("#results-count").textContent =
      `${visible.length} ${visible.length === 1 ? "produto encontrado" : "produtos encontrados"}`;
    $("#category-select").value = state.category;
    $("[data-favorites-count]").textContent = favorites.size
      ? `(${favorites.size})`
      : "";
    $$(".product-tabs button").forEach((button) => {
      const selected = button.dataset.tab === state.tab;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    const filtered = state.category !== "all" || state.query || state.favorites;
    $(".filter-status").hidden = !filtered;
    const parts = [];
    if (state.favorites) parts.push("Seus favoritos");
    if (state.category !== "all") parts.push(categoryNames[state.category]);
    if (state.query) parts.push(`Busca: “${state.query}”`);
    $("#filter-label").textContent =
      `${parts.join(" · ")} — ${visible.length} ${visible.length === 1 ? "produto" : "produtos"}`;
    const favoritesEmpty = state.favorites && favorites.size === 0;
    $("#empty-title").textContent = favoritesEmpty
      ? "Seus favoritos estão esperando por você."
      : "Nenhum mimo encontrado.";
    $("#empty-description").textContent = favoritesEmpty
      ? "Toque no coração de um produto para guardar suas ideias preferidas."
      : "Tente outro termo ou limpe os filtros para ver todo o catálogo.";
  }

  function resetFilters() {
    Object.assign(state, {
      category: "all",
      query: "",
      tab: "all",
      favorites: false,
      sort: "default",
    });
    $("#search").value = "";
    $("#sort").value = "default";
    $("#category-select").value = "all";
    renderProducts();
  }

  function showDialog(dialog, trigger = document.activeElement) {
    $$("dialog[open]").forEach((open) => open.close());
    lastDialogTrigger = trigger instanceof HTMLElement ? trigger : null;
    dialog.showModal();
    document.body.classList.add("modal-open");
  }

  function showProduct(id) {
    activeProduct = findProduct(id);
    if (!activeProduct) return;
    activeProductTrigger = document.activeElement;
    detailQuantity = 1;
    $("#product-details").innerHTML =
      `<div class="product-details-layout"><div class="detail-photo image-placeholder" style="${placeholderStyle(activeProduct)}" role="img" aria-label="Placeholder de ${escape(activeProduct.name)}"><span class="placeholder-label">PLACEHOLDER</span></div><div class="detail-copy"><p class="eyebrow">UM DETALHE, MUITO CARINHO</p><h2 id="dialog-title">${escape(activeProduct.name)}</h2><p class="detail-description">${escape(activeProduct.description)}</p><p class="detail-price"><small>A PARTIR DE</small>${money(activeProduct.price)}<small>Valor e imagem demonstrativos.</small></p><label class="personalize-label" for="personalization">Como você imagina seu mimo? <span>(opcional)</span></label><textarea id="personalization" maxlength="300" placeholder="Nome, tema, cores… conte sua ideia."></textarea><p class="field-note">Até 300 caracteres. Você pode escolher os detalhes depois.</p><div class="detail-add-row"><div class="quantity-control" aria-label="Quantidade"><button data-detail-quantity="-1" aria-label="Diminuir quantidade" disabled>${icon("minus")}</button><output id="detail-quantity" aria-live="polite">1</output><button data-detail-quantity="1" aria-label="Aumentar quantidade">${icon("plus")}</button></div><button class="button" id="add-to-cart">Adicionar à sacola ${icon("bag")}</button></div></div></div>`;
    showDialog($("#product-dialog"));
  }

  function updateCart() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce(
      (sum, item) => sum + findProduct(item.id).price * item.quantity,
      0,
    );
    $$("[data-cart-count]").forEach((element) => (element.textContent = count));
    $$("[data-cart-total]").forEach(
      (element) => (element.textContent = money(subtotal)),
    );
    $("[data-open-cart]").setAttribute(
      "aria-label",
      `Abrir sacola, ${count} ${count === 1 ? "item" : "itens"}`,
    );
    $("#cart-bottom").hidden = cart.length === 0;
    $("#cart-items").innerHTML = cart.length
      ? cart
          .map((item, index) => {
            const product = findProduct(item.id);
            return `<article class="cart-item"><div class="cart-item-photo image-placeholder" style="${placeholderStyle(product)}" role="img" aria-label="Placeholder de ${escape(product.name)}"><span class="placeholder-label">PLACEHOLDER</span></div><div><h3>${escape(product.name)}</h3><span class="cart-item-price">${money(product.price * item.quantity)}</span>${item.note ? `<p class="cart-item-note">${escape(item.note)}</p>` : ""}<div class="quantity-control"><button data-cart-change="${index}" data-delta="-1" aria-label="Diminuir quantidade de ${escape(product.name)}" ${item.quantity === 1 ? "disabled" : ""}>${icon("minus")}</button><output aria-label="Quantidade">${item.quantity}</output><button data-cart-change="${index}" data-delta="1" aria-label="Aumentar quantidade de ${escape(product.name)}" ${item.quantity === 99 ? "disabled" : ""}>${icon("plus")}</button></div></div><button class="icon-button remove-item" data-remove="${index}" aria-label="Remover ${escape(product.name)} da sacola">${icon("trash")}</button></article>`;
          })
          .join("")
      : `<div class="empty-cart">${icon("bag")}<h3>Uma sacola de possibilidades.</h3><p>Escolha seu primeiro mimo e comece<br>a imaginar algo especial.</p><button class="button button-light" data-continue-shopping>Explorar os produtos ${icon("arrow")}</button></div>`;
  }

  function addToCart() {
    if (!activeProduct) return;
    const note = $("#personalization").value.trim().slice(0, 300);
    const existing = cart.find(
      (item) => item.id === activeProduct.id && item.note === note,
    );
    if (existing && existing.quantity + detailQuantity > 99) {
      toast("O limite é de 99 unidades por personalização.");
      return;
    }
    if (existing) existing.quantity += detailQuantity;
    else cart.push({ id: activeProduct.id, quantity: detailQuantity, note });
    persist();
    updateCart();
    showDialog($("#cart-dialog"), activeProductTrigger);
  }

  function showInfo(title, content) {
    $("#info-title").textContent = title;
    $("#info-content").innerHTML = content;
    $("#back-to-cart").hidden = true;
    $("#info-dismiss").hidden = false;
    showDialog($("#info-dialog"));
  }

  const info = {
    social: [
      "Redes sociais da Minimali",
      "<p>Os perfis oficiais serão adicionados quando os endereços das redes sociais forem definidos.</p>",
    ],
    terms: [
      "Termos de uso",
      "<p>Os termos comerciais serão publicados antes do início das vendas, junto com as regras de personalização, produção, entrega e atendimento.</p>",
    ],
    whatsapp: [
      "WhatsApp da Minimali",
      "<p>O atendimento pelo WhatsApp será ativado assim que o número comercial da Minimali for definido.</p><p>O botão já está pronto; depois será necessário apenas adicionar o número ao link de contato.</p>",
    ],
    account: [
      "Minha conta",
      "<p>A área de acesso será ativada junto com o Supabase Auth em uma próxima etapa.</p><p>Por enquanto, sua sacola e seus favoritos ficam salvos somente neste navegador.</p>",
    ],
    delivery: [
      "Produção e entrega",
      "<p>Cada personalizado começa com uma ideia sua. Os prazos de produção, valores de entrega e área de atendimento serão disponibilizados quando a loja começar a receber pedidos.</p><p>Por enquanto, você pode explorar o catálogo e guardar suas escolhas na sacola deste navegador.</p>",
    ],
    care: [
      "Carinho que dura mais",
      "<p>As orientações de conservação dependem do material e do acabamento de cada personalizado. Consulte as instruções que acompanharão seu produto.</p><p>Os materiais, tamanhos e cuidados específicos serão confirmados no catálogo definitivo.</p>",
    ],
    privacy: [
      "Suas escolhas ficam com você",
      '<p>Esta versão demonstrativa guarda sua sacola, suas notas de personalização e seus favoritos somente neste navegador, usando armazenamento local.</p><p>Não há cadastro, pagamento ou envio desses dados para um banco. Você pode apagar a seleção pelo botão abaixo ou limpar os dados do site nas configurações do navegador.</p><button class="text-link" id="clear-local-data">Apagar minha sacola e favoritos</button>',
    ],
  };

  document.addEventListener("click", (event) => {
    const target = event.target.closest("button, a");
    if (!target) return;
    if (target.dataset.product) showProduct(target.dataset.product);
    if (target.dataset.favorite) {
      const id = target.dataset.favorite;
      if (favorites.has(id)) favorites.delete(id);
      else favorites.add(id);
      persist();
      renderProducts();
      $(`[data-favorite="${id}"]`)?.focus({ preventScroll: true });
      toast(
        favorites.has(id)
          ? "Um favorito guardado com carinho ♡"
          : "Produto removido dos favoritos.",
      );
    }
    if (target.hasAttribute("data-category")) {
      resetFilters();
      state.category = target.dataset.category;
      renderProducts();
    }
    if (target.dataset.tab) {
      state.tab = target.dataset.tab;
      renderProducts();
    }
    if (target.hasAttribute("data-hero-slide")) {
      showHeroSlide(Number(target.dataset.heroSlide));
      startHeroRotation();
    }
    if (target.hasAttribute("data-hero-direction")) {
      const current = heroPosition === 3 ? 0 : heroPosition;
      const nextPosition =
        target.dataset.heroDirection === "next"
          ? (current + 1) % 3
          : (current + 2) % 3;
      showHeroSlide(nextPosition);
      startHeroRotation();
    }
    if (target.hasAttribute("data-show-favorites")) {
      resetFilters();
      state.favorites = true;
      renderProducts();
      $("#produtos").scrollIntoView({ behavior: "smooth" });
    }
    if (target.id === "clear-filters" || target.hasAttribute("data-reset"))
      resetFilters();
    if (target.closest("#main-nav") && target.tagName === "A") {
      $("#main-nav").classList.remove("is-open");
    }
    if (target.hasAttribute("data-open-cart")) {
      updateCart();
      showDialog($("#cart-dialog"));
    }
    if (target.hasAttribute("data-close-cart")) $("#cart-dialog").close();
    if (target.hasAttribute("data-close-product")) $("#product-dialog").close();
    if (target.hasAttribute("data-close-info")) $("#info-dialog").close();
    if (target.hasAttribute("data-continue-shopping")) {
      $("#cart-dialog").close();
      $("#produtos").scrollIntoView({ behavior: "smooth" });
    }
    if (target.hasAttribute("data-detail-quantity")) {
      detailQuantity = Math.max(
        1,
        Math.min(99, detailQuantity + Number(target.dataset.detailQuantity)),
      );
      $("#detail-quantity").value = detailQuantity;
      $('[data-detail-quantity="-1"]').disabled = detailQuantity === 1;
      $('[data-detail-quantity="1"]').disabled = detailQuantity === 99;
    }
    if (target.id === "add-to-cart") addToCart();
    if (target.hasAttribute("data-cart-change")) {
      const index = Number(target.dataset.cartChange),
        delta = Number(target.dataset.delta);
      cart[index].quantity = Math.max(
        1,
        Math.min(99, cart[index].quantity + delta),
      );
      persist();
      updateCart();
      const next = $(`[data-cart-change="${index}"][data-delta="${delta}"]`);
      if (next && !next.disabled) next.focus();
      else $(`[data-cart-change="${index}"][data-delta="${-delta}"]`)?.focus();
    }
    if (target.hasAttribute("data-remove")) {
      const index = Number(target.dataset.remove);
      cart.splice(index, 1);
      persist();
      updateCart();
      (
        $(`[data-remove="${Math.min(index, cart.length - 1)}"]`) ||
        $("[data-continue-shopping]")
      )?.focus();
    }
    if (target.dataset.info) showInfo(...info[target.dataset.info]);
    if (target.id === "clear-local-data") {
      cart.length = 0;
      favorites.clear();
      persist();
      updateCart();
      renderProducts();
      $("#info-dialog").close();
      toast("Sacola e favoritos apagados deste navegador.");
    }
    if (target.id === "review-order") {
      const list = cart
        .map(
          (item) =>
            `<li><strong>${item.quantity} × ${escape(findProduct(item.id).name)}</strong> — ${money(findProduct(item.id).price * item.quantity)}${item.note ? `<small>${escape(item.note)}</small>` : ""}</li>`,
        )
        .join("");
      const total = cart.reduce(
        (sum, item) => sum + findProduct(item.id).price * item.quantity,
        0,
      );
      showInfo(
        "Sua ideia está tomando forma.",
        `<p>Esta é sua seleção de mimos:</p><ul class="order-list">${list}</ul><p><strong>Subtotal demonstrativo: ${money(total)}</strong></p><p>As vendas ainda não estão disponíveis. Sua seleção continua salva neste navegador para você visitar novamente. Nenhum pedido foi enviado ou pagamento realizado.</p>`,
      );
      $("#back-to-cart").hidden = false;
      $("#info-dismiss").hidden = true;
    }
    if (target.id === "back-to-cart") {
      $("#info-dialog").close();
      updateCart();
      showDialog($("#cart-dialog"), $("#review-order"));
    }
  });

  $(".search-form").addEventListener("submit", (event) => {
    event.preventDefault();
    Object.assign(state, {
      category: "all",
      tab: "all",
      favorites: false,
      query: $("#search").value.trim(),
    });
    renderProducts();
    $("#produtos").scrollIntoView({ behavior: "smooth" });
  });
  mobileMenu?.addEventListener("click", () => {
    setMobileMenu(mobileMenu.getAttribute("aria-expanded") !== "true");
  });
  mainNav?.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMobileMenu(false);
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 600) setMobileMenu(false);
  });
  $("#search").addEventListener("input", (event) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.query = event.target.value.trim();
      state.category = "all";
      state.favorites = false;
      $("#category-select").value = "all";
      renderProducts();
    }, 220);
  });
  $("#category-select").addEventListener("change", (event) => {
    state.category = event.target.value;
    state.favorites = false;
    renderProducts();
  });
  $("#sort").addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderProducts();
  });
  $(".newsletter-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    showInfo(
      "Newsletter em preparação",
      "<p>O cadastro de e-mails será ativado quando a integração da newsletter estiver pronta. Nenhum endereço foi enviado ou armazenado.</p>",
    );
  });
  $(".hero-track").addEventListener("transitionend", (event) => {
    if (event.propertyName !== "transform" || heroPosition !== 3) return;
    showHeroSlide(0, false);
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        $(".hero-track").classList.remove("no-transition"),
      ),
    );
  });
  $(".hero").addEventListener("mouseenter", stopHeroRotation);
  $(".hero").addEventListener("mouseleave", startHeroRotation);
  $(".hero").addEventListener("focusin", stopHeroRotation);
  $(".hero").addEventListener("focusout", (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) startHeroRotation();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopHeroRotation();
    else startHeroRotation();
  });
  $$("dialog").forEach((dialog) => {
    dialog.addEventListener("close", () => {
      document.body.classList.toggle("modal-open", !!$("dialog[open]"));
      if (!$("dialog[open]") && lastDialogTrigger?.isConnected) {
        lastDialogTrigger.focus({ preventScroll: true });
        lastDialogTrigger = null;
      }
    });
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        dialog.close();
    });
  });
  $("#year").textContent = new Date().getFullYear();
  renderProducts();
  updateCart();
  startHeroRotation();
})();
