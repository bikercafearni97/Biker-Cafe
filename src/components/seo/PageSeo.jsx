import { useEffect } from 'react';

const DEFAULT_SEO = {
  title: 'BIKER CAFE — ARNI | AXOR Helmets, Riding Gears & Motorcycle Accessories',
  description:
    'BIKER CAFE in Arni, Tamil Nadu — Motorcycle, AXOR helmet, riding gear, bike modification, and accessories showroom at 123, Karthikeyan Road.',
  robots: 'index, follow',
  ogType: 'website',
  ogImage: '/assets/axor/apex-hunter.jpg',
  ogImageAlt: 'AXOR Apex Hunter full-face helmet featured at BIKER CAFE Arni',
};

function upsertMetaTag(attributeName, attributeValue, content) {
  if (!content) return;
  const selector = `meta[${attributeName}="${attributeValue}"]`;
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attributeName, attributeValue);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function applySeoMetadata({ title, description, robots, ogType, ogImage, ogImageAlt }) {
  if (title) {
    document.title = title;
    upsertMetaTag('property', 'og:title', title);
    upsertMetaTag('name', 'twitter:title', title);
  }

  if (description) {
    upsertMetaTag('name', 'description', description);
    upsertMetaTag('property', 'og:description', description);
    upsertMetaTag('name', 'twitter:description', description);
  }

  upsertMetaTag('name', 'robots', robots);
  upsertMetaTag('property', 'og:type', ogType);
  upsertMetaTag('property', 'og:image', ogImage);
  upsertMetaTag('property', 'og:image:alt', ogImageAlt);
  upsertMetaTag('name', 'twitter:image', ogImage);

  // Ensure no placeholder or localhost canonical URL is left attached
  const existingCanonical = document.head.querySelector('link[rel="canonical"]');
  if (existingCanonical) {
    existingCanonical.remove();
  }
}

/**
 * Lightweight route-level SEO updater for CSR navigation.
 * Canonical URLs are intentionally left unset until a production domain is configured.
 */
export default function PageSeo({
  title = DEFAULT_SEO.title,
  description = DEFAULT_SEO.description,
  robots = DEFAULT_SEO.robots,
  ogType = DEFAULT_SEO.ogType,
  ogImage = DEFAULT_SEO.ogImage,
  ogImageAlt = DEFAULT_SEO.ogImageAlt,
}) {
  useEffect(() => {
    applySeoMetadata({ title, description, robots, ogType, ogImage, ogImageAlt });

    return () => {
      applySeoMetadata(DEFAULT_SEO);
    };
  }, [title, description, robots, ogType, ogImage, ogImageAlt]);

  return null;
}
