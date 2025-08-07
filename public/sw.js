self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      // Pour l'instant, nous ne faisons rien en cas d'échec de la récupération.
      // Une stratégie de cache plus complexe serait nécessaire pour un vrai support hors ligne.
      // Cela dépasse la portée de cette simple configuration PWA.
    })
  );
});
