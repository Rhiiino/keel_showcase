// keel_web/src/modules/timeline/lib/timelinePlanItemDefaults.ts

import type { TimelinePlanItemCreatePayload } from "../api";
import { formatTimelineDateOnly } from "./timelineDateRange";
import { timelineDatetimeLocalToApi } from "./timelineDateTime";

export const DEFAULT_NEW_PLAN_ITEM_TITLE = "Untitled";

export function resolveDefaultPlanItemDateOnly(
  planStartDate: string,
  planEndDate: string,
  referenceDate = new Date(),
): string {
  const today = formatTimelineDateOnly(referenceDate);
  if (today < planStartDate) {
    return planStartDate;
  }
  if (today > planEndDate) {
    return planEndDate;
  }
  return today;
}

export function buildDefaultTimelinePlanItemCreatePayload(
  planStartDate: string,
  planEndDate: string,
  referenceDate = new Date(),
): TimelinePlanItemCreatePayload {
  const dateOnly = resolveDefaultPlanItemDateOnly(planStartDate, planEndDate, referenceDate);
  const startAt = timelineDatetimeLocalToApi(`${dateOnly}T00:00`);
  return {
    title: DEFAULT_NEW_PLAN_ITEM_TITLE,
    description: "",
    start_at: startAt,
    end_at: startAt,
    all_day: true,
    status: "planned",
    tag_ids: [],
  };
}
