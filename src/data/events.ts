export type EventLecture = {
  id: string
  title: string
  author: string
  category: string
  categoryColor: 'orange' | 'green' | 'blue' | 'red'
  image: string
  summary: string
}

export type Event = {
  id: string
  city: string
  date: string
  location: string
  time: string
  image: string
  registrationUrl?: string
  lectures: EventLecture[]
}

export const events: Event[] = [
  {
    id: 'lviv-2024-05',
    city: 'Львів',
    date: '10/05',
    location: 'Паркова Аудиторія, Центр Шептицького, вул. Стрийська 29а',
    time: '19:00',
    image: '/images/event-image-1.png',
    lectures: [
      { 
        id: 'notpetya-lviv',
        title: 'Історія вірусу notPetya', 
        author: 'Назар Михайлищук',
        category: 'Технології',
        categoryColor: 'blue',
        image: '/images/lecture-image-1.png',
        summary: 'Lorem ipsum dolor sit amet consectetur. Nulla nibh id morbi venenatis mauris elementum vitae odio. Malesuada justo euismod mauris aenean commodo.'
      },
      { 
        id: 'art-lviv',
        title: 'Історія вірусу notPetya', 
        author: 'Назар Михайлищук',
        category: 'Мистецтво',
        categoryColor: 'green',
        image: '/images/lecture-image-2.png',
        summary: 'Lorem ipsum dolor sit amet consectetur. Nulla nibh id morbi venenatis mauris elementum vitae odio. Malesuada justo euismod mauris aenean commodo.'
      },
      { 
        id: 'tech-2-lviv',
        title: 'Історія вірусу notPetya', 
        author: 'Назар Михайлищук',
        category: 'Технології',
        categoryColor: 'blue',
        image: '/images/lecture-image-3.png',
        summary: 'Lorem ipsum dolor sit amet consectetur. Nulla nibh id morbi venenatis mauris elementum vitae odio. Malesuada justo euismod mauris aenean commodo.'
      },
      { 
        id: 'history-lviv',
        title: 'Історія вірусу notPetya', 
        author: 'Назар Михайлищук',
        category: 'Історія',
        categoryColor: 'orange',
        image: '/images/lecture-image-1.png',
        summary: 'Lorem ipsum dolor sit amet consectetur. Nulla nibh id morbi venenatis mauris elementum vitae odio. Malesuada justo euismod mauris aenean commodo.'
      },
    ],
  },
  {
    id: 'kharkiv-2024-05',
    city: 'Харків',
    date: '20/05',
    location: 'Паркова Аудиторія, Центр Шептицького, вул. Стрийська 29а',
    time: '15:00',
    image: '/images/event-image-1.png',
    lectures: [
      { 
        id: 'tech-kharkiv',
        title: 'Історія вірусу notPetya', 
        author: 'Назар Михайлищук',
        category: 'Технології',
        categoryColor: 'red',
        image: '',
        summary: 'Lorem ipsum dolor sit amet consectetur. Nulla nibh id morbi venenatis mauris elementum vitae odio. Malesuada justo euismod mauris aenean commodo.'
      },
      { 
        id: 'tech-2-kharkiv',
        title: 'Історія вірусу notPetya', 
        author: 'Назар Михайлищук',
        category: 'Технології',
        categoryColor: 'red',
        image: '',
        summary: 'Lorem ipsum dolor sit amet consectetur. Nulla nibh id morbi venenatis mauris elementum vitae odio. Malesuada justo euismod mauris aenean commodo.'
      },
      { 
        id: 'tech-3-kharkiv',
        title: 'Історія вірусу notPetya', 
        author: 'Назар Михайлищук',
        category: 'Технології',
        categoryColor: 'green',
        image: '',
        summary: 'Lorem ipsum dolor sit amet consectetur. Nulla nibh id morbi venenatis mauris elementum vitae odio. Malesuada justo euismod mauris aenean commodo.'
      },
      { 
        id: 'tech-4-kharkiv',
        title: 'Історія вірусу notPetya', 
        author: 'Назар Михайлищук',
        category: 'Технології',
        categoryColor: 'blue',
        image: '',
        summary: 'Lorem ipsum dolor sit amet consectetur. Nulla nibh id morbi venenatis mauris elementum vitae odio. Malesuada justo euismod mauris aenean commodo.'
      },
    ],
  },
]
