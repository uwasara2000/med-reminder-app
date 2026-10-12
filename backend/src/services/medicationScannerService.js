const { createWorker } = require('tesseract.js');

// Comprehensive dictionary of common prescription and OTC medications
const COMMON_MEDICATIONS = [
  { name: 'Panadol', genericName: 'Paracetamol', defaultDosage: '500 mg', form: 'pill', color: '#3B82F6', foodInstruction: 'after_meal' },
  { name: 'Paracetamol', genericName: 'Acetaminophen', defaultDosage: '500 mg', form: 'pill', color: '#3B82F6', foodInstruction: 'after_meal' },
  { name: 'Pendol', genericName: 'Paracetamol', defaultDosage: '500 mg', form: 'pill', color: '#3B82F6', foodInstruction: 'after_meal' },
  { name: 'Piriton', genericName: 'Chlorpheniramine Maleate', defaultDosage: '4 mg', form: 'pill', color: '#F59E0B', foodInstruction: 'after_meal' },
  { name: 'Amoxicillin', genericName: 'Amoxicillin Trihydrate', defaultDosage: '500 mg', form: 'capsule', color: '#EF4444', foodInstruction: 'with_meal' },
  { name: 'Augmentin', genericName: 'Amoxicillin / Clavulanate', defaultDosage: '625 mg', form: 'pill', color: '#10B981', foodInstruction: 'with_meal' },
  { name: 'Metformin', genericName: 'Metformin HCl', defaultDosage: '500 mg', form: 'pill', color: '#8B5CF6', foodInstruction: 'with_meal' },
  { name: 'Lipitor', genericName: 'Atorvastatin Calcium', defaultDosage: '20 mg', form: 'pill', color: '#06B6D4', foodInstruction: 'after_meal' },
  { name: 'Atorvastatin', genericName: 'Atorvastatin', defaultDosage: '20 mg', form: 'pill', color: '#06B6D4', foodInstruction: 'after_meal' },
  { name: 'Omeprazole', genericName: 'Omeprazole', defaultDosage: '20 mg', form: 'capsule', color: '#F97316', foodInstruction: 'before_meal' },
  { name: 'Lisinopril', genericName: 'Lisinopril', defaultDosage: '10 mg', form: 'pill', color: '#EC4899', foodInstruction: 'anytime' },
  { name: 'Amlodipine', genericName: 'Amlodipine Besylate', defaultDosage: '5 mg', form: 'pill', color: '#14B8A6', foodInstruction: 'anytime' },
  { name: 'Losartan', genericName: 'Losartan Potassium', defaultDosage: '50 mg', form: 'pill', color: '#6366F1', foodInstruction: 'anytime' },
  { name: 'Ibuprofen', genericName: 'Ibuprofen', defaultDosage: '400 mg', form: 'pill', color: '#EF4444', foodInstruction: 'with_meal' },
  { name: 'Aspirin', genericName: 'Acetylsalicylic Acid', defaultDosage: '100 mg', form: 'pill', color: '#F59E0B', foodInstruction: 'with_meal' },
  { name: 'Cetirizine', genericName: 'Cetirizine HCl', defaultDosage: '10 mg', form: 'pill', color: '#3B82F6', foodInstruction: 'after_meal' },
  { name: 'Zyrtec', genericName: 'Cetirizine', defaultDosage: '10 mg', form: 'pill', color: '#3B82F6', foodInstruction: 'after_meal' },
  { name: 'Ciprofloxacin', genericName: 'Ciprofloxacin HCl', defaultDosage: '500 mg', form: 'pill', color: '#0284C7', foodInstruction: 'after_meal' },
  { name: 'Azithromycin', genericName: 'Azithromycin', defaultDosage: '500 mg', form: 'pill', color: '#84CC16', foodInstruction: 'empty_stomach' },
  { name: 'Gabapentin', genericName: 'Gabapentin', defaultDosage: '300 mg', form: 'capsule', color: '#A855F7', foodInstruction: 'anytime' },
  { name: 'Albuterol', genericName: 'Salbutamol', defaultDosage: '2 puffs', form: 'inhaler', color: '#0284C7', foodInstruction: 'anytime' },
  { name: 'Ventolin', genericName: 'Salbutamol Inhaler', defaultDosage: '2 puffs', form: 'inhaler', color: '#0284C7', foodInstruction: 'anytime' },
  { name: 'Vitamin D3', genericName: 'Cholecalciferol', defaultDosage: '1000 IU', form: 'pill', color: '#F59E0B', foodInstruction: 'with_meal' },
  { name: 'Vitamin C', genericName: 'Ascorbic Acid', defaultDosage: '500 mg', form: 'pill', color: '#F97316', foodInstruction: 'after_meal' },
  { name: 'Multivitamin', genericName: 'Daily Multivitamins & Minerals', defaultDosage: '1 tablet', form: 'pill', color: '#10B981', foodInstruction: 'with_meal' },
  { name: 'Glucosamine', genericName: 'Glucosamine Sulfate', defaultDosage: '1500 mg', form: 'capsule', color: '#64748B', foodInstruction: 'with_meal' },
  { name: 'Melatonin', genericName: 'Melatonin', defaultDosage: '3 mg', form: 'pill', color: '#4338CA', foodInstruction: 'after_meal' },
  { name: 'Metoprolol', genericName: 'Metoprolol Tartrate', defaultDosage: '50 mg', form: 'pill', color: '#2563EB', foodInstruction: 'with_meal' },
  { name: 'Pantoprazole', genericName: 'Pantoprazole Sodium', defaultDosage: '40 mg', form: 'pill', color: '#D97706', foodInstruction: 'before_meal' },
  { name: 'Simvastatin', genericName: 'Simvastatin', defaultDosage: '20 mg', form: 'pill', color: '#7C3AED', foodInstruction: 'after_meal' }
];

