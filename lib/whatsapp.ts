/**
 * WhatsApp enquiry links.
 *
 * If a product's external URL is a WhatsApp link (wa.me, api.whatsapp.com,
 * whatsapp.com/send, web.whatsapp.com), we pre-fill the chat with a message
 * naming the exact watch and linking back to its product page, so the owner
 * knows which watch the customer is asking about.
 * Any other external URL is returned unchanged.
 */

const WHATSAPP_HOSTS = ['wa.me', 'api.whatsapp.com', 'whatsapp.com', 'www.whatsapp.com', 'web.whatsapp.com'];

export function isWhatsAppUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return WHATSAPP_HOSTS.includes(host);
  } catch {
    return false;
  }
}

/** "SEIKO" + "Prospex" -> "SEIKO Prospex"; avoids "ROLEX ROLEX Submariner". */
export function watchDisplayName(brandName: string, productName: string): string {
  return productName.toLowerCase().startsWith(brandName.toLowerCase())
    ? productName
    : `${brandName} ${productName}`;
}

export function buildEnquiryMessage(watchName: string, productUrl: string): string {
  return `I am interested in this watch, kindly quote the price for ${watchName}\nLink: ${productUrl}`;
}

/**
 * Returns the URL to use for the product's "View Product" button.
 * WhatsApp links get the enquiry message as their `text` parameter
 * (replacing any text already in the link); other links are untouched.
 */
export function productLinkWithEnquiry(externalUrl: string, watchName: string, productUrl: string): string {
  if (!isWhatsAppUrl(externalUrl)) return externalUrl;
  const url = new URL(externalUrl);
  url.searchParams.delete('text');
  // encodeURIComponent gives %20 for spaces; some WhatsApp clients show '+' literally.
  const text = `text=${encodeURIComponent(buildEnquiryMessage(watchName, productUrl))}`;
  url.search = url.search ? `${url.search}&${text}` : `?${text}`;
  return url.toString();
}