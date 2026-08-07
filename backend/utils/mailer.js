import nodemailer from 'nodemailer';

let transporter = null;

// let transporter

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  return transporter;
}

export async function sendOrderApprovedEmail(order) {
  try {
    const itemsList = order.items.map((i) => `${i.quantity} x ${i.name} - £${(i.price * i.quantity).toFixed(2)}`).join('\n');
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM,
      to: order.guestEmail,
      subject: `Your order for Room ${order.roomNumber} has been approved`,
      text: `Hi ${order.guestName},\n\nGreat news - your food order has been approved and is being prepared.\n\n${itemsList}\n\nTotal: £${order.totalPrice.toFixed(2)} (added to your room bill)\n\nThank you,\nGrand Sapphire Hotel Team`
    });
  } catch (err) {
    console.error('Failed to send approval email:', err.message);
  }
}

export async function sendOrderRejectedEmail(order, reason) {
  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM,
      to: order.guestEmail,
      subject: `Update on your order for Room ${order.roomNumber}`,
      text: `Hi ${order.guestName},\n\nUnfortunately we are unable to fulfil your order right now${reason ? `: ${reason}` : '.'}\n\nPlease feel free to place a new order or contact reception for assistance.\n\nThank you,\nGrand Sapphire Hotel Team`
    });
  } catch (err) {
    console.error('Failed to send rejection email:', err.message);
  }
}

// Sent the moment a guest submits a food order - it's not confirmed yet, just received
export async function sendOrderReceivedEmail(order) {
  try {
    const itemsList = order.items.map((i) => `${i.quantity} x ${i.name} - £${(i.price * i.quantity).toFixed(2)}`).join('\n');
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM,
      to: order.guestEmail,
      subject: `We've received your order for Room ${order.roomNumber}`,
      text: `Hi ${order.guestName},\n\nThanks - we've received your order and it's now pending approval from our kitchen team.\n\n${itemsList}\n\nTotal: £${order.totalPrice.toFixed(2)}\n\nWe'll send you another email at this address (${order.guestEmail}) confirming approval as soon as our kitchen team accepts it and starts preparing it - at that point the total will be added to your room bill. No payment is needed now.\n\nThank you,\nGrand Sapphire Hotel Team`
    });
  } catch (err) {
    console.error('Failed to send order-received email:', err.message);
  }
}

// Sent the moment a guest submits a room service request
export async function sendRoomServiceReceivedEmail(request) {
  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM,
      to: request.guestEmail,
      subject: `We've received your room service request - Room ${request.roomNumber}`,
      text: `Hi ${request.guestName},\n\nThanks - we've received your request and our team has been notified${request.priority === 'urgent' ? ' as urgent' : ''}.\n\nYour request: "${request.message}"\n\nWe'll get this sorted for you as soon as possible. You can check with reception any time if you need an update.\n\nThank you,\nGrand Sapphire Hotel Team`
    });
  } catch (err) {
    console.error('Failed to send room-service-received email:', err.message);
  }
}

// Sent the moment a guest reports an issue
export async function sendIssueReceivedEmail(request) {
  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM,
      to: request.guestEmail,
      subject: `We've received your report - Room ${request.roomNumber}`,
      text: `Hi ${request.guestName},\n\nThanks for letting us know - our team has been notified${request.priority === 'urgent' ? ' as urgent' : ''}.\n\nWhat you reported: "${request.message}"\n\nWe'll look into this as soon as possible. You can check with reception any time if you need an update.\n\nThank you,\nGrand Sapphire Hotel Team`
    });
  } catch (err) {
    console.error('Failed to send issue-received email:', err.message);
  }
}
