// keel_web/src/lib/keelPersona/promotedDesign.ts

import type { KeelPersonaElement } from "./types";
import promotedDesignBundle from "./promotedDesign.json";

type KeelPersonaPromotedDesignBundle = {
  design: {
    elements: KeelPersonaElement[];
    baseOffset?: { x: number; y: number };
  };
};

const bundle = promotedDesignBundle as KeelPersonaPromotedDesignBundle;

export const KEEL_PERSONA_PROMOTED_ELEMENTS: KeelPersonaElement[] = bundle.design.elements;
export const KEEL_PERSONA_PROMOTED_BASE_OFFSET = bundle.design.baseOffset ?? { x: 0, y: 0 };
