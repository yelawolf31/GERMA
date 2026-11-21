import packageJson from '../../package.json'

/**
 * Factual project metadata used by the About & Development page.
 * Every value here comes from the repository itself — nothing is invented.
 */
export const PROJECT_INFO = {
  name: 'GERMA',
  version: packageJson.version,
  // First commit in the repository history.
  firstCommit: '2026-08-09',
  // Date this documentation page was last reviewed.
  documentedOn: '2026-11-21',
  // Counts taken from supabase/migrations and the public schema.
  migrationCount: 20,
  tableCount: 12,
  initiator: 'HANI YEBESET',
  email: 'haniyebeset@gmail.com',
  assistant: 'OpenCode',
}

/** Technologies actually present in package.json / config. */
export const TECH_STACK = [
  'React 19',
  'Vite 8',
  'Tailwind CSS 4',
  'React Router 7',
  'Motion',
  'Lucide',
  'Recharts',
  'Supabase',
  'PostgreSQL 17',
  'Deno Edge Functions',
  'Workbox',
  'Mapbox GL JS',
]

/** Application modules, referenced by their existing navigation keys. */
export const MODULES = [
  'nav.dashboard',
  'nav.map',
  'nav.customers',
  'nav.refrigerators',
  'nav.visits',
  'nav.issues',
  'nav.reports',
  'nav.settings',
  'nav.users',
  'nav.auditLogs',
]

/**
 * Major development milestones.
 * Dates, hashes and messages are taken verbatim from the repository's Git
 * history; `kind` is used only to colour/label the entry.
 */
export const MILESTONES = [
  { hash: '1979307', date: '2026-08-09', kind: 'foundation', message: 'Initial commit: Germa Field Management PWA' },
  { hash: '56e2a34', date: '2026-08-16', kind: 'fix', message: 'fix: bug fixes + Vercel config + auth seed repair' },
  { hash: '692d464', date: '2026-08-16', kind: 'feature', message: 'feat: redesign UI colors to RED/BLUE/WHITE + add logo' },
  { hash: '5e65020', date: '2026-08-16', kind: 'security', message: 'feat: security hardening, full i18n, input validation, RTL support' },
  {
    hash: '29e6f24',
    date: '2026-08-17',
    kind: 'feature',
    message:
      'feat: visit details, photos, permissions, i18n - VisitDetails with full data and photo gallery - VisitForm adds refrigerator selection - Migration 013 FK+RLS+audit triggers - VALID_CONDITIONS fixed - 100 tests passing',
  },
  { hash: 'a7cbd2c', date: '2026-08-26', kind: 'fix', message: 'fix: timezone hardening, route guards, validators, dead code cleanup, i18n completeness' },
  { hash: 'aef7542', date: '2026-08-26', kind: 'feature', message: 'feat: close audit log gaps and overhaul admin Audit Logs page' },
  { hash: 'f3dccd7', date: '2026-08-27', kind: 'feature', message: 'feat: client warning system' },
  { hash: 'dd6e64e', date: '2026-08-27', kind: 'feature', message: 'feat: full user management overhaul' },
  { hash: '28ad019', date: '2026-08-28', kind: 'feature', message: 'feat: replace dashboard lists with sortable data tables' },
  { hash: '31c400e', date: '2026-08-28', kind: 'feature', message: 'feat: global search, CSV export, needs-attention strip, visit-to-issue link' },
  { hash: '6067ed5', date: '2026-08-31', kind: 'security', message: 'security: harden storage buckets, auth config, and web headers' },
  { hash: 'bb8407a', date: '2026-11-17', kind: 'security', message: 'security: explicit least-privilege grants + fix email provider flag' },
  { hash: '76ab962', date: '2026-11-18', kind: 'architecture', message: 'feat(ui): subtle motion system with reduced-motion support' },
]
