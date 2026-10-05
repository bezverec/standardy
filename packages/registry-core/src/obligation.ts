import type { NdkObligationCode, Obligation } from "./model.ts";

// Preserve the source version's code; no RA/O -> R upgrade is performed here.
export const ndkObligations: Record<NdkObligationCode, Obligation> = {
  M: "mandatory",
  MA: "mandatory_if_available",
  R: "recommended",
  RA: "recommended_if_available",
  O: "optional",
};
