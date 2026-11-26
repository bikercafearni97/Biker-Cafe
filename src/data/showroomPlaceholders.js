// Centralized catalogue & showroom configuration for BIKER CAFE — ARNI.
// Reference MRPs and product descriptions sourced from official AXOR listings (axorhelmets.com).

export const SHOWROOM_FINISHES = [
  {
    id: 'obsidian-carbon',
    label: 'Obsidian Carbon',
    shellColor: '#12141a',
    stripeColor: '#e11d2a',
    visorColor: '#0f131c',
    visorSheen: '#d6dce8',
    metalColor: '#b7bfcc',
    roughness: 0.16,
  },
  {
    id: 'crimson-apex',
    label: 'Racing Red',
    shellColor: '#b9121e',
    stripeColor: '#e2e6ef',
    visorColor: '#0c0d12',
    visorSheen: '#ff424e',
    metalColor: '#d7dce6',
    roughness: 0.14,
  },
  {
    id: 'liquid-silver',
    label: 'Metallic Silver',
    shellColor: '#9aa2b0',
    stripeColor: '#e11d2a',
    visorColor: '#111622',
    visorSheen: '#e5ebf5',
    metalColor: '#edf1f7',
    roughness: 0.12,
  },
];

export const SHOWROOM_CATEGORIES = [
  'All',
  'Apex Series',
  'Performance Full-Face',
  'Open-Face Retro',
];

export const SHOWROOM_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const PRICE_DISCLAIMER =
  'Price and availability may vary. Contact BIKER CAFE for confirmation.';

export const REFERENCE_MRP_LABEL = 'Reference MRP – confirm with showroom';

