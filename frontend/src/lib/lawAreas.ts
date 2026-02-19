export const LAW_AREA_MAP: Record<string, string[]> = {
  "Contract & Commercial": [
    "contract disputes",
    "debt recovery",
    "commercial agreements",
    "partnership disputes",
    "business sale/purchase",
  ],
  "Employment": [
    "unfair dismissal",
    "discrimination",
    "redundancy",
    "TUPE",
    "whistleblowing",
  ],
  "Family": [
    "divorce",
    "financial remedies",
    "child arrangements",
    "domestic abuse",
    "adoption",
  ],
  "Personal Injury": [
    "road traffic accidents",
    "employer liability",
    "clinical negligence",
    "public liability",
  ],
  "Property": [
    "residential conveyancing",
    "landlord & tenant",
    "boundary disputes",
    "planning",
  ],
  "Criminal": [
    "magistrates court",
    "crown court",
    "appeals",
    "regulatory offences",
  ],
  "Immigration": [
    "visa applications",
    "asylum",
    "deportation",
    "citizenship",
  ],
  "Intellectual Property": [
    "patents",
    "trademarks",
    "copyright",
    "design rights",
  ],
  "Regulatory": [
    "financial services",
    "health & safety",
    "environmental",
    "data protection",
  ],
  "Commercial Litigation": [
    "High Court claims",
    "arbitration",
    "mediation",
    "enforcement",
  ],
};

export const MAIN_AREAS = Object.keys(LAW_AREA_MAP);

export function getSubAreas(selectedMainAreas: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const main of selectedMainAreas) {
    for (const sub of LAW_AREA_MAP[main] || []) {
      if (!seen.has(sub)) {
        seen.add(sub);
        result.push(sub);
      }
    }
  }
  return result;
}
