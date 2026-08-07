import crypto from 'crypto';

// Mailchimp's server prefix (e.g. "us21") is embedded at the end of the API key
// itself, after the dash - e.g. "abc123...xyz-us21". We parse it automatically
// so there's no separate env var to configure by hand.
function getServerPrefix(apiKey) {
  const parts = apiKey.split('-');
  return parts[parts.length - 1];
}

// Splits a full name into Mailchimp's separate FNAME/LNAME merge fields.
function splitName(fullName) {
  const trimmed = (fullName || '').trim();
  const spaceIndex = trimmed.indexOf(' ');
  if (spaceIndex === -1) return { firstName: trimmed, lastName: '' };
  return { firstName: trimmed.slice(0, spaceIndex), lastName: trimmed.slice(spaceIndex + 1) };
}

// Upserts a contact in Mailchimp using their built-in "subscriber hash" method
// (MD5 of the lowercased email) - this means submitting the same guest twice
// updates their existing record instead of creating a duplicate.
export async function upsertMailchimpContact({ name, email, phone }) {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;

  if (!apiKey || !audienceId) {
    throw new Error('Mailchimp is not configured. Set MAILCHIMP_API_KEY and MAILCHIMP_AUDIENCE_ID in .env.');
  }

  const serverPrefix = getServerPrefix(apiKey);
  const lowerEmail = email.toLowerCase().trim();
  const subscriberHash = crypto.createHash('md5').update(lowerEmail).digest('hex');
  const { firstName, lastName } = splitName(name);

  const url = `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${audienceId}/members/${subscriberHash}`;

  const response = await fetch(url, {
    method: 'PUT', // PUT = create if missing, update if it already exists
    headers: {
      Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email_address: lowerEmail,
      status_if_new: 'subscribed', // only applies the first time this contact is created
      merge_fields: {
        FNAME: firstName,
        LNAME: lastName,
        PHONE: phone || ''
      }
    })
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.detail || `Mailchimp API error (${response.status})`);
  }

  return response.json();
}