export const SHOWROOM_SLOTS = [
  {
    id: 'axor-apex-hunter',
    slotCode: 'AXOR // 01',
    brand: 'AXOR Helmets',
    category: 'Apex Series',
    title: 'AXOR Apex Hunter',
    subtitle: 'Full-Face Sport Touring Helmet',
    priceLabel: '₹5,498',
    referenceNote: REFERENCE_MRP_LABEL,
    image: '/assets/axor/apex-hunter.jpg',
    certification: 'ECE R-22.06, DOT FMVSS No. 218 & ISI',
    shellSpec: 'ABS Material Shell (Dual EPS Liner)',
    weightSpec: '1600 ± 50 g',
    visorSpec: 'Optically Correct Quick-Release Visor + Internal Sun Visor (Pinlock Compatible)',
    ventilationSpec: 'Upper Air Intake + Integrated Spoiler Back Outlet Vent',
    retentionSpec: 'Double D-Ring Fastening',
    fitNote: 'Sport-Touring Fit — Confirm sizing at showroom',
    summary:
      'Featuring Hunter graphics on the AXOR Apex full-face platform with an ABS shell, internal drop-down sun visor, upper air intake and spoiler-integrated rear outlet ventilation, and Double D-ring fastening.',
    highlights: [
      'ABS shell with dual EPS impact-absorbing liner',
      'Internal sun visor + optically correct Pinlock-compatible outer visor',
      'Upper air intake vent and back outlet vent integrated with PC spoiler',
      'Double D-ring retention lock, breath guard, and chin curtain',
      'ECE R-22.06, DOT FMVSS No. 218, and ISI safety standards',
    ],
    accentColor: '#e11d2a',
    previewFinish: 'obsidian-carbon',
  },
  {
    id: 'axor-apex-venomous',
    slotCode: 'AXOR // 02',
    brand: 'AXOR Helmets',
    category: 'Apex Series',
    title: 'AXOR Apex Venomous',
    subtitle: 'Sport-Touring Full-Face Helmet',
    priceLabel: '₹5,498',
    referenceNote: REFERENCE_MRP_LABEL,
    image: '/assets/axor/apex-venomous.jpg',
    certification: 'ECE R-22.06, DOT FMVSS No. 218 & ISI',
    shellSpec: 'ABS Material Shell (Dual EPS Liner)',
    weightSpec: '1600 ± 50 g',
    visorSpec: 'Optically Correct Visor + Internal Sun Visor (Pinlock System)',
    ventilationSpec: 'Upper Air Intake + Spoiler-Integrated Rear Outlet Vent',
    retentionSpec: 'Double D-Ring Fastening',
    fitNote: 'Sport-Touring Fit — Confirm sizing at showroom',
    summary:
      'Built on AXOR Apex sport-touring architecture for stability and aerodynamic performance, pairing an ABS shell and integrated rear polycarbonate spoiler with an internal sun visor and Double D-ring lock.',
    highlights: [
      'Sport-touring aerodynamic shell with integrated polycarbonate spoiler',
      'ABS shell with dual EPS liner and Double D-ring fastening',
      'Internal sun visor + quick tool-less optically correct visor with Pinlock system',
      'Upper intake vent, spoiler-integrated rear exhaust, breath guard, and chin curtain',
      'ECE R-22.06, DOT FMVSS No. 218, and ISI certified',
    ],
    accentColor: '#ff2e3b',
    previewFinish: 'crimson-apex',
  },
  {
    id: 'axor-apex-ascetic',
    slotCode: 'AXOR // 03',
    brand: 'AXOR Helmets',
    category: 'Apex Series',
    title: 'AXOR Apex Ascetic',
    subtitle: 'Full-Face Graphic Helmet',
    priceLabel: '₹5,498',
    referenceNote: REFERENCE_MRP_LABEL,
    image: '/assets/axor/apex-ascetic.jpg',
    certification: 'ECE R-22.06, DOT FMVSS No. 218 & ISI',
    shellSpec: 'ABS Material Shell (Dual EPS Liner)',
    weightSpec: '1600 ± 50 g',
    visorSpec: 'Optically Correct Visor + Internal Sun Visor',
    ventilationSpec: 'Upper Air Intake + Spoiler-Integrated Exhaust Vent',
    retentionSpec: 'Double D-Ring Fastening',
    fitNote: 'Sport-Touring Fit — Confirm sizing at showroom',
    summary:
      'Distinctive Ascetic graphic styling over the AXOR Apex ABS shell platform, combining an internal sun visor, flow-through ventilation, integrated polycarbonate spoiler, and Double D-ring security.',
    highlights: [
      'Distinctive Ascetic graphics across the aerodynamic Apex shell',
      'ABS high-protection shell with dual EPS liner',
      'Internal sun visor + quick, tool-less optically correct main visor',
      'Integrated tough polycarbonate spoiler and flow-through ventilation system',
      'ECE R-22.06, DOT FMVSS No. 218, and ISI certified',
    ],
    accentColor: '#cfd5df',
    previewFinish: 'liquid-silver',
  },
  {
    id: 'axor-agera',
    slotCode: 'AXOR // 04',
    brand: 'AXOR Helmets',
    category: 'Performance Full-Face',
    title: 'AXOR Agera',
    subtitle: 'Full-Face Helmet with Spoiler',
    priceLabel: '₹9,251',
    referenceNote: REFERENCE_MRP_LABEL,
    image: '/assets/axor/axor-agera.png',
    certification: 'ECE 22.06, DOT FMVSS No. 218 & ISI (IS:4151)',
    shellSpec: 'ABS High Impact Shell',
    weightSpec: '1700 ± 50 g',
    visorSpec: 'Optically Correct UV Visor + Internal Smoke Sun Visor (Pinlock-Ready)',
    ventilationSpec: 'Top Vent + Dual Brow Vents + Mouth Vent + Spoiler Rear Exhaust',
    retentionSpec: 'Double D-Ring Buckle + EQRS',
    fitNote: 'Performance Full-Face Fit — Confirm sizing at showroom',
    summary:
      'High-performance full-face helmet built for aggressive styling and wind-cheating aerodynamics, featuring an active spoiler-integrated rear exhaust, Dual Shield System, and Emergency Quick Release System (EQRS).',
    highlights: [
      'ABS High Impact shell with Emergency Quick Release System (EQRS)',
      'Single rear spoiler that reduces drag and acts as the rear exhaust vent',
      'Top, dual brow-position, and mouth vents with included chin curtain',
      'Tool-less UV-protected outer visor, internal smoke sun visor, and Pinlock-ready optics',
      'ECE 22.06, DOT FMVSS No. 218, and ISI (IS:4151) certified',
    ],
    accentColor: '#e11d2a',
    previewFinish: 'obsidian-carbon',
  },
  {
    id: 'axor-retro-jet',
    slotCode: 'AXOR // 05',
    brand: 'AXOR Helmets',
    category: 'Open-Face Retro',
    title: 'AXOR Retro Jet',
    subtitle: 'Classic Open-Face Heritage Helmet',
    priceLabel: '₹2,951',
    referenceNote: REFERENCE_MRP_LABEL,
    image: '/assets/axor/retro-jet.jpg',
    certification: 'ISI & DOT Certified (FMVSS 218)',
    shellSpec: 'Fiberglass Composite Shell (Multi-Density EPS)',
    weightSpec: 'Up to 1200 g',
    visorSpec: 'Open-Face Silhouette (Shaded Peak / Visor Compatible)',
    ventilationSpec: 'Chin Air Vent',
    retentionSpec: 'Micrometric Chin Strap',
    fitNote: 'Open-Face Cruiser / Cafe Fit — Confirm sizing at showroom',
    summary:
      'Classic heritage open-face helmet crafted with a fiberglass composite shell, genuine leather trims and leather neck roll, hypoallergenic removable interior, and micrometric chin strap.',
    highlights: [
      'Fiberglass composite shell with multi-density EPS liner (up to 1200 g)',
      'Genuine leather trims, leather neck roll, and removable anti-bacterial interior',
      'Hypoallergenic comfort liner with classic cafe-racer and cruiser styling',
      'Micrometric chin strap retention and chin air vent',
      'ISI and DOT (FMVSS 218) safety certified',
    ],
    accentColor: '#cfd5df',
    previewFinish: 'liquid-silver',
  },
  {
    id: 'axor-brutale-airwaves',
    slotCode: 'AXOR // 06',
    brand: 'AXOR Helmets',
    category: 'Performance Full-Face',
    title: 'AXOR Brutale Airwaves',
    subtitle: 'Full-Face Dual Spoiler Helmet',
    priceLabel: '₹7,991',
    referenceNote: REFERENCE_MRP_LABEL,
    image: '/assets/axor/brutale-airwaves.png',
    certification: 'ECE 22.06, DOT FMVSS No. 218 & ISI (IS:4151)',
    shellSpec: 'Lightweight Shell Construction',
    weightSpec: '1600 ± 50 g',
    visorSpec: 'Scratch-Resistant Quick-Release Pinlock-Ready Visor',
    ventilationSpec: 'Multi-Point Top & Rear Exhaust Vents',
    retentionSpec: 'Official Listing Specification (Confirm at Showroom)',
    fitNote: 'Sport / Adventure-Touring Fit — Confirm sizing at showroom',
    summary:
      'Full-face helmet pairing adventure-touring styling and topographic contour graphics with Dual System Spoilers for aerodynamic stability, Pinlock-ready visor optics, and multi-point airflow.',
    highlights: [
      'Dual System Spoilers integrated at the rear for high-speed stability',
      'Lightweight shell (~1600 ± 50 g) with topographic contour graphics',
      'Clear, scratch-resistant Pinlock-ready visor with quick-release locking mechanism',
      'Multi-point top and rear ventilation with removable, washable comfort liner',
      'ECE 22.06, DOT FMVSS No. 218, and ISI (IS:4151) certified',
    ],
    accentColor: '#e11d2a',
    previewFinish: 'crimson-apex',
  },
];