const parseMedicineLabelText = (ocrText) => {
  if (!ocrText || typeof ocrText !== 'string') {
    return {
      name: 'Scanned Medication',
      genericName: '',
      dosage: '1 tablet',
      form: 'pill',
      color: '#3B82F6',
      foodInstruction: 'after_meal',
      instructions: 'Take with a full glass of water',
      currentStock: 30,
      times: ['08:00', '20:00']
    };
  }

  const cleanText = ocrText.replace(/\r\n/g, '\n');
  const lowerText = cleanText.toLowerCase();

  // 1. Identify Medication Name & Generic
  let matchedMed = null;
  for (const item of COMMON_MEDICATIONS) {
    const brandRegex = new RegExp(`\\b${item.name}\\b`, 'i');
    const genericRegex = new RegExp(`\\b${item.genericName.split(' ')[0]}\\b`, 'i');
    if (brandRegex.test(cleanText) || genericRegex.test(cleanText)) {
      matchedMed = item;
      break;
    }
  }

  let medName = matchedMed ? matchedMed.name : '';
  let genericName = matchedMed ? matchedMed.genericName : '';

  // If not in common dictionary, find the most prominent word in title or upper case
  if (!medName) {
    const lines = cleanText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 2);

    for (const line of lines) {
      // Ignore non-name medical lines
      if (/^(rx|exp|lot|mfg|warning|caution|keep|store|for|each|contains|dosage|tablets|capsules|pack|ndc)/i.test(line)) {
        continue;
      }
      const words = line.split(/\s+/).filter(w => /^[a-zA-Z]{3,20}$/.test(w));
      if (words.length > 0 && words[0].length >= 4) {
        medName = words[0];
        if (words.length > 1 && words[1].length >= 3) {
          genericName = words.slice(1).join(' ');
        }
        break;
      }
    }
  }

  if (!medName) {
    medName = 'Scanned Medication';
  }

  // 2. Identify Strength / Dosage
  let dosageStrength = '';
  const strengthMatch = cleanText.match(/(\d+\.?\d*)\s*(mg|mcg|g|ml|iu|%)\b/i);
  if (strengthMatch) {
    dosageStrength = `${strengthMatch[1]} ${strengthMatch[2].toLowerCase()}`;
  }

  // 3. Determine Dosage Form
  let form = matchedMed?.form || 'pill';
  if (/capsule|cap\b/i.test(lowerText)) {
    form = 'capsule';
  } else if (/syrup|liquid|solution|suspension|oral\s*sol/i.test(lowerText)) {
    form = 'syrup';
  } else if (/inhaler|aerosol|puff|respules/i.test(lowerText)) {
    form = 'inhaler';
  } else if (/drop|eye\s*drops|ear\s*drops|ophthalmic/i.test(lowerText)) {
    form = 'drops';
  } else if (/injection|injectable|vial|pen/i.test(lowerText)) {
    form = 'injection';
  } else if (/tablet|tab\b|caplet|pill/i.test(lowerText)) {
    form = 'pill';
  }

  // Combine form with strength for friendly dosage text
  let dosage = '1 tablet';
  if (form === 'capsule') {
    dosage = dosageStrength ? `1 capsule (${dosageStrength})` : '1 capsule';
  } else if (form === 'syrup') {
    dosage = dosageStrength ? `10 ml (${dosageStrength})` : '10 ml (2 teaspoons)';
  } else if (form === 'inhaler') {
    dosage = '2 puffs';
  } else if (form === 'drops') {
    dosage = '2 drops';
  } else if (form === 'injection') {
    dosage = dosageStrength ? `1 dose (${dosageStrength})` : '1 injection';
  } else {
    dosage = dosageStrength ? `1 tablet (${dosageStrength})` : '1 tablet';
  }

  // 4. Identify Food Instruction
  let foodInstruction = matchedMed?.foodInstruction || 'after_meal';
  if (/before\s*(meal|food|breakfast|eating)|empty\s*stomach/i.test(lowerText)) {
    foodInstruction = 'before_meal';
  } else if (/with\s*(meal|food)|during\s*meal/i.test(lowerText)) {
    foodInstruction = 'with_meal';
  } else if (/after\s*(meal|food)|post[\s-]meal/i.test(lowerText)) {
    foodInstruction = 'after_meal';
  } else if (/bedtime|at\s*night|before\s*sleep/i.test(lowerText)) {
    foodInstruction = 'after_meal';
  } else if (/anytime|without\s*regard/i.test(lowerText)) {
    foodInstruction = 'anytime';
  }

  // 5. Identify Frequency and Reminder Times
  let times = ['08:00', '20:00'];
  if (/three\s*times|3\s*times|tid\b|tds\b|every\s*8\s*hours/i.test(lowerText)) {
    times = ['08:00', '14:00', '20:00'];
  } else if (/four\s*times|4\s*times|qid\b|every\s*6\s*hours/i.test(lowerText)) {
    times = ['08:00', '12:00', '16:00', '20:00'];
  } else if (/twice\s*(a\s*day|daily)|2\s*times|bid\b|bd\b|every\s*12\s*hours/i.test(lowerText)) {
    times = ['08:00', '20:00'];
  } else if (/once\s*(a\s*day|daily)|every\s*morning|in\s*the\s*morning|od\b|qd\b/i.test(lowerText)) {
    times = ['08:00'];
  } else if (/night|bedtime|evening|hs\b|qhs\b/i.test(lowerText)) {
    times = ['21:00'];
  }

  // 6. Identify Stock / Total Quantity
  let currentStock = 30;
  const countMatch = cleanText.match(/(\d+)\s*(tablets|tabs|capsules|caps|pills|doses|ml)\b/i);
  if (countMatch && parseInt(countMatch[1], 10) > 0) {
    currentStock = Math.min(120, parseInt(countMatch[1], 10));
  }

  // 7. Generate Helpful Instructions
  let instructions = 'Take with a full glass of water';
  if (foodInstruction === 'with_meal') {
    instructions = 'Take with food or a snack to prevent stomach upset';
  } else if (foodInstruction === 'before_meal') {
    instructions = 'Take 30 minutes before your meal with water';
  } else if (foodInstruction === 'empty_stomach') {
    instructions = 'Take on an empty stomach with a full glass of water';
  } else if (form === 'syrup') {
    instructions = 'Shake well before measuring each dose';
  } else if (form === 'inhaler') {
    instructions = 'Rinse mouth with water after inhalation';
  }

  // 8. Suggest Pill Visualizer Color
  const color = matchedMed?.color || (
    form === 'capsule' ? '#EF4444' :
    form === 'syrup' ? '#10B981' :
    form === 'inhaler' ? '#0284C7' :
    '#3B82F6'
  );

  return {
    name: medName,
    genericName,
    dosage,
    form,
    color,
    foodInstruction,
    instructions,
    currentStock,
    times,
    extractedRawText: cleanText.substring(0, 300)
  };
};

