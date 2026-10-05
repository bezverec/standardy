/** Navigation taxonomy for the roles used in NDK, not an exhaustive ontology of each standard. */
export const metadataAreas = [
  { id: "structural", label: "Strukturální metadata" },
  { id: "descriptive", label: "Popisná metadata" },
  { id: "administrative-technical", label: "Administrativní a technická metadata" },
  { id: "audio-technical", label: "Technická metadata zvuku" },
  { id: "ocr", label: "OCR a rozvržení stránky" },
  { id: "rights", label: "Autorskoprávní metadata" },
  { id: "electronic-technical", label: "Technická metadata e-publikací" },
  { id: "package", label: "Informace o balíčku" },
] as const;
export type MetadataArea = typeof metadataAreas[number]["id"];

export const metadataStandards: ReadonlyArray<{ id: string; label: string; area: MetadataArea; url: string }> = [
  { id: "METS", label: "METS", area: "structural", url: "https://www.loc.gov/standards/mets/" },
  { id: "MODS", label: "MODS", area: "descriptive", url: "https://www.loc.gov/standards/mods/" },
  { id: "DC", label: "Dublin Core", area: "descriptive", url: "https://www.dublincore.org/specifications/dublin-core/dces/" },
  { id: "PREMIS", label: "PREMIS", area: "administrative-technical", url: "https://www.loc.gov/standards/premis/" },
  { id: "MIX", label: "MIX", area: "administrative-technical", url: "https://www.loc.gov/standards/mix/" },
  { id: "AES57", label: "AES57", area: "audio-technical", url: "https://www.aes.org/publications/standards/search.cfm?docID=84" },
  { id: "ALTO", label: "ALTO", area: "ocr", url: "https://www.loc.gov/standards/alto/" },
  { id: "copyrightMD", label: "copyrightMD", area: "rights", url: "https://cdlib.org/groups/rights-management-group-copyrightmd/" },
  { id: "documentMD", label: "documentMD", area: "electronic-technical", url: "https://web.archive.org/web/20150907192814/http://fclaweb.fcla.edu/uploads/Lydia%20Motyka/FDA_documentation/documentMD.pdf" },
  { id: "NDK-INFO", label: "info.xml (NDK)", area: "package", url: "https://standardy.ndk.cz/ndk/spec2014/info1_1.xsd" },
];
export const metadataTaxonomy = { areas: metadataAreas, standards: metadataStandards };
export const metadataAreaForStandard = (id: string): MetadataArea | undefined => metadataStandards.find((standard) => standard.id === id)?.area;

/** Classification follows only the target's owner, never citations or related rules. */
export function targetStandardId(target: string, relations: ReadonlyArray<{ from: string; to: string; type: string }>): string | undefined {
  return relations.find((edge) => edge.from === target && edge.type === "defined_by")?.to;
}
