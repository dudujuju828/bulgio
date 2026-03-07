const modules = import.meta.glob('./cards/*.json', { eager: true });

export interface Card {
  bg: string;
  en: string;
  pronunciation: string;
  example: string;
  type: string;
  category: string;
}

interface CardFile {
  category: string;
  cards: Omit<Card, 'category'>[];
}

const allCards: Card[] = [];
const categorySet = new Set<string>();
const typeSet = new Set<string>();

for (const mod of Object.values(modules)) {
  const file = (mod as { default: CardFile }).default;
  for (const card of file.cards) {
    allCards.push({ ...card, category: file.category });
    categorySet.add(file.category);
    typeSet.add(card.type);
  }
}

export const cards = allCards;
export const categories = [...categorySet];
export const types = [...typeSet];
