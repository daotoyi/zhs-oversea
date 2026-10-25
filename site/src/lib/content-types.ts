export type Chapter = {
  title: string;
  zh: string;
  text: string;
  note: string;
  practice: string;
};

export type HexagramLine = {
  name: string; // 爻位：初九 / 六二 …（乾坤末条为 用九 / 用六）
  text: string; // 爻辞原文
  textEn: string; // 爻辞英译
  image: string; // 小象原文
  imageEn: string; // 小象英译
};

export type Hexagram = {
  zh: string;
  en: string;
  symbol: string;
  image: string;
  judgement: string; // 卦辞原文
  judgementEn: string; // 卦辞英译
  imageText: string; // 大象传原文
  imageTextEn: string; // 大象传英译
  lines: HexagramLine[]; // 六爻（乾坤含用九/用六共七条）
  reading: string;
};

export type JournalPost = {
  category: string;
  minutes: number;
  title: string;
  image: string;
  body: string[];
};
