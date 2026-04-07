export function isFileEmpty(file) {
  return Boolean(file) && Number(file.size || 0) <= 0;
}

async function decodeImageToImageData(file) {
  const img = await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Invalid image'));
    };
    image.src = url;
  });

  const w = Math.max(1, Math.min(128, img.width || 1));
  const h = Math.max(1, Math.min(128, img.height || 1));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas context unavailable');
  ctx.drawImage(img, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

async function isLikelyBlankImage(file) {
  if (!file || !String(file.type || '').startsWith('image/')) return false;
  if (isFileEmpty(file)) return true;

  try {
    const imageData = await decodeImageToImageData(file);
    const data = imageData.data;
    if (!data || !data.length) return true;

    let visiblePixels = 0;
    let sum = 0;
    let sumSq = 0;
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a < 8) continue;
      const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      visiblePixels += 1;
      sum += lum;
      sumSq += lum * lum;
    }

    if (visiblePixels === 0) return true;

    const mean = sum / visiblePixels;
    const variance = Math.max(0, sumSq / visiblePixels - mean * mean);
    const stdDev = Math.sqrt(variance);

    const isAlmostSingleTone = stdDev < 4.2;
    const isMostlyWhite = mean > 248;
    const isMostlyBlack = mean < 7;

    return isAlmostSingleTone && (isMostlyWhite || isMostlyBlack);
  } catch (_err) {
    return false;
  }
}

export async function validateSubmissionInput({
  text = '',
  includeFile = false,
  documentFile = null,
  imageFile = null,
  minAnswerLength = 10,
}) {
  const trimmed = String(text || '').trim();
  const hasDocument = Boolean(documentFile);
  const hasImage = Boolean(imageFile);
  const hasAttachment = hasDocument || hasImage;

  if (isFileEmpty(documentFile)) {
    return 'Uploaded document is empty. Please choose a valid file.';
  }

  if (isFileEmpty(imageFile)) {
    return 'Uploaded image is empty. Please choose a valid image.';
  }

  if (imageFile && (await isLikelyBlankImage(imageFile))) {
    return 'Blank image detected. Please upload a valid image with visible content.';
  }

  if (includeFile && !hasDocument) {
    return 'Please attach a document file before submitting with file only option.';
  }

  if (!trimmed && !hasAttachment) {
    return 'Submission cannot be empty';
  }

  if (!hasAttachment && trimmed && trimmed.length < minAnswerLength) {
    return 'Answer is too short';
  }

  return '';
}
