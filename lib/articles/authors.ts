export interface AuthorInfo {
  id: string | null;
  name: string;
  affiliation: string | null;
  email: string | null;
  isMain: boolean;
  isCorresponding: boolean;
  order: number;
}

export const ADMIN_NAMES = [
  'C5K Executive Administrator',
  'The Mother Admin',
  'IJAISM Admin',
  'admin',
  'super_admin',
  'mother_admin'
];

export function getArticleAuthors(article: {
  author?: {
    id: string;
    name: string;
    email: string;
    affiliation?: string | null;
    university?: string | null;
  } | null;
  coAuthors?: Array<{
    id: string;
    userId?: string | null;
    name: string;
    email?: string | null;
    university?: string | null;
    isMain: boolean;
    isCorresponding?: boolean;
    order: number;
  }> | null;
}): AuthorInfo[] {
  const coAuthors = article.coAuthors || [];
  const author = article.author;

  const hasExplicitCoAuthorList = coAuthors.some(ca => ca.isMain || ca.isCorresponding);
  const isSubmitterAdmin = author ? ADMIN_NAMES.includes(author.name) : false;

  if (hasExplicitCoAuthorList || (isSubmitterAdmin && coAuthors.length > 0)) {
    return coAuthors
      .map(ca => ({
        id: ca.userId || null,
        name: ca.name,
        affiliation: ca.university || null,
        email: ca.email || null,
        isMain: ca.isMain,
        // backward compat: old records used isMain as corresponding
        isCorresponding: ca.isCorresponding ?? ca.isMain,
        order: ca.order,
      }))
      .sort((a, b) => a.order - b.order);
  }

  // Legacy fallback: prepend the submitter as main + corresponding
  const resolvedAuthors: AuthorInfo[] = [];

  if (author) {
    resolvedAuthors.push({
      id: author.id,
      name: author.name,
      affiliation: author.affiliation || author.university || null,
      email: author.email,
      isMain: true,
      isCorresponding: true,
      order: 1,
    });
  }

  coAuthors.forEach((ca, idx) => {
    resolvedAuthors.push({
      id: ca.userId || null,
      name: ca.name,
      affiliation: ca.university || null,
      email: ca.email || null,
      isMain: ca.isMain,
      isCorresponding: ca.isCorresponding ?? ca.isMain,
      order: idx + 2,
    });
  });

  return resolvedAuthors.filter(a => !ADMIN_NAMES.includes(a.name));
}
