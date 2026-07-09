// keel_web/src/modules/jobs/routes.tsx

import { Route } from "react-router-dom";

import { JobsModuleLayout } from "./JobsModuleLayout";
import { JobScheduleFormPage } from "./pages/JobScheduleFormPage";
import { JobRunsPage } from "./pages/JobRunsPage";
import { JobSchedulesPage } from "./pages/JobSchedulesPage";
import { JobTasksPage } from "./pages/JobTasksPage";

export const jobsShellRoutes = (
  <Route path="jobs" element={<JobsModuleLayout />}>
    <Route path="schedules/:scheduleId" element={<JobScheduleFormPage />} />
    <Route path="schedules" element={<JobSchedulesPage />} />
    <Route path="tasks" element={<JobTasksPage />} />
    <Route index element={<JobRunsPage />} />
  </Route>
);
