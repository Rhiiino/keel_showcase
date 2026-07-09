// stack_sandbox/frontend_web/src/modules/settings/components/ProfileNameSection.tsx

// Profile block in General settings — click the name to edit via contentEditable.

import { EditableText } from "../../agents/components/EditableText";
import type { CurrentUser } from "../../auth/api";
import { ProfilePictureField } from "./ProfilePictureField";

type ProfileNameSectionProps = {
  user: CurrentUser;
  nameDraft: string;
  onNameDraftChange: (nextName: string) => void;
  disabled?: boolean;
};

export function ProfileNameSection({
  user,
  nameDraft,
  onNameDraftChange,
  disabled = false,
}: ProfileNameSectionProps) {
  return (
    <section className="space-y-4 rounded-xl border border-stone-800/80 bg-stone-950/40 p-5">
      <div>
        <h3 className="text-sm font-semibold text-stone-100">Profile</h3>
        <p className="mt-1 text-xs text-stone-500">
          Click your picture or name to edit. Name changes apply after you save.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <ProfilePictureField
          displayName={nameDraft || user.display_name}
          pictureUrl={user.picture_url}
          disabled={disabled}
        />
        <div className="min-w-0 flex-1">
          <EditableText
            as="h3"
            value={nameDraft}
            onChange={(nextName) =>
              onNameDraftChange(nextName.replace(/\r?\n/g, " "))
            }
            editable={!disabled}
            placeholder="Your name"
            className="text-lg font-semibold text-stone-50"
            editableClassName="px-2 py-1"
          />
          <p className="mt-1 truncate text-sm text-stone-500">{user.email}</p>
        </div>
      </div>
    </section>
  );
}
