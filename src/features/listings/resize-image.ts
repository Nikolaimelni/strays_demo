const MAX_EDGE = 1600;
const QUALITY = 0.85;

// A phone camera hands over a 4000px, 5 MB file and the largest thing this
// app ever renders is a 160px thumbnail.
//
// every failure path returns the original: a photo that uploads too large
// beats a photo that does not upload.
export const resizeImage = async (file: File): Promise<File> => {
  if (!file.type.startsWith('image/')) return file;

  try {
    // from-image, or an EXIF-rotated photo comes out sideways the moment it
    // touches a canvas
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const longestEdge = Math.max(bitmap.width, bitmap.height);

    if (longestEdge <= MAX_EDGE) {
      bitmap.close();
      return file;
    }

    const scale = MAX_EDGE / longestEdge;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const context = canvas.getContext('2d');
    if (!context) {
      bitmap.close();
      return file;
    }

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', QUALITY);
    });
    if (!blob) return file;

    const name = file.name.replace(/\.[^.]+$/, '') || 'photo';
    return new File([blob], `${name}.jpg`, { type: 'image/jpeg' });
  } catch {
    return file;
  }
};
