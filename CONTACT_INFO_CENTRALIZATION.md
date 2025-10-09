# 📧 Contact Information Centralization

## ✅ Changes Completed

All contact information across the ARSD Dashboard website has been centralized into a single constants file for easy maintenance and updates.

## 📁 New File Created

### `src/constants/contact-info.ts`

This file now contains **all** contact information for ARSD Construction Corporation:

- ✅ Company name and tagline
- ✅ Email address (updated to `arsd_iloilo@yahoo.com`)
- ✅ Phone numbers (landline and mobile)
- ✅ Physical address
- ✅ Business hours
- ✅ Social media links
- ✅ Google Maps embed URL

## 📝 Files Updated

### 1. **`src/app/contact-us/page.tsx`**
- ✅ Imported `CONTACT_INFO` constants
- ✅ Updated email address to `arsd_iloilo@yahoo.com`
- ✅ Updated all contact information displays
- ✅ Updated mailto link to use new email
- ✅ Updated map embed URL

### 2. **`src/components/footer.tsx`**
- ✅ Imported `CONTACT_INFO` constants
- ✅ Updated company name display
- ✅ Updated email address to `arsd_iloilo@yahoo.com`
- ✅ Updated address display
- ✅ Updated social media links
- ✅ Updated mailto links

### 3. **`src/components/navbar.tsx`**
- ✅ Imported `CONTACT_INFO` constants
- ✅ Updated top bar email to `arsd_iloilo@yahoo.com`
- ✅ Updated address display
- ✅ Updated company name and tagline

## 🎯 Benefits

### **Easy Updates**
Now you can update contact information in **one place** and it automatically updates across the entire website:

```typescript
// Update email in one place:
export const CONTACT_INFO = {
  email: {
    primary: 'your-new-email@example.com',  // Change here
    display: 'your-new-email@example.com',
  },
  // ...
}
```

### **Consistency**
All pages now use the same source of truth for contact information, preventing inconsistencies.

### **Type Safety**
TypeScript ensures you use the correct property names and prevents typos.

## 📋 How to Update Contact Information

### **To Change Email:**
```typescript
// In src/constants/contact-info.ts
email: {
  primary: 'new-email@example.com',
  display: 'new-email@example.com',
},
```

### **To Change Phone Numbers:**
```typescript
// In src/constants/contact-info.ts
phone: {
  landline: '+63 33 XXX XXXX',
  mobile1: '+63 9XX XXX XXXX',
  mobile2: '+63 9XX XXX XXXX',
  landlineFormatted: '(033) XXX-XXXX',
},
```

### **To Change Address:**
```typescript
// In src/constants/contact-info.ts
address: {
  street: 'Your Street',
  city: 'Your City',
  province: 'Your Province',
  country: 'Philippines',
  postalCode: 'XXXX',
  full: 'Full Address String',
  short: 'Short Name', // For mobile display
},
```

### **To Change Business Hours:**
```typescript
// In src/constants/contact-info.ts
businessHours: {
  weekdays: 'Monday - Friday: X:XX AM - X:XX PM',
  saturday: 'Saturday: X:XX AM - X:XX PM',
  sunday: 'Sunday: Closed',
},
```

### **To Change Social Media:**
```typescript
// In src/constants/contact-info.ts
social: {
  facebook: {
    url: 'https://www.facebook.com/YourPage',
    handle: 'YourPage',
  },
},
```

## ✨ Key Changes

### **Email Updated**
- **Old**: `hr_arsd_iloilo@yahoo.com.ph`
- **New**: `arsd_iloilo@yahoo.com`

### **Locations Updated**
1. Contact Us page - All sections
2. Footer - Email display and mailto links
3. Navbar - Top bar contact information
4. Contact form - Form submission mailto

## 🔍 Verification

All changes have been tested and verified:
- ✅ No linter errors
- ✅ TypeScript compilation successful
- ✅ All pages use centralized constants
- ✅ Email links work correctly
- ✅ Consistent display across all pages

## 🚀 Future Updates

When you need to update contact information in the future:

1. **Open** `src/constants/contact-info.ts`
2. **Update** the relevant fields
3. **Save** the file
4. **Done!** Changes reflect across entire website

No need to search and replace across multiple files!

---

**Last Updated**: January 2025  
**Updated Email**: arsd_iloilo@yahoo.com
