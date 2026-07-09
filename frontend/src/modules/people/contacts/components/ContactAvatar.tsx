// keel_web/src/modules/contacts/components/ContactAvatar.tsx

// Contact avatar — photo or initials placeholder.

import { buildMediaContentUrl } from "../../../media/api";
import { contactInitials, type Contact } from "../api";

type ContactAvatarProps = {
  contact: Pick<Contact, "first_name" | "last_name" | "photo">;
  className?: string;
};

export function ContactAvatar({ contact, className = "h-12 w-12" }: ContactAvatarProps) {
  const photoUrl = contact.photo
    ? buildMediaContentUrl(contact.photo.id, contact.photo.updated_at)
    : null;
  const initials = contactInitials(contact);

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
