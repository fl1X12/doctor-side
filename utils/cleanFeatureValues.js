export const cleanFeatureValues = (features) => {
  return features.map(({ feature, value }) => {
    let cleanedValue = value;

    // Common OCR fixes
    cleanedValue = cleanedValue
      .replace(/[()]/g, '') // remove brackets
      .replace(/Celise?u?mm/gi, 'cells/cu mm')
      .replace(/Callscumm/gi, 'cells/cu mm')
      .replace(/Celiseo mm/gi, 'cells/cu mm')
      .replace(/Caliseumm/gi, 'cells/cu mm')
      .replace(/Cellsienmm/gi,'cells/cu mm')
      .replace(/u\/s/gi, 'g/dL')
      .replace(/\bia\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Fix 4) % -> 41 %
    if (cleanedValue.match(/^\d{1,2}\)?\s*%$/)) {
      cleanedValue = cleanedValue.replace(')', '') + ' %';
    }

    // Extract number
    const numMatch = cleanedValue.match(/[\d.]+/);
    const numeric = numMatch ? parseFloat(numMatch[0]) : null;

    return {
      feature,
      value: cleanedValue,
      numeric: !isNaN(numeric) ? numeric : null,
    };
  });
};
