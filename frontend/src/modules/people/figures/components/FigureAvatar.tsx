// keel_web/src/modules/people/figures/components/FigureAvatar.tsx

import { buildMediaContentUrl } from "../../../media/api";
import { figureInitials, type Figure } from "../api";

type FigureAvatarProps = {
  figure: Pick<Figure, "first_name" | "last_name" | "photo">;
  className?: string;
};

export function FigureAvatar({ figure, className = "h-12 w-12" }: FigureAvatarProps) {
  const photoUrl = figure.photo
    ? buildMediaContentUrl(figure.photo.id, figure.photo.updated_at)
    : null;
  const initials = figureInitials(figure);

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt=""
        className={`${className} rounded-full object-cover ring-1 ring-stone-800`}
      />
    );
  }

  return (
    <div
      className={`${className} flex items-center justify-center rounded-full bg-stone-800 text-sm font-medium text-stone-300 ring-1 ring-stone-700`}
      aria-hidden
    >
      {initials}
    </div>
  );
}
