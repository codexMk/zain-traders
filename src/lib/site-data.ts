import type {
  AboutHighlight,
  BusinessInfo,
  Feature,
  HeroImage,
  NavItem,
  Product,
  ProductImage,
  StatItem,
  SupplyArea,
} from "@/types/site";

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://zain-traders.vercel.app";

const mapQuery = "Mallik Nagar, Kondhwa, Pune, Maharashtra 411048";
const branchMapQuery = "Bus Stand, Paranda, Dharashiv, Maharashtra 413502";

export const businessInfo: BusinessInfo = {
  name: "\u095b\u0948\u0928 \u091f\u094d\u0930\u0947\u0921\u0930\u094d\u0938",
  displayName: "Zain Traders",
  industry: "Wholesale Spices & Dry Fruits",
  taglineMr:
    "\u0936\u0941\u0926\u094d\u0927 \u092e\u0938\u093e\u0932\u0947 \u2022 \u092f\u094b\u0917\u094d\u092f \u0926\u0930 \u2022 \u0935\u093f\u0936\u094d\u0935\u093e\u0938\u0942 \u0938\u0947\u0935\u093e",
  taglineEn: "Trusted Wholesale Supplier of Spices and Dry Fruits",
  address: "Head Office: Mallik Nagar, Kondhwa, Pune 411048 • Branch Office: Bus Stand, Paranda, Dharashiv 413502",
  offices: [
    {
      label: "Head Office",
      address: "Mallik Nagar, Kondhwa, Pune 411048",
      directionsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`,
    },
    {
      label: "Branch Office",
      address: "Bus Stand, Paranda, Dharashiv 413502",
      directionsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branchMapQuery)}`,
    },
  ],
  supplyAreasLabel: "Pune • Dharashiv • Solapur • Sambhajinagar",
  locationLabel: "Pune • Paranda, Maharashtra",
  whatsappNumber: "919021276946",
  whatsappHref:
    "https://wa.me/919021276946?text=Namaskar%20Zain%20Traders%2C%20I%20want%20wholesale%20details%20for%20your%20spices%20and%20dry%20fruits.",
  mapEmbedUrl: `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`,
  mapDirectionsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`,
  primaryPhone: {
    label: "Primary Line",
    number: "9307427731",
    href: "tel:+919307427731",
  },
  contactNumbers: [
    {
      label: "Primary Line",
      number: "9307427731",
      href: "tel:+919307427731",
    },
    {
      label: "Mobile",
      number: "9021276946",
      href: "tel:+919021276946",
    },
  ],
};

export const seoDescription =
  "Zain Traders is a wholesale supplier of spices and dry fruits with offices in Pune and Paranda, serving retailers, dealers, hotels, resellers, and bulk buyers across Maharashtra.";

export const seoKeywords = [
  "Zain Traders",
  "\u095b\u0948\u0928 \u091f\u094d\u0930\u0947\u0921\u0930\u094d\u0938",
  "whole spices wholesale Maharashtra",
  "dry fruits wholesale Paranda",
  "jeera dhana lavang supplier",
  "cashew almond pista wholesale",
  "Dharashiv spice supplier",
  "Solapur dry fruit wholesale",
  "Sambhajinagar spices trader",
  "export quality whole spices",
];

export const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const heroImages: HeroImage[] = [
  {
    src: "/images/spice-hero.jpg",
    alt: "Premium assortment of whole spices styled for wholesale presentation",
    label: "Premium wholesale curation",
  },
  {
    src: "/images/spice-spoons-dark.jpg",
    alt: "Whole spices arranged on spoons against a premium dark background",
    label: "Cleanly selected lots",
  },
  {
    src: "/images/spice-wood-spoons.jpg",
    alt: "Whole spices with cinnamon, pepper, and bay leaf arranged on wood",
    label: "Market-ready ingredients",
  },
  {
    src: "/images/spice-earthy.jpg",
    alt: "Earthy still life of whole spices styled for premium trade branding",
    label: "Trade-first presentation",
  },
  {
    src: "/images/spice-assortment.jpg",
    alt: "Colorful assortment of premium spices and dry ingredients",
    label: "Expanded category range",
  },
];

export const stats: StatItem[] = [
  { value: 21, label: "Featured trade products" },
  { value: 3, label: "Active supply regions" },
  { value: 4, label: "Buyer segments served" },
];

export const heroBadges = [
  "Wholesale spices & dry fruits",
  "Retailer, dealer & HoReCa supply",
  "Fast WhatsApp trade support",
];

export const aboutHighlights: AboutHighlight[] = [
  {
    title: "Family-led reliability",
    description:
      "Straight dealing, dependable quality checks, and long-term wholesale relationships built order by order.",
  },
  {
    title: "Focused product curation",
    description:
      "A practical range of daily-trade spices and premium dry fruits selected for repeat movement and clean presentation.",
  },
  {
    title: "Bulk-ready supply",
    description:
      "Practical packing options and clear minimum-order guidance help trade buyers plan their purchases with confidence.",
  },
];

const createGallery = (src: string, englishName: string): ProductImage[] => [
  {
    src,
    alt: `${englishName} catalogue lot view`,
    label: "Catalog View",
    objectPosition: "center 50%",
  },
  {
    src,
    alt: `${englishName} detail texture view`,
    label: "Texture View",
    objectPosition: "center 30%",
  },
  {
    src,
    alt: `${englishName} wholesale close-up view`,
    label: "Wholesale View",
    objectPosition: "center 70%",
  },
];

const buildProductInquiryHref = (productName: string) =>
  `https://wa.me/${businessInfo.whatsappNumber}?text=${encodeURIComponent(
    `Namaskar Zain Traders, I want wholesale details for ${productName}. Please share grade, packing, minimum order, and current availability.`,
  )}`;

export const products: Product[] = [
  {
    slug: "jeera",
    name: "\u091c\u093f\u0930\u0947",
    englishName: "Jeera / Cumin Seeds",
    category: "Whole Spice",
    note: "Bold aroma, even grain, and trade-friendly lots for daily wholesale movement.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Seeds_of_Cumin.jpg/960px-Seeds_of_Cumin.jpg",
    gallery: createGallery(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Seeds_of_Cumin.jpg/960px-Seeds_of_Cumin.jpg",
      "Cumin seeds",
    ),
    description:
      "Jeera lots are selected for aroma strength, low impurity handling, and consistent grain presentation suited for kirana, masala blending, and reseller dispatch.",
    grade: "Bold clean seed",
    origin: "Gujarat and Rajasthan trading lots",
    availablePacking: ["5 kg pouch", "10 kg bag", "25 kg PP bag"],
    wholesaleInfo:
      "Preferred by kirana stores, food manufacturers, and traders who need repeat supply with dependable sorting.",
    minimumOrder: "25 kg",
    qualityFeatures: [
      "Uniform grain appearance",
      "Strong natural aroma",
      "Cleaned lots with low visible dust",
    ],
    cardTone: "light",
  },
  {
    slug: "dhana",
    name: "\u0927\u0928\u0947",
    englishName: "Dhana / Coriander Seeds",
    category: "Whole Spice",
    note: "Balanced color and reliable size for bulk dispatch, grinding, and trade resale.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Coriander_Seeds.jpg/960px-Coriander_Seeds.jpg",
    gallery: createGallery(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Coriander_Seeds.jpg/960px-Coriander_Seeds.jpg",
      "Coriander seeds",
    ),
    description:
      "Coriander lots are chosen for clean texture, stable color, and batch consistency to support both retail refill and spice-processing demand.",
    grade: "Machine-clean whole seed",
    origin: "Madhya Pradesh and Rajasthan market lots",
    availablePacking: ["10 kg bag", "25 kg PP bag", "30 kg trade lot"],
    wholesaleInfo:
      "Suitable for wholesale counters, masala manufacturers, and regional resellers looking for dependable movement.",
    minimumOrder: "25 kg",
    qualityFeatures: [
      "Balanced seed size",
      "Wholesale-ready cleaning",
      "Fresh natural color",
    ],
    cardTone: "light",
  },
  {
    slug: "badishep",
    name: "\u092c\u0921\u0940\u0936\u0947\u092a",
    englishName: "Badishep / Fennel Seeds",
    category: "Whole Spice",
    note: "Sweet profile and polished appearance for retailers, after-meal blends, and premium counters.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Fennel_seeds_01.jpg/960px-Fennel_seeds_01.jpg",
    gallery: createGallery(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Fennel_seeds_01.jpg/960px-Fennel_seeds_01.jpg",
      "Fennel seeds",
    ),
    description:
      "Badishep is positioned for buyers who value sweet aroma, cleaner lots, and a more premium visual finish in the display or aftermint segment.",
    grade: "Sweet bold fennel",
    origin: "Gujarat and Rajasthan fennel markets",
    availablePacking: ["5 kg pouch", "10 kg pouch", "25 kg woven bag"],
    wholesaleInfo:
      "Works well for kirana, after-meal mixtures, sweet shops, and dry spice counters needing steady quality.",
    minimumOrder: "15 kg",
    qualityFeatures: [
      "Sweet natural fragrance",
      "Bright seed appearance",
      "Consistent lot sorting",
    ],
    cardTone: "light",
  },
  {
    slug: "methi",
    name: "\u092e\u0947\u0925\u0940 \u0926\u093e\u0923\u093e",
    englishName: "Methi / Fenugreek Seeds",
    category: "Whole Spice",
    note: "Wholesale-friendly seed lots with dependable bitterness, color, and dry handling.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Fenugreek_seeds.jpg/960px-Fenugreek_seeds.jpg",
    gallery: createGallery(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Fenugreek_seeds.jpg/960px-Fenugreek_seeds.jpg",
      "Fenugreek seeds",
    ),
    description:
      "Fenugreek is selected for dry, usable grain structure and lot stability suitable for retail refill, blending, and institutional kitchen supply.",
    grade: "Dry clean seed",
    origin: "Rajasthan and Madhya Pradesh trade sources",
    availablePacking: ["10 kg bag", "25 kg PP bag", "30 kg mandi lot"],
    wholesaleInfo:
      "Best suited for everyday spice counters, masala units, and restaurants requiring regular repeat supply.",
    minimumOrder: "25 kg",
    qualityFeatures: [
      "Dry storage-ready condition",
      "Consistent grain tone",
      "Cleaned for wholesale handling",
    ],
    cardTone: "light",
  },
  {
    slug: "lavang",
    name: "\u0932\u0935\u0902\u0917",
    englishName: "Lavang / Cloves",
    category: "Whole Spice",
    note: "Rich, premium-looking cloves with stronger aroma for higher-value orders.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Clove_close_up.jpg/960px-Clove_close_up.jpg",
    gallery: createGallery(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Clove_close_up.jpg/960px-Clove_close_up.jpg",
      "Cloves",
    ),
    description:
      "Lavang is positioned for premium spice buyers who need a polished look, dense buds, and aroma-led quality in smaller or higher-margin trade lots.",
    grade: "Hand-selected aromatic buds",
    origin: "Imported and domestic trading channels",
    availablePacking: ["1 kg pouch", "5 kg lined carton", "10 kg wholesale case"],
    wholesaleInfo:
      "Ideal for premium kirana counters, masala blenders, hotels, and festive demand supply.",
    minimumOrder: "5 kg",
    qualityFeatures: [
      "Strong aroma release",
      "Dark polished appearance",
      "Better visual grading for display sales",
    ],
    cardTone: "dark",
  },
  {
    slug: "dalchini",
    name: "\u0926\u093e\u0932\u091a\u093f\u0928\u0940",
    englishName: "Dalchini / Cinnamon Sticks",
    category: "Whole Spice",
    note: "Warm, clean sticks selected for attractive appearance and kitchen-ready use.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Canelle_Cinnamomum_burmanni_Luc_Viatour.jpg/960px-Canelle_Cinnamomum_burmanni_Luc_Viatour.jpg",
    gallery: createGallery(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Canelle_Cinnamomum_burmanni_Luc_Viatour.jpg/960px-Canelle_Cinnamomum_burmanni_Luc_Viatour.jpg",
      "Cinnamon sticks",
    ),
    description:
      "Dalchini lots are chosen to give a cleaner stick profile and dependable fragrance for spice counters, restaurants, and masala makers.",
    grade: "Clean bark roll selection",
    origin: "Imported cinnamon trading lots",
    availablePacking: ["2 kg pouch", "5 kg carton", "10 kg case"],
    wholesaleInfo:
      "Suitable for premium spice merchandising, hotel kitchens, and blended masala production.",
    minimumOrder: "5 kg",
    qualityFeatures: [
      "Clean stick presentation",
      "Warm natural fragrance",
      "Low breakage handling",
    ],
    cardTone: "dark",
  },
  {
    slug: "kali-mirch",
    name: "\u0915\u093e\u0933\u0940 \u092e\u093f\u0930\u0940",
    englishName: "Kali Mirch / Black Pepper",
    category: "Whole Spice",
    note: "Strong heat, stable sorting, and premium bulk appeal for trade buyers.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Piper_nigrum_Dried_fruits_with_and_without_pericarp_-_Penja_Cameroun.jpg/960px-Piper_nigrum_Dried_fruits_with_and_without_pericarp_-_Penja_Cameroun.jpg",
    gallery: createGallery(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Piper_nigrum_Dried_fruits_with_and_without_pericarp_-_Penja_Cameroun.jpg/960px-Piper_nigrum_Dried_fruits_with_and_without_pericarp_-_Penja_Cameroun.jpg",
      "Black pepper",
    ),
    description:
      "Black pepper lots are selected for strong heat delivery, better visual density, and clean handling for institutional, retail, and distribution orders.",
    grade: "Bold peppercorn lot",
    origin: "Kerala and imported trade channels",
    availablePacking: ["5 kg pouch", "10 kg carton", "25 kg bag"],
    wholesaleInfo:
      "Works well for restaurants, spice retailers, and stockists managing recurring premium demand.",
    minimumOrder: "10 kg",
    qualityFeatures: [
      "Heat-forward peppercorns",
      "Dense visual finish",
      "Consistent lot grading",
    ],
    cardTone: "dark",
  },
  {
    slug: "shah-jeera",
    name: "\u0936\u093e\u0939 \u091c\u093f\u0930\u0947",
    englishName: "Shah Jeera / Caraway",
    category: "Whole Spice",
    note: "Fine aromatic seed selected for premium masala and specialty trade orders.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/K%C3%BCmmel_2012-07-08-9523.jpg/960px-K%C3%BCmmel_2012-07-08-9523.jpg",
    gallery: createGallery(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/K%C3%BCmmel_2012-07-08-9523.jpg/960px-K%C3%BCmmel_2012-07-08-9523.jpg",
      "Caraway seeds",
    ),
    description:
      "Shah jeera is offered as a specialty line for premium blends, biryani masalas, and culinary buyers who need clean aroma-forward seed.",
    grade: "Fine aromatic seed",
    origin: "North Indian and imported specialty channels",
    availablePacking: ["1 kg pouch", "5 kg carton", "10 kg wholesale case"],
    wholesaleInfo:
      "A good fit for masala blenders, premium grocery buyers, and hospitality kitchens handling aromatic spice profiles.",
    minimumOrder: "5 kg",
    qualityFeatures: [
      "Distinct aromatic profile",
      "Fine specialty grain",
      "Selected for premium use cases",
    ],
    cardTone: "dark",
  },
  {
    slug: "hirvi-velchi",
    name: "\u0939\u093f\u0930\u0935\u0940 \u0935\u0947\u0932\u091a\u0940",
    englishName: "Hirvi Velchi / Green Cardamom",
    category: "Whole Spice",
    note: "Selected pods with premium color and fragrance for high-value wholesale demand.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Cardamom_pods_-_Green_BNC.jpg/960px-Cardamom_pods_-_Green_BNC.jpg",
    gallery: createGallery(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Cardamom_pods_-_Green_BNC.jpg/960px-Cardamom_pods_-_Green_BNC.jpg",
      "Green cardamom",
    ),
    description:
      "Green cardamom is presented as a premium line for buyers who need better pod appearance, fragrance retention, and dependable wholesale presentation.",
    grade: "Selected green pod lot",
    origin: "Kerala and premium auction channels",
    availablePacking: ["500 g pouch", "1 kg pouch", "5 kg carton"],
    wholesaleInfo:
      "Suitable for sweet shops, premium grocery counters, hotels, and festive gifting inventory.",
    minimumOrder: "2 kg",
    qualityFeatures: [
      "Premium pod appearance",
      "Aroma-led quality",
      "Careful packing for sensitive goods",
    ],
    cardTone: "dark",
  },
  {
    slug: "moti-velchi",
    name: "\u092e\u094b\u0920\u0940 \u0935\u0947\u0932\u091a\u0940",
    englishName: "Moti Velchi / Black Cardamom",
    category: "Whole Spice",
    note: "Smoky, bold pods for specialty gravies, biryani blends, and premium kitchens.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Black_cardamom_pods.jpg/960px-Black_cardamom_pods.jpg",
    gallery: createGallery(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Black_cardamom_pods.jpg/960px-Black_cardamom_pods.jpg",
      "Black cardamom",
    ),
    description:
      "Black cardamom is stocked for buyers who need the smoky profile and bold visual character used in richer gravies and biryani-style preparations.",
    grade: "Smoky whole pod selection",
    origin: "North-east India and wholesale spice markets",
    availablePacking: ["1 kg pouch", "5 kg carton", "10 kg case"],
    wholesaleInfo:
      "Popular with hotels, caterers, and masala traders looking for reliable pod quality in lower-volume premium orders.",
    minimumOrder: "5 kg",
    qualityFeatures: [
      "Smoky aromatic profile",
      "Full pod presentation",
      "Consistent premium handling",
    ],
    cardTone: "dark",
  },
  {
    slug: "tamalpatra",
    name: "\u0924\u092e\u093e\u0932\u092a\u0924\u094d\u0930",
    englishName: "Tamalpatra / Bay Leaves",
    category: "Whole Spice",
    note: "Dry, clean leaves arranged for easier wholesale packing and repeat kitchen use.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Bay_leaves.jpg/960px-Bay_leaves.jpg",
    gallery: createGallery(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Bay_leaves.jpg/960px-Bay_leaves.jpg",
      "Bay leaves",
    ),
    description:
      "Bay leaves are chosen for cleaner drying, recognizable leaf structure, and practical supply across retail and food service demand.",
    grade: "Dry clean leaf selection",
    origin: "North Indian herb and spice channels",
    availablePacking: ["2 kg pouch", "5 kg bag", "10 kg bulk lot"],
    wholesaleInfo:
      "Suitable for retailers, restaurants, and packaged masala lines looking for a dependable supporting spice item.",
    minimumOrder: "5 kg",
    qualityFeatures: [
      "Dry and storage-ready",
      "Better leaf integrity",
      "Convenient wholesale packing",
    ],
    cardTone: "light",
  },
  {
    slug: "khaskhas",
    name: "\u0916\u0938\u0916\u0938",
    englishName: "Khaskhas / Poppy Seeds",
    category: "Whole Spice",
    note: "Fine grain, premium handling, and clean lots for sweets, gravies, and specialty trade.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Poppy_seeds_2.jpg/960px-Poppy_seeds_2.jpg",
    gallery: createGallery(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Poppy_seeds_2.jpg/960px-Poppy_seeds_2.jpg",
      "Poppy seeds",
    ),
    description:
      "Khaskhas is presented for premium usage where grain cleanliness, controlled packing, and dependable visual quality matter more than commodity-only supply.",
    grade: "Fine cleaned seed",
    origin: "Specialty wholesale channels",
    availablePacking: ["1 kg pouch", "5 kg sealed lot", "10 kg trade case"],
    wholesaleInfo:
      "Well suited to sweets, gravies, premium grocery counters, and specialist food businesses.",
    minimumOrder: "2 kg",
    qualityFeatures: [
      "Fine grain structure",
      "Clean lot presentation",
      "Careful packing and handling",
    ],
    cardTone: "light",
  },
  {
    slug: "teja-mirchi",
    name: "\u0924\u0947\u091c\u093e \u092e\u093f\u0930\u091a\u0940",
    englishName: "Teja Mirchi / Teja Chilli",
    category: "Whole Spice",
    note: "Heat-forward chilli lots for traders focused on pungency and strong movement.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/33_Chilli_peppers_background_-_Dried_chilli_peppers_at_a_food_market_in_Granada%2C_Spain.jpg/960px-33_Chilli_peppers_background_-_Dried_chilli_peppers_at_a_food_market_in_Granada%2C_Spain.jpg",
    gallery: createGallery(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/33_Chilli_peppers_background_-_Dried_chilli_peppers_at_a_food_market_in_Granada%2C_Spain.jpg/960px-33_Chilli_peppers_background_-_Dried_chilli_peppers_at_a_food_market_in_Granada%2C_Spain.jpg",
      "Teja chilli",
    ),
    description:
      "Teja-style chilli supply is positioned for buyers who prioritize sharper heat, reliable red tone, and wholesale-friendly movement in spice markets.",
    grade: "Heat-forward whole chilli lot",
    origin: "Andhra Pradesh and major chilli mandis",
    availablePacking: ["10 kg bag", "20 kg bale", "25 kg PP bag"],
    wholesaleInfo:
      "Ideal for traders, spice mills, and food businesses buying for stronger heat profiles and regular replenishment.",
    minimumOrder: "25 kg",
    qualityFeatures: [
      "Heat-dominant profile",
      "Strong visual red tone",
      "Bulk handling for trade dispatch",
    ],
    cardTone: "dark",
  },
  {
    slug: "bedgi-mirchi",
    name: "\u092c\u0947\u0921\u0917\u0940 \u092e\u093f\u0930\u091a\u0940",
    englishName: "Bedgi Mirchi / Bedgi Chilli",
    category: "Whole Spice",
    note: "Color-focused chilli selection for buyers who value appearance and premium finish.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Bungamati-90-Chilli_zum_Trocknen-2014-gje.jpg/960px-Bungamati-90-Chilli_zum_Trocknen-2014-gje.jpg",
    gallery: createGallery(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Bungamati-90-Chilli_zum_Trocknen-2014-gje.jpg/960px-Bungamati-90-Chilli_zum_Trocknen-2014-gje.jpg",
      "Bedgi chilli",
    ),
    description:
      "Bedgi-style chilli is aimed at color-oriented buyers who need visually appealing whole chilli lots for blending, retail, and food service use.",
    grade: "Color-rich whole chilli lot",
    origin: "Karnataka and major chilli trade hubs",
    availablePacking: ["10 kg bag", "20 kg bale", "25 kg PP bag"],
    wholesaleInfo:
      "A strong fit for masala units, retailers, and traders balancing presentation with dependable bulk supply.",
    minimumOrder: "25 kg",
    qualityFeatures: [
      "Color-led selection",
      "Better visual merchandising value",
      "Bulk-ready packing",
    ],
    cardTone: "dark",
  },
  {
    slug: "haldi",
    name: "\u0939\u0933\u0926",
    englishName: "Haldi / Turmeric Fingers",
    category: "Whole Spice",
    note: "Bright, dry turmeric lots selected for grinding, retail refill, and trade supply.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Curcuma_longa_roots.jpg/960px-Curcuma_longa_roots.jpg",
    gallery: createGallery(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Curcuma_longa_roots.jpg/960px-Curcuma_longa_roots.jpg",
      "Turmeric fingers",
    ),
    description:
      "Turmeric finger supply is selected for dry handling, recognizable color strength, and practical suitability for grinding and wholesale resale.",
    grade: "Dry turmeric finger lot",
    origin: "Maharashtra and Andhra turmeric channels",
    availablePacking: ["10 kg bag", "25 kg PP bag", "50 kg mandi lot"],
    wholesaleInfo:
      "Useful for grinders, retailers, and buyers looking for everyday turmeric movement at wholesale scale.",
    minimumOrder: "25 kg",
    qualityFeatures: [
      "Dry storage-ready fingers",
      "Bright natural color",
      "Grinding-friendly lots",
    ],
    cardTone: "light",
  },
  {
    slug: "khobra",
    name: "\u0916\u094b\u092c\u0930\u0947",
    englishName: "Khobra / Dry Coconut",
    category: "Dry Fruit",
    note: "Dry coconut lots for sweet shops, grocery trade, and food businesses needing repeat supply.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Dry_coconut1.jpg/960px-Dry_coconut1.jpg",
    gallery: createGallery(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Dry_coconut1.jpg/960px-Dry_coconut1.jpg",
      "Dry coconut",
    ),
    description:
      "Khobra is positioned for buyers who need dry, usable coconut supply in manageable wholesale pack sizes for sweets, snacks, and retail counters.",
    grade: "Dry clean copra lot",
    origin: "South Indian coconut trade markets",
    availablePacking: ["5 kg pouch", "10 kg bag", "25 kg trade lot"],
    wholesaleInfo:
      "Suitable for sweet makers, dry fruit shops, and grocery buyers looking for dependable repeat stock.",
    minimumOrder: "10 kg",
    qualityFeatures: [
      "Dry storage-friendly condition",
      "Clean visual quality",
      "Packed for wholesale rotation",
    ],
    cardTone: "light",
  },
  {
    slug: "kaju-w320",
    name: "\u0915\u093e\u091c\u0942 W320",
    englishName: "Kaju W320 / Premium Cashew",
    category: "Dry Fruit",
    note: "Premium whole cashew kernels for gifting, retail shelves, and dry fruit counters.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Cashew_2.jpg/960px-Cashew_2.jpg",
    gallery: createGallery(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Cashew_2.jpg/960px-Cashew_2.jpg",
      "Cashew kernels",
    ),
    description:
      "Kaju W320 is offered as a premium grade for trade buyers who need attractive whole kernels, better count consistency, and shelf-ready visual appeal.",
    grade: "W320 whole kernel grade",
    origin: "Goa, Kerala, and imported processing channels",
    availablePacking: ["5 kg vacuum pack", "10 kg carton", "20 kg trade case"],
    wholesaleInfo:
      "Designed for premium dry fruit counters, gifting, hotel kitchens, and festive demand supply.",
    minimumOrder: "5 kg",
    qualityFeatures: [
      "Whole premium kernel appearance",
      "Better count consistency",
      "Protected wholesale packing",
    ],
    cardTone: "light",
  },
  {
    slug: "california-almond",
    name: "\u0915\u0945\u0932\u093f\u092b\u094b\u0930\u094d\u0928\u093f\u092f\u093e \u0906\u0932\u094d\u092e\u0902\u0921",
    englishName: "California Almond",
    category: "Dry Fruit",
    note: "Premium almond kernels with polished presentation for modern wholesale counters.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Almonds_macro_1.jpg/960px-Almonds_macro_1.jpg",
    gallery: createGallery(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Almonds_macro_1.jpg/960px-Almonds_macro_1.jpg",
      "Almond kernels",
    ),
    description:
      "California-style almond supply is aimed at premium dry fruit retailers, gifting buyers, and stores that value clean kernel appearance and dependable replenishment.",
    grade: "Premium kernel selection",
    origin: "California-origin trade channels",
    availablePacking: ["5 kg pouch", "10 kg carton", "25 kg master case"],
    wholesaleInfo:
      "A strong fit for dry fruit counters, premium grocery stores, and institutional buyers stocking high-rotation nut lines.",
    minimumOrder: "5 kg",
    qualityFeatures: [
      "Clean kernel finish",
      "Premium shelf presentation",
      "Trade-ready case packing",
    ],
    cardTone: "light",
  },
  {
    slug: "pista",
    name: "\u092a\u093f\u0938\u094d\u0924\u093e",
    englishName: "Pista / Pistachio",
    category: "Dry Fruit",
    note: "Premium pista with attractive shell presentation for modern dry fruit retail.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Pistachio_macro_whitebackground_NS.jpg/960px-Pistachio_macro_whitebackground_NS.jpg",
    gallery: createGallery(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Pistachio_macro_whitebackground_NS.jpg/960px-Pistachio_macro_whitebackground_NS.jpg",
      "Pistachio",
    ),
    description:
      "Pista is offered as a premium visual line for stores and buyers who prioritize attractive nut presentation, freshness, and cleaner pack handling.",
    grade: "Premium shell pistachio",
    origin: "Imported dry fruit trading channels",
    availablePacking: ["5 kg vacuum pack", "10 kg carton", "20 kg trade case"],
    wholesaleInfo:
      "Suitable for gifting, dry fruit counters, and premium snack or bakery supply requirements.",
    minimumOrder: "5 kg",
    qualityFeatures: [
      "Premium shell appearance",
      "Fresh visual finish",
      "Secure wholesale packing",
    ],
    cardTone: "light",
  },
  {
    slug: "anjeer",
    name: "\u0905\u0902\u091c\u0940\u0930",
    englishName: "Anjeer / Dried Figs",
    category: "Dry Fruit",
    note: "Soft, premium-looking dried figs for gifting, counters, and specialty dry fruit demand.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Dry_figs.JPG/960px-Dry_figs.JPG",
    gallery: createGallery(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Dry_figs.JPG/960px-Dry_figs.JPG",
      "Dried figs",
    ),
    description:
      "Anjeer is positioned for buyers who want a more premium dry fruit selection with strong visual appeal and dependable repeat stock availability.",
    grade: "Selected dried fig grade",
    origin: "Imported and domestic dry fruit markets",
    availablePacking: ["2 kg pouch", "5 kg box", "10 kg wholesale case"],
    wholesaleInfo:
      "Popular with dry fruit counters, gifting channels, and stores curating higher-value premium lines.",
    minimumOrder: "5 kg",
    qualityFeatures: [
      "Premium fruit appearance",
      "Balanced softness and shape",
      "Packing suited for display-led retail",
    ],
    cardTone: "dark",
  },
  {
    slug: "kishmish",
    name: "\u0915\u093f\u0936\u092e\u093f\u0936",
    englishName: "Kishmish / Raisins",
    category: "Dry Fruit",
    note: "Clean raisin lots for grocery movement, sweets, and bakery or snack supply.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Sunmaid-Raisin-Pile.jpg/960px-Sunmaid-Raisin-Pile.jpg",
    gallery: createGallery(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Sunmaid-Raisin-Pile.jpg/960px-Sunmaid-Raisin-Pile.jpg",
      "Raisins",
    ),
    description:
      "Kishmish supply is selected for everyday wholesale movement with a clean, usable look suited to dry fruit retail, sweets, and bakery demand.",
    grade: "Clean raisin lot",
    origin: "Nashik and wider dry fruit trade channels",
    availablePacking: ["5 kg pouch", "10 kg carton", "15 kg trade lot"],
    wholesaleInfo:
      "A practical fast-moving line for kirana, bakery supply, sweet shops, and mixed dry fruit counters.",
    minimumOrder: "10 kg",
    qualityFeatures: [
      "Clean market-friendly appearance",
      "Suitable for daily movement",
      "Wholesale-friendly replenishment packs",
    ],
    cardTone: "dark",
  },
  {
    slug: "premium-masala-blend",
    name: "Premium Masala Blend",
    englishName: "Premium Masala Blend",
    category: "Premium Blend",
    note: "Made-to-enquiry blended masala options for retail counters, kitchens, and regional resellers.",
    image: "/images/spice-assortment.jpg",
    gallery: createGallery("/images/spice-assortment.jpg", "Premium masala blend"),
    description:
      "Our premium blend range is available for buyers seeking dependable everyday masala lines for resale, food service, and local trade demand. Share your use case and preferred packing to confirm the right blend and current availability.",
    grade: "Blend matched to trade requirement",
    origin: "Prepared through trusted spice trade channels",
    availablePacking: ["500 g retail pouch", "1 kg pouch", "5 kg food-service pack"],
    wholesaleInfo:
      "Rates and blend availability depend on the recipe, packing, and order quantity. Enquire on WhatsApp for the current trade option.",
    minimumOrder: "By enquiry",
    qualityFeatures: [
      "Trade-focused flavour profiles",
      "Packing options for resale or kitchen use",
      "Availability confirmed before ordering",
    ],
    cardTone: "dark",
  },
  {
    slug: "seasonal-dry-fruit-lot",
    name: "Seasonal Trade Lots",
    englishName: "Seasonal Dry Fruit Trade Lots",
    category: "Seasonal Trade Lot",
    note: "Festive and seasonal dry fruit combinations planned around bulk buying and reseller demand.",
    image: "/images/spice-earthy.jpg",
    gallery: createGallery("/images/spice-earthy.jpg", "Seasonal dry fruit trade lot"),
    description:
      "Seasonal lots are arranged around festival demand, gifting periods, and high-rotation dry fruit requirements. Tell us the products, pack sizes, and quantity you need so the trade desk can guide you on availability.",
    grade: "Seasonal assortment by enquiry",
    origin: "Domestic and imported dry fruit trade channels",
    availablePacking: ["5 kg trade pack", "10 kg carton", "Custom bulk enquiry"],
    wholesaleInfo:
      "Seasonal pricing and assortment change with market movement. Contact us for the latest lot composition and bulk quote guidance.",
    minimumOrder: "By enquiry",
    qualityFeatures: [
      "Seasonal assortment planning",
      "Bulk and reseller-friendly options",
      "Direct availability confirmation",
    ],
    cardTone: "light",
  },
];

export const productCategories = [
  {
    name: "Whole Spice",
    title: "Whole spices",
    description: "Everyday trade essentials from cumin and coriander to chilli, pepper, and aromatic whole spices.",
  },
  {
    name: "Dry Fruit",
    title: "Dry fruits",
    description: "Retail-ready and bulk-friendly nuts, raisins, coconut, figs, and premium dry fruit lines.",
  },
  {
    name: "Premium Blend",
    title: "Premium blends",
    description: "Enquiry-led masala options for trade buyers looking for saleable, ready-to-use blends.",
  },
  {
    name: "Seasonal Trade Lot",
    title: "Seasonal trade lots",
    description: "Festival and high-demand assortments confirmed around your quantity and buying window.",
  },
] as const;

export const productInquiryLinks = products.reduce<Record<string, string>>((acc, product) => {
  acc[product.slug] = buildProductInquiryHref(product.englishName);
  return acc;
}, {});

export const whyChooseUs: Feature[] = [
  {
    title: "Trusted Quality",
    description:
      "Each trade lot is selected for usable appearance, dependable handling, and repeat-order confidence.",
    icon: "gem",
  },
  {
    title: "Bulk-ready quantities",
    description:
      "Packing choices and minimum-order guidance make it easier for retailers, dealers, and food businesses to plan supply.",
    icon: "badgeIndianRupee",
  },
  {
    title: "Responsive Support",
    description:
      "Fast WhatsApp and phone follow-up helps buyers confirm product, packing, and availability quickly.",
    icon: "shieldCheck",
  },
  {
    title: "Fast Dispatch Guidance",
    description:
      "We help buyers move from enquiry to lot planning without friction, especially for repeat trade supply.",
    icon: "zap",
  },
  {
    title: "Regional Delivery Fit",
    description:
      "The business is set up around nearby wholesale corridors, making repeat regional supply easier to manage.",
    icon: "truck",
  },
];

export const supplyAreas: SupplyArea[] = [
  {
    name: "Dharashiv",
    districtLabel: "Primary trade belt",
    summary:
      "Core business coverage from Paranda outward with strong familiarity in local kirana, mandi, and repeat wholesale requirements.",
    coverage:
      "Best suited for kirana, traders, resellers, and everyday food business supply coordination.",
    highlights: ["Paranda rooted", "Fast follow-up", "Consistent local support"],
    x: 302,
    y: 214,
  },
  {
    name: "Solapur",
    districtLabel: "High-volume movement",
    summary:
      "A strong fit for buyers seeking dependable communication, regular wholesale lots, and practical dispatch planning.",
    coverage:
      "Supports retailers, distributors, and food-service buyers with repeat-demand product movement.",
    highlights: ["Wholesale pricing", "Trader-ready supply", "Reliable repeat orders"],
    x: 234,
    y: 286,
  },
  {
    name: "Sambhajinagar",
    districtLabel: "Growth corridor",
    summary:
      "A valuable expansion market for premium whole spices and dry fruits with more presentation-conscious demand.",
    coverage:
      "Suitable for premium grocery stores, food processors, and buyers scaling higher-value category supply.",
    highlights: ["Premium presentation", "Fast enquiry response", "Scalable trade support"],
    x: 358,
    y: 146,
  },
];

export const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "WholesaleStore",
  name: businessInfo.displayName,
  alternateName: businessInfo.name,
  description: seoDescription,
  url: siteUrl,
  telephone: businessInfo.primaryPhone.href.replace("tel:", ""),
  address: {
    "@type": "PostalAddress",
    streetAddress: "Mallik Nagar, Kondhwa",
    postalCode: "411048",
    addressLocality: "Pune",
    addressRegion: "Maharashtra",
    addressCountry: "IN",
  },
  location: businessInfo.offices.map((office) => ({
    "@type": "Place",
    name: office.label,
    address: office.address,
  })),
  areaServed: supplyAreas.map((area) => ({
    "@type": "Place",
    name: area.name,
  })),
  contactPoint: businessInfo.contactNumbers.map((item) => ({
    "@type": "ContactPoint",
    telephone: item.href.replace("tel:", ""),
    contactType: item.label,
    areaServed: ["IN-MH"],
    availableLanguage: ["Marathi", "English", "Hindi"],
  })),
};

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}
