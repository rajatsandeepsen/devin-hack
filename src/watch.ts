export const APP_NAME = "Watch Bot";
export const APP_DESCRIPTION =
	"Telegram bot for hourly Indian government updates in your native language";

export const categories = {
	agriculture: {
		name: "Agriculture & Farming",
		icon: "🌾",
		description:
			"Crop advisories, MSP, farming schemes, irrigation, agri policies",
		query:
			"latest Indian government agriculture farming policy scheme update",
		domains: [
			"agricoop.nic.in",
			"agriwelfare.gov.in",
			"pmkisan.gov.in",
			"enam.gov.in",
			"mkisan.gov.in",
			"india.gov.in",
		],
	},
	weather: {
		name: "Weather & Climate",
		icon: "🌦️",
		description:
			"Weather alerts, monsoon, climate advisories, disaster warnings",
		query:
			"latest Indian government weather climate advisory alert IMD update",
		domains: [
			"mausam.imd.gov.in",
			"imd.gov.in",
			"ndma.gov.in",
			"ndrf.gov.in",
			"india.gov.in",
		],
	},
	welfare: {
		name: "Subsidies & Welfare",
		icon: "🏛️",
		description:
			"Government subsidies, welfare schemes, pensions, benefits",
		query:
			"latest Indian government subsidy welfare scheme benefit policy update",
		domains: [
			"india.gov.in",
			"pmindia.gov.in",
			"pib.gov.in",
			"myscheme.gov.in",
			"dbtbharat.gov.in",
		],
	},
	jobs: {
		name: "Jobs & Recruitment",
		icon: "💼",
		description:
			"Government jobs, recruitment notifications, employment schemes",
		query:
			"latest Indian government job recruitment vacancy employment notification update",
		domains: [
			"ncs.gov.in",
			"ssc.nic.in",
			"upsc.gov.in",
			"rrbcdg.gov.in",
			"employmentnews.gov.in",
			"india.gov.in",
		],
	},
	education: {
		name: "Education & Scholarships",
		icon: "🎓",
		description:
			"Scholarships, exams, education policies, admissions, student schemes",
		query:
			"latest Indian government education scholarship exam policy student update",
		domains: [
			"education.gov.in",
			"scholarships.gov.in",
			"nta.ac.in",
			"ugc.gov.in",
			"india.gov.in",
		],
	},
	health: {
		name: "Health & Public Health",
		icon: "🏥",
		description:
			"Public health advisories, health schemes, hospitals, disease alerts",
		query:
			"latest Indian government health public health scheme advisory update",
		domains: [
			"mohfw.gov.in",
			"nhm.gov.in",
			"pmjay.gov.in",
			"abdm.gov.in",
			"india.gov.in",
		],
	},
	business: {
		name: "Business & MSME",
		icon: "🏢",
		description:
			"MSME, startup, trade, business policies, tenders, compliance",
		query:
			"latest Indian government MSME startup business trade policy update",
		domains: [
			"msme.gov.in",
			"startupindia.gov.in",
			"dgft.gov.in",
			"commerce.gov.in",
			"india.gov.in",
		],
	},
	finance: {
		name: "Finance & Tax",
		icon: "💰",
		description:
			"Tax, GST, budget, RBI/finance notifications, banking policies",
		query:
			"latest Indian government finance tax GST budget RBI policy update",
		domains: [
			"incometax.gov.in",
			"gst.gov.in",
			"finmin.gov.in",
			"rbi.org.in",
			"india.gov.in",
		],
	},
	transport: {
		name: "Infrastructure & Transport",
		icon: "🚆",
		description:
			"Roads, railways, transport, infrastructure projects, public services",
		query:
			"latest Indian government infrastructure transport railway road policy update",
		domains: [
			"morth.nic.in",
			"indianrailways.gov.in",
			"nhai.gov.in",
			"pmgati.gov.in",
			"india.gov.in",
		],
	},
} as const;

export type CategoryKey = keyof typeof categories;
export const categoryKeys = Object.keys(categories) as CategoryKey[];

export const languages = {
	"en-IN": { name: "English", nativeName: "English" },
	"hi-IN": { name: "Hindi", nativeName: "हिन्दी" },
	"bn-IN": { name: "Bengali", nativeName: "বাংলা" },
	"ta-IN": { name: "Tamil", nativeName: "தமிழ்" },
	"te-IN": { name: "Telugu", nativeName: "తెలుగు" },
	"mr-IN": { name: "Marathi", nativeName: "मराठी" },
	"gu-IN": { name: "Gujarati", nativeName: "ગુજરાતી" },
	"kn-IN": { name: "Kannada", nativeName: "ಕನ್ನಡ" },
	"ml-IN": { name: "Malayalam", nativeName: "മലയാളം" },
	"pa-IN": { name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
	"od-IN": { name: "Odia", nativeName: "ଓଡ଼ିଆ" },
	"as-IN": { name: "Assamese", nativeName: "অসমীয়া" },
	"ur-IN": { name: "Urdu", nativeName: "اردو" },
	"ne-IN": { name: "Nepali", nativeName: "नेपाली" },
	"kok-IN": { name: "Konkani", nativeName: "कोंकणी" },
	"ks-IN": { name: "Kashmiri", nativeName: "कॉशुर" },
	"sd-IN": { name: "Sindhi", nativeName: "सिंधी" },
	"sa-IN": { name: "Sanskrit", nativeName: "संस्कृतम्" },
	"sat-IN": { name: "Santali", nativeName: "ᱥᱟᱱᱛᱟᱲᱤ" },
	"mni-IN": { name: "Manipuri", nativeName: "মৈতৈলোন্" },
	"brx-IN": { name: "Bodo", nativeName: "बड़ो" },
	"mai-IN": { name: "Maithili", nativeName: "मैथिली" },
	"doi-IN": { name: "Dogri", nativeName: "डोगरी" },
} as const;

export type LanguageCode = keyof typeof languages;
export const languageCodes = Object.keys(languages) as LanguageCode[];

export const DEFAULT_LANGUAGE: LanguageCode = "en-IN";

export function isCategoryKey(value: string): value is CategoryKey {
	return value in categories;
}

export function isLanguageCode(value: string): value is LanguageCode {
	return value in languages;
}
