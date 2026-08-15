import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";

import { getApplicationUrl } from "@/config/server-env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database.generated";

const USERS_PER_PAGE = 200;
const MAX_USER_PAGES = 50;

async function findUserByEmail(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  email: string,
): Promise<User | null> {
  for (let page = 1; page <= MAX_USER_PAGES; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: USERS_PER_PAGE,
    });

    if (error) {
      throw error;
    }

    const user = data.users.find(
      (candidate) => candidate.email?.toLowerCase() === email,
    );

    if (user) {
      return user;
    }

    if (data.users.length < USERS_PER_PAGE) {
      return null;
    }
  }

  throw new Error("The Auth user directory exceeds the supported lookup size.");
}

export async function resolveOrInviteRecruiter(
  email: string,
): Promise<Readonly<{ user: User; invitationSent: boolean }>> {
  const admin = createAdminSupabaseClient();
  const existingUser = await findUserByEmail(admin, email);

  if (existingUser) {
    return { user: existingUser, invitationSent: false };
  }

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${getApplicationUrl()}/auth/callback?next=/auth/update-password`,
  });

  if (error || !data.user) {
    throw error ?? new Error("Supabase Auth returned no invited user.");
  }

  return { user: data.user, invitationSent: true };
}

export async function listRecruiterEmails(
  profileIds: readonly string[],
): Promise<ReadonlyMap<string, string>> {
  const pendingIds = new Set(profileIds);
  const emails = new Map<string, string>();

  if (pendingIds.size === 0) {
    return emails;
  }

  const admin = createAdminSupabaseClient();

  for (let page = 1; page <= MAX_USER_PAGES; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: USERS_PER_PAGE,
    });

    if (error) {
      throw error;
    }

    data.users.forEach((user) => {
      if (pendingIds.has(user.id) && user.email) {
        emails.set(user.id, user.email);
        pendingIds.delete(user.id);
      }
    });

    if (pendingIds.size === 0 || data.users.length < USERS_PER_PAGE) {
      break;
    }
  }

  return emails;
}

export async function acceptPendingRecruiterInvitations(
  supabase: SupabaseClient<Database>,
): Promise<string | undefined> {
  const { data, error } = await supabase.rpc(
    "accept_pending_recruiter_invitations",
  );

  if (error) {
    throw error;
  }

  return data[0];
}
