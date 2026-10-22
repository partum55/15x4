// Demo branch: mock content that replaces the Supabase database.
// Dates are relative to "now" so the demo always has both upcoming and past events.
import { CITY_OPTIONS } from '@/constants/cities'
import { getLectureCategoryColor } from '@/constants/lectureCategories'
import type { ContentRow } from '@/lib/content-api'
import { DEMO_USER } from '@/lib/demo-user'

const day = (offset: number) => new Date(Date.now() + offset * 864e5).toISOString().slice(0, 10)
const stamp = (offset: number) => new Date(Date.now() + offset * 864e5).toISOString()
const OWNER = DEMO_USER.id

// id, city, dayOffset, time, titleUk, titleEn, locationUk, locationEn
const EVENT_TABLE = [
  ['e1', 'kyiv', 21, '18:30', 'Мости між науками', 'Bridges Between Sciences', 'Мистецький арсенал, зал 2', 'Mystetskyi Arsenal, Hall 2'],
  ['e2', 'lviv', 45, '19:00', 'Світ у деталях', 'The World in Detail', 'Центр Шептицьких', 'Sheptytsky Center'],
  ['e3', 'tartu', 70, '18:00', 'Наука без кордонів', 'Science Without Borders', 'Університет Тарту, Аудиторія 4', 'University of Tartu, Room 4'],
  ['e4', 'kharkiv', -40, '18:00', 'Дані, мізки і музика', 'Data, Brains and Music', 'Харківський університет, головна зала', 'Kharkiv University, Main Hall'],
  ['e5', 'odesa', -120, '18:30', 'Море, небо і код', 'Sea, Sky and Code', 'Одеська кіностудія', 'Odesa Film Studio'],
  ['e6', 'munich', 100, '19:00', 'Чернетка: Наука в Мюнхені', 'Draft: Science in Munich', 'Місце уточнюється', 'Venue TBD'],
] as const

// eventId, slot, category, authorUk, authorEn, titleUk, titleEn, summaryUk, summaryEn
const LECTURE_TABLE = [
  ['e1', 1, 'tech', 'Олена Коваль', 'Olena Koval', 'Як навчити машину бачити', 'How to Teach a Machine to See', 'Від перших нейромереж до сучасного комп’ютерного зору за 15 хвилин.', 'From the first neural nets to modern computer vision in 15 minutes.'],
  ['e1', 2, 'nature', 'Андрій Мельник', 'Andrii Melnyk', 'Мова грибів', 'The Language of Fungi', 'Як ліс обмінюється сигналами під землею.', 'How a forest exchanges signals underground.'],
  ['e1', 3, 'artes', 'Ірина Шевчук', 'Iryna Shevchuk', 'Чому ми любимо сумну музику', 'Why We Love Sad Music', 'Психологія і нейронаука естетичних емоцій.', 'The psychology and neuroscience of aesthetic emotion.'],
  ['e1', 4, 'wild-card', 'Тарас Бондар', 'Taras Bondar', 'Математика черг', 'The Mathematics of Queues', 'Чому інша черга завжди швидша — і що з цим робити.', 'Why the other line always moves faster — and what to do about it.'],
  ['e2', 1, 'nature', 'Соломія Гнатюк', 'Solomiia Hnatiuk', 'Карпатські льодовики, яких уже немає', 'The Carpathian Glaciers That Are Gone', 'Слід льодовикового періоду в ландшафті Західної України.', 'Traces of the Ice Age in the landscape of western Ukraine.'],
  ['e2', 2, 'tech', 'Максим Лук’яненко', 'Maksym Lukianenko', 'Квантові комп’ютери без магії', 'Quantum Computers Without Magic', 'Що таке кубіт і навіщо він потрібен.', 'What a qubit is and why anyone needs one.'],
  ['e2', 3, 'artes', 'Марта Різник', 'Marta Riznyk', 'Шрифти, які змінили історію', 'Typefaces That Changed History', 'Як літери формують наше сприйняття тексту.', 'How letterforms shape the way we read.'],
  ['e2', 4, 'wild-card', 'Володимир Пилип', 'Volodymyr Pylyp', 'Наука про сон', 'The Science of Sleep', 'Що відбувається з мозком, поки ми спимо.', 'What happens to the brain while we sleep.'],
  ['e3', 1, 'tech', 'Кадрі Тамм', 'Kadri Tamm', 'Цифрова держава: естонський досвід', 'The Digital State: Estonia’s Experience', 'Як країна переїхала в хмару.', 'How a country moved to the cloud.'],
  ['e3', 2, 'nature', 'Юрій Савчук', 'Yurii Savchuk', 'Болота як кліматичні герої', 'Bogs as Climate Heroes', 'Чому торфовища зберігають більше вуглецю, ніж ліси.', 'Why peatlands store more carbon than forests.'],
  ['e3', 3, 'artes', 'Анна Мартин', 'Anna Martin', 'Музика, яку створює алгоритм', 'Music Made by Algorithm', 'Чи може код бути композитором.', 'Can code be a composer?'],
  ['e3', 4, 'wild-card', 'Ліна Йоханссон', 'Lina Johansson', 'Чому ми забуваємо сни', 'Why We Forget Our Dreams', 'Пам’ять і ранковий туман у голові.', 'Memory and the morning fog in the head.'],
  ['e4', 1, 'tech', 'Дмитро Гончаренко', 'Dmytro Honcharenko', 'Великі дані без паніки', 'Big Data Without the Panic', 'Як виглядає робота з терабайтами на практиці.', 'What working with terabytes looks like in practice.'],
  ['e4', 2, 'nature', 'Наталія Остапчук', 'Natalia Ostapchuk', 'Як птахи знаходять дорогу', 'How Birds Find Their Way', 'Магнітне чуття та зоряна навігація.', 'Magnetic sense and star navigation.'],
  ['e4', 3, 'artes', 'Богдан Кравець', 'Bohdan Kravets', 'Мозок на концерті', 'The Brain at a Concert', 'Що робить із нами жива музика.', 'What live music does to us.'],
  ['e4', 4, 'wild-card', 'Софія Данильченко', 'Sofiia Danylchenko', 'Хімія кави', 'The Chemistry of Coffee', 'Чому ранкова чашка пахне саме так.', 'Why your morning cup smells the way it does.'],
  ['e5', 1, 'tech', 'Єгор Приходько', 'Yehor Prykhodko', 'Дрони і навігація', 'Drones and Navigation', 'Як літальний апарат розуміє, де він.', 'How a flying machine knows where it is.'],
  ['e5', 2, 'nature', 'Вікторія Лисенко', 'Viktoriia Lysenko', 'Чорне море: життя на глибині', 'The Black Sea: Life at Depth', 'Що відомо про шар без кисню.', 'What we know about the oxygen-free layer.'],
  ['e5', 3, 'artes', 'Руслан Захарчук', 'Ruslan Zakharchuk', 'Кіно як наука про час', 'Cinema as a Science of Time', 'Як монтаж маніпулює нашим відчуттям часу.', 'How editing manipulates our sense of time.'],
  ['e5', 4, 'wild-card', 'Оксана Руденко', 'Oksana Rudenko', 'Чому в нас є почуття гумору', 'Why We Have a Sense of Humor', 'Еволюція сміху — серйозно.', 'The evolution of laughter — seriously.'],
  ['e6', 1, 'tech', 'Ганс Мюллер', 'Hans Müller', 'Чернетка: інженерія майбутнього', 'Draft: Engineering the Future', 'Лекція очікує схвалення адміністратора.', 'This lecture is awaiting admin approval.'],
] as const

