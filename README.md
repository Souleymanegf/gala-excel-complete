# Gala Black Excellence Noire 2027 — version Excel + GitHub

Cette version conserve l'interface React du fichier d'origine et remplace `window.storage` pour les candidatures par une vraie API serveur.

## Architecture

- **React/Vite** : formulaire et tableau d'administration.
- **Excel** : base de données `data/candidatures-gala-2027.xlsx`.
- **GitHub privé** : stockage persistant du fichier Excel et des documents.
- **API Node/Express** : seul endroit qui connaît le token GitHub.
- **Numéro automatique** : `GBE2027-000001`, `GBE2027-000002`, etc.
- **Admin** : le mot de passe n'est plus présent dans le JavaScript du navigateur.

## Installation

1. Créer un dépôt GitHub **privé**.
2. Copier `.env.example` vers `.env` et remplir les variables.
3. Installer Node.js 20+.
4. Lancer `npm install`.
5. En développement : `npm run dev`.
6. En production : `npm run build` puis `NODE_ENV=production npm start`.

## Variables

`GITHUB_TOKEN` doit être un token GitHub avec les permissions nécessaires sur le dépôt privé. Ne jamais le mettre dans `src/` ni dans une variable `VITE_*`.

## Première soumission

Si le fichier Excel n'existe pas, l'API le crée automatiquement avec deux feuilles : `Candidatures` et `Documents`.

## Important — données personnelles

Le dépôt doit être privé et protégé. GitHub conserve l'historique des commits : supprimer une ligne du fichier Excel ne supprime pas nécessairement les anciennes données des commits. Pour un usage réel contenant des CV, photos, coordonnées ou autres renseignements personnels, une base de données et un stockage de fichiers conçus pour la protection des renseignements personnels sont préférables à GitHub comme base de données.
