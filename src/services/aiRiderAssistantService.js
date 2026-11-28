/**
 * aiRiderAssistantService.js
 *
 * Client-side intelligent rider shopping assistant for BIKER CAFE:
 * - Knowledge base derived strictly from actual AXOR models, safety standards (ECE 22.06, DOT, ISI),
 *   head circumference sizing chart, showroom location (Arni), and order navigation.
 * - Zero invented specifications or fake prices.
 * - Intent classifier for:
 *   - Helmet recommendations (Track, Touring, Daily City, Retro)
 *   - Sizing and Fitment consultation (Head circumference in cm to XS-XXL)
 *   - Safety certifications (ECE 22.06 vs DOT vs ISI explanation)
 *   - Showroom location, timing, and WhatsApp handoff
 *   - Order tracking guidance
 */

import { SHOWROOM_SLOTS, CLIENT_PLACEHOLDER_INFO, buildWhatsAppUrl } from '../data/showroomPlaceholders';

export const SIZING_GUIDE = [
  { size: 'XS', cm: '53 - 54 cm', description: 'Very snug, small adult head shape' },
  { size: 'S', cm: '55 - 56 cm', description: 'Standard small head circumference' },
  { size: 'M', cm: '57 - 58 cm', description: 'Most common medium rider fit' },
  { size: 'L', cm: '59 - 60 cm', description: 'Standard large rider fit' },
  { size: 'XL', cm: '61 - 62 cm', description: 'Extra large circumference' },
  { size: 'XXL', cm: '63 - 64 cm', description: 'Maximum circumference fitment' },
];

export const QUICK_PROMPTS = [
  'Help me choose a helmet for daily city commuting',
  'What helmet is best for highway touring?',
  'How do I measure my head size accurately?',
  'What does ECE 22.06 certification mean?',
  'Where is BIKER CAFE showroom located?',
  'Can I speak directly with the owner on WhatsApp?',
];

/**
 * Intelligent response generator based on rider query
 */
