// keel_web/src/modules/services/routes.tsx

import { Route } from "react-router-dom";

import { ServicesModuleLayout } from "./ServicesModuleLayout";
import { ServiceCreatePage } from "./pages/ServiceCreatePage";
import { ServiceDetailPage } from "./pages/ServiceDetailPage";
import { ServicesPage } from "./pages/ServicesPage";

export const servicesShellRoutes = (
  <Route path="services" element={<ServicesModuleLayout />}>
    <Route index element={<ServicesPage />} />
    <Route path="new" element={<ServiceCreatePage />} />
    <Route path=":serviceId" element={<ServiceDetailPage />} />
  </Route>
);
