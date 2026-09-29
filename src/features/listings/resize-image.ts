const MAX_EDGE = 1600;
const QUALITY = 0.85;

// The server's MAX_PHOTO_BYTES, which is 2 MB unless somebody changed it. A 1600px jpeg is
// usually a fifth of that, but a noisy photo of gravel is not, and finding out from a 400
// after the upload is a worse way to learn it.
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const FALLBACK_QUALITY = 0.6;

export class ImageUnreadableError extends Error {
  readonly code = 'IMAGE_UNREADABLE';
}

export class PhotoTooLargeError extends Error {
  readonly code = 'PHOTO_TOO_LARGE';
}

// A phone camera hands over a 4000px, 5 MB file and the largest thing this
// app ever renders is a 160px thumbnail.
//
// The re-encode runs even when the photo is already small enough, which looks
// wasteful and is the whole point: EXIF rides along with the original bytes,
// and on a phone photo that includes where it was taken. A canvas keeps the
// pixels and drops every tag. Listings are public, so a photo that skips this
// step publishes somebody's street.
//
// Which is also why there is no fall back to the original any more. If the
// browser cannot decode the file we would rather refuse it than upload
// metadata we have not looked at.
export const resizeImage = async (file: File): Promise<File> => {
  let bitmap: ImageBitmap;
  try {
    // from-image, or an EXIF-rotated photo comes out sideways the moment it
    // touches a canvas
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new ImageUnreadableError(`cannot decode ${file.type || 'file'}`);
  }

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const context = canvas.getContext('2d');
    if (!context) throw new ImageUnreadableError('no 2d context');

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const encode = (quality: number) =>
      new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', quality);
      });

    let blob = await encode(QUALITY);
    if (!blob) throw new ImageUnreadableError('canvas produced no blob');
    if (blob.size > MAX_UPLOAD_BYTES) blob = await encode(FALLBACK_QUALITY);
    if (!blob) throw new ImageUnreadableError('canvas produced no blob');
    if (blob.size > MAX_UPLOAD_BYTES) {
      throw new PhotoTooLargeError(`${blob.size} bytes after resizing`);
    }

    const name = file.name.replace(/\.[^.]+$/, '') || 'photo';
    return new File([blob], `${name}.jpg`, { type: 'image/jpeg' });
  } finally {
    bitmap.close();
  }
};
