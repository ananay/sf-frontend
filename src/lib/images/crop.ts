export interface SquareCrop {
  zoom: number;
  x: number;
  y: number;
}

interface CropRectangle {
  size: number;
  x: number;
  y: number;
}

const MAX_OUTPUT_PIXELS = 512;

/** Convert a -100..100 position and zoom level into a square source rectangle. */
export function calculateSquareCrop(
  width: number,
  height: number,
  crop: SquareCrop,
): CropRectangle {
  const size = Math.min(width, height) / crop.zoom;
  const normalizedX = (crop.x + 100) / 200;
  const normalizedY = (crop.y + 100) / 200;

  return {
    size,
    x: (width - size) * normalizedX,
    y: (height - size) * normalizedY,
  };
}

/** Render the selected square crop to a bounded data URI. */
export function renderSquareCrop(
  source: string,
  mimeType: string,
  crop: SquareCrop,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const rectangle = calculateSquareCrop(
        image.naturalWidth,
        image.naturalHeight,
        crop,
      );
      const outputSize = Math.min(MAX_OUTPUT_PIXELS, Math.floor(rectangle.size));
      const canvas = document.createElement("canvas");
      canvas.width = outputSize;
      canvas.height = outputSize;

      const context = canvas.getContext("2d");
      if (!context || outputSize < 1) {
        reject(new Error("The selected photo could not be cropped."));
        return;
      }

      context.drawImage(
        image,
        rectangle.x,
        rectangle.y,
        rectangle.size,
        rectangle.size,
        0,
        0,
        outputSize,
        outputSize,
      );
      resolve(canvas.toDataURL(mimeType, 0.9));
    };
    image.onerror = () => reject(new Error("The selected photo could not be decoded."));
    image.src = source;
  });
}
