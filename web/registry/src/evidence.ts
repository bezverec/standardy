export interface IssueReference { url: string; title: string; number: string }
export function issueReferences(sources: ReadonlyArray<Record<string, unknown>>): IssueReference[] {
  const references = new Map<string, IssueReference>();
  for (const source of sources) {
    if (typeof source.url !== "string") continue;
    const match = source.url.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)(?:#[^\s]*)?$/);
    if (match?.[3]) references.set(source.url, { url: source.url, number: match[3], title: `${match[1]}/${match[2]} #${match[3]}` });
  }
  return [...references.values()];
}
export function linkIssueMentions(text: string, references: IssueReference[]): Array<{ text: string; href?: string }> {
  const parts: Array<{ text: string; href?: string }> = [];
  let offset = 0;
  for (const match of text.matchAll(/#(\d+)\b/g)) {
    const candidates = references.filter((reference) => reference.number === match[1]);
    if (candidates.length !== 1) continue;
    parts.push({ text: text.slice(offset, match.index) }, { text: match[0], href: candidates[0]!.url });
    offset = match.index + match[0].length;
  }
  parts.push({ text: text.slice(offset) });
  return parts;
}
