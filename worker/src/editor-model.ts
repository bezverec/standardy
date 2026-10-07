import type { RegistryDocument, RuleDocument } from "../../packages/registry-core/src/model.ts";
import { validateSemanticDocuments, type ValidationIssue } from "../../packages/registry-core/src/validate-semantic.ts";
import validateRule from "../generated/rule-schema.cjs";

export function validateProposal(document: unknown, published: RegistryDocument[]): ValidationIssue[] {
  if (!validateRule(document)) return (validateRule.errors ?? []).slice(0, 100).map((issue) => ({ path: issue.instancePath || "/", message: issue.message ?? "Invalid schema" }));
  const rule = document as RuleDocument;
  if (published.some((item) => item.id === rule.id && item.kind !== "rule")) return [{ message: "ID belongs to another entity kind" }];
  return validateSemanticDocuments([...published.filter((item) => !(item.kind === "rule" && item.id === rule.id)), rule]);
}

export function stableJson(value: unknown): string {
  function sorted(item: unknown): unknown {
    if (Array.isArray(item)) return item.map(sorted);
    if (item && typeof item === "object") return Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)).map(([key, val]) => [key, sorted(val)]));
    return item;
  }
  return JSON.stringify(sorted(value));
}

export async function documentHash(document: unknown): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(stableJson(document))));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function changedFields(before: unknown, after: unknown, prefix = ""): Array<{ path: string; before: unknown; after: unknown }> {
  if (stableJson(before) === stableJson(after)) return [];
  if (before && after && typeof before === "object" && typeof after === "object" && Array.isArray(before) === Array.isArray(after)) {
    return [...new Set([...Object.keys(before), ...Object.keys(after)])].sort().flatMap((key) => changedFields(
      (before as Record<string, unknown>)[key], (after as Record<string, unknown>)[key], `${prefix}/${key.replaceAll("~", "~0").replaceAll("/", "~1")}`,
    ));
  }
  return [{ path: prefix || "/", before: before ?? null, after: after ?? null }];
}
