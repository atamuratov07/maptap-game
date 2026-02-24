import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { feature } from 'topojson-client';
import countriesTopoJsonUrl from 'world-atlas/countries-110m.json?url';
import type { CountryFeature, CountryInfo, GameData } from './types';

const COUNTRY_FACTS_URL =
  'https://restcountries.com/v3.1/all?fields=name,translations,capital,currencies,flags,ccn3';

interface RestCountryApiItem {
  ccn3?: string;
  name?: {
    common?: string;
  };
  translations?: {
    rus?: {
      common?: string;
    };
  };
  capital?: string[];
  currencies?: Record<
    string,
    {
      name?: string;
    }
  >;
  flags?: {
    png?: string;
    svg?: string;
  };
}

const CYRILLIC_LETTER_PATTERN = /[А-Яа-яЁё]/;
const LATIN_LETTER_PATTERN = /[A-Za-z]/;

const CAPITAL_NAME_OVERRIDES: Record<string, string> = {
  Athens: 'Афины',
  Beijing: 'Пекин',
  Belgrade: 'Белград',
  Berlin: 'Берлин',
  Bern: 'Берн',
  Bratislava: 'Братислава',
  Brussels: 'Брюссель',
  Bucharest: 'Бухарест',
  Budapest: 'Будапешт',
  Chisinau: 'Кишинев',
  Copenhagen: 'Копенгаген',
  Helsinki: 'Хельсинки',
  Kyiv: 'Киев',
  Lisbon: 'Лиссабон',
  Ljubljana: 'Любляна',
  London: 'Лондон',
  Luxembourg: 'Люксембург',
  Madrid: 'Мадрид',
  Minsk: 'Минск',
  Moscow: 'Москва',
  Nicosia: 'Никосия',
  Oslo: 'Осло',
  Paris: 'Париж',
  Prague: 'Прага',
  Reykjavik: 'Рейкьявик',
  Riga: 'Рига',
  Rome: 'Рим',
  Sofia: 'София',
  Stockholm: 'Стокгольм',
  Tallinn: 'Таллин',
  Tirana: 'Тирана',
  Tokyo: 'Токио',
  Vienna: 'Вена',
  Vilnius: 'Вильнюс',
  Warsaw: 'Варшава',
  Yerevan: 'Ереван',
  Zagreb: 'Загреб',
};

const LATIN_TO_CYRILLIC_GROUPS: Array<[string, string]> = [
  ['shch', 'щ'],
  ['sch', 'щ'],
  ['zh', 'ж'],
  ['kh', 'х'],
  ['ts', 'ц'],
  ['ch', 'ч'],
  ['sh', 'ш'],
  ['yu', 'ю'],
  ['ya', 'я'],
  ['yo', 'ё'],
  ['ye', 'е'],
  ['ju', 'ю'],
  ['ja', 'я'],
];

const LATIN_TO_CYRILLIC_CHARS: Record<string, string> = {
  a: 'а',
  b: 'б',
  c: 'к',
  d: 'д',
  e: 'е',
  f: 'ф',
  g: 'г',
  h: 'х',
  i: 'и',
  j: 'дж',
  k: 'к',
  l: 'л',
  m: 'м',
  n: 'н',
  o: 'о',
  p: 'п',
  q: 'к',
  r: 'р',
  s: 'с',
  t: 'т',
  u: 'у',
  v: 'в',
  w: 'в',
  x: 'кс',
  y: 'й',
  z: 'з',
};

function normalizeCountryId(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return parsed.toString().padStart(3, '0');
}

function formatCurrency(
  currencies: Record<
    string,
    {
      name?: string;
    }
  > | null | undefined,
): string {
  if (!currencies) {
    return 'Нет данных';
  }

  const [code, entry] = Object.entries(currencies)[0] ?? [];
  if (!code) {
    return 'Нет данных';
  }

  const currencyName = entry?.name?.trim();
  return currencyName ? `${currencyName} (${code})` : code;
}

