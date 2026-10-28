export interface SamplePreset {
  id: string;
  nameEn: string;
  nameHi: string;
  category: string;
  descriptionEn: string;
  descriptionHi: string;
  svgDataUri: string;
}

// Generate realistic SVG representations that render cleanly into canvas/files
function createSvgDataUri(title: string, subtitle: string, color: string, badge: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
      <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${color}"/>
        <stop offset="100%" stop-color="#38bdf8"/>
      </linearGradient>
    </defs>
    <rect width="600" height="400" fill="url(#bg)"/>
    <circle cx="300" cy="180" r="110" fill="#334155" opacity="0.6"/>
    <rect x="230" y="110" width="140" height="140" rx="20" fill="${color}" opacity="0.2"/>
    <path d="M260 210 L300 140 L340 210 Z" fill="${color}" opacity="0.8"/>
    <circle cx="300" cy="190" r="12" fill="#ffffff"/>
    <rect x="40" y="30" width="130" height="30" rx="8" fill="#1e293b" stroke="${color}" stroke-width="1.5"/>
    <text x="105" y="50" font-family="sans-serif" font-size="12" font-weight="bold" fill="${color}" text-anchor="middle">${badge}</text>
    <text x="300" y="310" font-family="sans-serif" font-size="22" font-weight="bold" fill="#f8fafc" text-anchor="middle">${title}</text>
    <text x="300" y="340" font-family="sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">${subtitle}</text>
    <rect x="50" y="370" width="500" height="4" rx="2" fill="url(#accent)"/>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'pothole',
    nameEn: 'Pothole Crater',
    nameHi: 'सड़क का गड्ढा',
    category: 'Pothole / Road Damage',
    descriptionEn: 'Deep 1.5m crater on Sector 4 main arterial road with exposed aggregate',
    descriptionHi: 'सेक्टर 4 मुख्य सड़क पर लगभग 1.5 मीटर गहरा गड्ढा, बिखरी बजरी',
    svgDataUri: createSvgDataUri(
      'Deep Road Pothole Evidence',
      'Location: Sector 4 Main Road | Depth: ~15cm | Traffic Hazard',
      '#f97316',
      'POTHOLE'
    ),
  },
  {
    id: 'garbage',
    nameEn: 'Garbage Dump',
    nameHi: 'कचरे का ढेर',
    category: 'Garbage / Illegal Dumping',
    descriptionEn: 'Overflowing municipal waste bin causing street blockage and foul odor',
    descriptionHi: 'सड़क किनारे नगर निगम कचरा पात्र का उफान, दुर्गंध एवं गंदगी',
    svgDataUri: createSvgDataUri(
      'Overflowing Waste Site',
      'Location: Ward 12 Market Complex | Health & Sanitation Hazard',
      '#eab308',
      'SANITATION'
    ),
  },
  {
    id: 'wire',
    nameEn: 'Hanging Wire',
    nameHi: 'लटकता बिजली तार',
    category: 'Streetlight / Electrical Hazard',
    descriptionEn: 'Snapped overhead power cable dangling near pedestrian crossing',
    descriptionHi: 'पैदल मार्ग के पास लटकता हुआ बिजली का खुला तार, करंट का खतरा',
    svgDataUri: createSvgDataUri(
      'Exposed Electrical Cable',
      'Location: Crossroad 3 | High Voltage Hazard | Immediate Risk',
      '#ef4444',
      'CRITICAL DANGER'
    ),
  },
  {
    id: 'drain',
    nameEn: 'Drainage Overflow',
    nameHi: 'सीवर उफान',
    category: 'Water Leakage / Drainage',
    descriptionEn: 'Choked underground storm drain overflowing with dirty runoff',
    descriptionHi: 'अवरुद्ध भूमिगत नाला, सड़क पर गंदे पानी का भराव',
    svgDataUri: createSvgDataUri(
      'Choked Sewer & Waterlogging',
      'Location: Block B Colony Gate | Disease Vector Hazard',
      '#06b6d4',
      'DRAINAGE'
    ),
  },
];

/**
 * Converts a sample SVG data URI into a browser File object for testing POST /api/analyze
 */
export async function samplePresetToFile(preset: SamplePreset): Promise<File> {
  const res = await fetch(preset.svgDataUri);
  const blob = await res.blob();
  return new File([blob], `${preset.id}_sample_evidence.png`, {
    type: 'image/png',
  });
}
