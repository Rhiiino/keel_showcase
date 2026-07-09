// keel_web/src/modules/people/routes.tsx

import { Fragment } from "react";
import { Navigate, Route, useLocation } from "react-router-dom";

import { PeopleModuleLayout } from "./PeopleModuleLayout";
import { ContactDetailPage } from "./contacts/pages/ContactDetailPage";
import { ContactCreatePage } from "./contacts/pages/ContactCreatePage";
import { ContactTagsPage } from "./contacts/pages/ContactTagsPage";
import { ContactsPage } from "./contacts/pages/ContactsPage";
import { FamilyGroupDetailPage } from "./contacts/pages/FamilyGroupDetailPage";
import { FamilyGroupsPage } from "./contacts/pages/FamilyGroupsPage";
import { FamilyTreePage } from "./contacts/pages/FamilyTreePage";
import { FigureCreatePage } from "./figures/pages/FigureCreatePage";
import { FigureDetailPage } from "./figures/pages/FigureDetailPage";
import { FiguresPage } from "./figures/pages/FiguresPage";

function LegacyContactsRedirect() {
  const location = useLocation();
  const suffix = location.pathname.replace(/^\/contacts\/?/, "");
  const target = suffix ? `/people/contacts/${suffix}` : "/people/contacts";
  return (
    <Navigate
      to={`${target}${location.search}${location.hash}`}
      replace
    />
  );
}

export const peopleShellRoutes = (
  <Fragment>
    <Route path="contacts/*" element={<LegacyContactsRedirect />} />
    <Route path="people" element={<PeopleModuleLayout />}>
      <Route path="contacts">
        <Route path="family-groups/:familyKey" element={<FamilyGroupDetailPage />} />
        <Route path="family-groups" element={<FamilyGroupsPage />} />
        <Route path="family-tree" element={<FamilyTreePage />} />
        <Route path="tags" element={<ContactTagsPage />} />
        <Route path="new" element={<ContactCreatePage />} />
        <Route path=":contactId" element={<ContactDetailPage />} />
        <Route index element={<ContactsPage />} />
      </Route>
      <Route path="figures">
        <Route path="new" element={<FigureCreatePage />} />
        <Route path=":figureId" element={<FigureDetailPage />} />
        <Route index element={<FiguresPage />} />
      </Route>
    </Route>
  </Fragment>
);
