import type { Hexagram } from '@/lib/content-types';

/**
 * 《周易》六十四卦 —— 按原本卦序（1 乾 … 64 未济）。
 * 每卦：卦名（中）、英名、卦象符号、上下经卦之象、一段白话读法。
 * 中文名与中文读法见 lib/i18n/zh-hans-content.ts 的 HEXAGRAMS_ZH。
 */
export const HEXAGRAMS: Record<string, Hexagram> = {
  qian: {
    zh: '乾', en: 'The Creative', symbol: '䷀', image: 'Heaven over Heaven',
    reading: 'Six unbroken lines. The image is pure yang — the sky, the horse, the father, the head. The judgement is that of something beginning that cannot yet be helped: keep going, and do not stop to celebrate.',
  },
  kun: {
    zh: '坤', en: 'The Receptive', symbol: '䷁', image: 'Earth over Earth',
    reading: 'Six broken lines. The image is earth, the mare, the mother, the belly. Where the creative initiates, the receptive carries — and carrying is the harder discipline, because it looks like nothing.',
  },
  zhun: {
    zh: '屯', en: 'Difficulty at the Beginning', symbol: '䷂', image: 'Water over Thunder',
    reading: 'Clouds over thunder, no rain yet. Everything at the start stands in this condition — force gathered with nowhere to go. The counsel is to appoint a lord and gather helpers: a beginning cannot be carried by one person’s heroism.',
  },
  meng: {
    zh: '蒙', en: 'Youthful Folly', symbol: '䷃', image: 'Mountain over Water',
    reading: 'Water at the foot of the mountain: a spring that has not yet found its course. Folly here is not stupidity but inexperience, and the text treats it as a stage with its own discipline. The wise do not answer every question at once; they let the asker grow into the answer.',
  },
  xu: {
    zh: '需', en: 'Waiting', symbol: '䷄', image: 'Water over Heaven',
    reading: 'Clouds rising, the rain not yet come. Waiting is active: the text puts the waiters in the open, fed and at ease, because the danger is not the delay but the temper it breeds. Cross the great water only when the water is ready to be crossed.',
  },
  song: {
    zh: '訟', en: 'Conflict', symbol: '䷅', image: 'Heaven over Water',
    reading: 'Heaven above, water seeking its own level below — two courses that cannot share one channel. Conflict is real and sometimes right; the text is exact about how far to take it. Halfway is the dangerous place: pursue a dispute to the end, or do not begin it.',
  },
  shi: {
    zh: '師', en: 'The Army', symbol: '䷆', image: 'Earth over Water',
    reading: 'Water hidden within the earth: an army is strength kept underground. Discipline is the whole subject — the host moves on one command, and the command belongs to the older, unhurried man. The hexagram distrusts courage that has not been organised.',
  },
  bi: {
    zh: '比', en: 'Holding Together', symbol: '䷇', image: 'Water over Earth',
    reading: 'Water spread over the earth settles into every low place. Union happens naturally; the care of the text is about when it happens. Join early and from within, not late and from outside — the latecomer to a formed circle is the one the judgement warns about.',
  },
  'xiao-xu': {
    zh: '小畜', en: 'The Taming Power of the Small', symbol: '䷈', image: 'Wind over Heaven',
    reading: 'Wind moving across the sky: something is being held back, gently, and not yet enough. Small accumulation, small restraint — the hexagram is about progress made by withholding rather than pressing. A dense cloud that does not rain tests everyone’s patience, including the right one’s.',
  },
  lu: {
    zh: '履', en: 'Treading', symbol: '䷉', image: 'Heaven over Lake',
    reading: 'Treading on the tiger’s tail; the tiger does not bite. Conduct is the subject: the hexagram describes moving correctly among things stronger than oneself. The weak treads upon the strong not by force but by knowing exactly where the foot may go.',
  },
  tai: {
    zh: '泰', en: 'Peace', symbol: '䷊', image: 'Earth over Heaven',
    reading: 'Heaven and earth in communion — the powers above descending, the powers below rising. Peace is not rest; it is the traffic between them running freely. The text notes that every peace carries its own ending, and that the ending begins when the traffic stops.',
  },
  pi: {
    zh: '否', en: 'Standstill', symbol: '䷋', image: 'Heaven over Earth',
    reading: 'Heaven and earth no longer in communion. Everything stands, and standing still is not peace but stagnation — the good person is tested by having nothing to do. The text holds the reversal inside the standstill: the turn comes from within, held quietly.',
  },
  'tong-ren': {
    zh: '同人', en: 'Fellowship with Men', symbol: '䷌', image: 'Heaven over Fire',
    reading: 'Fire rising to meet heaven: likeness finding likeness. Fellowship in the open square, not in the closet — the hexagram values association that happens in daylight and survives being seen. Its one warning is the clique that feels like fellowship and is only comfort.',
  },
  'da-you': {
    zh: '大有', en: 'Possession in Great Measure', symbol: '䷍', image: 'Fire over Heaven',
    reading: 'Fire over the sky, illuminating everything at once. Great possession shines, and the whole care of the text is that possession of this size stops being personal. What is lit this widely belongs to what it lights; the good heir is the one who knows it.',
  },
  'qian-modesty': {
    zh: '謙', en: 'Modesty', symbol: '䷎', image: 'Earth over Mountain',
    reading: 'Mountain hidden inside the earth: the visible part is the plain, the weight is underneath. Modesty in this text is not performance but structure — the mountain is actually there, simply not displayed. The judgement: heaven and earth themselves keep low, and everything follows.',
  },
  yu: {
    zh: '豫', en: 'Enthusiasm', symbol: '䷏', image: 'Thunder over Earth',
    reading: 'Thunder breaking out of the earth, and everything answering it. Enthusiasm is contagious in both directions — the text pairs the ruler’s music with the people’s response. Its caution is against enthusiasm that has been assigned: joy scheduled is no longer joy.',
  },
  sui: {
    zh: '隨', en: 'Following', symbol: '䷐', image: 'Lake over Thunder',
    reading: 'Thunder into the lake, rest following movement. Following is the hexagram of the disciple and of the day’s proper order — retreat when the day retreats, advance when it advances. The perfection of following is that no one notices they are being led.',
  },
  gu: {
    zh: '蠱', en: 'Work on What Has Been Spoiled', symbol: '䷑', image: 'Mountain over Wind',
    reading: 'Wind stopped at the foot of the mountain: something has gone slack and begun to rot. Decay is the subject, and the text is unsentimental — repair the father’s decay and name it while doing so. What has spoiled is not to be mourned; it is to be worked on.',
  },
  lin: {
    zh: '臨', en: 'Approach', symbol: '䷒', image: 'Earth over Lake',
    reading: 'The lake approaching the earth, the tide coming in. Approach is auspicious and time-bound — everything depends on the eighth month, when the tide turns. Influence grows the way water rises: without any decision, it covers more ground.',
  },
  guan: {
    zh: '觀', en: 'Contemplation', symbol: '䷓', image: 'Wind over Earth',
    reading: 'Wind moving over the earth, touching everything, changing nothing. The sage is contemplated rather than contemplating — the hexagram turns the usual subject around. Rule by being watched: the people do not need explanations, they need something steady to look at.',
  },
  'shi-he': {
    zh: '噬嗑', en: 'Biting Through', symbol: '䷔', image: 'Fire over Thunder',
    reading: 'Thunder and fire together: something is obstructing the mouth and must be bitten through. The text is candid that justice here means clearing a blockage, and that clearing it requires marks in the line — visible penalties, publicly placed. What blocks must be chewed, not talked around.',
  },
  'bi-grace': {
    zh: '賁', en: 'Grace', symbol: '䷕', image: 'Mountain over Fire',
    reading: 'Fire under the mountain: the mountain lit from below, every edge visible. Grace is ornament, and the text takes it seriously as structure rather than veneer — form is what lets content be seen at all. Its limit is exact: grace at the end of the road is a small thing, and a small thing rightly held.',
  },
  bo: {
    zh: '剝', en: 'Splitting Apart', symbol: '䷖', image: 'Mountain over Earth',
    reading: 'Mountain eroding into the plain. The text is stripped of comfort on purpose: the splitting is real, the loss is counted line by line. The one instruction is about where to sit — when everything above is going, the place with a bed under it is the low place.',
  },
  fu: {
    zh: '復', en: 'Return', symbol: '䷗', image: 'Earth over Thunder',
    reading: 'Thunder under the earth: the first movement after the deepest stillness. Return is the turning point of the whole book — one yang line enters below, and everything is decided by that single returning step. The text measures the return in days, and the seven days are not a schedule but a natural period.',
  },
  'wu-wang': {
    zh: '無妄', en: 'Innocence', symbol: '䷘', image: 'Heaven over Thunder',
    reading: 'Thunder rolling under heaven, uncalculated. Innocence here is not naivety but the absence of crooked intent — things simply as they are. The paradox of the text: what arrives unexpected and unearned is exactly what the innocent receive, and the one who schemes forfeits it.',
  },
  'da-xu': {
    zh: '大畜', en: 'The Taming Power of the Great', symbol: '䷙', image: 'Mountain over Heaven',
    reading: 'Heaven stored inside the mountain: accumulation of a different order from the small hexagram. What is held here is not goods but strength — the image is the great carriage, loaded and ready to travel far. Restraint at this scale is itself a form of power.',
  },
  yi: {
    zh: '頤', en: 'Nourishment', symbol: '䷚', image: 'Mountain over Thunder',
    reading: 'Jaws working: the seeking of nourishment, and what is sought. The hexagram moves from food to the source of food — the text asks where the filling comes from, and whether the filling is worth taking. What you nourish yourself on will eventually be visible.',
  },
  'da-guo': {
    zh: '大過', en: 'Preponderance of the Great', symbol: '䷛', image: 'Lake over Wind',
    reading: 'Wind surging over the lake: the great outweighs everything that would hold it. The beam is bent under the load. The text is unusual in permitting an extraordinary move — when the situation itself has broken the rules, only an irregular answer fits.',
  },
  kan: {
    zh: '坎', en: 'The Abysmal', symbol: '䷜', image: 'Water over Water',
    reading: 'Water repeated. Danger is the plain meaning. The classic advice is not to avoid the water but to learn its channels — the sage goes through the gorge by knowing where the current will carry him.',
  },
  li: {
    zh: '離', en: 'The Clinging', symbol: '䷝', image: 'Fire over Fire',
    reading: 'Fire repeated. Fire has no substance of its own; it clings to what it burns. The chapter reads as a warning about any brilliance that depends on a host — including reputation, and including love.',
  },
  xian: {
    zh: '咸', en: 'Influence', symbol: '䷞', image: 'Lake over Mountain',
    reading: 'The lake receiving the mountain’s influence; the mountain’s shadow moves the water. Influence precedes choice — nobody decides to be moved. The text locates the danger in the heels, the first place the influence lands: where the moving starts determines where it ends.',
  },
  heng: {
    zh: '恆', en: 'Duration', symbol: '䷟', image: 'Thunder over Wind',
    reading: 'Thunder and wind sustaining each other. Duration is not persistence of effort but persistence of form — the hexagram refuses the heroic and prefers the regular. Its warning is against duration held in the wrong place: a long-held mistake does not improve with age.',
  },
  dun: {
    zh: '遁', en: 'Retreat', symbol: '䷠', image: 'Heaven over Mountain',
    reading: 'Heaven’s way withdrawing from the mountain. Retreat is not defeat but the correct use of distance — the text grades it: the retreat of the lower, the middle, the upper, each with its own manners. The one rule is to keep the retreat unhurried; what is done in panic cannot be undone.',
  },
  'da-zhuang': {
    zh: '大壯', en: 'The Power of the Great', symbol: '䷡', image: 'Thunder over Heaven',
    reading: 'Thunder driving through the sky. Power at full volume, and the concern of the text is what the power steps on — the ram that charges fences its horns. The strength is real; the instruction is about not confusing what is strong with what is unobstructed.',
  },
  jin: {
    zh: '晉', en: 'Progress', symbol: '䷢', image: 'Fire over Earth',
    reading: 'The sun rising over the earth: light advancing, things becoming visible in order. Progress in this hexagram is granted, not seized — the text praises the one who is met with belief and given charge. Advancement that needs to be taken by force is not progress.',
  },
  'ming-yi': {
    zh: '明夷', en: 'Darkening of the Light', symbol: '䷣', image: 'Earth over Fire',
    reading: 'The sun gone under the earth. The bright thing is wounded and hides — the image is the lord of Yi’s own liver. The instruction is exact about how to hide brightness: dim it outside, keep it intact inside, and do not mistake the dark for the condition.',
  },
  'jia-ren': {
    zh: '家人', en: 'The Family', symbol: '䷤', image: 'Wind over Fire',
    reading: 'Fire made by wind inside the house. The family is the smallest state, and the text treats it that way — offices, not feelings: the woman’s place, the child’s place, each held and the whole holds. Order at home is not a metaphor for order; it is where order is actually made.',
  },
  kui: {
    zh: '睽', en: 'Opposition', symbol: '䷥', image: 'Fire over Lake',
    reading: 'Fire rising, lake sinking — the two elements turning away from each other. Opposition is the state of things going different directions, and the text does not promise reunion. What it offers is smaller: the ability to meet the other in one honest act, the way strangers share a road.',
  },
  jian: {
    zh: '蹇', en: 'Obstruction', symbol: '䷦', image: 'Water over Mountain',
    reading: 'Water stopped in front of the mountain. Obstruction is total and the text says so — advance is wrong, retreat is wrong. Its counsel is to turn inward and toward the strong one: when the road is closed, the work becomes the walker.',
  },
  jie: {
    zh: '解', en: 'Deliverance', symbol: '䷧', image: 'Thunder over Water',
    reading: 'Thunder and rain breaking the obstruction. Release comes with weather, not with argument — the tension drains because the storm happened. The text pairs deliverance with a duty: forgive the residual wrongs, and return to the ordinary post before it forgets you.',
  },
  sun: {
    zh: '損', en: 'Decrease', symbol: '䷨', image: 'Mountain over Lake',
    reading: 'The lake diminished by the mountain’s height: the lower gives to the higher. Decrease at the bottom is the whole subject — the text is exact that what is taken from below must be matched by sincerity above. The discipline is the arithmetic of giving: decrease the outer, keep the inner.',
  },
  'yi-increase': {
    zh: '益', en: 'Increase', symbol: '䷩', image: 'Wind over Thunder',
    reading: 'Wind and thunder amplifying each other. Increase moves downward — the text says it is good to have somewhere to go, meaning benefit that travels. The caution: increase given to the wrong place is not generosity, it is loss wearing a kind face.',
  },
  guai: {
    zh: '夬', en: 'Breakthrough', symbol: '䷪', image: 'Lake over Heaven',
    reading: 'The lake pushed up to heaven, about to spill. Decision has arrived and cannot be postponed — the text shows the resolved one announcing the matter in the court, plainly. Its single warning is about method: force applied where force is not ripe hardens what it was meant to break.',
  },
  gou: {
    zh: '姤', en: 'The Coming to Meet', symbol: '䷫', image: 'Heaven over Wind',
    reading: 'One yin line entering from below, wind slipping under heaven. The meeting is casual and consequential — the text forbids taking the weak thing lightly because of how it arrives. Do not escort what should not be escorted: the beginning of everything is small and unimpressive.',
  },
  cui: {
    zh: '萃', en: 'Gathering Together', symbol: '䷬', image: 'Lake over Earth',
    reading: 'The lake collecting the water of the earth. Assembly needs a structure and a place — the text names the king and the temple, the altar and the well. Its unease is about the assembly that gathers without a centre: a crowd is not a gathering, and the difference is what it can do.',
  },
  sheng: {
    zh: '升', en: 'Pushing Upward', symbol: '䷭', image: 'Earth over Wind',
    reading: 'Wood growing out of the earth: upward by accumulation, one ring at a time. The text grades the ascent — rise by rising, meet the great without startling it. Growth at this speed does not need to be argued for; it only needs to not be interrupted.',
  },
  'kun-adversity': {
    zh: '困', en: 'Oppression', symbol: '䷮', image: 'Lake over Water',
    reading: 'The lake drained to the bottom: water gone, fish on the bed. Oppression at its exact — the words are there, the listener is not. The text keeps the mind alive inside the constraint: the one thing not taken is what you say when no one is listening.',
  },
  jing: {
    zh: '井', en: 'The Well', symbol: '䷯', image: 'Water over Wind',
    reading: 'Wood drawing water from the well: the mechanism does not change, only the rope does. The well is the one institution the text leaves standing through every change — it may be repaired but not relocated. Its caution is the rope that never reaches the water: a well nobody drinks from.',
  },
  ge: {
    zh: '革', en: 'Revolution', symbol: '䷰', image: 'Lake over Fire',
    reading: 'Fire inside the lake, boiling it. Change has matured into revolution, and the text gives it a calendar — change on the proper day is believed, change on the wrong day is not. What makes the new thing believable is that the old thing is actually finished.',
  },
  ding: {
    zh: '鼎', en: 'The Cauldron', symbol: '䷱', image: 'Fire over Wind',
    reading: 'Fire under the cauldron: the vessel that transforms. The care of the text is the state of the vessel and the state of what goes in — revolution means nothing if the cauldron is dirty. Good fortune is described as the supreme offering, meaning the outcome is measured by what was offered, not by the cooking.',
  },
  zhen: {
    zh: '震', en: 'The Arousing', symbol: '䷲', image: 'Thunder over Thunder',
    reading: 'Thunder repeated. Shock, and the recovery afterwards. The classic line is that the superior man, in fear, is able to keep the sacrificial vessel — meaning that alarm, handled well, is a form of attention.',
  },
  gen: {
    zh: '艮', en: 'Keeping Still', symbol: '䷳', image: 'Mountain over Mountain',
    reading: 'Mountain repeated. Stillness, and the specific stillness of a boundary being kept. There is activity in the hexagram, but it is the activity of not moving — which the text treats as a positive act.',
  },
  'jian-development': {
    zh: '漸', en: 'Development', symbol: '䷴', image: 'Wind over Mountain',
    reading: 'Wood growing on the mountain: slow, visible, taking the shape of the slope. Development is incremental and the text makes the increment the point — the wild goose lands stage by stage. What advances by stages can be watched; what cannot be watched is not development.',
  },
  'gui-mei': {
    zh: '歸妹', en: 'The Marrying Maiden', symbol: '䷵', image: 'Thunder over Lake',
    reading: 'Thunder over the lake, the younger sister given in marriage. The hexagram is about unions made by arrangement rather than choice, and the text is careful rather than romantic: the secondary position held correctly is its own form of order. What cannot be the main thing can still be done well.',
  },
  feng: {
    zh: '豐', en: 'Abundance', symbol: '䷶', image: 'Thunder over Fire',
    reading: 'Thunder and fire together at full strength: the day at its longest. Abundance is peak, and the whole anxiety of the text is that peaks are visible — be like the sun at noon, it says, and then asks how long noon lasts. The decision the hexagram demands is made while there is still light.',
  },
  'li-traveler': {
    zh: '旅', en: 'The Wanderer', symbol: '䷷', image: 'Fire over Mountain',
    reading: 'Fire moving on the mountain: bright, transient, owning nothing. The wanderer’s hexagram is about manners in other people’s places — small, attentive, not settling. Its one instruction is about resentment: the traveller who carries a grievance is carrying luggage that was never his.',
  },
  xun: {
    zh: '巽', en: 'The Gentle', symbol: '䷸', image: 'Wind over Wind',
    reading: 'Wind repeated, penetrating. Not weakness but reach: wind enters everywhere, and no door stops it. The judgement favours the small and continuous over the large and sudden.',
  },
  dui: {
    zh: '兑', en: 'The Joyous', symbol: '䷹', image: 'Lake over Lake',
    reading: 'Lake repeated. Pleasure, discussion, and the pleasure of discussion. Two lakes sharing one water: the hexagram is about joy that is held in common, and the danger of joy that is not.',
  },
  huan: {
    zh: '渙', en: 'Dispersion', symbol: '䷺', image: 'Wind over Water',
    reading: 'Wind driving over the water, scattering it. Dispersion begins as loss and the text turns it — what is scattered can be gathered, and the gathering needs a symbol to gather around. The king approaches his temple: dissolve the distance, then give the dispersed something to come back to.',
  },
  'jie-limitation': {
    zh: '節', en: 'Limitation', symbol: '䷻', image: 'Water over Lake',
    reading: 'The lake has its limits, and the limits are the reason it holds water. Limitation is not deprivation but form — the text counts it, times it, measures it, and finds that bitterness comes only from limits that are not accepted. A limit you have not accepted will be enforced anyway.',
  },
  'zhong-fu': {
    zh: '中孚', en: 'Inner Truth', symbol: '䷼', image: 'Wind over Lake',
    reading: 'Wind over the lake, moving the water that moves nothing above it. Inner truth works without contact — the images are pigs and fish, the things that respond without being argued with. Sincerity at this depth does not persuade; it simply arranges things around itself.',
  },
  'xiao-guo': {
    zh: '小過', en: 'Preponderance of the Small', symbol: '䷽', image: 'Thunder over Mountain',
    reading: 'Thunder over the mountain: the bird’s message is that it should fly low. The small outweighs — and where the great hexagram permits the extraordinary, this one insists on the modest. Its discipline is exact: rise above in humility, stay below in conduct; do not aim at what is above.',
  },
  'ji-ji': {
    zh: '既濟', en: 'Completion', symbol: '䷾', image: 'Water over Fire',
    reading: 'Water over fire, each in its place, the pot on the stove. Completion is real and unstable — the text is most severe at the moment of success, and its word for the start of decay is wearing out. Even the completed thing needs watching; the fox that crossed the ice learns the ice was thin.',
  },
  'wei-ji': {
    zh: '未濟', en: 'Before Completion', symbol: '䷿', image: 'Fire over Water',
    reading: 'Fire over water, the pot not yet on: everything almost. The last hexagram refuses to end — the text says the young fox’s tail gets wet, meaning the crossing was begun too eagerly. The book closes on an unfinished thing, which is the honest state of anything alive.',
  },
};
