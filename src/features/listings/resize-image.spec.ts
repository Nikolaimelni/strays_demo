import { afterEach, describe, expect, it, vi } from 'vitest';
import { ImageUnreadableError, PhotoTooLargeError, resizeImage } from './resize-image.ts';

const imageFile = () => new File(['x'], 'photo.heic', { type: 'image/heic' });

const stubBitmap = (width: number, height: number) =>
  vi.stubGlobal('createImageBitmap', () => Promise.resolve({ width, height, close: () => {} }));

const stubCanvas = () => {
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({ drawImage: () => {} }),
    toBlob: (done: (blob: Blob) => void) => done(new Blob(['jpeg'], { type: 'image/jpeg' })),
  };
  vi.spyOn(document, 'createElement').mockReturnValue(canvas as unknown as HTMLCanvasElement);
  return canvas;
};

// the server caps an upload at 2 MB, so the sizes here are what that check sees
const blobOf = (megabytes: number) =>
  new Blob([new Uint8Array(megabytes * 1024 * 1024)], { type: 'image/jpeg' });

const stubCanvasSizing = (sizeFor: (quality: number) => number) => {
  const qualities: number[] = [];
  vi.spyOn(document, 'createElement').mockReturnValue({
    width: 0,
    height: 0,
    getContext: () => ({ drawImage: () => {} }),
    toBlob: (done: (blob: Blob) => void, _type: string, quality: number) => {
      qualities.push(quality);
      done(blobOf(sizeFor(quality)));
    },
  } as unknown as HTMLCanvasElement);
  return qualities;
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('resizeImage', () => {
  it('scales a phone-sized photo down to the long edge', async () => {
    stubBitmap(4000, 3000);
    const canvas = stubCanvas();

    const resized = await resizeImage(imageFile());

    expect(canvas.width).toBe(1600);
    expect(canvas.height).toBe(1200);
    expect(resized.type).toBe('image/jpeg');
    expect(resized.name).toBe('photo.jpg');
  });

  // the EXIF one. a small photo needs no resizing and still must not reach the
  // bucket with the coordinates it was taken at, so it goes through the canvas
  // at full size rather than being handed back untouched.
  it('re-encodes a photo that is already small enough, at its own size', async () => {
    stubBitmap(800, 600);
    const canvas = stubCanvas();

    const original = imageFile();
    const result = await resizeImage(original);

    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(600);
    expect(result).not.toBe(original);
    expect(result.type).toBe('image/jpeg');
  });

  it('refuses a file the browser cannot decode rather than passing it through', async () => {
    vi.stubGlobal('createImageBitmap', () => Promise.reject(new Error('unsupported')));

    await expect(resizeImage(imageFile())).rejects.toBeInstanceOf(ImageUnreadableError);
  });

  it('drops the quality instead of the photo when the first encode is too big', async () => {
    stubBitmap(4000, 3000);
    const qualities = stubCanvasSizing((quality) => (quality > 0.7 ? 3 : 1));

    const resized = await resizeImage(imageFile());

    expect(qualities).toEqual([0.85, 0.6]);
    expect(resized.size).toBeLessThan(2 * 1024 * 1024);
  });

  it('refuses a photo that is over the server limit even at the lower quality', async () => {
    stubBitmap(4000, 3000);
    stubCanvasSizing(() => 3);

    await expect(resizeImage(imageFile())).rejects.toBeInstanceOf(PhotoTooLargeError);
  });

  it('refuses it when the canvas hands back nothing', async () => {
    stubBitmap(4000, 3000);
    vi.spyOn(document, 'createElement').mockReturnValue({
      width: 0,
      height: 0,
      getContext: () => ({ drawImage: () => {} }),
      toBlob: (done: (blob: Blob | null) => void) => done(null),
    } as unknown as HTMLCanvasElement);

    await expect(resizeImage(imageFile())).rejects.toBeInstanceOf(ImageUnreadableError);
  });
});
