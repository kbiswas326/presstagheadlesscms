self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    try {
      data = { title: 'New update', body: event.data ? event.data.text() : '' };
    } catch {
      data = { title: 'New update', body: '' };
    }
  }

  const title = data.title || 'New update';
  const options = {
    body: data.body || '',
    data: { url: data.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || '/';
  event.waitUntil((async () => {
    const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = allClients.find((c) => c.url && c.url.includes(self.location.origin));
    if (existing) {
      try {
        await existing.focus();
        existing.navigate(url);
        return;
      } catch {}
    }
    await clients.openWindow(url);
  })());
});

