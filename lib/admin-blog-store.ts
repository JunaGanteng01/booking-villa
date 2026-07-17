export type BlogStatus = "PUBLISHED" | "DRAFT" | "SCHEDULED";
export type BlogArticle = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  status: BlogStatus;
  coverImage: string | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  views: number;
  createdAt: string;
  updatedAt: string;
};

const globalForBlog = globalThis as typeof globalThis & {
  villakuBlogStore?: Map<string, BlogArticle>;
};
const store = globalForBlog.villakuBlogStore ?? new Map<string, BlogArticle>();
if (process.env.NODE_ENV !== "production")
  globalForBlog.villakuBlogStore = store;

export const listMemoryArticles = () =>
  Array.from(store.values()).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
export const getMemoryArticle = (id: string) =>
  store.get(id) ??
  Array.from(store.values()).find((item) => item.slug === id) ??
  null;
export function saveMemoryArticle(article: BlogArticle) {
  store.set(article.id, article);
  return article;
}
export function deleteMemoryArticle(id: string) {
  const article = getMemoryArticle(id);
  if (!article) return null;
  store.delete(article.id);
  return article;
}
