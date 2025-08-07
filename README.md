# Momenty - Votre Journal de Voyage

Ceci est votre application de journal de voyage créée avec Firebase Studio.

## Comment lancer l'application en local

Pour faire tourner le projet sur votre machine, suivez ces étapes :

1.  **Installez les dépendances :**
    ```bash
    npm install
    ```
2.  **Lancez le serveur de développement :**
    ```bash
    npm run dev
    ```
3.  Ouvrez [http://localhost:9002](http://localhost:9002) dans votre navigateur pour voir l'application.

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

- **Framework Preset** : Vercel détectera automatiquement qu'il s'agit d'un projet Next.js. Vous n'avez rien à changer.
- **Root Directory** : Laissez la valeur par défaut.
- **Build and Output Settings** : Laissez les valeurs par défaut. Vercel sait comment construire une application Next.js.
- **Environment Variables** : Si votre projet avait besoin de clés d'API (ce qui n'est pas le cas pour l'instant), c'est ici qu'il faudrait les ajouter.

**4. Déployez !**

- Cliquez sur le bouton "Deploy".
- Vercel va maintenant récupérer votre code, installer les dépendances, construire l'application et la mettre en ligne. Cela peut prendre une ou deux minutes.

Une fois le déploiement terminé, vous recevrez une URL publique pour votre application (par exemple, `momenty-app.vercel.app`). Félicitations, votre journal de voyage est en ligne !

Chaque fois que vous pousserez (push) de nouvelles modifications sur la branche `main` de votre dépôt GitHub, Vercel redéploiera automatiquement votre site avec les dernières mises à jour.
