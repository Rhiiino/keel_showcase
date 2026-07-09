// keel_web/src/modules/timeline/routes.tsx

import { Route } from "react-router-dom";

import { TimelineModuleLayout } from "./TimelineModuleLayout";
import { TimelineCalendarPage } from "./pages/TimelineCalendarPage";
import { TimelineCreatePage } from "./pages/TimelineCreatePage";
import { TimelineEventPage } from "./pages/TimelineEventPage";
import { TimelinePage } from "./pages/TimelinePage";
import { TimelinePlanCreatePage } from "./pages/TimelinePlanCreatePage";
import { TimelinePlanDetailPage } from "./pages/TimelinePlanDetailPage";
import { TimelinePlansPage } from "./pages/TimelinePlansPage";
import { TimelineTagsPage } from "./pages/TimelineTagsPage";

export const timelineShellRoutes = (
  <Route path="timeline" element={<TimelineModuleLayout />}>
    <Route path="calendar" element={<TimelineCalendarPage />} />
    <Route path="plan/new" element={<TimelinePlanCreatePage />} />
    <Route path="plan/:planId" element={<TimelinePlanDetailPage />} />
    <Route path="plan" element={<TimelinePlansPage />} />
    <Route path="tags" element={<TimelineTagsPage />} />
    <Route path="new" element={<TimelineCreatePage />} />
    <Route path=":eventId" element={<TimelineEventPage />} />
    <Route index element={<TimelinePage />} />
  </Route>
);
