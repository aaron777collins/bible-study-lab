import { getJson } from "@/lib/data/load";

/** [name, slug, passage count] */
export type TopicIndexRow = [name: string, slug: string, count: number];
export const loadTopicIndex = () => getJson<TopicIndexRow[]>("topics/index.json");

/** Flat triples: start id, end id (0 for one verse), quality score. */
export async function loadTopicPassages(slug: string): Promise<[number, number, number][]> {
  const letter = /^[a-z]/.test(slug) ? slug[0] : "0";
  const file = await getJson<Record<string, number[]>>(`topics/${letter}.json`);
  const flat = file[slug] ?? [];
  const out: [number, number, number][] = [];
  for (let i = 0; i < flat.length; i += 3) out.push([flat[i], flat[i + 1], flat[i + 2]]);
  return out;
}

/** A starting set of common topics, shown first. Each must exist in the index (checked by a test). */
export const STARTER_TOPICS = [
  "hope", "forgiveness", "anxiety", "prayer", "grace", "faith", "love", "suffering", "wisdom", "money",
  "marriage", "death", "peace", "joy", "strength", "comfort", "courage", "fear", "patience", "humility",
  "gratitude", "mercy", "salvation", "temptation", "forgiving-others", "loneliness", "worry", "trust", "obedience", "heaven",
  "friendship", "anger", "healing", "guidance", "purpose", "generosity", "worship", "repentance", "justice", "rest",
];
