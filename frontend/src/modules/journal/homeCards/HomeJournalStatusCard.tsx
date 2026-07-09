// keel_web/src/modules/journal/homeCards/HomeJournalStatusCard.tsx

// Home dashboard card — shows whether today's journal entry is complete.

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { fetchJournalEntries, journalQueryKeys } from "../api";
import { HomeJournalStatus } from "./HomeJournalStatus";
import {
  calculateJournalStreak,
  journalStreakLookbackFilters,
} from "./lib/homeJournalStreak";
import {
  firstFilledJournalEntryForToday,
  hasFilledJournalEntryForToday,
} from "./lib/homeJournalToday";

export function HomeJournalStatusCard() {
  const navigate = useNavigate();
  const streakFilters = useMemo(() => journalStreakLookbackFilters(), []);

  const entriesQuery = useQuery({
    queryKey: journalQueryKeys.entries(streakFilters),
    queryFn: () => fetchJournalEntries(streakFilters),
  });

  const entries = entriesQuery.data ?? [];
  const isComplete = hasFilledJournalEntryForToday(entries);
  const todayEntry = firstFilledJournalEntryForToday(entries);
  const streak = calculateJournalStreak(entries);

  const handleClick = () => {
    if (todayEntry) {
      navigate(`/journal/${todayEntry.id}`);
      return;
    }
    navigate("/journal/new");
  };

  return (
    <HomeJournalStatus
      isComplete={isComplete}
      isLoading={entriesQuery.isLoading}
      streak={streak}
      onClick={handleClick}
    />
  );
}
