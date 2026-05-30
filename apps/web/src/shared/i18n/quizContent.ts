import type {
	AnswerChoice,
	QuizChoiceQuestion,
} from '@maptap/game-domain/multiplayer-next/game'
import type { AppLanguage } from './locales'

interface QuizQuestionTranslation {
	prompt: string
	imageAlt?: string
	choices: Record<string, string>
}

function q(
	prompt: string,
	choices: Record<string, string>,
	imageAlt?: string,
): QuizQuestionTranslation {
	return { prompt, choices, imageAlt }
}

const EN_QUIZ_TRANSLATIONS = {
	'uz-geo-001': q('Which city is the capital of Uzbekistan?', {
		tashkent: 'Tashkent',
		samarkand: 'Samarkand',
		bukhara: 'Bukhara',
		namangan: 'Namangan',
	}),
	'uz-geo-002': q(
		'In which city is Registan Square located?',
		{
			samarkand: 'Samarkand',
			khiva: 'Khiva',
			nukus: 'Nukus',
			andijan: 'Andijan',
		},
		'Registan Square in Samarkand',
	),
	'uz-geo-003': q(
		'Which sea has shrunk dramatically in Uzbekistan and Kazakhstan?',
		{
			'aral-sea': 'Aral Sea',
			'caspian-sea': 'Caspian Sea',
			'black-sea': 'Black Sea',
			'red-sea': 'Red Sea',
		},
		'Shrunken Aral Sea',
	),
	'uz-geo-004': q('Which country borders Uzbekistan to the north?', {
		kazakhstan: 'Kazakhstan',
		iran: 'Iran',
		india: 'India',
		china: 'China',
	}),
	'uz-geo-005': q(
		'Which city is famous for the Itchan Kala fortress?',
		{
			khiva: 'Khiva',
			termez: 'Termez',
			karshi: 'Karshi',
			fergana: 'Fergana',
		},
		'Itchan Kala in Khiva',
	),
	'uz-geo-006': q(
		'Which desert covers much of northwestern Uzbekistan?',
		{
			kyzylkum: 'Kyzylkum',
			sahara: 'Sahara',
			gobi: 'Gobi',
			taklamakan: 'Taklamakan',
		},
		'Kyzylkum Desert in Uzbekistan',
	),
	'uz-geo-007': q('Which river is one of Uzbekistan’s two main rivers?', {
		'amu-darya': 'Amu Darya',
		volga: 'Volga',
		nile: 'Nile',
		danube: 'Danube',
	}),
	'uz-geo-008': q('Which river is associated with the Fergana Valley?', {
		'syr-darya': 'Syr Darya',
		thames: 'Thames',
		rhine: 'Rhine',
		mekong: 'Mekong',
	}),
	'uz-geo-009': q('Which city is the capital of Karakalpakstan?', {
		nukus: 'Nukus',
		urgench: 'Urgench',
		navoi: 'Navoi',
		jizzakh: 'Jizzakh',
	}),
	'uz-geo-010': q(
		'Which city is the administrative center of Bukhara Region?',
		{
			bukhara: 'Bukhara',
			gulistan: 'Gulistan',
			namangan: 'Namangan',
			termiz: 'Termez',
		},
	),
	'uz-geo-011': q(
		'In which city is the Gur-e-Amir Mausoleum located?',
		{
			samarkand: 'Samarkand',
			bukhara: 'Bukhara',
			khiva: 'Khiva',
			kokand: 'Kokand',
		},
		'Gur-e-Amir Mausoleum in Samarkand',
	),
	'uz-geo-012': q(
		'Which city is known for the Palace of Khudayar Khan?',
		{
			kokand: 'Kokand',
			navoi: 'Navoi',
			muynak: 'Muynak',
			gulistan: 'Gulistan',
		},
		'Palace of Khudayar Khan in Kokand',
	),
	'uz-geo-013': q(
		'Which city is traditionally associated with silk and crafts?',
		{
			margilan: 'Margilan',
			zarafshan: 'Zarafshan',
			muynak: 'Muynak',
			bekabad: 'Bekabad',
		},
	),
	'uz-geo-014': q('In which city is the Savitsky Museum located?', {
		nukus: 'Nukus',
		khiva: 'Khiva',
		samarkand: 'Samarkand',
		tashkent: 'Tashkent',
	}),
	'uz-geo-015': q('Which region is the city of Termez associated with?', {
		surkhandarya: 'Surkhandarya Region',
		sirdarya: 'Sirdarya Region',
		khorezm: 'Khorezm Region',
		navoi: 'Navoi Region',
	}),
	'uz-geo-016': q('Which country lies south of Uzbekistan?', {
		afghanistan: 'Afghanistan',
		russia: 'Russia',
		mongolia: 'Mongolia',
		azerbaijan: 'Azerbaijan',
	}),
	'uz-geo-017': q('Which of these countries does NOT border Uzbekistan?', {
		azerbaijan: 'Azerbaijan',
		tajikistan: 'Tajikistan',
		turkmenistan: 'Turkmenistan',
		kyrgyzstan: 'Kyrgyzstan',
	}),
	'uz-geo-018': q(
		'Which mountain system reaches eastern Uzbekistan?',
		{
			'tian-shan': 'Tian Shan',
			alps: 'Alps',
			andes: 'Andes',
			atlas: 'Atlas Mountains',
		},
	),
	'uz-geo-019': q(
		'Which valley is shared by Uzbekistan, Kyrgyzstan, and Tajikistan?',
		{
			'fergana-valley': 'Fergana Valley',
			'rift-valley': 'Great Rift Valley',
			'po-valley': 'Po Valley',
			'loire-valley': 'Loire Valley',
		},
	),
	'uz-geo-020': q(
		'Which city was an important capital of the Kokand Khanate?',
		{
			kokand: 'Kokand',
			zarafshan: 'Zarafshan',
			chirchiq: 'Chirchiq',
			angren: 'Angren',
		},
	),
	'uz-geo-021': q(
		'Which city is the administrative center of Khorezm Region?',
		{
			urgench: 'Urgench',
			khiva: 'Khiva',
			nukus: 'Nukus',
			bukhara: 'Bukhara',
		},
	),
	'uz-geo-022': q(
		'Which city is the administrative center of Kashkadarya Region?',
		{
			karshi: 'Karshi',
			termez: 'Termez',
			navoi: 'Navoi',
			gulistan: 'Gulistan',
		},
	),
	'uz-geo-023': q(
		'Which city is the administrative center of Sirdarya Region?',
		{
			gulistan: 'Gulistan',
			jizzakh: 'Jizzakh',
			namangan: 'Namangan',
			urgench: 'Urgench',
		},
	),
	'uz-geo-024': q(
		'Which city is the administrative center of Jizzakh Region?',
		{
			jizzakh: 'Jizzakh',
			andijan: 'Andijan',
			bukhara: 'Bukhara',
			nukus: 'Nukus',
		},
	),
	'uz-geo-025': q(
		'Which region is linked to Muruntau, one of the world’s largest gold mines?',
		{
			navoi: 'Navoi Region',
			khorezm: 'Khorezm Region',
			fergana: 'Fergana Region',
			andijan: 'Andijan Region',
		},
	),
	'uz-geo-026': q(
		'Which city is the administrative center of Namangan Region?',
		{
			namangan: 'Namangan',
			fergana: 'Fergana',
			andijan: 'Andijan',
			samarkand: 'Samarkand',
		},
	),
	'uz-geo-027': q(
		'Which mosque in Samarkand is associated with Bibi-Khanym?',
		{
			'bibi-khanym': 'Bibi-Khanym Mosque',
			minor: 'Minor Mosque',
			kalan: 'Kalan Mosque',
			'juma-khiva': 'Juma Mosque of Khiva',
		},
		'Bibi-Khanym Mosque in Samarkand',
	),
	'uz-geo-028': q(
		'Which city is the administrative center of Tashkent Region?',
		{
			nurafshon: 'Nurafshon',
			'tashkent-city': 'Tashkent city',
			chirchiq: 'Chirchiq',
			angren: 'Angren',
		},
	),
	'uz-geo-029': q(
		'Which square is one of the central landmarks of Tashkent?',
		{
			'amir-temur-square': 'Amir Temur Square',
			'registan-square': 'Registan',
			'ichan-kala': 'Itchan Kala',
			'ark-fortress': 'Ark Fortress',
		},
		'Amir Temur Square in Tashkent',
	),
	'uz-geo-030': q('Which city is the Ark Fortress associated with?', {
		bukhara: 'Bukhara',
		andijan: 'Andijan',
		jizzakh: 'Jizzakh',
		gulistan: 'Gulistan',
	}),
	'uz-geo-031': q(
		'What is the high-speed train connecting Tashkent, Samarkand, and Bukhara called?',
		{
			afrosiyob: 'Afrosiyob',
			'orient-express': 'Orient Express',
			sapsan: 'Sapsan',
			'talgo-steppe': 'Steppe Express',
		},
		'Afrosiyob high-speed train',
	),
	'uz-geo-032': q(
		'The historic center of which city is a UNESCO World Heritage site?',
		{
			bukhara: 'Bukhara',
			angren: 'Angren',
			bekabad: 'Bekabad',
			gulistan: 'Gulistan',
		},
	),
	'uz-geo-033': q(
		'Where is the Hazrati Imam complex located?',
		{
			tashkent: 'Tashkent',
			samarkand: 'Samarkand',
			khiva: 'Khiva',
			termez: 'Termez',
		},
		'Interior of Hazrati Imam Mosque in Tashkent',
	),
	'uz-geo-034': q(
		'Which site near Tashkent is known as a popular mountain reservoir?',
		{
			charvak: 'Charvak Reservoir',
			aidarkul: 'Aydarkul',
			sarygamysh: 'Sarygamysh',
			'aral-sea': 'Aral Sea',
		},
	),
	'uz-geo-035': q(
		'Which mountain resort near Tashkent is often associated with Chimgan?',
		{
			beldersay: 'Beldersay',
			muynak: 'Muynak',
			zarafshan: 'Zarafshan',
			gulistan: 'Gulistan',
		},
	),
	'uz-geo-036': q(
		'Which ancient settlement museum is located in Samarkand?',
		{
			afrosiab: 'Afrosiab',
			ellikkala: 'Ellikkala',
			paikend: 'Paikend',
			kampyrtepa: 'Kampyrtepa',
		},
	),
	'uz-geo-037': q(
		'Which city is known for a ship graveyard near the former Aral shore?',
		{
			muynak: 'Muynak',
			urgench: 'Urgench',
			nukus: 'Nukus',
			karshi: 'Karshi',
		},
		'Ships near the former Aral Sea shore in Muynak',
	),
	'uz-geo-038': q(
		'What is the famous minaret in Bukhara’s historic center called?',
		{
			'kalan-minaret': 'Kalan Minaret',
			'minor-minaret': 'Minor Minaret',
			'islam-khoja': 'Islam Khoja Minaret',
			'qutlug-timur': 'Qutlug Timur Minaret',
		},
		'Kalan Minaret in Bukhara',
	),
	'uz-geo-039': q(
		'In which city is the Lyabi-Hauz architectural ensemble located?',
		{
			bukhara: 'Bukhara',
			samarkand: 'Samarkand',
			tashkent: 'Tashkent',
			andijan: 'Andijan',
		},
		'Lyabi-Hauz ensemble in Bukhara',
	),
	'uz-geo-040': q(
		'Which national park is located in Jizzakh Region?',
		{
			zaamin: 'Zaamin National Park',
			'ugam-chatkal': 'Ugam-Chatkal Park',
			'baday-tugay': 'Baday-Tugay',
			hissar: 'Hissar Reserve',
		},
		'Zaamin National Park',
	),
	'uz-geo-041': q(
		'Which transport system in Tashkent was the first metro in Central Asia?',
		{
			'tashkent-metro': 'Tashkent Metro',
			tram: 'Tashkent tram',
			'airport-express': 'Aeroexpress',
			monorail: 'Monorail',
		},
		'Tashkent Metro',
	),
	'uz-geo-042': q(
		'What is the group of ancient Karakalpakstan fortresses, including Ayaz-Kala and Toprak-Kala, called?',
		{
			ellikkala: 'Ellikkala',
			registan: 'Registan',
			'ichan-kala': 'Itchan Kala',
			'hazrati-imam': 'Hazrati Imam',
		},
	),
	'tashkent-001': q(
		'Which market is considered one of the main symbols of old Tashkent?',
		{
			chorsu: 'Chorsu',
			kuyluk: 'Kuyluk',
			farhad: 'Farhad',
			askiya: 'Askiya',
		},
		'Chorsu Bazaar in Tashkent',
	),
	'tashkent-002': q('Which metro station is next to Chorsu Bazaar?', {
		chorsu: 'Chorsu',
		oybek: 'Oybek',
		minor: 'Minor',
		beruniy: 'Beruniy',
	}),
	'tashkent-003': q(
		'Which Tashkent structure is known as a tall TV tower?',
		{
			'tv-tower': 'Tashkent TV Tower',
			'humo-arena': 'Humo Arena',
			'palace-forums': 'Palace of Forums',
			'state-circus': 'State Circus',
		},
		'Tashkent TV Tower',
	),
	'tashkent-004': q(
		'On which square does the Amir Temur monument stand?',
		{
			'amir-temur-square': 'Amir Temur Square',
			'independence-square': 'Independence Square',
			'chorsu-square': 'Chorsu Square',
			'friendship-square': 'Friendship of Peoples Square',
		},
		'Amir Temur Square in Tashkent',
	),
	'tashkent-005': q(
		'What is Independence Square usually called in Uzbek?',
		{
			mustaqillik: 'Mustaqillik Maydoni',
			registan: 'Registan',
			shahriston: 'Shahriston',
			navruz: 'Navruz Maydoni',
		},
	),
	'tashkent-006': q(
		'Which Old City complex is associated with the Quran of Caliph Uthman?',
		{
			'hazrati-imam': 'Hazrati Imam',
			'minor-mosque': 'Minor Mosque',
			kukeldash: 'Kukeldash Madrasah',
			abdulkasim: 'Abdulkasim Madrasah',
		},
		'Interior of Hazrati Imam Mosque in Tashkent',
	),
	'tashkent-007': q(
		'Which Tashkent mosque is known for its white facade and location by the Ankhor Canal?',
		{
			'minor-mosque': 'Minor Mosque',
			'tilla-sheikh': 'Tilla Sheikh Mosque',
			namazgah: 'Namazgah',
			juma: 'Juma Mosque',
		},
		'Minor Mosque in Tashkent',
	),
	'tashkent-008': q(
		'Which metro station is known for its space-themed design?',
		{
			kosmonavtlar: 'Kosmonavtlar',
			pakhtakor: 'Pakhtakor',
			novza: 'Novza',
			'hamid-olimjon': 'Hamid Olimjon',
		},
		'Kosmonavtlar metro station in Tashkent',
	),
	'tashkent-009': q(
		'Which pair of stations forms a well-known transfer between metro lines downtown?',
		{
			'pakhtakor-alisher-navoi': 'Pakhtakor and Alisher Navoi',
			'minor-bodomzor': 'Minor and Bodomzor',
			'chorsu-gafur-gulyam': 'Chorsu and Gafur Gulyam',
			'dustlik-mashinasozlar': 'Dustlik and Mashinasozlar',
		},
		'Alisher Navoiy metro station in Tashkent',
	),
	'tashkent-010': q(
		'What is the metro line that includes Chorsu station called?',
		{
			'uzbekistan-line': 'Uzbekistan Line',
			'chilanzar-line': 'Chilanzar Line',
			'yunusabad-line': 'Yunusabad Line',
			'circle-line': 'Circle Line',
		},
	),
	'tashkent-011': q('Which option is a district of Tashkent city?', {
		yunusabad: 'Yunusabad',
		chirchik: 'Chirchik',
		yangiyul: 'Yangiyul',
		parkent: 'Parkent',
	}),
	'tashkent-012': q(
		'Which Tashkent district is the newest of those listed?',
		{
			yangihayot: 'Yangihayot',
			chilanzar: 'Chilanzar',
			mirobod: 'Mirobod',
			uchtepa: 'Uchtepa',
		},
	),
	'tashkent-013': q(
		'Which district name literally refers to “three hills”?',
		{
			uchtepa: 'Uchtepa',
			olmazor: 'Olmazor',
			bektemir: 'Bektemir',
			sergeli: 'Sergeli',
		},
	),
	'tashkent-014': q(
		'Which district is named after the great astronomer and ruler?',
		{
			'mirzo-ulugbek': 'Mirzo Ulugbek District',
			shaykhantahur: 'Shaykhantahur District',
			yakkasaray: 'Yakkasaray District',
			yashnobod: 'Yashnobod District',
		},
	),
	'tashkent-015': q(
		'Which Tashkent district name is connected with an apple orchard?',
		{
			olmazor: 'Olmazor',
			bektemir: 'Bektemir',
			sergeli: 'Sergeli',
			mirobod: 'Mirobod',
		},
	),
	'tashkent-016': q(
		'Which airport serves Tashkent’s main international flights?',
		{
			'tashkent-airport': 'Tashkent International Airport',
			'samarkand-airport': 'Samarkand Airport',
			'namangan-airport': 'Namangan Airport',
			'urgench-airport': 'Urgench Airport',
		},
	),
	'tashkent-017': q(
		'Which major sports and concert complex is located in Tashkent?',
		{
			'humo-arena': 'Humo Arena',
			'registan-arena': 'Registan Arena',
			'aral-palace': 'Aral Palace',
			'zarafshan-dome': 'Zarafshan Dome',
		},
		'Humo Arena in Tashkent',
	),
	'tashkent-018': q(
		'Which amusement park is located next to Tashkent City center?',
		{
			'magic-city': 'Magic City',
			'eco-park': 'Ecopark',
			'ankhor-lokomotiv': 'Ankhor-Lokomotiv',
			'ashgabat-park': 'Ashgabat Park',
		},
	),
	'tashkent-019': q(
		'Which open-air museum in Tashkent is dedicated to railway equipment?',
		{
			'railway-museum': 'Railway Equipment Museum',
			'art-museum': 'Art Museum',
			'temurid-museum': 'Museum of Timurid History',
			'polytechnic-museum': 'Polytechnic Museum',
		},
	),
	'tashkent-020': q(
		'Which museum is located near Amir Temur Square?',
		{
			'temurid-museum': 'Museum of Timurid History',
			'savitsky-museum': 'Savitsky Museum',
			'afrosiab-museum': 'Afrosiab Museum',
			'khiva-museum': 'Itchan Kala Museum',
		},
	),
	'tashkent-021': q(
		'Which university in Tashkent is known by the English name WIUT?',
		{
			wiut: 'Westminster International University',
			tsue: 'Tashkent State University of Economics',
			nuwu: 'National University of Uzbekistan',
			inha: 'Inha University in Tashkent',
		},
	),
	'tashkent-022': q(
		'Which university is named after Mirzo Ulugbek?',
		{
			'national-university': 'National University of Uzbekistan',
			'world-economy': 'University of World Economy and Diplomacy',
			'medical-academy': 'Tashkent Medical Academy',
			'architecture-university':
				'Tashkent University of Architecture and Civil Engineering',
		},
	),
	'tashkent-023': q(
		'Which higher education institution in Tashkent specializes in world economy and diplomacy?',
		{
			uwed: 'UWED',
			inha: 'Inha',
			webster: 'Webster University',
			tuit: 'TUIT',
		},
	),
	'tashkent-024': q(
		'Which university is most often associated with IT and telecommunications?',
		{
			tuit: 'TUIT named after Muhammad al-Khwarizmi',
			tslaw: 'Tashkent State University of Law',
			conservatory: 'State Conservatory',
			'textile-institute': 'Textile Institute',
		},
	),
	'tashkent-025': q(
		'Which public transport system in Tashkent is famous for artistically designed stations?',
		{
			metro: 'Metro',
			tram: 'Tram',
			funicular: 'Funicular',
			monorail: 'Monorail',
		},
		'Tashkent Metro',
	),
	'tashkent-026': q(
		'Which metro station is named in honor of friendship among peoples?',
		{
			'xalqlar-dostligi': 'Xalqlar Dostligi',
			'mustaqillik-maydoni': 'Mustaqillik Maydoni',
			'buyuk-ipak-yoli': 'Buyuk Ipak Yoli',
			tinchlik: 'Tinchlik',
		},
	),
	'tashkent-027': q(
		'Which Tashkent park is named after the capital of Turkmenistan?',
		{
			'ashgabat-park': 'Ashgabat Park',
			'seoul-park': 'Seoul Park',
			'navoi-park': 'Alisher Navoi Park',
			'gafur-gulyam-park': 'Gafur Gulyam Park',
		},
	),
	'tashkent-028': q(
		'Which Tashkent park has a South Korean theme?',
		{
			'seoul-park': 'Seoul Park',
			'ashgabat-park': 'Ashgabat Park',
			'eco-park': 'Ecopark',
			'botanical-garden': 'Botanical Garden',
		},
	),
	'tashkent-029': q(
		'Which district is in the north of the city and gave its name to a large residential area?',
		{
			yunusabad: 'Yunusabad',
			chilanzar: 'Chilanzar',
			sergeli: 'Sergeli',
			bektemir: 'Bektemir',
		},
	),
	'tashkent-030': q(
		'Which Tashkent City site is most often seen as a new-format business center?',
		{
			'business-center': 'International Business Center',
			'railway-station': 'Northern Railway Station',
			'botanical-garden': 'Botanical Garden',
			'chorsu-bazaar': 'Chorsu Bazaar',
		},
	),
} satisfies Record<string, QuizQuestionTranslation>

