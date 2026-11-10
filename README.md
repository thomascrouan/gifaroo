# Gifaroo

Application Angular pour rechercher des GIFs via l'API [KLIPY](https://klipy.com), les ranger dans des collections et garder ses favoris.

- **Accueil** : GIFs tendances et recherche par mot-clé, avec pagination (« Voir plus »)
- **Favoris** : ajouter / retirer un GIF des favoris depuis n'importe quelle grille (❤️)
- **Collections** : créer, lister, consulter, modifier et supprimer des collections, y ajouter des GIFs (➕) ou les en retirer
- **Copier le lien** d'un GIF pour le coller rapidement dans Discord, Slack, Teams ou Telegram

Les favoris et les collections sont stockés dans une API simulée avec json-server (`db.json`). Une copie des infos du GIF y est enregistrée : les afficher ne consomme aucun appel KLIPY.

### Pourquoi ce projet

J'ai choisi un projet personnel plutôt qu'un des trois sujets proposés, parce que j'utilise souvent des GIFs dans mes messageries et que je voulais un outil qui me serve vraiment. Il couvre les mêmes notions que les sujets du cours, avec en plus une API externe (KLIPY).

## Prérequis

- [Node.js](https://nodejs.org) **22.22.3 ou plus** (ou 24.15+), exigé par Angular CLI 22
- npm (fourni avec Node.js)
- [Angular CLI](https://angular.dev/tools/cli)

```bash
npm install -g @angular/cli
```

## Installation

```bash
git clone git@github.com:thomascrouan/gifaroo.git
cd gifaroo
npm install
```

### Clé API KLIPY

1. Créer un compte sur [partner.klipy.com](https://partner.klipy.com) et générer une clé de test (gratuite, 100 appels par heure).
2. Copier le modèle de configuration :

   ```bash
   cp src/environments/environment.example.ts src/environments/environment.ts
   ```

3. Renseigner la clé dans `src/environments/environment.ts` :

   ```ts
   export const environment = {
     klipyApiKey: 'VOTRE_CLE_KLIPY',
     apiUrl: 'http://localhost:3000',
   };
   ```

`environment.ts` est ignoré par git : la clé n'est jamais commitée.

## Lancement

Dans deux terminaux :

```bash
npm run api   # json-server sur http://localhost:3000
ng serve      # application sur http://localhost:4200
```

Si json-server n'est pas lancé, l'application affiche un message d'erreur avec un bouton « Réessayer ».

## Build

```bash
ng build
```

Les fichiers sont générés dans `dist/gifaroo/`.

## Structure du projet

```
src/app/
├── core/
│   ├── http/          # toErrorMessage() : messages d'erreur HTTP lisibles
│   ├── models/        # Gif, Collection, CollectionGif, Favorite
│   └── services/      # CollectionService, FavoriteService, KlipyService
├── features/
│   ├── home/          # tendances + recherche
│   ├── favorites/
│   ├── collections/   # collection-list, collection-detail, collection-form
│   └── not-found/
├── shared/components/ # gif-card, gif-grid, search-bar, collection-picker, state-message
├── app.routes.ts
└── app.config.ts
```

### Routes

| Route | Page |
|---|---|
| `/` | Tendances et recherche |
| `/favorites` | Favoris |
| `/collections` | Liste des collections |
| `/collections/new` | Création d'une collection |
| `/collections/:id` | Détail d'une collection |
| `/collections/:id/edit` | Modification d'une collection |
| `**` | Page 404 |

Toutes les pages sont chargées à la demande (`loadComponent`). Le paramètre `:id` arrive dans les composants via `input()` grâce à `withComponentInputBinding()`. `collections/new` est déclarée avant `collections/:id`.

## Choix techniques

### Comment chaque exigence est réalisée

| Exigence | Où et comment |
|---|---|
| Composants standalone, two-way binding avec `input()` / `output()` | Aucun NgModule, control flow moderne (`@if`, `@for`, `@empty`). `SearchBar` expose `query` + `queryChange`, utilisé en `[(query)]` sur l'accueil. `CollectionPicker` expose `open` + `openChange`, utilisé en `[(open)]` sur l'accueil et les favoris. |
| Service avec signal privé, vue read-only et `computed()` | `CollectionService` : signals privés `collectionsSignal`, `loadingSignal`, `errorSignal`… exposés avec `asReadonly()`, et trois `computed()` : `count`, `sortedCollections`, `gifCounts`. Même principe dans `FavoriteService` (`favoriteIds` est un `computed` qui donne un `Set`). |
| 4 routes minimum dont 1 avec paramètre | 7 routes dans `app.routes.ts`, dont `/collections/:id` et `/collections/:id/edit` (voir [Routes](#routes)). |
| Formulaire réactif avec validateurs et messages d'erreur | `CollectionForm` : `name` (obligatoire, 2 à 50 caractères, validateur perso « nom unique ») et `description` (200 caractères max). Les messages s'affichent quand le champ est `touched`. Le même formulaire sert à la création et à la modification. |
| CRUD résilient avec json-server | Collections : `GET`, `POST`, `PATCH`, `DELETE`. GIFs des collections et favoris : `GET`, `POST`, `DELETE`. `catchError` sur chaque appel, `retry(1)` sur les lectures, messages clairs selon l'erreur (serveur éteint, 404, 500). Supprimer une collection supprime aussi ses GIFs. Un GIF ne peut pas être ajouté deux fois à la même collection. |
| États loading, error et empty | Composant `StateMessage` (`type` = `loading`, `error` ou `empty`, bouton « Réessayer » en cas d'erreur), utilisé sur toutes les pages qui chargent des données. |
| README | Ce fichier : prérequis, installation, clé KLIPY, lancement, build, tests, structure et choix techniques. |
| 5 commits minimum | Une branche et un commit par étape de la feuille de route, puis une PR vers `develop`. |

### Autres choix

- **Copie des infos du GIF** dans `db.json` au moment de l'ajout : afficher les favoris et les collections ne consomme aucun appel KLIPY.
- **Économie d'appels KLIPY** (clé de test limitée à 100 appels par heure) : `debounceTime(400)`, 2 caractères minimum, `distinctUntilChanged()`, cache en mémoire des pages déjà chargées, message dédié en cas de limite atteinte (429).
- **Clé API** dans `environment.ts`, ignoré par git ; `environment.example.ts` sert de modèle.
- **Accessibilité** : lien « Aller au contenu », focus visibles, `alt` sur les images, boutons utilisables au clavier, fenêtre d'ajout à une collection fermable avec Échap.
- **Aucune dépendance ajoutée** en dehors d'Angular et de json-server.

## Utilisation de l'IA

J'ai utilisé **Claude Code** (modèle Claude Opus 5.5), dans le terminal, directement dans le dossier du projet.

### Cadrer le projet

J'ai d'abord utilisé Claude pour cadrer le projet. J'ai rédigé deux documents qui ont ensuite servi de contexte à chaque session :

- **`SPECS.md`** : fonctionnalités, routes, modèle de données, services, composants, formulaires, et ce qui est hors périmètre ;
- **`CLAUDE.md`** : stack, commandes, grille d'évaluation et règles à respecter (pas de dépendance sans validation, pas de fonctionnalité hors `SPECS.md`, limiter les appels KLIPY).

### Le mode plan quand j'avais des doutes

Quand je n'étais pas sûr de la bonne approche, j'utilisais le **mode plan** de Claude Code. Dans ce mode, Claude analyse le projet et propose un plan sans modifier de fichier. Je pouvais comparer les options et choisir avant de passer à la réalisation.

### L'implémentation

L'IA m'a été utile pour réaliser le design et les documents `.md`. Je l'ai également utilisée pour relire le code que j'ai écrit, afin de corriger les éventuelles erreurs et d'harmoniser le code.
