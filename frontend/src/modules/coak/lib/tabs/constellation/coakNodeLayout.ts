// keel_web/src/modules/coak/lib/tabs/constellation/coakNodeLayout.ts

export { normalizeHexColor } from "./coakColorUtils";
export {
  buildAutoNodePositionMap,
  buildAutoOptimizeTreePositionMap,
  buildCoakTreeStructureSignature,
  buildDirectChildrenAngledOptimizePositionMap,
  buildDirectChildrenInlineOptimizePositionMap,
  buildDirectChildrenPlanePositionMap,
  buildResolvedNodePositionMap,
  buildSubtreeAutoPositionMap,
  shortestDirectChildConnectionDistance,
} from "./coakOptimizeLayout";
export {
  buildChildrenByParent,
  layoutDescendantsFromParent,
  siblingPositionAngledToParentLink,
  siblingPositionAroundParent,
  siblingPositionInlineToParentLink,
  siblingPositionOnParentPlane,
  type CoakInlineOptimizeAngle,
  type CoakOptimizeBranchAngle,
  type CoakOptimizeLayoutMode,
} from "./coakSiblingPositions";
export {
  addVec3,
  crossVec3,
  distanceBetweenPositions,
  dotVec3,
  lengthVec3,
  normalizeVec3,
  pickPerpendicularAxis,
  rotateVec3AroundAxis,
  scaleVec3,
  subtractVec3,
} from "./coakVec3";
