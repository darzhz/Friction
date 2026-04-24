export interface UPIPayload {
  pa: string;   // Payee VPA (e.g. merchant@okaxis)
  pn: string;   // Payee name
  am: number;   // Amount in INR
  cu: string;   // Currency (always INR)
  tn?: string;  // Transaction note
  mc?: string;  // Merchant category code
  raw: string;  // Original link for redirect
}

/**
 * Parses a UPI URI or raw QR string into a UPIPayload object.
 * Format: upi://pay?pa=...&pn=...&am=...&cu=INR
 */
export function parseUPILink(raw: string): UPIPayload | null {
  try {
    let queryString = '';
    
    if (raw.toLowerCase().startsWith('upi://')) {
      const url = new URL(raw);
      queryString = url.search;
    } else if (raw.toLowerCase().includes('pa=')) {
      queryString = raw.includes('?') ? raw.split('?')[1] : raw;
    } else {
      queryString = raw;
    }

    const params = new URLSearchParams(queryString);
    
    // Helper to get param case-insensitively
    const getParam = (key: string) => {
      const lowerKey = key.toLowerCase();
      for (const [k, v] of params.entries()) {
        if (k.toLowerCase() === lowerKey) return v;
      }
      return null;
    };

    const pa = getParam('pa');
    
    // Handle generic upi://pay with no params
    if (!pa) {
      const lowerRaw = raw.toLowerCase();
      if (lowerRaw === 'upi://pay' || lowerRaw === 'upi://pay/') {
        return {
          pa: '',
          pn: 'Manual Entry',
          am: 0,
          cu: 'INR',
          raw: 'upi://pay'
        };
      }
      return null;
    }

    const amStr = getParam('am');
    const am = amStr ? parseFloat(amStr) : 0;

    return {
      pa,
      pn: getParam('pn') ?? 'Unknown',
      am: isNaN(am) ? 0 : am,
      cu: getParam('cu') ?? 'INR',
      tn: getParam('tn') ?? undefined,
      mc: getParam('mc') ?? undefined,
      raw,
    };
  } catch (error) {
    console.error('Failed to parse UPI link:', error);
    return null;
  }
}
