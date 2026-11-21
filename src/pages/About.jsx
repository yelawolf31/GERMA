import {
  BadgeCheck,
  Boxes,
  Cpu,
  Database,
  GitCommit,
  History,
  Info,
  KeyRound,
  Mail,
  Monitor,
  Plug,
  Scale,
  Server,
  ShieldCheck,
  Smartphone,
  UserRound,
} from 'lucide-react'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import Badge from '../components/ui/Badge'
import { useTranslation } from '../i18n'
import { formatDate } from '../utils/format'
import { MILESTONES, MODULES, PROJECT_INFO, TECH_STACK } from '../constants/about'

const ARCHITECTURE = [
  { key: 'frontend', icon: Monitor },
  { key: 'backend', icon: Server },
  { key: 'database', icon: Database, vars: { tables: PROJECT_INFO.tableCount, migrations: PROJECT_INFO.migrationCount } },
  { key: 'auth', icon: KeyRound },
  { key: 'security', icon: ShieldCheck },
  { key: 'integrations', icon: Plug },
  { key: 'pwa', icon: Smartphone },
]

const KIND_TONES = {
  foundation: 'blue',
  feature: 'green',
  fix: 'gray',
  security: 'red',
  architecture: 'purple',
}

function InfoRow({ label, children, mono = false }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-2.5 last:border-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <dt className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className={`text-sm text-slate-800 sm:text-right ${mono ? 'font-mono' : 'font-medium'}`}>{children}</dd>
    </div>
  )
}

function SectionBlock({ icon: Icon, title, children }) {
  return (
    <div>
      <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        <Icon className="h-4 w-4 shrink-0 text-brand-700" />
        {title}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{children}</p>
    </div>
  )
}