const city = (id: string) => CITY_OPTIONS.find((c) => c.id === id)!

export const DEMO_EVENTS: ContentRow[] = EVENT_TABLE.map(([id, cityId, offset, time, titleUk, titleEn, locationUk, locationEn], i) => ({
  id,
  titleUk,
  titleEn,
  descriptionUk: 'Вечір із чотирма лекціями по 15 хвилин. Це демонстраційні дані — події вигадані.',
  descriptionEn: 'An evening of four 15-minute lectures. This is demo data — the event is fictional.',
  city: cityId,
  cityUk: city(cityId).uk,
  cityEn: city(cityId).en,
  cities: { nameUk: city(cityId).uk, nameEn: city(cityId).en },
  date: day(offset),
  time,
  locationUk,
  locationEn,
  image: '/images/event-image-1.png',
  registrationUrl: offset > 0 ? 'https://15x4.org' : undefined,
  eventPhotosUrl: offset < 0 ? 'https://15x4.org' : undefined,
  isPublic: id !== 'e6',
  userId: OWNER,
  createdAt: stamp(-200 + i),
  updatedAt: stamp(-200 + i),
}))

export const DEMO_LECTURES: ContentRow[] = LECTURE_TABLE.map(([eventId, slot, category, authorUk, authorEn, titleUk, titleEn, summaryUk, summaryEn], i) => ({
  id: `l${i + 1}`,
  eventId,
  slot,
  category,
  categoryColor: getLectureCategoryColor(category),
  authorUk,
  authorEn,
  image: `/images/lecture-image-${(i % 3) + 1}.png`,
  titleUk,
  titleEn,
  summaryUk,
  summaryEn,
  authorBioUk: 'Вигаданий спікер для демонстрації.',
  authorBioEn: 'A fictional speaker for demo purposes.',
  sources: null,
  isPublic: eventId !== 'e6',
  userId: OWNER,
  createdAt: stamp(-150 + i),
  updatedAt: stamp(-150 + i),
}))