export const SHOWROOM_PILLARS = [
  {
    index: '01',
    title: 'Precision Fitment',
    metric: 'In-Showroom Sizing Guidance',
    description:
      'Dedicated helmet sizing guidance and liner calibration tailored to rider head geometry and riding posture.',
  },
  {
    index: '02',
    title: 'Curated Headwear',
    metric: 'AXOR Certified Lineup',
    description:
      'Showroom display architecture designed to spotlight verified safety certifications, visor optics, and shell finishes.',
  },
  {
    index: '03',
    title: 'Rider Lounge & Cafe',
    metric: 'BIKER CAFE — Arni',
    description:
      'A meeting ground for riders to inspect gear up close, compare aerodynamics, and connect over espresso.',
  },
];

export const CLIENT_PLACEHOLDER_INFO = {
  brandName: 'BIKER CAFE',
  locationLabel: 'ARNI',
  ownerName: 'A. Narasimman',
  ownerCredit: 'Owned & Managed by A. Narasimman',
  tagline: 'Premium Motorcycle & Helmet Showroom',
  addressLine1: '123, Karthikeyan Road',
  addressLine2: 'Arni – 632301, T.V. Malai District, Tamil Nadu, India',
  fullAddress: '123, Karthikeyan Road, Arni – 632301, T.V. Malai District, Tamil Nadu, India',
  phone: '73958 56611',
  phoneHref: 'tel:+917395856611',
  whatsappDisplay: '+91 73958 56611',
  whatsappUrl: 'https://wa.me/917395856611',
  email: 'Bikercafearni97@gmail.com',
  emailHref: 'mailto:Bikercafearni97@gmail.com',
  mapsUrl:
    'https://www.google.com/maps/dir/?api=1&destination=123%2C+Karthikeyan+Road%2C+Arni+632301%2C+T.V.+Malai+District%2C+Tamil+Nadu%2C+India',
};

export const HOME_WHATSAPP_MESSAGE =
  'Hello BIKER CAFE, I would like to know more about your products and services.';

export function buildWhatsAppUrl(message = HOME_WHATSAPP_MESSAGE) {
  if (!message) return CLIENT_PLACEHOLDER_INFO.whatsappUrl;
  return `${CLIENT_PLACEHOLDER_INFO.whatsappUrl}?text=${encodeURIComponent(message)}`;
}

export const ABOUT_CATEGORIES = [
  {
    index: '01',
    title: 'Riding Gears',
    tag: 'CATEGORY // 01',
    description:
      'Dedicated focus on protective headwear and riding gear built around rider comfort and road readiness.',
  },
  {
    index: '02',
    title: 'Bike Modification',
    tag: 'CATEGORY // 02',
    description:
      'Dedicated focus on motorcycle modification tailored to rider preferences and street presence.',
  },
  {
    index: '03',
    title: 'Accessories',
    tag: 'CATEGORY // 03',
    description:
      'Essential motorcycle and rider accessories curated to complement everyday rides and touring.',
  },
];

export const INQUIRY_TOPICS = [
  'AXOR Helmets & Sizing',
  'Riding Gears',
  'Bike Modification',
  'Accessories',
  'General Inquiry',
];
