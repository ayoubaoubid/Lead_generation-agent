-- Global authorization vocabulary only. No tenant, user, or personal data is seeded.
-- Migrations remain the production source of truth; this idempotent seed keeps the
-- local catalog synchronized after `supabase db reset`.
insert into public.permissions (
  key,
  resource,
  action,
  description,
  allowed_scopes
)
values
  ('agency.manage', 'agency', 'manage', 'Manage agency settings and lifecycle.', array['agency'::public.role_scope]),
  ('agency.transfer_ownership', 'agency', 'transfer_ownership', 'Transfer ownership of an agency.', array['agency'::public.role_scope]),
  ('client.read', 'client', 'read', 'Read authorized client workspaces.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('client.create', 'client', 'create', 'Create a client workspace within an agency.', array['agency'::public.role_scope]),
  ('client.manage', 'client', 'manage', 'Manage an authorized client workspace.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('member.read', 'member', 'read', 'Read authorized member profiles and memberships.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('member.invite', 'member', 'invite', 'Invite a member into an authorized scope.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('member.assign_role', 'member', 'assign_role', 'Assign an allowed role to a member.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('member.suspend', 'member', 'suspend', 'Suspend or remove a membership.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('role.read', 'role', 'read', 'Read roles and their permission assignments.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('role.create', 'role', 'create', 'Create a custom role in an authorized scope.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('role.assign', 'role', 'assign', 'Change permission assignments on a custom role.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('role.archive', 'role', 'archive', 'Archive a custom role.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('offer.read', 'offer', 'read', 'Read client offers and supporting evidence.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('offer.write', 'offer', 'write', 'Create and update client offers.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('targeting.read', 'targeting', 'read', 'Read authorized ICP and persona profiles.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('targeting.write', 'targeting', 'write', 'Create, edit, duplicate, version, and archive ICP and persona profiles.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('targeting.validate', 'targeting', 'validate', 'Human validation and activation of ICP and persona versions.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('targeting.propose', 'targeting', 'propose', 'Request structured AI proposals for ICP and persona drafts.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('campaign.read', 'campaign', 'read', 'Read campaigns and sequences.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('campaign.create', 'campaign', 'create', 'Create a campaign.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('campaign.write', 'campaign', 'write', 'Edit campaign configuration and content.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('campaign.approve', 'campaign', 'approve', 'Approve a campaign for its next controlled stage.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('campaign.launch', 'campaign', 'launch', 'Launch an approved campaign after all preflight checks.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('lead.read', 'lead', 'read', 'Read authorized company, contact, and lead data.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('lead.write', 'lead', 'write', 'Create and update authorized lead data.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('message.read', 'message', 'read', 'Read generated messages and templates.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('message.write', 'message', 'write', 'Create and edit messages and templates.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('message.approve', 'message', 'approve', 'Approve or reject generated messages.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('reply.read', 'reply', 'read', 'Read authorized inbound replies.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('reply.write', 'reply', 'write', 'Classify replies and record authorized follow-up actions.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('meeting.read', 'meeting', 'read', 'Read authorized meeting information.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('meeting.write', 'meeting', 'write', 'Create and update authorized meetings.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('pipeline.read', 'pipeline', 'read', 'Read authorized pipeline and opportunity data.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('pipeline.write', 'pipeline', 'write', 'Create and update authorized pipeline records.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('analytics.read', 'analytics', 'read', 'Read authorized analytics and reports.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('audit.read', 'audit', 'read', 'Read tenant-scoped audit records.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('settings.read', 'settings', 'read', 'Read settings in an authorized scope.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('settings.manage', 'settings', 'manage', 'Manage settings in an authorized scope.', array['agency'::public.role_scope, 'client'::public.role_scope])
on conflict (key) do update
set
  resource = excluded.resource,
  action = excluded.action,
  description = excluded.description,
  allowed_scopes = excluded.allowed_scopes;
