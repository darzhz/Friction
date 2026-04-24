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
  const scheme = PACKAGE_MAP[preferredApp] || PACKAGE_MAP.default;
  
  // Extract existing params from raw if it's a UPI URL or contains query params
  let params = new URLSearchParams();
  if (payload.raw.includes('?')) {
    params = new URLSearchParams(payload.raw.split('?')[1]);
  } else if (payload.raw.includes('=') && !payload.raw.startsWith('upi:')) {
    // Handle case where raw is just a query string
    params = new URLSearchParams(payload.raw);
  }

  // Override/Add parameters from the current payload
  if (payload.pa) params.set('pa', payload.pa);
  if (payload.pn) params.set('pn', payload.pn);
  
  if (payload.am > 0) {
    // Format to 2 decimal places as per standard UPI spec preference
    params.set('am', payload.am.toFixed(2));
  } else {
    params.delete('am');
  }
  
  params.set('cu', payload.cu || 'INR');
  
  if (payload.tn) params.set('tn', payload.tn);
  if (payload.mc) params.set('mc', payload.mc);

  return `${scheme}?${params.toString()}`;
}

export function performRedirect(link: string): void {
  window.location.href = link;
}
