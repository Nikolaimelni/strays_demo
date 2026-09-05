import { afterEach, describe, expect, it, vi } from 'vitest';
import { resizeImage } from './resize-image.ts';

const imageFile = () => new File(['x'], 'photo.heic', { type: 'image/heic' });

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

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('resizeImage', () => {
  it('leaves anything that is not an image alone', async () => {
    const pdf = new File(['x'], 'notes.pdf', { type: 'application/pdf' });
    await expect(resizeImage(pdf)).resolves.toBe(pdf);
  });

  it('returns the original when the browser cannot decode it', async () => {
    vi.stubGlobal('createImageBitmap', () => Promise.reject(new Error('unsupported')));

    const file = imageFile();
    await expect(resizeImage(file)).resolves.toBe(file);
  });

  it('returns the original when the image is already small enough', async () => {
    vi.stubGlobal('createImageBitmap', () =>
      Promise.resolve({ width: 800, height: 600, close: () => {} }),
    );

    const file = imageFile();
    await expect(resizeImage(file)).resolves.toBe(file);
  });

  it('scales a phone-sized photo down to the long edge and re-encodes it', async () => {
    vi.stubGlobal('createImageBitmap', () =>
      Promise.resolve({ width: 4000, height: 3000, close: () => {} }),
    );
    const canvas = stubCanvas();

    const resized = await resizeImage(imageFile());

    expect(canvas.width).toBe(1600);
    expect(canvas.height).toBe(1200);
    expect(resized.type).toBe('image/jpeg');
    expect(resized.name).toBe('photo.jpg');
  });

  it('keeps the original when the canvas hands back nothing', async () => {
    vi.stubGlobal('createImageBitmap', () =>
      Promise.resolve({ width: 4000, height: 3000, close: () => {} }),
    );
    vi.spyOn(document, 'createElement').mockReturnValue({
      width: 0,
      height: 0,
      getContext: () => ({ drawImage: () => {} }),
      toBlob: (done: (blob: Blob | null) => void) => done(null),
    } as unknown as HTMLCanvasElement);

    const file = imageFile();
    await expect(resizeImage(file)).resolves.toBe(file);
  });
});
