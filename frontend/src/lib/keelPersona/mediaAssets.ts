// keel_web/src/lib/keelPersona/mediaAssets.ts

import beretUrl from "../../assets/KeelPersona/beret.png";
import branchUrl from "../../assets/KeelPersona/branch.png";
import cakeUrl from "../../assets/KeelPersona/cake.png";
import chefHatUrl from "../../assets/KeelPersona/chef-hat.png";
import helmUrl from "../../assets/KeelPersona/helm.png";
import noseMustacheUrl from "../../assets/KeelPersona/nose w_ mustache.png";
import pirateHatUrl from "../../assets/KeelPersona/pirate_hat.png";
import sailorHatUrl from "../../assets/KeelPersona/sailor-hat.png";
import telescopeUrl from "../../assets/KeelPersona/telescope.png";
import waterDropletUrl from "../../assets/KeelPersona/water-droplet.png";
import { buildMediaContentUrl } from "../../modules/media/api";

const STATIC_KEEL_PERSONA_MEDIA: Record<string, string> = {
  "0aeb057d-c61f-4904-9519-e6a7127f366a": chefHatUrl,
  "8a2fdaf4-d5c5-4cd8-b200-1febf8d029a9": cakeUrl,
  "42ba856f-3bdf-418d-bbbf-f5a435723ca8": noseMustacheUrl,
  "5acb1787-634b-44e2-bba1-519bb3c5c7fb": beretUrl,
  "67ff4275-c010-4cf2-84eb-c889da09c080": branchUrl,
  "a75df9f5-211f-4a99-bc4d-6a9e805b404f": pirateHatUrl,
  "0b75aced-bc0c-459f-b7b1-a611bcf568b2": telescopeUrl,
  "3771682d-3996-408f-a266-72bd04f91a53": helmUrl,
  "c409ab66-662b-488f-b679-e22de87ca45c": sailorHatUrl,
  "c21b6565-eccb-4006-8dd3-08fb7bc527c7": waterDropletUrl,
};

export const KEEL_PERSONA_PRELOAD_MEDIA = [
  beretUrl,
  branchUrl,
  cakeUrl,
  chefHatUrl,
  helmUrl,
  noseMustacheUrl,
  pirateHatUrl,
  sailorHatUrl,
  telescopeUrl,
  waterDropletUrl,
] as const;

export function resolveKeelPersonaMediaSrc(mediaId: string): string {
  return STATIC_KEEL_PERSONA_MEDIA[mediaId] ?? buildMediaContentUrl(mediaId);
}
