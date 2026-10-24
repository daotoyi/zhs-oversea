export type Chapter = {
  title: string;
  zh: string;
  text: string;
  note: string;
  practice: string;
};

export type Hexagram = {
  zh: string;
  en: string;
  symbol: string;
  image: string;
  reading: string;
};

export type JournalPost = {
  category: string;
  minutes: number;
  title: string;
  image: string;
  body: string[];
};
