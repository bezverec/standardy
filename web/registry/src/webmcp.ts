export interface SearchResult { count: number; ids: string[] }
export interface ModelContext {
  registerTool(tool: ReturnType<typeof searchTool>, options: { signal: AbortSignal }): void | Promise<void>;
}

export function searchTool(search: (query: string) => Promise<SearchResult>) {
  return {
    name: "set_rule_search",
    title: "Hledat v pravidlech NDK",
    description: "Nastaví dotaz v hledání pravidel NDK. Zachová vybrané filtry a vrátí odpovídající ID po aktualizaci zobrazení.",
    inputSchema: { type: "object", properties: { query: { type: "string", maxLength: 1000 } }, required: ["query"], additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: true },
    async execute(input: unknown): Promise<SearchResult> {
      if (!input || typeof input !== "object" || !("query" in input) || typeof input.query !== "string"
        || input.query.length > 1000 || Object.keys(input).some((key) => key !== "query")) throw new Error("query musí být text do 1000 znaků.");
      return search(input.query);
    },
  };
}
