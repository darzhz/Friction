import { UPIPayload } from './upiParser';

export type UPIApp = 'gpay' | 'phonepe' | 'paytm' | 'default';

const PACKAGE_MAP: Record<UPIApp, string> = {
  gpay:    'tez://upi/pay',
  phonepe: 'phonepe://pay',
  paytm:   'paytmmp://pay',
  default: 'upi://pay',
};

/**
 * Builds a deep link for a specific UPI app.
 * If 'default' is selected, it returns the standard 'upi://pay' link.
 */
export function buildRedirectLink(
  payload: UPIPayload,
  preferredApp: UPIApp = 'default'
): string {
  // Use the standard upi:// scheme for default
  if (preferredApp === 'default') {
    // If original raw was already a full upi link, use it, else build one
    if (payload.raw.startsWith('upi://')) return payload.raw;
    
    // Construct search params from payload
    const params = new URLSearchParams();
    params.set('pa', payload.pa);
    params.set('pn', payload.pn);
    if (payload.am > 0) params.set('am', payload.am.toString());
    params.set('cu', payload.cu);
    if (payload.tn) params.set('tn', payload.tn);
    if (payload.mc) params.set('mc', payload.mc);
    
    return `upi://pay?${params.toString()}`;
  }

  // For specific apps, swap the scheme
  const scheme = PACKAGE_MAP[preferredApp];
  const params = new URLSearchParams();
  params.set('pa', payload.pa);
  params.set('pn', payload.pn);
  if (payload.am > 0) params.set('am', payload.am.toString());
  params.set('cu', payload.cu);
  if (payload.tn) params.set('tn', payload.tn);
  if (payload.mc) params.set('mc', payload.mc);

  return `${scheme}?${params.toString()}`;
}

export function performRedirect(link: string): void {
  window.location.href = link;
}