// Scan via Gemini Multimodal Vision API if API key is provided
const scanWithGemini = async (base64Image, apiKey) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  // Clean base64 string
  let cleanBase64 = base64Image;
  let mimeType = 'image/jpeg';
  if (base64Image.includes(';base64,')) {
    const parts = base64Image.split(';base64,');
    mimeType = parts[0].replace('data:', '') || 'image/jpeg';
    cleanBase64 = parts[1];
  }

  const prompt = `Analyze this medication package, blister strip, pill bottle, or prescription label.
Extract the medication details and return ONLY a valid JSON object without markdown or code fences:
{
  "name": "Brand Name (e.g. Panadol, Augmentin)",
  "genericName": "Generic active ingredient",
  "dosage": "Dosage string (e.g. 500 mg, 1 tablet)",
  "form": "pill|capsule|syrup|inhaler|drops|injection",
  "color": "Hex color for pill icon (e.g. #3B82F6, #EF4444, #10B981, #F59E0B)",
  "foodInstruction": "before_meal|with_meal|after_meal|empty_stomach|anytime",
  "instructions": "Helpful usage guidance from label",
  "currentStock": 30,
  "times": ["08:00", "20:00"]
}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: cleanBase64
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 500
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini Vision error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawContent) {
    throw new Error('No content returned from Gemini Vision');
  }

  // Parse JSON response safely
  const jsonStr = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(jsonStr);

  return {
    name: parsed.name || 'Medication',
    genericName: parsed.genericName || '',
    dosage: parsed.dosage || '1 tablet',
    form: parsed.form || 'pill',
    color: parsed.color || '#3B82F6',
    foodInstruction: parsed.foodInstruction || 'after_meal',
    instructions: parsed.instructions || 'Take with water',
    currentStock: Number(parsed.currentStock) || 30,
    times: Array.isArray(parsed.times) && parsed.times.length > 0 ? parsed.times : ['08:00', '20:00']
  };
};

// Scan via local Tesseract.js OCR engine
const scanWithTesseract = async (base64Image) => {
  let cleanBase64 = base64Image;
  if (base64Image.includes(';base64,')) {
    cleanBase64 = base64Image.split(';base64,')[1];
  }

  const buffer = Buffer.from(cleanBase64, 'base64');
  const worker = await createWorker('eng');
  
  try {
    const ret = await worker.recognize(buffer);
    await worker.terminate();
    const text = ret.data.text || '';
    return parseMedicineLabelText(text);
  } catch (err) {
    await worker.terminate().catch(() => {});
    throw err;
  }
};

/**
 * Main Scanner Entrypoint:
 * Tries Gemini Vision if GEMINI_API_KEY is present;
 * otherwise runs high-accuracy local Tesseract OCR + Medical NLP Parser.
 */
exports.scanMedication = async (base64Image) => {
  if (!base64Image) {
    throw new Error('No image provided for medication scanning.');
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (geminiApiKey) {
    try {
      console.log('🤖 Scanning medication using Google Gemini Multimodal AI...');
      return await scanWithGemini(base64Image, geminiApiKey);
    } catch (err) {
      console.warn('⚠️ Gemini Vision failed, falling back to local OCR engine:', err.message);
    }
  }

  console.log('🔍 Scanning medication using local Tesseract OCR & Medical NLP engine...');
  return await scanWithTesseract(base64Image);
};
