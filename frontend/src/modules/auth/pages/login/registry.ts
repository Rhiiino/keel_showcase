// keel_web/src/modules/auth/pages/login/registry.ts

// Maps login variant ids to screen components. Register new variants here.

import type { ComponentType } from "react";

import type { LoginVariantId } from "../../lib/loginConfig";
import { ClassicLoginScreen } from "./ClassicLoginScreen";
import { EmberLoginScreen } from "./EmberLoginScreen";
import { GrayLoginScreen } from "./GrayLoginScreen";
import { ScatterLoginScreen } from "./ScatterLoginScreen";

export const loginVariantRegistry: Record<LoginVariantId, ComponentType> = {
  classic: ClassicLoginScreen,
  ember: EmberLoginScreen,
  gray: GrayLoginScreen,
  scatter: ScatterLoginScreen,
};
