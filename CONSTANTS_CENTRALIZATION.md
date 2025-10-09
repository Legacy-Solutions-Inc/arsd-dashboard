# 📋 Constants Centralization - Complete Guide

## ✅ Overview

All static data across the ARSD Dashboard website has been centralized into separate constant files for easy maintenance and updates. Now you can update content in one place and it automatically reflects across the entire website.

## 📁 Files Created

### 1. **`src/constants/contact-info.ts`**
**Purpose**: Centralized contact information

**Contains**:
- ✅ Email address: `arsd_iloilo@yahoo.com`
- ✅ Phone numbers (landline and mobile)
- ✅ Physical address
- ✅ Business hours
- ✅ Social media links
- ✅ Google Maps embed URL
- ✅ Company name and tagline

**Used in**:
- `src/app/contact-us/page.tsx`
- `src/components/footer.tsx`
- `src/components/navbar.tsx`

### 2. **`src/constants/services-data.ts`**
**Purpose**: Centralized services information

**Contains**:
- ✅ Main services (5 services with details)
- ✅ Work process steps (4 steps)
- ✅ Equipment overview (3 categories)
- ✅ Service features and descriptions

**Used in**:
- `src/app/our-services/page.tsx`

### 3. **`src/constants/about-us-data.ts`**
**Purpose**: Centralized company information

**Contains**:
- ✅ Company story paragraphs
- ✅ Mission statement
- ✅ Vision statement
- ✅ Achievements/stats
- ✅ Company milestones timeline
- ✅ Certifications and recognitions

**Used in**:
- `src/app/about-us/page.tsx`

### 4. **`src/constants/projects-data.ts`**
**Purpose**: Centralized project information

**Contains**:
- ✅ Project stats (500+, 25+, 100+)
- ✅ Delivery process steps
- ✅ Sample/demo projects (fallback data)
- ✅ Page content (hero, CTA sections)

**Used in**:
- `src/app/projects/page.tsx`

## 🎯 Key Changes

### **Email Updated Globally**
- **Old**: `hr_arsd_iloilo@yahoo.com.ph`
- **New**: `arsd_iloilo@yahoo.com`
- **Updated in**: Contact page, footer, navbar, all mailto links

### **Phone Numbers Centralized**
- Landline: `+63 33 123 4567`
- Mobile 1: `+63 917 123 4567`
- Mobile 2: `+63 918 123 4567` (optional)
- Formatted: `(033) 123-4567`

### **All Content Centralized**
- Services descriptions
- Company story
- Mission & vision statements
- Milestones timeline
- Certifications
- Stats and achievements

## 📋 How to Update Data

### **Update Contact Information**
```typescript
// File: src/constants/contact-info.ts

export const CONTACT_INFO = {
  email: {
    primary: 'your-new-email@example.com',  // Change here
    display: 'your-new-email@example.com',
  },
  phone: {
    landline: '+63 33 XXX XXXX',           // Change here
    mobile1: '+63 9XX XXX XXXX',           // Change here
    // ...
  },
  // ... other fields
}
```

### **Update Services**
```typescript
// File: src/constants/services-data.ts

export const SERVICES_DATA = {
  mainServices: [
    {
      title: "Your Service Name",           // Change here
      description: "Your description",      // Change here
      features: [
        "Feature 1",                        // Change here
        "Feature 2",
      ],
      // ...
    }
  ]
}
```

### **Update Company Story**
```typescript
// File: src/constants/about-us-data.ts

export const ABOUT_US_DATA = {
  story: {
    paragraphs: [
      "First paragraph of your story",     // Change here
      "Second paragraph",                   // Change here
      // ...
    ]
  },
  mission: "Your mission statement",       // Change here
  vision: "Your vision statement",         // Change here
  // ...
}
```

### **Update Projects Data**
```typescript
// File: src/constants/projects-data.ts

export const PROJECTS_DATA = {
  stats: [
    { 
      number: "1000+",                      // Change here
      label: "Projects Completed" 
    },
    // ...
  ],
  sampleProjects: [
    {
      name: "Your Project Name",            // Change here
      location: "Project Location",         // Change here
      // ...
    }
  ]
}
```

## 🔄 Before vs After

