const FEATURE_SYNONYMS = {
  haemoglobin: "Hemoglobin",
  hb: "Hemoglobin",
  hemoglobin: "Hemoglobin",
  rbc: "RBC Count",
  wbc: "WBC Count",
  pcv: "PCV",
  mcv: "MCV",
  mch: "MCH",
  mchc: "MCHC",
  rdwcv: "RDW-CV",
  rdwsd: "RDW-SD",
  platelet: "Platelet Count",
  plateletcount: "Platelet Count",
  neutrophils: "Neutrophils",
  lymphocytes: "Lymphocytes",
  eosinophils: "Eosinophils",
  monocytes: "Monocytes",
  basophils: "Basophils",
  "total count": "WBC Count",
};

const IGNORED_FEATURE_PATTERNS = [
  "labs",
  "department",
  "checkup",
  "screening",
  "test name",
  "whole blood",
  "hematology",
  "unit",
  "method",
  "interval",
  "reference",
  "received on",
  "reported on",
  "sample type",
  "consultant",
  "doctor",
  "lab address",
  "room",
  "name",
  "gender",
  "date",
  "phone",
  "address",
];

const WHITELISTED_FEATURES = new Set(Object.values(FEATURE_SYNONYMS));

const normalizeFeature = (feature) => {
  const key = feature.toLowerCase().replace(/[^a-z]/g, "");
  return FEATURE_SYNONYMS[key] || null;
};

const isWhitelisted = (feature) => {
  const base = feature.replace(/\s*\(.*?\)/, "").trim();
  return WHITELISTED_FEATURES.has(base);
};

export const extractFeatureValues = (lines) => {
  const result = [];

  for (const line of lines) {
    const cleaned = line.trim();
    if (!cleaned || cleaned.length < 2) continue;

    const lower = cleaned.toLowerCase();
    if (IGNORED_FEATURE_PATTERNS.some((term) => lower.includes(term))) continue;

    // Colon or tab-separated
    const colonSplit = cleaned.split(/[:\t]+/);
    if (colonSplit.length === 2) {
      const rawFeature = colonSplit[0].trim();
      const value = colonSplit[1].trim();
      const feature = normalizeFeature(rawFeature);
      if (feature && /[\d.]/.test(value) && isWhitelisted(feature)) {
        result.push({ feature, value });
      }
      continue;
    }

    // Feature + value in one line
    const match = cleaned.match(/^([A-Za-z\-()%\/\s]+)\s+([\d.,]+.*)$/);
    if (match) {
      const rawFeature = match[1].trim();
      const value = match[2].trim();
      const feature = normalizeFeature(rawFeature);
      if (feature && /[\d.]/.test(value) && isWhitelisted(feature)) {
        result.push({ feature, value });
      }
    }
  }

  // Group % and absolute
  const grouped = {};
  for (const { feature, value } of result) {
    const base = feature.replace(/\s*\(.*?\)/, "").trim();
    if (!grouped[base]) grouped[base] = {};
    if (/%/.test(value)) grouped[base].percent = value;
    else if (/cell|cumm/i.test(value)) grouped[base].abs = value;
    else grouped[base].raw = value;
  }

  const final = [];
  for (const key in grouped) {
    const entry = grouped[key];
    if (entry.percent) final.push({ feature: `${key} (%)`, value: entry.percent });
    if (entry.abs) final.push({ feature: `${key} (Abs)`, value: entry.abs });
    else if (entry.raw) final.push({ feature: key, value: entry.raw });
  }

  return final;
};
