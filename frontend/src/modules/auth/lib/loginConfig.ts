// keel_web/src/modules/auth/lib/loginConfig.ts

// Global login screen variant selection. Change ACTIVE_LOGIN_VARIANT to swap
// which screen renders at /login.

export const LOGIN_VARIANTS = ["classic", "ember", "gray", "scatter"] as const;
export type LoginVariantId = (typeof LOGIN_VARIANTS)[number];

/** Change this line to switch the global login screen. */
export const ACTIVE_LOGIN_VARIANT: LoginVariantId = "scatter";
