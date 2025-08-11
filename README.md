# Momenty - Votre Journal de Voyage

Ceci est votre application de journal de voyage créée avec Firebase Studio.

## Comment lancer l'application en local

Pour faire tourner le projet sur votre machine, suivez ces étapes :

1.  **Installez les dépendances :**
    ```bash
    npm install
    ```
2.  **Configurez les variables d'environnement :**
    Créez un fichier `.env.local` à la racine de votre projet et ajoutez-y vos clés d'API. Ce fichier ne sera pas envoyé sur GitHub.

    ```
    # Clés Firebase (disponibles dans la console Firebase > Paramètres du projet)
    NEXT_PUBLIC_FIREBASE_API_KEY=AIz...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
    NEXT_PUBLIC_FIREBASE_APP_ID=1:...:web:...

    # Clés Cloudinary (disponibles dans le tableau de bord Cloudinary)
    CLOUDINARY_CLOUD_NAME=...
    CLOUDINARY_API_KEY=...
    CLOUDINARY_API_SECRET=...
    ```

3.  **Lancez le serveur de développement :**
    ```bash
    npm run dev
    ```
4.  Ouvrez [http://localhost:9002](http://localhost:9002) dans votre navigateur pour voir l'application.

---

## Comment transférer le projet sur GitHub

Suivez ce guide pour héberger votre code sur GitHub.

### Prérequis
- Vous devez avoir [Git](https://git-scm.com/) installé sur votre ordinateur.
- Vous devez avoir un compte [GitHub](https://github.com/).

### Étapes

**1. Créez un nouveau dépôt sur GitHub**

- Allez sur [github.com/new](https://github.com/new).
- Donnez un nom à votre dépôt (par exemple, `momenty-app`).
- Choisissez si le dépôt doit être public ou privé.
- **Important** : Ne cochez PAS "Initialize this repository with a README", ".gitignore", ou "license". Nous allons importer le projet existant.
- Cliquez sur "Create repository".

**2. Initialisez le dépôt Git local**

Ouvrez un terminal à la racine de votre projet et exécutez les commandes suivantes :

```bash
# Initialise un nouveau dépôt Git dans votre projet
git init

# Ajoute tous les fichiers au suivi de Git
git add .

# Crée le premier "commit" (un instantané de votre code)
git commit -m "Premier commit : initialisation du projet Momenty"
```

**3. Connectez votre dépôt local à GitHub**

Sur la page de votre nouveau dépôt GitHub, vous verrez une section "…or push an existing repository from the command line". Copiez les commandes qui s'y trouvent. Elles ressembleront à ceci :

```bash
# Remplacez <URL_DE_VOTRE_DEPOT_GITHUB> par l'URL fournie par GitHub
git remote add origin <URL_DE_VOTRE_DEPOT_GITHUB>

# Renomme la branche principale en "main" (une convention moderne)
git branch -M main
```

**4. Poussez votre code vers GitHub**

Maintenant, envoyez votre code vers votre dépôt sur GitHub :

```bash
git push -u origin main
```

Et voilà ! Votre code est maintenant sauvegardé sur GitHub. Vous pouvez rafraîchir la page de votre dépôt pour voir vos fichiers apparaître.

---

## Comment déployer sur Vercel

Vercel est la plateforme idéale pour héberger des applications Next.js. Le déploiement est simple et rapide.

### Prérequis
- Votre code doit être sur un dépôt GitHub.
- Vous devez avoir un compte [Vercel](https://vercel.com/signup). Vous pouvez vous inscrire gratuitement avec votre compte GitHub.

### Étapes

**1. Connectez-vous à Vercel**

- Rendez-vous sur [vercel.com](https://vercel.com) et connectez-vous.

**2. Importez votre projet**

- Une fois sur votre tableau de bord, cliquez sur "Add New..." > "Project".
- Vercel vous proposera d'importer vos dépôts GitHub. Trouvez votre projet `momenty-app` (ou le nom que vous lui avez donné) et cliquez sur "Import".

**3. Configurez le projet**

- **Framework Preset** : Vercel détectera automatiquement qu'il s'agit d'un projet Next.js.
- **Root Directory** : Laissez la valeur par défaut.
- **Build and Output Settings** : Laissez les valeurs par défaut.

**4. Ajoutez les Variables d'Environnement**

- C'est l'étape la plus importante. Déroulez la section **"Environment Variables"**.
- Vous devez ajouter ici **toutes les clés** que vous avez dans votre fichier `.env.local`. Chaque clé doit être ajoutée une par une.
- Voici la liste des variables à ajouter :
    - `NEXT_PUBLIC_FIREBASE_API_KEY`
    - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
    - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
    - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
    - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
    - `NEXT_PUBLIC_FIREBASE_APP_ID`
    - `CLOUDINARY_CLOUD_NAME`
    - `CLOUDINARY_API_KEY`
    - `CLOUDINARY_API_SECRET`
- Pour chaque ligne, copiez le nom de la variable, puis collez la valeur correspondante depuis votre fichier local.

**5. Déployez !**

- Cliquez sur le bouton "Deploy".
- Vercel va maintenant récupérer votre code, utiliser vos variables d'environnement, installer les dépendances, construire l'application et la mettre en ligne.

Une fois le déploiement terminé, vous recevrez une URL publique pour votre application (par exemple, `momenty-app.vercel.app`). Félicitations, votre journal de voyage est en ligne !

Chaque fois que vous pousserez (push) de nouvelles modifications sur la branche `main` de votre dépôt GitHub, Vercel redéploiera automatiquement votre site avec les dernières mises à jour.
