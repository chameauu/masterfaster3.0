# Homepage Disabled

**Date:** 2026-04-09  
**Reason:** Focusing on voice assistant feature for visually impaired users

---

## What Was Changed

The homepage (`app/(home)/page.tsx`) has been modified to immediately redirect users:
- **Authenticated users** → `/dashboard`
- **Unauthenticated users** → `/login`

This effectively disables the marketing homepage without deleting any files.

---

## Files Preserved (Not Deleted)

All homepage components are preserved in case they're needed later:

### Components (`components/homepage/`)
- `cta.tsx` - Call to action section
- `features-bento-grid.tsx` - Features grid
- `features-card.tsx` - Feature cards
- `footer-new.tsx` - Footer
- `github-stars-badge.tsx` - GitHub badge
- `hero-section.tsx` - Hero section
- `integrations.tsx` - Integrations showcase
- `navbar.tsx` - Navigation bar
- `use-cases-grid.tsx` - Use cases
- `why-surfsense.tsx` - Why SurfSense section

### Routes (`app/(home)/`)
- `page.tsx` - Homepage (modified to redirect)
- `layout.tsx` - Homepage layout
- `announcements/` - Announcements page
- `changelog/` - Changelog page
- `contact/` - Contact page
- `pricing/` - Pricing page
- `privacy/` - Privacy policy
- `terms/` - Terms of service

**Note:** Login and register pages are still active and functional.

---

## How to Re-enable Homepage

If you need to restore the homepage later:

1. **Restore `app/(home)/page.tsx`:**
   ```bash
   git checkout app/(home)/page.tsx
   ```

2. **Or manually restore the imports:**
   ```typescript
   import dynamic from "next/dynamic";
   import { HeroSection } from "@/components/homepage/hero-section";
   
   const WhySurfSense = dynamic(
     () => import("@/components/homepage/why-surfsense").then((m) => ({ default: m.WhySurfSense })),
     { ssr: false }
   );
   // ... restore other imports
   ```

3. **Restore the JSX:**
   ```tsx
   return (
     <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 text-gray-900 dark:from-black dark:to-gray-900 dark:text-white">
       <HeroSection />
       <WhySurfSense />
       <FeaturesCards />
       <FeaturesBentoGrid />
       <ExternalIntegrations />
       <CTAHomepage />
     </main>
   );
   ```

---

## Benefits of This Approach

✅ **No files deleted** - Easy to restore if needed  
✅ **Clean user experience** - No confusion with marketing content  
✅ **Faster development** - Focus on voice assistant feature  
✅ **Git history preserved** - Can see what was there before  
✅ **Simple rollback** - Just restore one file  

---

## Current User Flow

```
User visits / (root)
    │
    ├─ Authenticated? 
    │   ├─ Yes → Redirect to /dashboard
    │   └─ No  → Redirect to /login
    │
User logs in at /login
    │
    └─ Redirect to /dashboard
```

---

## Related Documentation

- [Voice Assistant Implementation Roadmap](./VOICE_ASSISTANT_IMPLEMENTATION_ROADMAP.md)
- [Frontend Components Spec](./frontend/FRONTEND_COMPONENTS_SPEC.md)
- [Existing Frontend Components](./EXISTING_FRONTEND_COMPONENTS.md)

---

**This change allows the team to focus entirely on building the voice assistant feature without the distraction of marketing pages.**
