// keel_web/src/modules/coak/lib/tabs/constellation/coakStripeSphereTexture.ts

import { CanvasTexture, SRGBColorSpace } from "three";

const TEXTURE_WIDTH = 1024;
const TEXTURE_HEIGHT = 512;
const STRIPE_COUNT = 14;

export function createStripeSphereTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE_WIDTH;
  canvas.height = TEXTURE_HEIGHT;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Failed to create stripe sphere texture canvas.");
  }

  context.clearRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);

  const bandHeight = TEXTURE_HEIGHT / STRIPE_COUNT;
  for (let index = 0; index < STRIPE_COUNT; index += 1) {
    if (index % 2 !== 0) {
      continue;
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, index * bandHeight, TEXTURE_WIDTH, bandHeight);
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
