export const LECTURE_CATEGORY_COLOR_MAP = {
  tech: 'blue',
  nature: 'green',
  artes: 'red',
  'wild-card': 'orange',
} as const

export type LectureCategory = keyof typeof LECTURE_CATEGORY_COLOR_MAP
export type LectureCategoryColor = (typeof LECTURE_CATEGORY_COLOR_MAP)[LectureCategory]

export const LECTURE_CATEGORIES = Object.keys(LECTURE_CATEGORY_COLOR_MAP) as LectureCategory[]

function resolveLectureCategory(category: string): LectureCategory | null {
  const normalizedCategory = category.trim()

  if (normalizedCategory in LECTURE_CATEGORY_COLOR_MAP) {
    return normalizedCategory as LectureCategory
  }

  return null
}

export function getLectureCategoryColor(category: string): LectureCategoryColor | null {
  const resolvedCategory = resolveLectureCategory(category)

  if (resolvedCategory) {
    return LECTURE_CATEGORY_COLOR_MAP[resolvedCategory]
  }

  return null
}

export function normalizeLectureCategory(
  category: string,
): { category: LectureCategory; categoryColor: LectureCategoryColor } | null {
  const resolvedCategory = resolveLectureCategory(category)

  if (!resolvedCategory) {
    return null
  }

  return {
    category: resolvedCategory,
    categoryColor: LECTURE_CATEGORY_COLOR_MAP[resolvedCategory],
  }
}

export function isValidLectureCategoryPair(category: string, categoryColor: string): boolean {
  const expectedColor = getLectureCategoryColor(category)
  return expectedColor !== null && expectedColor === categoryColor
}
