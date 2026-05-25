export const publicDomainGradeBands = ["K", "K-1", "Grade 1", "Grade 1-2", "Grade 2", "Read Aloud"];

export const publicDomainDifficulties = ["emergent", "early", "developing", "read-aloud"];

export function collectBookFilterOptions(books = []) {
  return {
    gradeBands: [...new Set(books.map(book => book.gradeBand).filter(Boolean))].sort(),
    difficulties: [...new Set(books.map(book => book.difficulty).filter(Boolean))].sort(),
    tags: [...new Set(books.flatMap(book => book.tags || []))].sort(),
    skills: [...new Set(books.flatMap(book => book.skills || []))].sort()
  };
}

export function filterBooks(books = [], filters = {}) {
  return books.filter(book => {
    if (filters.gradeBand && book.gradeBand !== filters.gradeBand) return false;
    if (filters.difficulty && book.difficulty !== filters.difficulty) return false;
    if (filters.tag && !(book.tags || []).includes(filters.tag)) return false;
    if (filters.skill && !(book.skills || []).includes(filters.skill)) return false;
    return true;
  });
}
