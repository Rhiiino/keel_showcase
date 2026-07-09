// keel_web/src/modules/home/pages/HomePage.tsx

// Home route content rendered inside AppShell. Card layout resolved from settings.

import { AppShellContent } from "../../../app/shell/AppShellContent";
import { HomeCardCanvas } from "../cards/layout/HomeCardCanvas";
import { useHomeCardLayout } from "../cards/layout/useHomeCardLayout";

export function HomePage() {
  const { layout, moveCard, resizeCard, persistLayout } = useHomeCardLayout();

  return (
    <AppShellContent>
      <HomeCardCanvas
        layout={layout}
        onMoveCard={moveCard}
        onResizeCard={resizeCard}
        onLayoutChangeEnd={persistLayout}
      />
    </AppShellContent>
  );
}
