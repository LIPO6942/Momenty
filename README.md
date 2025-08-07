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