const UZ_LATN_QUIZ_TRANSLATIONS = {
	'uz-geo-001': q("O'zbekiston poytaxti qaysi shahar?", {
		tashkent: 'Toshkent',
		samarkand: 'Samarqand',
		bukhara: 'Buxoro',
		namangan: 'Namangan',
	}),
	'uz-geo-002': q(
		'Registon maydoni qaysi shaharda joylashgan?',
		{
			samarkand: 'Samarqand',
			khiva: 'Xiva',
			nukus: 'Nukus',
			andijan: 'Andijon',
		},
		'Samarqanddagi Registon maydoni',
	),
	'uz-geo-003': q(
		"O'zbekiston va Qozog'iston hududida qaysi dengiz keskin sayozlashgan?",
		{
			'aral-sea': 'Orol dengizi',
			'caspian-sea': 'Kaspiy dengizi',
			'black-sea': 'Qora dengiz',
			'red-sea': 'Qizil dengiz',
		},
		'Sayozlashgan Orol dengizi',
	),
	'uz-geo-004': q("Qaysi davlat O'zbekiston bilan shimolda chegaradosh?", {
		kazakhstan: "Qozog'iston",
		iran: 'Eron',
		india: 'Hindiston',
		china: 'Xitoy',
	}),
	'uz-geo-005': q('Ichan Qal’a qaysi shaharda joylashgan?', {
		khiva: 'Xiva',
		termez: 'Termiz',
		karshi: 'Qarshi',
		fergana: "Farg'ona",
	}, 'Xivadagi Ichan qal’a'),
	'uz-geo-006': q(
		"O'zbekiston shimoli-g'arbining katta qismini qaysi cho'l egallaydi?",
		{
			kyzylkum: 'Qizilqum',
			sahara: 'Sahro',
			gobi: 'Gobi',
			taklamakan: 'Taklamakon',
		},
		"O'zbekistondagi Qizilqum cho'li",
	),
	'uz-geo-007': q(
		"O'zbekistonning ikki asosiy daryosidan biri qaysi?",
		{
			'amu-darya': 'Amudaryo',
			volga: 'Volga',
			nile: 'Nil',
			danube: 'Dunay',
		},
	),
	'uz-geo-008': q("Qaysi daryo Farg'ona vodiysi bilan bog'liq?", {
		'syr-darya': 'Sirdaryo',
		thames: 'Temza',
		rhine: 'Reyn',
		mekong: 'Mekong',
	}),
	'uz-geo-009': q("Qoraqalpog'iston poytaxti qaysi shahar?", {
		nukus: 'Nukus',
		urgench: 'Urganch',
		navoi: 'Navoiy',
		jizzakh: 'Jizzax',
	}),
	'uz-geo-010': q("Buxoro viloyatining ma'muriy markazi qaysi shahar?", {
		bukhara: 'Buxoro',
		gulistan: 'Guliston',
		namangan: 'Namangan',
		termiz: 'Termiz',
	}),
	'uz-geo-011': q(
		"Go'ri Amir maqbarasi qaysi shaharda joylashgan?",
		{
			samarkand: 'Samarqand',
			bukhara: 'Buxoro',
			khiva: 'Xiva',
			kokand: "Qo'qon",
		},
		"Samarqanddagi Go'ri Amir maqbarasi",
	),
	'uz-geo-012': q(
		"Xudoyorxon saroyi bilan qaysi shahar mashhur?",
		{
			kokand: "Qo'qon",
			navoi: 'Navoiy',
			muynak: "Mo'ynoq",
			gulistan: 'Guliston',
		},
		"Qo'qondagi Xudoyorxon saroyi",
	),
	'uz-geo-013': q(
		"Qaysi shahar odatda ipak va hunarmandchilik bilan bog'lanadi?",
		{
			margilan: "Marg'ilon",
			zarafshan: 'Zarafshon',
			muynak: "Mo'ynoq",
			bekabad: 'Bekobod',
		},
	),
	'uz-geo-014': q('Savitskiy muzeyi qaysi shaharda joylashgan?', {
		nukus: 'Nukus',
		khiva: 'Xiva',
		samarkand: 'Samarqand',
		tashkent: 'Toshkent',
	}),
	'uz-geo-015': q("Termiz shahri qaysi viloyat bilan bog'liq?", {
		surkhandarya: 'Surxondaryo viloyati',
		sirdarya: 'Sirdaryo viloyati',
		khorezm: 'Xorazm viloyati',
		navoi: 'Navoiy viloyati',
	}),
	'uz-geo-016': q("O'zbekiston janubida qaysi davlat joylashgan?", {
		afghanistan: "Afg'oniston",
		russia: 'Rossiya',
		mongolia: "Mo'g'uliston",
		azerbaijan: 'Ozarbayjon',
	}),
	'uz-geo-017': q("Quyidagi davlatlardan qaysi biri O'zbekiston bilan chegaradosh emas?", {
		azerbaijan: 'Ozarbayjon',
		tajikistan: 'Tojikiston',
		turkmenistan: 'Turkmaniston',
		kyrgyzstan: "Qirg'iziston",
	}),
	'uz-geo-018': q("Qaysi tog' tizimi O'zbekiston sharqiga yetib keladi?", {
		'tian-shan': 'Tyanshan',
		alps: 'Alp tog‘lari',
		andes: 'And tog‘lari',
		atlas: 'Atlas tog‘lari',
	}),
	'uz-geo-019': q(
		"Qaysi vodiy O'zbekiston, Qirg'iziston va Tojikiston o'rtasida bo'lingan?",
		{
			'fergana-valley': "Farg'ona vodiysi",
			'rift-valley': 'Buyuk Rift vodiysi',
			'po-valley': 'Po vodiysi',
			'loire-valley': 'Luara vodiysi',
		},
	),
	'uz-geo-020': q("Qaysi shahar Qo'qon xonligining muhim poytaxti bo'lgan?", {
		kokand: "Qo'qon",
		zarafshan: 'Zarafshon',
		chirchiq: 'Chirchiq',
		angren: 'Angren',
	}),
	'uz-geo-021': q('Xorazm viloyatining ma’muriy markazi qaysi shahar?', {
		urgench: 'Urganch',
		khiva: 'Xiva',
		nukus: 'Nukus',
		bukhara: 'Buxoro',
	}),
	'uz-geo-022': q('Qashqadaryo viloyatining ma’muriy markazi qaysi shahar?', {
		karshi: 'Qarshi',
		termez: 'Termiz',
		navoi: 'Navoiy',
		gulistan: 'Guliston',
	}),
	'uz-geo-023': q('Sirdaryo viloyatining ma’muriy markazi qaysi shahar?', {
		gulistan: 'Guliston',
		jizzakh: 'Jizzax',
		namangan: 'Namangan',
		urgench: 'Urganch',
	}),
	'uz-geo-024': q('Jizzax viloyatining ma’muriy markazi qaysi shahar?', {
		jizzakh: 'Jizzax',
		andijan: 'Andijon',
		bukhara: 'Buxoro',
		nukus: 'Nukus',
	}),
	'uz-geo-025': q(
		"Dunyodagi eng yirik oltin konlaridan biri bo'lgan Muruntov koni qaysi viloyat bilan bog'liq?",
		{
			navoi: 'Navoiy viloyati',
			khorezm: 'Xorazm viloyati',
			fergana: "Farg'ona viloyati",
			andijan: 'Andijon viloyati',
		},
	),
	'uz-geo-026': q('Namangan viloyatining ma’muriy markazi qaysi shahar?', {
		namangan: 'Namangan',
		fergana: "Farg'ona",
		andijan: 'Andijon',
		samarkand: 'Samarqand',
	}),
	'uz-geo-027': q(
		"Samarqanddagi qaysi masjid Bibixonim nomi bilan bog'liq?",
		{
			'bibi-khanym': 'Bibixonim masjidi',
			minor: 'Minor masjidi',
			kalan: 'Kalon masjidi',
			'juma-khiva': 'Xiva Juma masjidi',
		},
		'Samarqanddagi Bibixonim masjidi',
	),
	'uz-geo-028': q('Toshkent viloyatining ma’muriy markazi qaysi shahar?', {
		nurafshon: 'Nurafshon',
		'tashkent-city': 'Toshkent shahri',
		chirchiq: 'Chirchiq',
		angren: 'Angren',
	}),
	'uz-geo-029': q(
		"Toshkentning markaziy diqqatga sazovor joylaridan biri bo'lgan maydon qaysi?",
		{
			'amir-temur-square': 'Amir Temur maydoni',
			'registan-square': 'Registon',
			'ichan-kala': 'Ichan qal’a',
			'ark-fortress': 'Ark qal’asi',
		},
		'Toshkentdagi Amir Temur maydoni',
	),
	'uz-geo-030': q("Ark qal’asi qaysi shahar bilan bog'liq?", {
		bukhara: 'Buxoro',
		andijan: 'Andijon',
		jizzakh: 'Jizzax',
		gulistan: 'Guliston',
	}),
	'uz-geo-031': q(
		"Toshkent, Samarqand va Buxoroni bog'lovchi tezyurar poyezd qanday nomlanadi?",
		{
			afrosiyob: 'Afrosiyob',
			'orient-express': 'Sharq ekspressi',
			sapsan: 'Sapsan',
			'talgo-steppe': "Cho'l ekspressi",
		},
		'Afrosiyob tezyurar poyezdi',
	),
	'uz-geo-032': q(
		'Qaysi shaharning tarixiy markazi YUNESKOning Jahon merosi ro‘yxatiga kiritilgan?',
		{
			bukhara: 'Buxoro',
			angren: 'Angren',
			bekabad: 'Bekobod',
			gulistan: 'Guliston',
		},
	),
	'uz-geo-033': q('Hazrati Imom majmuasi qayerda joylashgan?', {
		tashkent: 'Toshkent',
		samarkand: 'Samarqand',
		khiva: 'Xiva',
		termez: 'Termiz',
	}, 'Toshkentdagi Hazrati Imom masjidi ichki qismi'),
	'uz-geo-034': q(
		"Toshkent yaqinidagi qaysi obyekt mashhur tog' suv ombori sifatida tanilgan?",
		{
			charvak: 'Chorvoq suv ombori',
			aidarkul: "Aydarko'l",
			sarygamysh: 'Sariqamish',
			'aral-sea': 'Orol dengizi',
		},
	),
	'uz-geo-035': q(
		"Toshkent yaqinidagi qaysi tog' kurorti ko'pincha Chimyon bilan bog'lanadi?",
		{
			beldersay: 'Beldersoy',
			muynak: "Mo'ynoq",
			zarafshan: 'Zarafshon',
			gulistan: 'Guliston',
		},
	),
	'uz-geo-036': q('Samarqanddagi qadimiy shahar-muzey qaysi?', {
		afrosiab: 'Afrosiyob',
		ellikkala: 'Ellikqal’a',
		paikend: 'Poykent',
		kampyrtepa: 'Kampirtepa',
	}),
	'uz-geo-037': q(
		"Orolning sobiq qirg'og'idagi kemalar qabristoni bilan qaysi shahar mashhur?",
		{
			muynak: "Mo'ynoq",
			urgench: 'Urganch',
			nukus: 'Nukus',
			karshi: 'Qarshi',
		},
		"Mo'ynoqda Orol dengizining sobiq qirg'og'i yonidagi kemalar",
	),
	'uz-geo-038': q(
		'Buxoroning tarixiy markazidagi mashhur minora qanday nomlanadi?',
		{
			'kalan-minaret': 'Kalon minorasi',
			'minor-minaret': 'Minor minorasi',
			'islam-khoja': 'Islomxo‘ja minorasi',
			'qutlug-timur': "Qutlug' Temur minorasi",
		},
		'Buxorodagi Kalon minorasi',
	),
	'uz-geo-039': q("Labi Hovuz me'moriy ansambli qaysi shaharda joylashgan?", {
		bukhara: 'Buxoro',
		samarkand: 'Samarqand',
		tashkent: 'Toshkent',
		andijan: 'Andijon',
	}, 'Buxorodagi Labi Hovuz ansambli'),
	'uz-geo-040': q('Qaysi milliy bog‘ Jizzax viloyatida joylashgan?', {
		zaamin: 'Zomin milliy tabiat parki',
		'ugam-chatkal': 'Ugom-Chotqol bog‘i',
		'baday-tugay': "Baday-To'qay",
		hissar: "Hisor qo'riqxonasi",
	}, 'Zomin milliy tabiat parki'),
	'uz-geo-041': q(
		"Toshkentdagi qaysi transport Markaziy Osiyodagi birinchi metropoliten bo'lgan?",
		{
			'tashkent-metro': 'Toshkent metropoliteni',
			tram: 'Toshkent tramvayi',
			'airport-express': 'Aeroekspress',
			monorail: 'Monorels',
		},
		'Toshkent metrosi',
	),
	'uz-geo-042': q(
		"Ayozqal’a va Tuproqqal’ani o'z ichiga olgan Qoraqalpog'istondagi qadimiy qal'alar guruhi qanday ataladi?",
		{
			ellikkala: 'Ellikqal’a',
			registan: 'Registon',
			'ichan-kala': 'Ichan qal’a',
			'hazrati-imam': 'Hazrati Imom',
		},
	),
	'tashkent-001': q(
		"Qaysi bozor eski Toshkentning asosiy ramzlaridan biri hisoblanadi?",
		{
			chorsu: 'Chorsu',
			kuyluk: "Qo'yliq",
			farhad: 'Farhod',
			askiya: 'Askiya',
		},
		'Toshkentdagi Chorsu bozori',
	),
	'tashkent-002': q('Qaysi metro bekati Chorsu bozori yonida joylashgan?', {
		chorsu: 'Chorsu',
		oybek: 'Oybek',
		minor: 'Minor',
		beruniy: 'Beruniy',
	}),
	'tashkent-003': q("Toshkentdagi qaysi obyekt baland teleminora sifatida tanilgan?", {
		'tv-tower': 'Toshkent teleminorasi',
		'humo-arena': 'Humo Arena',
		'palace-forums': 'Forumlar saroyi',
		'state-circus': 'Davlat sirki',
	}, 'Toshkent teleminorasi'),
	'tashkent-004': q('Amir Temur haykali qaysi maydonda joylashgan?', {
		'amir-temur-square': 'Amir Temur maydoni',
		'independence-square': 'Mustaqillik maydoni',
		'chorsu-square': 'Chorsu maydoni',
		'friendship-square': "Xalqlar do'stligi maydoni",
	}, 'Toshkentdagi Amir Temur maydoni'),
	'tashkent-005': q(
		'Ruscha “Площадь Независимости” deb ataladigan maydonning rasmiy o‘zbekcha nomi qaysi?',
		{
			mustaqillik: 'Mustaqillik maydoni',
			registan: 'Registon',
			shahriston: 'Shahriston',
			navruz: "Navro'z maydoni",
		},
	),
	'tashkent-006': q(
		"Eski shahardagi qaysi majmua xalifa Usmon Qur'oni bilan bog'liq?",
		{
			'hazrati-imam': 'Hazrati Imom',
			'minor-mosque': 'Minor masjidi',
			kukeldash: "Ko'kaldosh madrasasi",
			abdulkasim: 'Abdulqosim madrasasi',
		},
		'Toshkentdagi Hazrati Imom masjidi ichki qismi',
	),
	'tashkent-007': q(
		"Oq fasadi va Anhor kanali bo'yidagi joylashuvi bilan qaysi Toshkent masjidi mashhur?",
		{
			'minor-mosque': 'Minor masjidi',
			'tilla-sheikh': 'Tilla Shayx masjidi',
			namazgah: 'Namozgoh',
			juma: 'Juma masjidi',
		},
		'Toshkentdagi Minor masjidi',
	),
	'tashkent-008': q('Qaysi metro bekati kosmik mavzudagi bezagi bilan mashhur?', {
		kosmonavtlar: 'Kosmonavtlar',
		pakhtakor: 'Paxtakor',
		novza: 'Novza',
		'hamid-olimjon': 'Hamid Olimjon',
	}, 'Toshkentdagi Kosmonavtlar metro bekati'),
	'tashkent-009': q(
		"Qaysi bekatlar juftligi markazdagi metro yo'nalishlari orasidagi mashhur o'tish joyini hosil qiladi?",
		{
			'pakhtakor-alisher-navoi': 'Paxtakor va Alisher Navoiy',
			'minor-bodomzor': 'Minor va Bodomzor',
			'chorsu-gafur-gulyam': "Chorsu va G'afur G'ulom",
			'dustlik-mashinasozlar': "Do'stlik va Mashinasozlar",
		},
		'Toshkentdagi Alisher Navoiy metro bekati',
	),
	'tashkent-010': q("Chorsu bekati qaysi metro yo'nalishida joylashgan?", {
		'uzbekistan-line': "O'zbekiston yo'nalishi",
		'chilanzar-line': "Chilonzor yo'nalishi",
		'yunusabad-line': "Yunusobod yo'nalishi",
		'circle-line': 'Halqa yo‘nalishi',
	}),
	'tashkent-011': q('Variantlardan qaysi biri Toshkent shahri tumani?', {
		yunusabad: 'Yunusobod',
		chirchik: 'Chirchiq',
		yangiyul: "Yangiyo'l",
		parkent: 'Parkent',
	}),
	'tashkent-012': q('Quyidagilardan qaysi Toshkent tumani eng yangi tashkil etilgan?', {
		yangihayot: 'Yangihayot',
		chilanzar: 'Chilonzor',
		mirobod: 'Mirobod',
		uchtepa: 'Uchtepa',
	}),
	'tashkent-013': q('Qaysi tuman nomi so‘zma-so‘z “uch tepa” bilan bog‘liq?', {
		uchtepa: 'Uchtepa',
		olmazor: 'Olmazor',
		bektemir: 'Bektemir',
		sergeli: 'Sergeli',
	}),
	'tashkent-014': q(
		"Qaysi tuman buyuk astronom va hukmdor nomi bilan atalgan?",
		{
			'mirzo-ulugbek': 'Mirzo Ulug‘bek tumani',
			shaykhantahur: 'Shayxontohur tumani',
			yakkasaray: 'Yakkasaroy tumani',
			yashnobod: 'Yashnobod tumani',
		},
	),
	'tashkent-015': q('Toshkentdagi qaysi tuman nomi olma bog‘i bilan bog‘liq?', {
		olmazor: 'Olmazor',
		bektemir: 'Bektemir',
		sergeli: 'Sergeli',
		mirobod: 'Mirobod',
	}),
	'tashkent-016': q(
		"Toshkentning asosiy xalqaro reyslariga qaysi aeroport xizmat ko'rsatadi?",
		{
			'tashkent-airport': 'Toshkent xalqaro aeroporti',
			'samarkand-airport': 'Samarqand aeroporti',
			'namangan-airport': 'Namangan aeroporti',
			'urgench-airport': 'Urganch aeroporti',
		},
	),
	'tashkent-017': q(
		"Toshkentda qaysi yirik sport-konsert majmuasi joylashgan?",
		{
			'humo-arena': 'Humo Arena',
			'registan-arena': 'Registan Arena',
			'aral-palace': 'Aral Palace',
			'zarafshan-dome': 'Zarafshan Dome',
		},
		'Toshkentdagi Humo Arena',
	),
	'tashkent-018': q("Tashkent City markazi yonida qaysi ko'ngilochar park joylashgan?", {
		'magic-city': 'Magic City',
		'eco-park': 'Ecopark',
		'ankhor-lokomotiv': 'Anhor-Lokomotiv',
		'ashgabat-park': 'Ashxobod bog‘i',
	}),
	'tashkent-019': q(
		"Toshkentdagi qaysi ochiq osmon ostidagi muzey temiryo'l texnikasiga bag'ishlangan?",
		{
			'railway-museum': "Temiryo'l texnikasi muzeyi",
			'art-museum': "San'at muzeyi",
			'temurid-museum': 'Temuriylar tarixi muzeyi',
			'polytechnic-museum': 'Politexnika muzeyi',
		},
	),
	'tashkent-020': q('Amir Temur maydoni yaqinida qaysi muzey joylashgan?', {
		'temurid-museum': 'Temuriylar tarixi muzeyi',
		'savitsky-museum': 'Savitskiy muzeyi',
		'afrosiab-museum': 'Afrosiyob muzeyi',
		'khiva-museum': 'Ichan qal’a muzeyi',
	}),
	'tashkent-021': q('Toshkentdagi qaysi universitet WIUT inglizcha nomi bilan mashhur?', {
		wiut: 'Vestminster xalqaro universiteti',
		tsue: 'Toshkent davlat iqtisodiyot universiteti',
		nuwu: 'O‘zbekiston Milliy universiteti',
		inha: 'Toshkentdagi Inha universiteti',
	}),
	'tashkent-022': q('Qaysi universitet Mirzo Ulug‘bek nomi bilan atalgan?', {
		'national-university': 'O‘zbekiston Milliy universiteti',
		'world-economy': 'Jahon iqtisodiyoti va diplomatiya universiteti',
		'medical-academy': 'Toshkent tibbiyot akademiyasi',
		'architecture-university': 'Toshkent arxitektura-qurilish universiteti',
	}),
	'tashkent-023': q(
		"Toshkentdagi qaysi oliy ta'lim muassasasi jahon iqtisodiyoti va diplomatiyaga ixtisoslashgan?",
		{
			uwed: 'JIDU',
			inha: 'Inha',
			webster: 'Webster University',
			tuit: 'TATU',
		},
	),
	'tashkent-024': q(
		"Qaysi universitet ko'pincha IT va telekommunikatsiya bilan bog'lanadi?",
		{
			tuit: 'Muhammad al-Xorazmiy nomidagi TATU',
			tslaw: 'Toshkent davlat yuridik universiteti',
			conservatory: 'Davlat konservatoriyasi',
			'textile-institute': "To'qimachilik instituti",
		},
	),
	'tashkent-025': q(
		"Toshkentdagi qaysi jamoat transporti badiiy bezatilgan bekatlari bilan mashhur?",
		{
			metro: 'Metro',
			tram: 'Tramvay',
			funicular: 'Funikulyor',
			monorail: 'Monorels',
		},
		'Toshkent metrosi',
	),
	'tashkent-026': q("Qaysi metro bekati xalqlar do'stligi sharafiga nomlangan?", {
		'xalqlar-dostligi': "Xalqlar do'stligi",
		'mustaqillik-maydoni': 'Mustaqillik maydoni',
		'buyuk-ipak-yoli': "Buyuk ipak yo'li",
		tinchlik: 'Tinchlik',
	}),
	'tashkent-027': q("Toshkentdagi qaysi bog' Turkmaniston poytaxti nomi bilan atalgan?", {
		'ashgabat-park': "Ashxobod bog'i",
		'seoul-park': 'Seul bog‘i',
		'navoi-park': 'Alisher Navoiy bog‘i',
		'gafur-gulyam-park': "G'afur G'ulom bog‘i",
	}),
	'tashkent-028': q("Toshkentdagi qaysi bog' Janubiy Koreya mavzusi bilan bog'liq?", {
		'seoul-park': 'Seul bog‘i',
		'ashgabat-park': "Ashxobod bog'i",
		'eco-park': 'Ecopark',
		'botanical-garden': 'Botanika bog‘i',
	}),
	'tashkent-029': q(
		'Qaysi tuman shaharning shimoliy qismida joylashgan va yirik turar-joy massiviga nom bergan?',
		{
			yunusabad: 'Yunusobod',
			chilanzar: 'Chilonzor',
			sergeli: 'Sergeli',
			bektemir: 'Bektemir',
		},
	),
	'tashkent-030': q(
		"Tashkent Citydagi qaysi obyekt ko'pincha yangi formatdagi ishbilarmonlik markazi sifatida qabul qilinadi?",
		{
			'business-center': 'Xalqaro biznes markazi',
			'railway-station': 'Shimoliy vokzal',
			'botanical-garden': 'Botanika bog‘i',
			'chorsu-bazaar': 'Chorsu bozori',
		},
	),
} satisfies Record<string, QuizQuestionTranslation>

const QUIZ_TRANSLATIONS: Partial<
	Record<AppLanguage, Record<string, QuizQuestionTranslation>>
> = {
	en: EN_QUIZ_TRANSLATIONS,
	'uz-Latn': UZ_LATN_QUIZ_TRANSLATIONS,
}

function getQuestionTranslation(
	question: QuizChoiceQuestion,
	language: AppLanguage,
): QuizQuestionTranslation | undefined {
	return QUIZ_TRANSLATIONS[language]?.[question.id]
}

export function getQuizPrompt(
	question: QuizChoiceQuestion,
	language: AppLanguage,
): string {
	return getQuestionTranslation(question, language)?.prompt ?? question.prompt
}

export function getQuizImageAlt(
	question: QuizChoiceQuestion,
	language: AppLanguage,
): string | undefined {
	return (
		getQuestionTranslation(question, language)?.imageAlt ?? question.imageAlt
	)
}

export function getQuizChoiceLabel(
	question: QuizChoiceQuestion,
	choice: AnswerChoice,
	language: AppLanguage,
): string {
	return (
		getQuestionTranslation(question, language)?.choices[choice.id] ??
		choice.label
	)
}
