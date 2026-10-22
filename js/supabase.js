(() => {
  "use strict";

  const projectUrl = "https://hsogypihvmkurnwkefhi.supabase.co";
  const publishableKey = "sb_publishable_ly8iWrLvONOqV4uIdJJIqg_6QQhZR-N";
  const fallback = window.MINIMALI_PRODUCTS;

  window.MINIMALI_PRODUCTS_READY = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const fields = [
        "id",
        "name",
        "category",
        "label",
        "price",
        "placeholder_color",
        "badge",
        "featured",
        "is_new",
        "description",
      ].join(",");
      const response = await fetch(
        `${projectUrl}/rest/v1/products?select=${fields}&order=sort_order.asc`,
        {
          headers: { apikey: publishableKey },
          signal: controller.signal,
        },
      );

      if (!response.ok) throw new Error(`Supabase respondeu ${response.status}`);

      const rows = await response.json();
      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error("O catálogo remoto está vazio");
      }

      return Object.freeze(
        rows.map((row) =>
          Object.freeze({
            id: row.id,
            name: row.name,
            category: row.category,
            label: row.label,
            price: Number(row.price),
            placeholderColor: row.placeholder_color,
            badge: row.badge,
            featured: row.featured,
            isNew: row.is_new,
            description: row.description,
          }),
        ),
      );
    } catch (error) {
      console.warn("Catálogo remoto indisponível; usando cópia local.", error);
      return fallback;
    } finally {
      clearTimeout(timeout);
    }
  })();
})();
