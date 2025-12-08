# Installation de Node.js sur Windows

## ⚠️ Problème détecté

Node.js n'est pas installé ou n'est pas accessible sur votre système Windows.

## 📥 Solutions possibles

### Solution 1 : Installer Node.js (Recommandé)

1. **Téléchargez Node.js** :
   - Allez sur : https://nodejs.org/fr
   - Téléchargez la version **LTS** (Long Term Support) - actuellement v20 ou v22
   - Choisissez "Windows Installer (.msi)" pour votre système (64-bit probablement)

2. **Installez Node.js** :
   - Lancez le fichier `.msi` téléchargé
   - Suivez l'assistant d'installation
   - **Important** : Cochez la case "Automatically install the necessary tools" si elle apparaît
   - Utilisez les paramètres par défaut

3. **Vérifiez l'installation** :
   - Ouvrez un **NOUVEAU** PowerShell (fermez l'ancien)
   - Tapez : `node --version`
   - Tapez : `npm --version`
   - Si vous voyez les versions, c'est installé ! ✅

4. **Installez les dépendances du projet** :
   ```powershell
   cd "C:\Users\moslem5017\Desktop\doc perso\Momenty antig\Momenty"
   npm install
   ```

---

### Solution 2 : Utiliser l'environnement cloud/IDE

Si vous développez habituellement dans un environnement cloud (comme Google IDX, Replit, CodeSandbox, etc.) :

1. **Google IDX** (recommandé pour Next.js) :
   - Les dépendances sont gérées automatiquement
   - Ouvrez votre projet dans IDX
   - Le terminal IDX aura accès à npm

2. **VS Code avec Remote Development** :
   - Si vous utilisez WSL ou un container
   - Ouvrez le terminal WSL/container
   - Exécutez `npm install` depuis là

---

### Solution 3 : Utiliser uniquement pour déploiement

Si vous ne développez pas localement et déployez uniquement sur Vercel :

1. **Push vos changements sur Git** :
   ```powershell
   git add .
   git commit -m "Security update: Next.js 15.3.6 + Image zoom feature"
   git push
   ```

2. **Vercel installera automatiquement** :
   - Vercel détectera le nouveau `package.json`
   - Installera Next.js 15.3.6
   - Déploiera automatiquement

---

## 🔍 Comment vérifier votre situation ?

Répondez à ces questions :

1. **Où développez-vous habituellement ?**
   - [ ] Localement sur Windows
   - [ ] Dans un environnement cloud (IDX, Replit, etc.)
   - [ ] Je déploie seulement, je ne développe pas localement

2. **Avez-vous déjà utilisé npm sur cette machine ?**
   - [ ] Oui, mais je ne sais pas où
   - [ ] Non, jamais
   - [ ] Je ne suis pas sûr

---

## 🚀 Actions recommandées selon votre cas

### Cas A : Vous voulez développer localement
➡️ Installez Node.js (Solution 1)

### Cas B : Vous développez dans le cloud
➡️ Ouvrez votre projet dans votre environnement cloud et exécutez-y `npm install`

### Cas C : Vous déployez seulement
➡️ Commitez et pushez les changements, Vercel s'occupera du reste

---

## 📝 Fichiers modifiés prêts à déployer

Les modifications de sécurité et la nouvelle fonctionnalité sont déjà dans votre code :

✅ `package.json` - Next.js mis à jour vers 15.3.6
✅ `src/components/ui/image-lightbox.tsx` - Nouveau composant
✅ `src/app/plats/page.tsx` - Photos cliquables et agrandissables

**Ces fichiers sont prêts à être déployés même sans npm install local !**

---

## ❓ Besoin d'aide ?

Dites-moi :
1. Comment vous développez habituellement (localement, cloud, autre)
2. Si vous voulez installer Node.js localement ou juste déployer les changements

Je vous guiderai selon votre situation !
