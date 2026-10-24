import type { Hexagram } from '@/lib/content-types';

export const HEXAGRAMS: Record<string, Hexagram> = {
  qian: {
    zh: '乾', en: 'The Creative', symbol: '☰', image: 'Heaven over Heaven',
    reading: 'Six unbroken lines. The image is pure yang — the sky, the horse, the father, the head. The judgement is that of something beginning that cannot yet be helped: keep going, and do not stop to celebrate.',
  },
  kun: {
    zh: '坤', en: 'The Receptive', symbol: '☷', image: 'Earth over Earth',
    reading: 'Six broken lines. The image is earth, the mare, the mother, the belly. Where the creative initiates, the receptive carries — and carrying is the harder discipline, because it looks like nothing.',
  },
  kan: {
    zh: '坎', en: 'The Abysmal', symbol: '☵', image: 'Water over Water',
    reading: 'Water repeated. Danger is the plain meaning. The classic advice is not to avoid the water but to learn its channels — the sage goes through the gorge by knowing where the current will carry him.',
  },
  li: {
    zh: '離', en: 'The Clinging', symbol: '☲', image: 'Fire over Fire',
    reading: 'Fire repeated. Fire has no substance of its own; it clings to what it burns. The chapter reads as a warning about any brilliance that depends on a host — including reputation, and including love.',
  },
  xun: {
    zh: '巽', en: 'The Gentle', symbol: '☴', image: 'Wind over Wind',
    reading: 'Wind repeated, penetrating. Not weakness but reach: wind enters everywhere, and no door stops it. The judgement favours the small and continuous over the large and sudden.',
  },
  gen: {
    zh: '艮', en: 'The Reedy', symbol: '☶', image: 'Mountain over Mountain',
    reading: 'Mountain repeated. Stillness, and the specific stillness of a boundary being kept. There is activity in the hexagram, but it is the activity of not moving — which the text treats as a positive act.',
  },
  zhen: {
    zh: '震', en: 'The Thunder', symbol: '☳', image: 'Thunder over Thunder',
    reading: 'Thunder repeated. Shock, and the recovery afterwards. The classic line is that the superior man, in fear, is able to keep the sacrificial vessel — meaning that alarm, handled well, is a form of attention.',
  },
  dui: {
    zh: '兑', en: 'The Joyous', symbol: '☱', image: 'Lake over Lake',
    reading: 'Lake repeated. Pleasure, discussion, and the pleasure of discussion. Two lakes sharing one water: the hexagram is about joy that is held in common, and the danger of joy that is not.',
  },
};
