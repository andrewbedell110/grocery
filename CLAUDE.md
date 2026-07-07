# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

MealMap — a mobile-first PWA for household meal planning, recipe storage, and automated grocery shopping via Smith's/Kroger. Hosted on Vercel, backed by Supabase.

## Deploy

```bash
vercel --yes --prod
```

No build step — static files served directly. API routes in `api/` are Vercel serverless functions (Node.js, ESM).

## Architecture

**Single-page vanilla JS app** with no framework or bundler. Pages are `<div class="page">` elements toggled via `.active` class in `js/app.js`. Tailwind CSS is loaded via CDN with inline config in `index.html`.

### Frontend (`index.html` + `js/`)
- `js/app.js` — App shell, navigation (`App.navigate(page)`), form handlers, `Meals`, `RecipesPage`, `Settings` modules
- `js/auth.js` — Supabase auth (signUp/signIn/signOut/getProfile). Profile query must use `households!profiles_household_fk(*)` to disambiguate the two FKs between profiles and households
- `js/recipes.js` — `Recipes` (CRUD, card rendering, category filters), `RecipeModal` (detail sheet), `escapeHtml()` helper
- `js/plan.js` — `Plan` module: 3-step wizard (Discovery → Pantry Check → Grocery Review), progress bar, questionnaire flow, AI recipe rendering
- `js/shopping.js` — `Shopping` module: Kroger product search and cart integration
- `js/supabase.js` — Supabase client init with hardcoded project credentials (anon key is public)

### API Routes (`api/`)
- `ai-recipe.js` — Proxies Claude Haiku API for recipe suggestions (random or questionnaire-based)
- `kroger-search.js` — Searches Kroger Products API for cheapest matching ingredients using client credentials OAuth
- `kroger-cart.js` — Adds items to user's Kroger cart (requires user OAuth token)
- `kroger-locations.js` — Looks up Smith's store locations by zip code

### Database (Supabase)
Schema in `sql/schema.sql`. Key tables: `profiles`, `households`, `recipes`, `recipe_ingredients`, `recipe_categories`, `categories`, `weekly_plans`, `weekly_plan_recipes`, `shopping_list_items`. All tables use RLS. The `handle_new_user` trigger auto-creates profiles on signup and requires `set search_path = public`.

## Design System

Light parchment theme matching wireframes. All UI uses Tailwind utility classes — do NOT add custom CSS for layout/colors.

- **Fonts**: Literata (display/headlines via `font-display`), Plus Jakarta Sans (body via `font-body`)
- **Icons**: Material Symbols Outlined from Google Fonts. Use `icon-filled` class for filled variant
- **Key colors**: `parchment-bg` (#FDFCF0), `kale-deep` (#1B4332), `primary` (#0f5238), `carrot-accent` (#FF7043), `herb-light` (#D8F3DC), `cream-surface` (#FAF9F0)
- **Cards**: `bg-cream-surface rounded-xl p-4 shadow-[0_4px_24px_rgba(45,106,79,0.06)] border border-kale-deep/5`
- **Primary buttons**: `bg-carrot-accent text-white font-semibold text-sm py-3 rounded-full shadow-lg active:scale-95 transition-transform`
- **Category pills**: `bg-herb-light text-primary px-3 py-1 rounded-full text-xs font-bold`

## Environment Variables (Vercel)

- `ANTHROPIC_API_KEY` — Claude API for AI recipe features
- `KROGER_CLIENT_ID` / `KROGER_CLIENT_SECRET` — Kroger API OAuth
- `KROGER_LOCATION_ID` — Smith's store location ID for price lookups

## Gotchas

- The `profiles` table has two FKs to `households` (`household_id` and `owner_id`). Supabase PostgREST queries that join households must specify the FK name: `households!profiles_household_fk(*)`.
- Page visibility is controlled by CSS classes (`.page` hidden, `.page.active` shown) — not routing.
- Wizard step panels use `.wizard-panel` / `.wizard-panel.active` classes.
- The saved-recipes-panel lives inside the `.meal-options` grid and replaces the browse-saved card inline (not as a separate page).
- Service worker caches static assets; bump `CACHE_NAME` in `sw.js` when making breaking changes.
