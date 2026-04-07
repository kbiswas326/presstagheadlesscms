async function main() {
  const tenant = process.argv[2] || 'sportzpoint';
  const origin = process.argv[3] || 'http://localhost:5001';
  const res = await fetch(`${origin}/api/layout-config`, { headers: { 'x-tenant-id': tenant } });
  const data = await res.json().catch(() => null);
  const widgets = data?.sidebar?.widgets || [];
  const socialWidget = Array.isArray(widgets)
    ? widgets.find((w) => w?.type === 'social_links' || w?.type === 'social')
    : null;
  const keys = data && typeof data === 'object' ? Object.keys(data).sort() : [];
  console.log(JSON.stringify({
    status: res.status,
    hasSocialLinks: !!(data && Object.prototype.hasOwnProperty.call(data, 'socialLinks')),
    socialLinks: data?.socialLinks,
    socialWidget: socialWidget || null,
    keys,
  }, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
