# Germa Field Management

PWA interne de gestion terrain pour Germa : clients, réfrigérateurs, visites de supervision et incidents.

- **Frontend** : React 19 + Vite 8 + Tailwind CSS v4, mobile-first
- **Backend** : Supabase (PostgreSQL, Auth, Storage, Edge Functions) avec **RLS** activé sur toutes les tables
- **Carte** : Mapbox GL JS (clusters, marqueurs colorés, sélection, itinéraires)
- **PWA** : installable, cache de tuiles Mapbox et pré-cache hors-ligne

## Comptes

Les comptes ne sont **jamais** documentés en clair dans le dépôt. Ils sont créés par un administrateur via l'Edge Function `create-user` (qui utilise la clé `service_role` côté serveur uniquement). Les mots de passe sont choisis à la création et ne doivent pas être committés.

> Des données de démonstration sont fournies par `supabase/migrations/010_seed_data.sql` (exécutées uniquement lors d'un `db reset` local de développement, jamais en production). Aucun identifiant réel ni mot de passe en clair n'est stocké dans le code source.

## Prérequis

- Node.js 20+ (développé/testé avec Node 24)
- Un projet **Supabase** (gratuit) : https://supabase.com
- Un token **Mapbox** (gratuit) : https://account.mapbox.com/access-tokens
- Git (pour versionner) : non installé sur la machine actuelle, voir « Première mise en place » ci-dessous

## Première mise en place

```bash
# 1. Initialiser le dépôt git
git init

# 2. Installer les dépendances
npm install
```

## Configuration

Copier `.env.example` vers `.env` et remplir les valeurs :

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_MAPBOX_ACCESS_TOKEN=
```

> La clé **service_role** ne doit JAMAIS être utilisée côté frontend. Elle est réservée à l'Edge Function (variable d'environnement serveur).

## Base de données (Supabase)

1. Créer un projet sur https://supabase.com et récupérer l'URL + clé **anon** dans **Project Settings → API**.
2. Appliquer les migrations dans l'ordre :

```bash
# Avec la CLI Supabase (projet lié) :
supabase link --project-ref <project-ref>
supabase db push
```

Ou copier-coller chaque fichier `supabase/migrations/0XX_*.sql` dans **SQL Editor** du dashboard, dans l'ordre numérique (001 → 010).

### Structure des migrations

| Fichier | Contenu |
| --- | --- |
| `001_create_profiles.sql` | Table `profiles`, trigger de création auto depuis `auth.users`, helpers `current_user_role()` / `is_admin()` / `set_updated_at()` |
| `002_create_customers.sql` | Clients avec coordonnées GPS |
| `003_create_refrigerators.sql` | Réfrigérateurs liés aux clients + trigger d'audit |
| `004_create_visits.sql` | Visites (immuables) + audit |
| `005_create_issues.sql` | Incidents + audit |
| `006_create_products.sql` | Catalogue produits (indépendant) |
| `007_create_audit_logs.sql` | Journal d'audit + triggers (insérer une ligne à chaque INSERT/UPDATE/DELETE) |
| `008_create_storage_buckets.sql` | Buckets Storage (photos visites/incidents/clients/réfrigérateurs) + tables de référence photo + politiques d'upload |
| `009_create_rls_policies.sql` | **RLS** sur toutes les tables (voir matrice ci-dessous) |
| `010_seed_data.sql` | Données de démonstration locales (Oran) — jamais exécutées en production |
| `014_private_visit_photos.sql` | Bucket `visit-photos` privé (URL signées) |
| `017_private_photo_buckets.sql` | Tous les buckets photo passés **privés** (URL signées pour authentifiés) |

## Edge Function `create-user`

La création de comptes par un admin passe par une Edge Function (clé service_role côté serveur uniquement).

1. Créer le fichier d'environnement local (optionnel) :
   ```bash
   supabase functions new create-user
   ```
   (ou utiliser directement `supabase/functions/create-user/index.ts` fourni)
2. Déployer :
   ```bash
   supabase functions deploy create-user
   ```
3. Renseigner les secrets (remplis automatiquement par la CLI avec `--project-ref` lié) :
   ```bash
   supabase secrets set SUPABASE_URL=<url> SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   ```

> Le frontend appelle `supabase.functions.invoke('create-user')`. L'Edge Function vérifie que l'appelant est **admin** avant de créer l'utilisateur (email confirmé + profile créé via trigger).

## Mapbox

Générer un token public (pas besoin de scopes restreints pour l'affichage) et le mettre dans `VITE_MAPBOX_ACCESS_TOKEN`.

## Lancer le projet

```bash
npm run dev        # développement (http://localhost:5173)
npm run build      # build de production + génération du service worker PWA
npm run preview    # prévisualisation du build
npm run test       # tests unitaires (Vitest)
npm run lint       # lint (oxlint)
```

## Déploiement (PWA)

Construire puis héberger `dist/` (Netlify, Vercel, Cloudflare Pages, etc.). Le manifest + service worker rendent l'application **installable** :

- Android/Chrome : « Ajouter à l'écran d'accueil »
- iOS/Safari : « Ajouter à l'écran d'accueil »
- Les tuiles Mapbox visitées sont mises en cache pour un usage **hors-ligne**.

## Carte — légende des couleurs

Priorité : client inactif > réfrigérateur cassé > entretien nécessaire > tout fonctionne > aucun réfrigérateur.

| Couleur | Signification |
| --- | --- |
| 🟥 Rouge | Au moins un réfrigérateur **en panne** |
| 🟧 Orange | Au moins un réfrigérateur **à entretenir** |
| 🟩 Vert | Tous les réfrigérateurs **fonctionnent** |
| 🟦 Bleu | Aucun réfrigérateur enregistré |
| ⬜ Gris | Client **inactif** (contractuel) |

Les réfrigérateurs **retirés** sont ignorés dans le calcul de la couleur.

## Rôles et permissions (RLS)

| Action | Admin | Superviseur |
| --- | --- | --- |
| Voir clients / réfrigérateurs / visites / incidents | ✅ | ✅ |
| Créer un client, un réfrigérateur, une visite, un incident | ✅ | ✅ |
| Modifier/supprimer un client ou réfrigérateur | ✅ | ❌ |
| Modifier le **statut** d'un réfrigérateur | ✅ | ✅ (uniquement `status`, les autres colonnes sont protégées par RLS) |
| Modifier/supprimer un incident | ✅ | ❌ |
| Gérer le catalogue produits | ✅ | ❌ |
| Créer des comptes (Edge Function) | ✅ | ❌ |
| Consulter le journal d'audit | ✅ | ❌ |

**Immuabilité** : les visites n'ont **aucune** politique UPDATE/DELETE — elles ne peuvent ni être modifiées ni supprimées, même par un admin.

## Structure du projet

```
germa-field-management/
├── public/
│   └── icons/                  # Icônes PWA générées
├── scripts/
│   └── generate-icons.cjs      # Génération des icônes PWA
├── src/
│   ├── components/             # UI (ui/), carte (map/), formulaires
│   ├── constants/              # Statuts, rôles, wilayas, types de commerce
│   ├── hooks/                  # useAuth, useMapData, useGeolocation, ...
│   ├── i18n/                   # Traductions fr / ar / en
│   ├── lib/                    # Client Supabase
│   ├── pages/                  # Login, Dashboard, Carte, Clients, Visites, ...
│   ├── routes/                 # AppRoutes + guards (ProtectedRoute / RoleRoute)
│   ├── services/               # Appels API (supabase-js)
│   ├── test/                   # Setup + tests unitaires
│   └── utils/                  # geo, format, validators, filters, image
├── supabase/
│   ├── functions/create-user/  # Edge Function de création de comptes
│   └── migrations/             # 001 → 010 (schéma, RLS, seed)
├── .env.example
└── vite.config.js              # Vite + PWA + Tailwind + config Vitest
```

## Sécurité

- **RLS** activé sur toutes les tables ; la base rejette ce que l'UI masque.
- La clé `service_role` n'est utilisée que dans l'Edge Function.
- Les visites sont immuables au niveau base.
- Le changement de statut superviseur est borné par la politique `with check` (seule la colonne `status` peut changer).
