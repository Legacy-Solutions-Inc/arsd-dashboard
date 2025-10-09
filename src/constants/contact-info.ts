// =====================================================
// ARSD Construction Contact Information
// =====================================================
// Centralized contact information for easy maintenance
// Update these values here and they will reflect across the entire website
// =====================================================

export const CONTACT_INFO = {
  // Company Information
  company: {
    name: 'ARSD Construction Corporation',
    tagline: 'In God We Trust',
    establishedYear: 1998,
  },

  // Email Address
  email: {
    primary: 'arsd_iloilo@yahoo.com',
    display: 'arsd_iloilo@yahoo.com',
  },

  // Phone Numbers
  phone: {
    landline: '+63 33 123 4567',
    mobile1: '+63 917 123 4567',
    mobile2: '+63 918 123 4567', // Optional second mobile
    landlineFormatted: '(033) 123-4567',
  },

  // Physical Address
  address: {
    street: 'Figueroa St. Bonifacio',
    city: 'Arevalo, Iloilo City',
    province: 'Iloilo',
    country: 'Philippines',
    postalCode: '5000',
    full: 'Figueroa St. Bonifacio, Arevalo, Iloilo City, Philippines 5000',
    short: 'Iloilo City', // For mobile display
  },

  // Business Hours
  businessHours: {
    weekdays: 'Monday - Friday: 8:00 AM - 5:00 PM',
    saturday: 'Saturday: 8:00 AM - 12:00 PM',
    sunday: 'Sunday: Closed',
  },

  // Social Media
  social: {
    facebook: {
      url: 'https://www.facebook.com/ARSDConCorp',
      handle: 'ARSDConCorp',
    },
  },

  // Google Maps
  maps: {
    embedUrl: 'https://www.google.com/maps?q=Figueroa%20St.%20Bonifacio%2C%20Arevalo%2C%20Iloilo%20City&output=embed',
  },

  // Response Times
  responseTime: '24 hours',
} as const;

// Helper function to get mailto link
export const getMailtoLink = (subject?: string, body?: string) => {
  let link = `mailto:${CONTACT_INFO.email.primary}`;
  const params = [];
  
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  
  if (params.length > 0) {
    link += `?${params.join('&')}`;
  }
  
  return link;
};

// Helper function to format phone number for display
export const formatPhoneDisplay = (phoneNumber: string) => {
  return phoneNumber;
};

