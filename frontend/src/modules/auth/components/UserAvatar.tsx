// stack_sandbox/frontend_web/src/modules/auth/components/UserAvatar.tsx

// Reusable profile image with Google photo support and initials fallback
// when the image fails to load.

import { useEffect, useState } from "react";

type UserAvatarProps = {
  displayName: string;
  pictureUrl: string | null;
  size?: "sm" | "md";
};

function userInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const sizeClasses = {
  sm: "h-[1.8rem] w-[1.8rem] text-xs",
  md: "h-16 w-16 text-sm",
};

export function UserAvatar({ displayName, pictureUrl, size = "md" }: UserAvatarProps) {
  const [pictureFailed, setPictureFailed] = useState(false);
  const showPicture = Boolean(pictureUrl) && !pictureFailed;
  const sizeClass = sizeClasses[size];

  useEffect(() => {
    setPictureFailed(false);
  }, [pictureUrl]);

  if (showPicture) {
    return (
      <img
        src={pictureUrl!}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setPictureFailed(true)}
        className={`${sizeClass} rounded-full border border-stone-500/35 object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex items-center justify-center rounded-full border border-stone-500/35 bg-stone-700/60 font-bold text-stone-100`}
      aria-hidden
    >
      {userInitials(displayName)}
    </div>
  );
}
