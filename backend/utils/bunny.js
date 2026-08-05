import { v4 as uuidv4 } from 'uuid';

// Uploads a file buffer to Bunny.net Storage and returns the public CDN URL.
// Requires these env vars:
//   BUNNY_STORAGE_ZONE      - your storage zone name (e.g. "grand-sapphire-hotel")
//   BUNNY_STORAGE_API_KEY   - the storage zone's FTP & API password (from Bunny dashboard)
//   BUNNY_STORAGE_REGION    - optional, leave blank for default (Falkenstein), or e.g. "ny", "la", "sg"
//   BUNNY_PULL_ZONE_URL     - your public CDN pull zone URL, e.g. https://grand-sapphire-images.b-cdn.net
export async function uploadImageToBunny(fileBuffer, originalName) {
  const zone = process.env.BUNNY_STORAGE_ZONE;
  const apiKey = process.env.BUNNY_STORAGE_API_KEY;
  const region = process.env.BUNNY_STORAGE_REGION || '';
  const pullZoneUrl = process.env.BUNNY_PULL_ZONE_URL;

  if (!zone || !apiKey || !pullZoneUrl) {
    throw new Error(
      'Bunny.net storage is not configured. Set BUNNY_STORAGE_ZONE, BUNNY_STORAGE_API_KEY, and BUNNY_PULL_ZONE_URL in .env.'
    );
  }

  const hostname = region ? `${region}.storage.bunnycdn.com` : 'storage.bunnycdn.com';
  const ext = (originalName.split('.').pop() || 'jpg').toLowerCase();
  const fileName = `menu-items/${uuidv4()}.${ext}`;
  const uploadUrl = `https://${hostname}/${zone}/${fileName}`;

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      AccessKey: apiKey,
      'Content-Type': 'application/octet-stream'
    },
    body: fileBuffer
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Bunny.net upload failed (${response.status}): ${text}`);
  }

  return `${pullZoneUrl.replace(/\/$/, '')}/${fileName}`;
}

// Deletes an image from Bunny storage given its full public CDN URL (best-effort, ignores failures)
export async function deleteImageFromBunny(publicUrl) {
  try {
    const zone = process.env.BUNNY_STORAGE_ZONE;
    const apiKey = process.env.BUNNY_STORAGE_API_KEY;
    const region = process.env.BUNNY_STORAGE_REGION || '';
    const pullZoneUrl = process.env.BUNNY_PULL_ZONE_URL;
    if (!zone || !apiKey || !pullZoneUrl || !publicUrl.startsWith(pullZoneUrl)) return;

    const hostname = region ? `${region}.storage.bunnycdn.com` : 'storage.bunnycdn.com';
    const path = publicUrl.replace(pullZoneUrl.replace(/\/$/, ''), '');
    await fetch(`https://${hostname}/${zone}${path}`, {
      method: 'DELETE',
      headers: { AccessKey: apiKey }
    });
  } catch (err) {
    console.error('Bunny delete failed (non-fatal):', err.message);
  }
}