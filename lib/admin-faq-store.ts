export type FaqRecord = {
  id: string;
  question: string;
  answer: string;
  category: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};
const globalFaq = globalThis as typeof globalThis & {
  villakuFaqStore?: Map<string, FaqRecord>;
};
const store = globalFaq.villakuFaqStore ?? new Map<string, FaqRecord>();
if (process.env.NODE_ENV !== "production") globalFaq.villakuFaqStore = store;
export const listMemoryFaqs = () =>
  Array.from(store.values()).sort((a, b) => a.sortOrder - b.sortOrder);
export const getMemoryFaq = (id: string) => store.get(id) ?? null;
export function saveMemoryFaq(item: FaqRecord) {
  store.set(item.id, item);
  return item;
}
export function deleteMemoryFaq(id: string) {
  const item = store.get(id);
  if (!item) return null;
  store.delete(id);
  return item;
}