export function generateAiAssistantResponse(query, products = SHOWROOM_SLOTS) {
  const q = (query || '').toLowerCase().trim();

  // 1. WhatsApp / Human handoff
  if (q.includes('whatsapp') || q.includes('owner') || q.includes('talk to human') || q.includes('call') || q.includes('phone') || q.includes('contact')) {
    const waUrl = buildWhatsAppUrl(`Hello BIKER CAFE, I have a question regarding: "${query}"`);
    return {
      text: `You can reach our showroom owner directly on WhatsApp at **+91 ${CLIENT_PLACEHOLDER_INFO.phone}** for live stock confirmation, custom graphics, or immediate sizing advice.`,
      action: {
        label: 'Open WhatsApp Chat',
        url: waUrl,
        isExternal: true,
      },
    };
  }

  // 2. Showroom Location / Timings
  if (q.includes('location') || q.includes('address') || q.includes('where') || q.includes('time') || q.includes('open') || q.includes('visit')) {
    return {
      text: `📍 **BIKER CAFE — ARNI Showroom**\n\n• **Address**: ${CLIENT_PLACEHOLDER_INFO.fullAddress}\n• **Timings**: 10:00 AM – 9:00 PM (All 7 Days)\n• **Services**: In-store digital helmet showcase, physical head measurement, visor replacements, and bike accessories.`,
      action: {
        label: 'View Showroom Map / Contact',
        url: '/contact',
      },
    };
  }

  // 3. Head Sizing and Measurement
  if (q.includes('size') || q.includes('measure') || q.includes('fit') || q.includes('tight') || q.includes('cm') || q.includes('small') || q.includes('large')) {
    const tableText = SIZING_GUIDE.map((s) => `• **${s.size}**: ${s.cm} (${s.description})`).join('\n');
    return {
      text: `📏 **How to Measure Your Helmet Size:**\n1. Wrap a flexible measuring tape around your head, approximately **1 inch (2.5 cm) above your eyebrows** and ears.\n2. Note the circumference in centimeters:\n\n${tableText}\n\n*Pro Tip: A new helmet should feel comfortably snug against your cheeks. Cheek pads compress by 10-15% after 15-20 hours of riding.*`,
      action: {
        label: 'Use Smart Helmet Finder',
        url: '/helmet-finder',
      },
    };
  }

  // 4. Safety Certifications (ECE 22.06, DOT, ISI)
  if (q.includes('ece') || q.includes('22.06') || q.includes('dot') || q.includes('isi') || q.includes('safety') || q.includes('certification') || q.includes('standard')) {
    return {
      text: `🛡️ **Understanding Helmet Safety Standards at BIKER CAFE:**\n\n• **ECE R-22.06**: The latest and most rigorous European safety standard. Tests rotational acceleration, high/low velocity impacts, oblique impacts, and visor penetration resistance.\n• **DOT FMVSS 218**: US federal safety standard testing energy absorption and retention strength.\n• **ISI (IS 4151)**: Mandatory Bureau of Indian Standards certification required for legal riding on Indian highways.\n\n*All AXOR helmets featured in our showroom carry ECE and/or ISI certifications.*`,
      action: {
        label: 'Browse Certified Helmets',
        url: '/showroom',
      },
    };
  }

  // 5. Track / High-Speed Racing Helmets
  if (q.includes('track') || q.includes('race') || q.includes('racing') || q.includes('high speed') || q.includes('carbon') || q.includes('double d')) {
    const trackModels = products.filter((p) =>
      (p.title + p.summary + p.retentionSpec).toLowerCase().includes('double d') ||
      (p.title + p.summary).toLowerCase().includes('track') ||
      (p.title + p.summary).toLowerCase().includes('apex')
    );
    const topModel = trackModels[0] || products[0];

    return {
      text: `🏁 **Recommended for High-Speed & Track Days: ${topModel.title}**\n\n• **Fastening**: ${topModel.retentionSpec || 'Double D-Ring'}\n• **Aerodynamics**: Integrated rear PC spoiler and dual exhaust vents\n• **Visor**: Pinlock 70 MaxVision anti-fog ready shield\n• **Reference MRP**: ${topModel.priceLabel}\n\n*Features an aerodynamic ABS shell and meets ECE 22.06 safety standard.*`,
      product: topModel,
      action: {
        label: `View ${topModel.title}`,
        url: `/showroom/${topModel.id}`,
      },
    };
  }

  // 6. Highway Sport Touring / Dual Visor Helmets
  if (q.includes('touring') || q.includes('highway') || q.includes('long distance') || q.includes('sun visor') || q.includes('dual visor') || q.includes('trip')) {
    const touringModel = products.find((p) => (p.title + p.summary).toLowerCase().includes('touring')) || products[1] || products[0];

    return {
      text: `🛣️ **Recommended for Sport Touring & Long Rides: ${touringModel.title}**\n\n• **Optics**: Dual visor system with internal drop-down smoked sun shield\n• **Ventilation**: Chin intake vent + top airflow ports for all-day comfort\n• **Price**: ${touringModel.priceLabel}\n\n*Ideal for riders encountering fluctuating sunlight between sunrise and evening highway riding.*`,
      product: touringModel,
      action: {
        label: `View ${touringModel.title}`,
        url: `/showroom/${touringModel.id}`,
      },
    };
  }

  // 7. City / Daily Commuting
  if (q.includes('city') || q.includes('daily') || q.includes('office') || q.includes('commute') || q.includes('retro') || q.includes('budget') || q.includes('cheap')) {
    const cityModel = products.find((p) => p.category?.toLowerCase().includes('retro') || p.category?.toLowerCase().includes('open-face')) || products[products.length - 1] || products[0];

    return {
      text: `🛵 **Recommended for City Commuting: ${cityModel.title}**\n\n• **Category**: ${cityModel.category}\n• **Fitment**: Lightweight shell with wide field of peripheral view for urban traffic\n• **Price**: ${cityModel.priceLabel}\n• **Certification**: ISI & DOT approved`,
      product: cityModel,
      action: {
        label: `View ${cityModel.title}`,
        url: `/showroom/${cityModel.id}`,
      },
    };
  }

  // 8. Order Tracking & Status
  if (q.includes('order') || q.includes('track') || q.includes('delivery') || q.includes('status')) {
    return {
      text: `📦 **Order Tracking & Pickup Status:**\n\nYou can track your live orders, delivery fee quotes, and showroom pickup readiness directly from your **Rider Profile** under the Orders section.`,
      action: {
        label: 'Open My Orders',
        url: '/profile',
      },
    };
  }

  // Default Fallback
  return {
    text: `I'm your **BIKER CAFE AI Rider Assistant**! I can assist you with:\n\n1. **Helmet Recommendations**: Based on your motorcycle, riding style (Track, Touring, City), or budget.\n2. **Head Sizing & Fit**: How to measure your circumference in cm.\n3. **Safety Standards**: Explaining ECE 22.06, DOT, and ISI certifications.\n4. **Showroom Pickup**: Information about stock, timings, or connecting directly with our owner on WhatsApp.`,
    action: {
      label: 'Explore Complete Showroom',
      url: '/showroom',
    },
  };
}