### **Before (Scattered Data)**
```typescript
// contact-us/page.tsx
const email = "hr_arsd_iloilo@yahoo.com.ph";

// footer.tsx
const email = "hr_arsd_iloilo@yahoo.com.ph";

// navbar.tsx
const email = "hr_arsd_iloilo@yahoo.com.ph";

// To change email: Update in 3+ files 😓
```

### **After (Centralized Data)**
```typescript
// constants/contact-info.ts
export const CONTACT_INFO = {
  email: { primary: 'arsd_iloilo@yahoo.com' }
}

// All pages import and use:
import { CONTACT_INFO } from '@/constants/contact-info';
const email = CONTACT_INFO.email.primary;

// To change email: Update in 1 file! 🎉
```

## ✅ Benefits

### **1. Easy Maintenance**
- Update data in **one place**
- Changes reflect **automatically** across all pages
- **No need** to search and replace across multiple files

### **2. Consistency**
- **Same source of truth** for all pages
- **No inconsistencies** between pages
- **Prevents errors** from manual updates

### **3. Type Safety**
- **TypeScript** ensures correct usage
- **Autocomplete** in your IDE
- **Compile-time** error checking

### **4. Better Organization**
- **Clear separation** between data and presentation
- **Easy to find** what needs to be updated
- **Cleaner codebase** structure

### **5. Scalability**
- Easy to **add new** fields
- Simple to **remove** outdated data
- **Version control** friendly

## 📊 Complete File Structure

```
src/
├── constants/
│   ├── contact-info.ts          # ✅ Contact information
│   ├── services-data.ts         # ✅ Services content
│   ├── about-us-data.ts         # ✅ Company information
│   ├── projects-data.ts         # ✅ Projects content
│   └── website-projects.ts      # (existing file)
├── app/
│   ├── contact-us/page.tsx      # ✅ Uses CONTACT_INFO
│   ├── our-services/page.tsx    # ✅ Uses SERVICES_DATA
│   ├── about-us/page.tsx        # ✅ Uses ABOUT_US_DATA
│   └── projects/page.tsx        # ✅ Uses PROJECTS_DATA
└── components/
    ├── footer.tsx               # ✅ Uses CONTACT_INFO
    └── navbar.tsx               # ✅ Uses CONTACT_INFO
```

## 🚀 Quick Reference

### **To Update Email**
→ Edit `src/constants/contact-info.ts`

### **To Update Phone Numbers**
→ Edit `src/constants/contact-info.ts`

### **To Update Address**
→ Edit `src/constants/contact-info.ts`

### **To Update Services**
→ Edit `src/constants/services-data.ts`

### **To Update Company Story**
→ Edit `src/constants/about-us-data.ts`

### **To Update Mission/Vision**
→ Edit `src/constants/about-us-data.ts`

### **To Update Certifications**
→ Edit `src/constants/about-us-data.ts`

### **To Update Sample Projects**
→ Edit `src/constants/projects-data.ts`

## 🎯 Example: Changing Email Across Website

**Old Way (3+ files to update)**:
1. Open `contact-us/page.tsx` → Find and replace email
2. Open `footer.tsx` → Find and replace email
3. Open `navbar.tsx` → Find and replace email
4. Risk of missing some instances

**New Way (1 file to update)**:
1. Open `constants/contact-info.ts`
2. Change `primary: 'new-email@example.com'`
3. Done! All pages updated automatically ✅

## 🔒 Important Notes

### **Data Types**
- All constants use TypeScript `as const` for immutability
- This ensures data isn't accidentally modified at runtime
- Provides better type inference and autocomplete

### **Icon Handling**
- Services and process steps use string references for icons
- Icons are mapped to components in the page files
- This allows data to be serializable and easier to manage

### **Fallback Data**
- Sample projects serve as fallback when database is empty
- Can be removed or replaced with actual client data
- Useful for development and testing

## ✨ Summary

All static content across your ARSD Dashboard is now centralized:

- ✅ **Contact info** in one file
- ✅ **Services data** in one file
- ✅ **Company info** in one file
- ✅ **Projects data** in one file

**Result**: Easy to maintain, consistent, and scalable! 🎉

---

**Last Updated**: January 2025  
**Maintainer**: Development Team
