// ============================================================
//  RAIDZONE — Dynamic SEO & Schema Manager
//  Usage: import { SEO } from './seo.js'
//  Call SEO.update(pageData) on every route load.
// ============================================================

export const SEO = (() => {

  // ─── Internal Helpers ────────────────────────────────────

  function setMeta(name, content, isProperty = false) {
    if (!content) return;
    const attr = isProperty ? 'property' : 'name';
    let tag = document.querySelector(`meta[${attr}="${name}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attr, name);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  }

  function setCanonical(url) {
    if (!url) return;
    let tag = document.querySelector('link[rel="canonical"]');
    if (!tag) {
      tag = document.createElement('link');
      tag.setAttribute('rel', 'canonical');
      document.head.appendChild(tag);
    }
    tag.setAttribute('href', url);
  }

  function injectSchema(id, schemaObject) {
    // Remove old version of this schema if it exists
    const existing = document.getElementById(id);
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    script.textContent = JSON.stringify(schemaObject, null, 2);
    document.head.appendChild(script);
  }

  function removeSchema(id) {
    const existing = document.getElementById(id);
    if (existing) existing.remove();
  }

  // ─── Schema Builders ─────────────────────────────────────

  function buildProductSchema({ name, description, price, url, image, availability, rating, reviewCount }) {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": name,
      "description": description,
      "image": image ? [image] : [],
      "brand": {
        "@type": "Brand",
        "name": "RAIDZONE Market"
      },
      "offers": {
        "@type": "Offer",
        "url": url,
        "priceCurrency": "USD",
        "price": price,
        "availability": availability ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "seller": {
          "@type": "Organization",
          "name": "RAIDZONE Market"
        }
      }
    };
    
    if (rating && reviewCount > 0) {
      schema.aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": rating,
        "reviewCount": reviewCount
      };
    }
    
    return schema;
  }

  function buildBreadcrumbSchema(crumbs) {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": crumbs.map((crumb, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": crumb.name,
        "item": crumb.url
      }))
    };
  }

  function buildFAQSchema(faqs) {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };
  }

  // ─── Page-Type Handlers ──────────────────────────────────

  function applyHomepage() {
    const BASE = "https://www.raidzonemarket.com";

    document.title = "RAIDZONE Market — Premium Game Currencies, Items & Digital Goods";
    setMeta('description', 'RAIDZONE is your premium global marketplace for instant game currency, rare items, boosting services, and regional gift cards. Delivered in minutes, safe and trusted.');
    setMeta('keywords', 'arc raiders coins, delta force boosting, game currency shop, instant digital delivery, buy game items, raidzone market');
    setCanonical(BASE);

    // Open Graph
    setMeta('og:title', 'RAIDZONE Market — Premium Game Currencies & Digital Goods', true);
    setMeta('og:description', 'Instant delivery. Safe transactions. Best prices.', true);
    setMeta('og:url', BASE, true);
    setMeta('og:type', 'website', true);
    setMeta('twitter:card', 'summary_large_image', false);

    // Schemas
    removeSchema('schema-product');
    removeSchema('schema-faq');

    injectSchema('schema-breadcrumb', buildBreadcrumbSchema([
      { name: "Home", url: BASE }
    ]));
  }

  function applyCategory(categoryData) {
    const BASE = "https://www.raidzonemarket.com";
    const { name, slug, faqs } = categoryData;
    const url = `${BASE}/${slug}`;

    document.title = `Buy ${name} — Instant Delivery | RAIDZONE Market`;
    setMeta('description', `Shop the best ${name} prices. Instant delivery, secure transactions, and 24/7 support. Trusted by thousands of players.`);
    setCanonical(url);

    // Open Graph
    setMeta('og:title', `Buy ${name} | RAIDZONE Market`, true);
    setMeta('og:description', `Get ${name} delivered instantly. Best prices guaranteed.`, true);
    setMeta('og:url', url, true);
    setMeta('og:type', 'website', true);
    setMeta('twitter:card', 'summary_large_image', false);

    // Schemas
    removeSchema('schema-product');

    injectSchema('schema-breadcrumb', buildBreadcrumbSchema([
      { name: "Home", url: BASE },
      { name: name, url: url }
    ]));

    if (faqs && faqs.length > 0) {
      injectSchema('schema-faq', buildFAQSchema(faqs));
    } else {
      removeSchema('schema-faq');
    }
  }

  function applyProduct(productData) {
    const BASE = "https://www.raidzonemarket.com";
    const { name, slug, price, categoryName, categorySlug, description, image, inStock, rating, reviewCount } = productData;
    const url = `${BASE}/buy/${slug}`;
    const metaDesc = description || `Buy ${name} instantly. Safe delivery, best prices, trusted marketplace. Get your ${name} in minutes.`;

    document.title = `Buy ${name} – Instant Delivery | RAIDZONE Market`;
    setMeta('description', metaDesc);
    setCanonical(url);

    // Open Graph
    setMeta('og:title', `Buy ${name} | RAIDZONE Market`, true);
    setMeta('og:description', metaDesc, true);
    setMeta('og:url', url, true);
    setMeta('og:type', 'product', true);
    if (image) setMeta('og:image', image, true);
    
    setMeta('twitter:card', 'summary_large_image', false);
    setMeta('twitter:title', `Buy ${name} | RAIDZONE Market`, false);
    setMeta('twitter:description', metaDesc, false);
    if (image) setMeta('twitter:image', image, false);

    // Schemas
    if (productData.faq && productData.faq.length > 0) {
      injectSchema('schema-faq', buildFAQSchema(productData.faq));
    } else {
      removeSchema('schema-faq');
    }

    injectSchema('schema-product', buildProductSchema({
      name,
      description: metaDesc,
      price,
      url,
      image,
      availability: inStock,
      rating,
      reviewCount
    }));

    injectSchema('schema-breadcrumb', buildBreadcrumbSchema([
      { name: "Home", url: BASE },
      { name: categoryName || 'Catalog', url: `${BASE}/${categorySlug || ''}` },
      { name: `Buy ${name}`, url: url }
    ]));
  }

  // ─── Public API ───────────────────────────────────────────

  function update(pageData) {
    switch (pageData.type) {
      case 'homepage': applyHomepage(); break;
      case 'category': applyCategory(pageData); break;
      case 'product':  applyProduct(pageData); break;
      default: console.warn('SEO.update: unknown page type', pageData.type);
    }
  }

  return { update };

})();
