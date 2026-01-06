# 🔗 Intégration Momenty → Kol Youm

## Contexte

L'application **Momenty** permet aux utilisateurs de publier des "instants" de type **Plat** avec sélection d'un restaurant/café depuis la base de données Kol Youm.

**Objectif** : Quand un utilisateur publie un plat sur Momenty, enregistrer automatiquement cette visite dans les statistiques de Kol Youm.

---

## Prompt pour IA/Dev Kol Youm

> **Mission** : Créer un endpoint API qui permet à Momenty d'enregistrer une visite quand un utilisateur publie un plat.

### 1. Route à Créer

```
POST /api/external-visit
```

### 2. Headers Requis

```
Content-Type: application/json
X-API-Key: [clé secrète partagée - à définir]  // Optionnel mais recommandé
```

### 3. Corps de la Requête (JSON)

```json
{
  "userEmail": "user@example.com",
  "placeName": "Dar El Jeld",
  "zone": "Tunis Centre",
  "visitDate": "2026-01-06T10:00:00Z",
  "source": "momenty"
}
```

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `userEmail` | string | ✅ | Email de l'utilisateur (identique dans les 2 apps) |
| `placeName` | string | ✅ | Nom exact du restaurant/café |
| `zone` | string | ✅ | Zone/ville du lieu |
| `visitDate` | string (ISO) | ✅ | Date et heure de la visite |
| `source` | string | ✅ | Toujours "momenty" |

### 4. Comportement Attendu

1. **Valider** que la requête contient tous les champs requis
2. **Vérifier** que `source === "momenty"` (et optionnellement la clé API)
3. **Chercher l'utilisateur** dans Firestore par `userEmail`
4. **Ajouter la visite** dans le log de visites de l'utilisateur (même format que les visites internes Kol Youm)
5. **Retourner** une réponse de succès ou d'erreur

### 5. Réponses Attendues

**Succès (200)** :
```json
{
  "success": true,
  "message": "Visite enregistrée",
  "visitId": "abc123xyz"
}
```

**Utilisateur non trouvé (404)** :
```json
{
  "success": false,
  "error": "Utilisateur non trouvé"
}
```

**Données manquantes (400)** :
```json
{
  "success": false,
  "error": "Champs requis manquants: placeName, zone"
}
```

**Clé API invalide (401)** - si implémentée :
```json
{
  "success": false,
  "error": "Clé API invalide"
}
```

### 6. Exemple de Code (Next.js API Route)

```typescript
// src/app/api/external-visit/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase'; // Votre config Firestore
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

const API_KEY = process.env.MOMENTY_API_KEY; // Optionnel

export async function POST(request: Request) {
  try {
    // 1. Vérifier la clé API (optionnel)
    const apiKey = request.headers.get('X-API-Key');
    if (API_KEY && apiKey !== API_KEY) {
      return NextResponse.json({ success: false, error: 'Clé API invalide' }, { status: 401 });
    }

    // 2. Parser le body
    const body = await request.json();
    const { userEmail, placeName, zone, visitDate, source } = body;

    // 3. Valider les champs
    if (!userEmail || !placeName || !zone || !visitDate || source !== 'momenty') {
      return NextResponse.json({ success: false, error: 'Champs requis manquants ou source invalide' }, { status: 400 });
    }

    // 4. Chercher l'utilisateur par email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', userEmail));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ success: false, error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;

    // 5. Ajouter la visite (adapter selon votre structure de données)
    const visitsRef = collection(db, 'users', userId, 'visits'); // ou votre collection
    const visitDoc = await addDoc(visitsRef, {
      placeName,
      zone,
      visitDate: new Date(visitDate),
      source: 'momenty',
      createdAt: serverTimestamp(),
    });

    // 6. Retourner le succès
    return NextResponse.json({
      success: true,
      message: 'Visite enregistrée',
      visitId: visitDoc.id,
    });

  } catch (error) {
    console.error('[External Visit API] Error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
```

---

## Questions à Clarifier

1. **Structure des visites** : Comment sont stockées les visites actuellement dans Kol Youm ? (collection, champs, etc.)
2. **Même Firebase ?** : Momenty et Kol Youm utilisent-ils le même projet Firebase ?
3. **Identification** : L'email est-il le bon identifiant commun entre les apps ?
4. **Clé API** : Voulez-vous une protection par clé API partagée ?

---

## Étapes Suivantes

1. **Kol Youm** : Implémenter l'endpoint `/api/external-visit`
2. **Kol Youm** : Tester avec Postman/curl
3. **Momenty** : Une fois l'API prête, intégrer l'appel après publication d'un plat
4. **Partager** : Si clé API utilisée, la partager de manière sécurisée
