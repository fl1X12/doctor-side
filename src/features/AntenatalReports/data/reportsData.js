export const antenatalReports = [
  {
    name: 'Blood Pressure',
    type: 'pdf',
    available: true,
    uri: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    name: 'Hemoglobin',
    type: 'image',
    available: true,
    uri: 'https://via.placeholder.com/800x600/4a90e2/ffffff?text=Hemoglobin+Report',
  },
  {
    name: 'Blood Sugar',
    type: 'pdf',
    available: false,
    uri: null,
  },
];

export const scanReports = [
  {
    name: 'Dating scan',
    type: 'slider',
    available: true,
    uris: [
      'https://via.placeholder.com/800x600/ff6b6b/ffffff?text=Dating+Scan+1',
      'https://via.placeholder.com/800x600/4ecdc4/ffffff?text=Dating+Scan+2',
    ],
  },
  {
    name: 'NT/NB scan',
    type: 'image',
    available: true,
    uri: 'https://via.placeholder.com/800x600/96ceb4/ffffff?text=NT+NB+Scan',
  },
  {
    name: 'Anomaly scan',
    type: 'pdf',
    available: true,
    uri: 'https://www.africau.edu/images/default/sample.pdf',
  },
  {
    name: 'Growth scan',
    type: 'slider',
    available: true,
    uris: [
      'https://via.placeholder.com/800x600/feca57/ffffff?text=Growth+Scan+1',
      'https://via.placeholder.com/800x600/ff9ff3/ffffff?text=Growth+Scan+2',
    ],
  },
  {
    name: 'Term scan',
    type: 'image',
    available: false,
    uri: null,
  },
];
