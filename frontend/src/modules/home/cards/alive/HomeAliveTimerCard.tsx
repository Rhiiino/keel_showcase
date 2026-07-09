// keel_web/src/modules/home/cards/alive/HomeAliveTimerCard.tsx

// Live alive-timer card for the home dashboard.

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  authKeys,
  authSessionQueryRetry,
  CURRENT_USER_STALE_TIME_MS,
  fetchAuthSessionUser,
} from "../../../auth/api";
import { contactsQueryKeys, fetchContact } from "../../../people/contacts/api";
import { HomeAliveTimer } from "./HomeAliveTimer";
import { HomeAliveTimerTargetEditor } from "./HomeAliveTimerTargetEditor";
import { formatAliveDisplay, parseBirthDateMs } from "./lib/aliveDuration";
import {
  aliveTargetToTimestampMs,
  formatAliveCountdownDisplay,
  isAliveTargetReached,
} from "./lib/aliveTargetDuration";
import {
  cycleAliveTimerDisplayMode,
  readStoredAliveTimerDisplayMode,
  writeStoredAliveTimerDisplayMode,
  type AliveTimerDisplayMode,
} from "./lib/aliveTimerDisplayModes";
import {
  readStoredAliveTimerTargets,
  writeStoredAliveTimerTargets,
  type AliveTimerTargetByMode,
} from "./lib/aliveTimerTargets";
import { useAliveTimerTick } from "./lib/useAliveTimerTick";

export function HomeAliveTimerCard() {
  const [displayMode, setDisplayMode] = useState<AliveTimerDisplayMode>(
    () => readStoredAliveTimerDisplayMode() ?? "calendar",
  );
  const [targets, setTargets] = useState<AliveTimerTargetByMode>(
    () => readStoredAliveTimerTargets(),
  );
  const [isEditing, setIsEditing] = useState(false);

  const userQuery = useQuery({
    queryKey: authKeys.me(),
    queryFn: ({ signal }) => fetchAuthSessionUser(signal),
    staleTime: CURRENT_USER_STALE_TIME_MS,
    refetchOnWindowFocus: false,
    retry: authSessionQueryRetry,
  });

  const contactId = userQuery.data?.contact_id ?? null;

  const contactQuery = useQuery({
    queryKey: contactsQueryKeys.detail(contactId ?? 0),
    queryFn: () => fetchContact(contactId as number),
    enabled: contactId != null,
  });

  const birthMs = useMemo(() => {
    const birthDate = contactQuery.data?.birth_date;
    if (!birthDate) {
      return null;
    }
    return parseBirthDateMs(birthDate);
  }, [contactQuery.data?.birth_date]);

  const canTick =
    birthMs != null
    && contactQuery.data?.birth_date_year_known !== false;

  const nowMs = useAliveTimerTick(canTick);

  const display = useMemo(() => {
    if (!canTick || birthMs == null) {
      return null;
    }
    return formatAliveDisplay(displayMode, birthMs, nowMs);
  }, [birthMs, canTick, displayMode, nowMs]);

  const activeTarget = targets[displayMode];

  const countdown = useMemo(() => {
    if (!canTick || birthMs == null || activeTarget == null) {
      return null;
    }
    return formatAliveCountdownDisplay(displayMode, birthMs, nowMs, activeTarget);
  }, [activeTarget, birthMs, canTick, displayMode, nowMs]);

  const targetReachMs = useMemo(() => {
    if (!canTick || birthMs == null || activeTarget == null || countdown == null) {
      return null;
    }
    return aliveTargetToTimestampMs(birthMs, displayMode, activeTarget);
  }, [activeTarget, birthMs, canTick, countdown, displayMode]);

  useEffect(() => {
    if (!canTick || birthMs == null) {
      return;
    }

    setTargets((current) => {
      let changed = false;
      const nextTargets = { ...current };

      for (const mode of ["calendar", "seconds", "days"] as const) {
        const target = nextTargets[mode];
        if (target != null && isAliveTargetReached(birthMs, nowMs, mode, target)) {
          nextTargets[mode] = null;
          changed = true;
        }
      }

      if (!changed) {
        return current;
      }

      writeStoredAliveTimerTargets(nextTargets);
      return nextTargets;
    });
  }, [birthMs, canTick, nowMs]);

  const isLoading = userQuery.isLoading || (contactId != null && contactQuery.isLoading);

  const emptyMessage = (() => {
    if (isLoading) {
      return null;
    }
    if (contactId == null) {
      return "No contact is linked to your user account yet.";
    }
    if (!contactQuery.data?.birth_date) {
      return "Add a birth date to your linked contact to start the timer.";
    }
    if (contactQuery.data.birth_date_year_known === false) {
      return "Add the birth year on your linked contact to start the timer.";
    }
    return null;
  })();

  const handleCycleDisplayMode = () => {
    setDisplayMode((current) => {
      const next = cycleAliveTimerDisplayMode(current);
      writeStoredAliveTimerDisplayMode(next);
      return next;
    });
  };

  const handleSaveTargets = useCallback((nextTargets: AliveTimerTargetByMode) => {
    writeStoredAliveTimerTargets(nextTargets);
    setTargets(nextTargets);
    setIsEditing(false);
  }, []);

  if (isEditing && canTick && birthMs != null) {
    return (
      <HomeAliveTimerTargetEditor
        birthMs={birthMs}
        nowMs={nowMs}
        targets={targets}
        onSave={handleSaveTargets}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <HomeAliveTimer
      display={display}
      displayMode={displayMode}
      isLoading={isLoading}
      contactId={contactId}
      emptyMessage={emptyMessage}
      countdown={countdown}
      targetReachMs={targetReachMs}
      onCycleDisplayMode={handleCycleDisplayMode}
      onEdit={canTick && emptyMessage == null ? () => setIsEditing(true) : undefined}
    />
  );
}
