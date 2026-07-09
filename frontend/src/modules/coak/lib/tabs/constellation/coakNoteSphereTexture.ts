// keel_web/src/modules/coak/lib/coakNoteSphereTexture.ts

import { CanvasTexture, SRGBColorSpace } from "three";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const TEXTURE_WIDTH = 1024;
const TEXTURE_HEIGHT = 512;
const LETTER_COUNT = 140;

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function randomLetter(random: () => number): string {
  return LETTERS[Math.floor(random() * LETTERS.length)] ?? "a";
}

function fibonacciUnitSpherePoints(count: number): [number, number, number][] {
  const points: [number, number, number][] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let index = 0; index < count; index += 1) {
    const y = 1 - (2 * (index + 0.5)) / count;
    const ringRadius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * index;
    points.push([Math.cos(theta) * ringRadius, y, Math.sin(theta) * ringRadius]);
  }

  return points;
}

function spherePointToCanvas(x: number, y: number, z: number): [number, number] {
  const u = Math.atan2(z, x) / (Math.PI * 2) + 0.5;
  const v = 0.5 - Math.asin(Math.max(-1, Math.min(1, y))) / Math.PI;
  return [u * TEXTURE_WIDTH, v * TEXTURE_HEIGHT];
}

export function createNoteSphereTexture(seed: string): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE_WIDTH;
  canvas.height = TEXTURE_HEIGHT;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Failed to create note sphere texture canvas.");
  }

  context.clearRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  const random = createSeededRandom(hashSeed(`${seed}:note`));

  for (const [x, y, z] of fibonacciUnitSpherePoints(LETTER_COUNT)) {
    const [px, py] = spherePointToCanvas(x, y, z);
    const fontSize = 34 + random() * 18;
    const rotation = (random() - 0.5) * 0.55;

    context.save();
    context.translate(px, py);
    context.rotate(rotation);
    context.font = `700 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
    context.fillStyle = "#ffffff";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(randomLetter(random), 0, 0);
    context.restore();
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
