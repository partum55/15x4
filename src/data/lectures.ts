export type SocialLink = {
  platform: string
  handle: string
  url: string
}

export type Source = {
  label: string
  url?: string
}

export type LectureEvent = {
  city: string
  date: string
  photosUrl?: string
}

export type Lecture = {
  id: string
  category: string
  categoryColor: 'orange' | 'green' | 'blue' | 'red'
  author: string
  image: string
  title: string
  summary: string
  // Detail page fields (optional)
  duration?: string
  videoUrl?: string
  authorBio?: string
  socialLinks?: SocialLink[]
  sources?: Source[]
  event?: LectureEvent
}

export const lectures: Lecture[] = [
  {
    id: 'notpetya',
    category: 'Технології',
    categoryColor: 'blue',
    author: 'Назар Михайлищук',
    image: '/images/lecture-image-1.png',
    title: 'Історія вірусу NotPetya',
    summary:
      'Lorem ipsum dolor sit amet consectetur. Nulla nibh id morbi venenatis mauris elementum vitae odio. Malesuada justo euismod mauris aenean commodo.',
    duration: '17 хв',
    authorBio:
      'Lorem ipsum dolor sit amet consectetur. Nulla nibh id morbi venenatis mauris elementum vitae odio. Malesuada justo euismod mauris aenean commodo.',
    socialLinks: [
      { platform: 'instagram', handle: '@exampple', url: 'https://instagram.com/exampple' },
      { platform: 'telegram', handle: '@exampple', url: 'https://t.me/exampple' },
    ],
    sources: [
      { label: 'Article Example Lorem Ipsum', url: 'https://example.com' },
      { label: 'Introduction to Theories of Personality' },
    ],
    event: {
      city: 'Львів',
      date: '26/09/2026',
      photosUrl: 'https://drive.google.com',
    },
  },
  {
    id: 'blyzhniy-skhid',
    category: 'Суспільство',
    categoryColor: 'orange',
    author: 'Олексій Приймак',
    image: '/images/lecture-image-2.png',
    title: 'Як Близький Схід втратив наукову першість',
    summary:
      'Сучасний Іран — це держава, яка всіма силами опирається сучасності. Втім, кілька століть тому науковці перського походження випереджали світову наукову думку.',
    duration: '22 хв',
    authorBio:
      'Олексій — історик та дослідник Близького Сходу. Захищає докторську дисертацію в Єльському університеті.',
    socialLinks: [
      { platform: 'instagram', handle: '@oleksiy_pryimak', url: 'https://instagram.com' },
    ],
    sources: [
      { label: 'The House of Wisdom — Jonathan Lyons', url: 'https://example.com' },
      { label: 'Lost Enlightenment — S. Frederick Starr' },
    ],
    event: {
      city: 'Львів',
      date: '10/05/2024',
      photosUrl: 'https://drive.google.com',
    },
  },
  {
    id: 'leleka-1',
    category: 'Біологія',
    categoryColor: 'green',
    author: 'Віталій Грищенко',
    image: '/images/lecture-image-3.png',
    title: 'Як білий лелека свідчить про глобальне потепління',
    summary:
      'Зміни клімату видно скрізь, зокрема і в Україні. У нас поки немає катастрофічних лісових пожеж чи повеней, зате їх легко помітити за лелеками.',
    duration: '19 хв',
    event: { city: 'Київ', date: '03/03/2024' },
  },
  {
    id: 'leleka-2',
    category: 'Біологія',
    categoryColor: 'green',
    author: 'Віталій Грищенко',
    image: '/images/lecture-image-1.png',
    title: 'Як білий лелека свідчить про глобальне потепління',
    summary:
      'Зміни клімату видно скрізь, зокрема і в Україні. У нас поки немає катастрофічних лісових пожеж чи повеней, зате їх легко помітити за лелеками.',
    duration: '19 хв',
    event: { city: 'Київ', date: '03/03/2024' },
  },
  {
    id: 'blyzhniy-skhid-2',
    category: 'Суспільство',
    categoryColor: 'orange',
    author: 'Олексій Приймак',
    image: '/images/lecture-image-2.png',
    title: 'Як Близький Схід втратив наукову першість',
    summary:
      'Сучасний Іран — це держава, яка всіма силами опирається сучасності. Втім, кілька століть тому науковці перського походження випереджали світову наукову думку.',
    duration: '22 хв',
    event: { city: 'Львів', date: '10/05/2024' },
  },
]
