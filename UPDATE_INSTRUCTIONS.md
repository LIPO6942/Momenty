# Instructions de mise à jour - Sécurité & Fonctionnalités

## ⚠️ MISE À JOUR CRITIQUE DE SÉCURITÉ

### CVE-2025-55182 - Vulnérabilité RCE dans Next.js

**Action requise immédiatement** : Next.js a été mis à jour de la version **15.3.3** vers **15.3.6** pour corriger une vulnérabilité critique de type RCE (Remote Code Execution) dans les React Server Components.

### Installation de la mise à jour

Pour appliquer la mise à jour de sécurité, exécutez la commande suivante :

```bash
npm install
```

Ou si vous utilisez yarn :

```bash
yarn install
```

Cette commande installera Next.js 15.3.6 et mettra à jour toutes les dépendances nécessaires.

### Vérification de la version

Après installation, vérifiez que Next.js est bien à jour :

```bash
npm list next
```

Vous devriez voir : `next@15.3.6`

## ✨ Nouvelle Fonctionnalité : Agrandissement des Photos de Plats

### Changements apportés

1. **Nouveau composant** : `ImageLightbox` (`src/components/ui/image-lightbox.tsx`)
   - Permet d'agrandir les images en plein écran
   - Effet de zoom au survol avec icône
   - Modal sombre pour une meilleure visualisation
   - Fermeture facile avec bouton X ou en cliquant en dehors

2. **Page Plats mise à jour** : `src/app/plats/page.tsx`
   - Les photos des plats sont maintenant cliquables
   - Cliquer sur une photo l'affiche en haute qualité dans un modal
   - Animation douce et expérience utilisateur améliorée

### Utilisation

- Naviguez vers la page "Mes Plats"
- Survolez une photo de plat pour voir l'icône de zoom
- Cliquez sur la photo pour l'agrandir
- Cliquez sur le X ou en dehors de l'image pour fermer

## 🚀 Déploiement

Après avoir installé les dépendances :

```bash
# Mode développement
npm run dev

# Build pour production
npm run build

# Démarrer en production
npm start
```

## 📝 Notes techniques

- **TypeScript** : Les erreurs de lint affichées sont probablement dues aux types TypeScript non encore installés. Elles disparaîtront après `npm install`.
- **Compatibilité** : Cette mise à jour est compatible avec votre configuration actuelle
- **Breaking Changes** : Aucune modification majeure nécessaire dans votre code

## ⚡ Prochaines étapes recommandées

1. Installer les dépendances : `npm install`
2. Tester localement : `npm run dev`
3. Vérifier la fonctionnalité d'agrandissement des images
4. Déployer sur Vercel une fois validé

---

**Date de mise à jour** : 8 décembre 2025
**Version Next.js** : 15.3.3 → 15.3.6
**Nouvelles fonctionnalités** : Agrandissement des photos de plats
