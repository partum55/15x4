export type CityOption = {
  id: string
  uk: string
  en: string
}

export const CITY_OPTIONS: CityOption[] = [
  { id: 'kharkiv', uk: 'Харків', en: 'Kharkiv' },
  { id: 'kyiv', uk: 'Київ', en: 'Kyiv' },
  { id: 'lviv', uk: 'Львів', en: 'Lviv' },
  { id: 'chernivtsi', uk: 'Чернівці', en: 'Chernivtsi' },
  { id: 'chisinau', uk: 'Кишинів', en: 'Chisinau' },
  { id: 'odesa', uk: 'Одеса', en: 'Odesa' },
  { id: 'samara', uk: 'Самара', en: 'Samara' },
  { id: 'khmelnytskyi', uk: 'Хмельницький', en: 'Khmelnytskyi' },
  { id: 'dnipro', uk: 'Дніпро', en: 'Dnipro' },
  { id: 'munich', uk: 'Мюнхен', en: 'Munich' },
  { id: 'tula', uk: 'Тула', en: 'Tula' },
  { id: 'sievierodonetsk', uk: 'Сєвєродонецьк', en: 'Sievierodonetsk' },
  { id: 'tartu', uk: 'Тарту', en: 'Tartu' },
  { id: 'ternopil', uk: 'Тернопіль', en: 'Ternopil' },
  { id: 'ivano-frankivsk', uk: 'Івано-Франківськ', en: 'Ivano-Frankivsk' },
  { id: 'kolomyia', uk: 'Коломия', en: 'Kolomyia' },
]

function normalize(value: string) {
  return value.trim().toLocaleLowerCase('uk')
}

export function findCityOption(value?: string | null) {
  if (!value) return null
  const normalized = normalize(value)
  return CITY_OPTIONS.find((city) =>
    city.id === normalized ||
    normalize(city.uk) === normalized ||
    normalize(city.en) === normalized
  ) ?? null
}

export function isCityId(value: string): value is CityOption['id'] {
  return CITY_OPTIONS.some((city) => city.id === value)
}

export function getCityLabel(city: CityOption, language?: string) {
  return language?.startsWith('en') ? city.en : city.uk
}
