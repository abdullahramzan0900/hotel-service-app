import Customer from '../models/Customer.js';
import { upsertMailchimpContact } from './mailchimp.js';

// Called after every guest submission (room service, issue, food order).
// Deduplicates by email: creates a new Customer record the first time this
// email is seen, or updates the existing one (name/phone refreshed, visit
// count incremented, lastSeen bumped) on every subsequent submission.
// Also pushes the contact to Mailchimp in the background - failures here
// are recorded on the customer record but never block the guest's request.
export async function upsertCustomer({ name, email, phone }) {
  const lowerEmail = email.toLowerCase().trim();

  const customer = await Customer.findOneAndUpdate(
    { email: lowerEmail },
    {
      $set: { name, phone, lastSeen: new Date() },
      $inc: { totalRequests: 1 },
      $setOnInsert: { firstSeen: new Date() }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Fire-and-forget: don't make the guest wait on Mailchimp's API
  upsertMailchimpContact({ name, email: lowerEmail, phone })
    .then(async () => {
      customer.mailchimpStatus = 'synced';
      customer.mailchimpSyncedAt = new Date();
      customer.mailchimpError = '';
      await customer.save();
    })
    .catch(async (err) => {
      customer.mailchimpStatus = 'failed';
      customer.mailchimpError = err.message;
      await customer.save();
      console.error('Mailchimp sync failed for', lowerEmail, ':', err.message);
    });

  return customer;
}