export default function About() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title={t('about.title')}
        subtitle={t('about.subtitle')}
        actions={<Badge tone="red">{PROJECT_INFO.name}</Badge>}
      />

      {/* Project information + authors */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={t('about.projectTitle')} />
          <CardBody>
            <p className="text-sm leading-relaxed text-slate-600">{t('about.description')}</p>
            <dl className="mt-4">
              <InfoRow label={t('about.projectName')}>{PROJECT_INFO.name}</InfoRow>
              <InfoRow label={t('about.projectType')}>{t('about.projectTypeValue')}</InfoRow>
              <InfoRow label={t('about.firstDate')}>
                <span dir="ltr">{formatDate(PROJECT_INFO.firstCommit)}</span>
              </InfoRow>
              <InfoRow label={t('about.version')}>
                <span dir="ltr" className="font-mono">
                  {PROJECT_INFO.version}
                </span>
              </InfoRow>
              <InfoRow label={t('about.status')}>{t('about.statusValue')}</InfoRow>
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-slate-400">{t('about.versionNote')}</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('about.ownerTitle')} />
          <CardBody className="space-y-4">
            <dl>
              <InfoRow label={t('about.initiator')}>{PROJECT_INFO.initiator}</InfoRow>
              <InfoRow label={t('about.functionalDesign')}>{PROJECT_INFO.initiator}</InfoRow>
              <InfoRow label={t('about.developer')}>{PROJECT_INFO.initiator}</InfoRow>
              <InfoRow label={t('about.email')}>
                <a href={`mailto:${PROJECT_INFO.email}`} dir="ltr" className="text-brand-700 hover:underline">
                  {PROJECT_INFO.email}
                </a>
              </InfoRow>
            </dl>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <UserRound className="h-3.5 w-3.5" />
                  {t('about.humanTitle')}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{t('about.humanBody')}</p>
              </div>
              <div className="rounded-xl border border-brand-100 bg-brand-50 p-3">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-700">
                  <Cpu className="h-3.5 w-3.5" />
                  {t('about.aiTitle')}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{t('about.aiBody')}</p>
                <p className="mt-2">
                  <Badge tone="red">
                    <BadgeCheck className="h-3 w-3" />
                    {t('about.assistant')}: {PROJECT_INFO.assistant}
                  </Badge>
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Technical architecture */}
      <Card>
        <CardHeader title={t('about.archTitle')} subtitle={t('about.archIntro')} />
        <CardBody className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {ARCHITECTURE.map(({ key, icon: Icon, vars }) => (
              <div key={key} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Icon className="h-4 w-4 shrink-0 text-brand-700" />
                  {t(`about.${key}`)}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{t(`about.${key}Body`, vars)}</p>
              </div>
            ))}

            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Boxes className="h-4 w-4 shrink-0 text-brand-700" />
                {t('about.modules')}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {MODULES.map((moduleKey) => (
                  <Badge key={moduleKey} tone="blue">
                    {t(moduleKey)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{t('about.stackTitle')}</p>
            <div className="flex flex-wrap gap-1.5">
              {TECH_STACK.map((item) => (
                <Badge key={item} tone="gray">
                  {item}
                </Badge>
              ))}
            </div>
          </div>

          <dl>
            <InfoRow label={t('about.roles')}>{t('about.rolesValue')}</InfoRow>
            <InfoRow label={t('about.languages')}>{t('about.languagesValue')}</InfoRow>
          </dl>
        </CardBody>
      </Card>

      {/* Development history */}
      <Card>
        <CardHeader title={t('about.historyTitle')} subtitle={t('about.historyIntro')} />
        <CardBody>
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <Badge tone="green">
              <History className="h-3 w-3" />
              {t('about.initialCommit')}: <span dir="ltr">{formatDate(PROJECT_INFO.firstCommit)}</span>
            </Badge>
            <Badge tone="gray">
              {PROJECT_INFO.migrationCount} {t('about.migrations')}
            </Badge>
            <Badge tone="gray">
              {PROJECT_INFO.tableCount} {t('about.tables')}
            </Badge>
            <Badge tone="gray">
              {t('about.documentedOn')} <span dir="ltr">{formatDate(PROJECT_INFO.documentedOn)}</span>
            </Badge>
          </div>

          <ol className="relative space-y-5 border-l border-slate-200 pl-5">
            {MILESTONES.map((milestone) => (
              <li key={milestone.hash} className="relative">
                <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-500 ring-4 ring-white" />
                <div className="flex flex-wrap items-center gap-2">
                  <time className="text-xs font-semibold text-slate-500" dir="ltr">
                    {formatDate(milestone.date)}
                  </time>
                  <Badge tone={KIND_TONES[milestone.kind] || 'gray'}>{t(`about.kind_${milestone.kind}`)}</Badge>
                  <Badge tone="gray">
                    <GitCommit className="h-3 w-3" />
                    <span dir="ltr">{milestone.hash}</span>
                  </Badge>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-slate-700" dir="ltr">
                  {milestone.message}
                </p>
              </li>
            ))}
          </ol>
        </CardBody>
      </Card>

      {/* Authorship & intellectual property */}
      <Card>
        <CardHeader title={t('about.ipTitle')} />
        <CardBody className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <SectionBlock icon={UserRound} title={t('about.conception')}>
              {t('about.conceptionBody')}
            </SectionBlock>
            <SectionBlock icon={Cpu} title={t('about.designContrib')}>
              {t('about.designBody')}
            </SectionBlock>
            <SectionBlock icon={Monitor} title={t('about.devContrib')}>
              {t('about.devBody')}
            </SectionBlock>
            <SectionBlock icon={Info} title={t('about.identification')}>
              {PROJECT_INFO.name} — {PROJECT_INFO.initiator} — {PROJECT_INFO.email}
            </SectionBlock>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Scale className="h-3.5 w-3.5" />
              {t('about.dossier')}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{t('about.dossierBody')}</p>
          </div>

          <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-relaxed text-amber-800">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{t('about.legalNote')}</span>
          </div>
        </CardBody>
      </Card>

      {/* Security & privacy */}
      <Card>
        <CardHeader title={t('about.privacyTitle')} />
        <CardBody>
          <p className="flex gap-2 text-sm leading-relaxed text-slate-600">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span>{t('about.privacyBody')}</span>
          </p>
          <p className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <Mail className="h-3.5 w-3.5" />
            <a href={`mailto:${PROJECT_INFO.email}`} dir="ltr" className="hover:underline">
              {PROJECT_INFO.email}
            </a>
          </p>
        </CardBody>
      </Card>
    </div>
  )
}