function transliterateLatinToken(token: string): string {
  let working = token.toLowerCase();
  for (const [latin, cyrillic] of LATIN_TO_CYRILLIC_GROUPS) {
    working = working.replaceAll(latin, cyrillic);
  }

  let converted = '';
  for (const char of working) {
    converted += LATIN_TO_CYRILLIC_CHARS[char] ?? char;
  }

  if (/^[A-Z]/.test(token) && converted.length > 0) {
    return converted[0].toUpperCase() + converted.slice(1);
  }

  return converted;
}

function toRussianCapitalName(capitalRaw: string | undefined): string {
  const capital = capitalRaw?.trim();
  if (!capital) {
    return 'Нет данных';
  }

  if (CAPITAL_NAME_OVERRIDES[capital]) {
    return CAPITAL_NAME_OVERRIDES[capital];
  }

  if (CYRILLIC_LETTER_PATTERN.test(capital) || !LATIN_LETTER_PATTERN.test(capital)) {
    return capital;
  }

  return capital
    .split(/(\s+|-|,|\/|\(|\))/)
    .map((part) => (LATIN_LETTER_PATTERN.test(part) ? transliterateLatinToken(part) : part))
    .join('');
}

function parseMapFeatures(topologyPayload: unknown): CountryFeature[] {
  const topology = topologyPayload as {
    objects?: Record<string, unknown>;
  };

  const countriesObject = topology.objects?.countries;
  if (!countriesObject) {
    throw new Error('Не найдена геометрия стран в world-atlas.');
  }

  const resolvedFeature = feature(
    topologyPayload as never,
    countriesObject as never,
  ) as FeatureCollection<Geometry, Record<string, unknown>> | Feature<Geometry, Record<string, unknown>>;

  const collection: FeatureCollection<Geometry, Record<string, unknown>> =
    resolvedFeature.type === 'FeatureCollection'
      ? resolvedFeature
      : {
          type: 'FeatureCollection',
          features: [resolvedFeature],
        };

  const features: CountryFeature[] = [];
  for (const item of collection.features) {
    const normalizedId = normalizeCountryId(item.id as string | number | undefined);
    if (!normalizedId) {
      continue;
    }

    features.push({
      ...item,
      id: normalizedId,
    });
  }

  return features;
}

async function loadCountryFacts(signal?: AbortSignal): Promise<Map<string, CountryInfo>> {
  const response = await fetch(COUNTRY_FACTS_URL, { signal });
  if (!response.ok) {
    throw new Error(`Запрос к REST Countries завершился ошибкой: ${response.status}`);
  }

  const payload = (await response.json()) as RestCountryApiItem[];
  const infoMap = new Map<string, CountryInfo>();

  for (const country of payload) {
    const id = normalizeCountryId(country.ccn3);
    if (!id || infoMap.has(id)) {
      continue;
    }

    infoMap.set(id, {
      id,
      name:
        country.translations?.rus?.common?.trim() ||
        country.name?.common?.trim() ||
        'Неизвестно',
      capital: toRussianCapitalName(country.capital?.[0]),
      currency: formatCurrency(country.currencies),
      flagUrl: country.flags?.svg || country.flags?.png || '',
    });
  }

  return infoMap;
}

export async function loadGameData(signal?: AbortSignal): Promise<GameData> {
  const [topologyResponse, infoMapRaw] = await Promise.all([
    fetch(countriesTopoJsonUrl, { signal }),
    loadCountryFacts(signal),
  ]);

  if (!topologyResponse.ok) {
    throw new Error(`Запрос к world-atlas завершился ошибкой: ${topologyResponse.status}`);
  }

  const topologyPayload = await topologyResponse.json();
  const topoFeatures = parseMapFeatures(topologyPayload);
  const featureIdSet = new Set(topoFeatures.map((item) => item.id));

  const allowedIds = [...infoMapRaw.keys()].filter((id) => featureIdSet.has(id));
  const allowedIdSet = new Set(allowedIds);

  const features = topoFeatures.filter((item) => allowedIdSet.has(item.id));
  const infoMap = new Map<string, CountryInfo>();

  for (const id of allowedIds) {
    const info = infoMapRaw.get(id);
    if (info) {
      infoMap.set(id, info);
    }
  }

  return {
    features,
    infoMap,
    allowedIds,
  };
}
