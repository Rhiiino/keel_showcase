// keel_web/src/modules/auth/pages/LoginPage.tsx

// Dispatches /login to the globally configured login screen variant.

import { ACTIVE_LOGIN_VARIANT } from "../lib/loginConfig";
import { loginVariantRegistry } from "./login/registry";

export function LoginPage() {
  const Screen = loginVariantRegistry[ACTIVE_LOGIN_VARIANT];
  return <Screen />;
}
