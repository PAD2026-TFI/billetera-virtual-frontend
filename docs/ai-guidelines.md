# AI Development Guidelines — Virtual Wallet (padi.)

This document defines the mandatory architecture, design system, libraries, and behavioral rules that every AI coding assistant must strictly follow when operating in this project. It merges the **padi.** identity with modern dark-mode fintech ergonomics inspired by high-end neo-banking apps.

---

## 1. Brand Identity & Design System (padi.)

The project's visual identity unites the **padi.** (*Pagos Al Día*) brand with high-contrast, dark-mode-first fintech interfaces (curved cards, glowing fluid accents, pill buttons, and radial financial indicators).

### A. Wordmark & Visual Identity
- **Logo**: Bold wordmark `padi` with a gold coin dot (`<span className="size-[0.24em] rounded-full bg-[#FFD54A]" />`).
- Canonical component: `Wordmark` (`src/features/auth/AuthLayout.jsx`).
- **Aesthetic Direction**: High-end fintech dark aesthetic (deep OLED midnight-violet backgrounds, gradient hero balance cards, stacked physical/virtual cards, and glowing electric violet accents) seamlessly paired with an accessible, high-contrast light mode.

### B. Color Palette & Dark Mode Architecture

The design system implements a dual-mode palette with OLED depth and warm accents:

| Token / Role | Light Mode | Dark Mode (Primary Fintech Inspiration) |
| :--- | :--- | :--- |
| **App Canvas / Background** | `#EFEBFB` (Soft Lavender) | `#090613` (Deep OLED Midnight-Violet) |
| **Card Surface (Base)** | `#FFFFFF` | `#140F24` (Elevated Midnight Card) |
| **Interactive Surface / Input** | `#F3F1F9` | `#1E1735` (Dark Lilac-Slate) |
| **Hover Surface** | `#E9E5F6` | `#281F45` |
| **Borders & Dividers** | `#ECE9F5` | `#261E3D` / `rgba(255, 255, 255, 0.08)` |
| **Primary Brand Violet** | `#4C1DB8` | `#5B2EE0` (with glow `shadow-[0_0_25px_rgba(91,46,224,0.35)]`) |
| **Primary Brand Hover** | `#3D1499` | `#6C3BF4` |
| **Gold / Coin Accent** | `#FFD54A` | `#FFD54A` / `#FFE664` (Warm Gold for badges & CTAs) |
| **Primary Text (Headings)** | `#1C1633` | `#F4F2FA` (High-contrast Off-White) |
| **Secondary Text (Labels)** | `#4A4560` | `#9D97B5` |
| **Muted / Placeholders** | `#8C87A3` / `#ABA6C2` | `#6B6485` |
| **Semantic Success / Credit** | Emerald (`#10B981` / `bg-emerald-50`) | Emerald Mint (`#34D399` / `bg-emerald-950/40`) |
| **Semantic Warning / Pending** | Amber (`#F59E0B` / `bg-[#FFF4CC]`) | Amber Gold (`#FBBF24` / `bg-amber-950/40`) |
| **Semantic Error / Debit** | Red (`#EF4444` / `bg-red-50`) | Rose Coral (`#F87171` / `bg-rose-950/40`) |

### C. Hero Balance Card (Inspiration Mockup Component)
- **Gradient Mesh Card Style**: A standout card option for the primary balance featuring an iridescent sunrise-to-lavender gradient (`from-[#FFF0C2] via-[#FFE5D3] to-[#E5DBFD]`) with deep purple-black typography (`text-[#120E24]`), pill tag for balance delta (`+10.2%`), and quick-action pills directly below.
- **Stacked Card Visualization**: Virtual card component in deep violet gradient with simulated chip, Mastercard indicator, and monospaced card number.

### D. Geometry & Component Ergonomics
- **Buttons**: Pill-shaped (`rounded-full`), standard height `h-11`, semibold font `text-[15px]`. Action button pairs feature a filled primary pill (Electric Violet or Warm Gold) alongside an outline/ghost pill (e.g., *Deposit* vs. *Withdraw*).
- **Inputs**: Height `h-11`, border radius `rounded-xl`, background `#F3F1F9` in light mode / `#1E1735` in dark mode, borderless, text `#1C1633` / `#F4F2FA`, aligned Lucide icon. Focus ring: `focus-visible:ring-2 focus-visible:ring-[#5B2EE0]/40`.
- **Cards & Sheets**: Border radius `rounded-[24px]` to `rounded-[32px]`. Mobile sheets use `rounded-t-[32px]`.
- **Docked Mobile Navigation**: Fixed bottom navigation bar with blur backdrop (`bg-white/85 dark:bg-[#0E0A1A]/85 backdrop-blur-lg border-t border-[#ECE9F5] dark:border-[#261E3D]`), featuring central circular action trigger and high-contrast Lucide icons.

### E. Typography
- **Brand & UI Typography**: `Poppins` (`font-[Poppins]`) supporting weights 400, 500, 600, and 700 (`@fontsource/poppins`), alongside `Geist Sans` for general body text.
- **Tabular & Financial Data**: Monospace font (`font-mono`) is **mandatory** for currency figures (`$ 1.250.000,00`), transaction identifiers (`payment.id`), timestamps, CUITs, and account numbers (CVU/Alias).

---

## 2. Dark Mode Implementation Rules

Dark mode must be built systematically following these requirements:

1. **Class-Based Dark Mode**: Managed via the `.dark` class on the `<html>` element.
2. **Tailwind v4 CSS Variable Theming**: Map tokens in `src/index.css` under `:root` and `.dark` layers using semantic names (`--background`, `--foreground`, `--card`, `--card-foreground`, `--border`, `--primary`, `--ring`).
3. **No Hardcoded Hex in Components**: Never use raw background colors like `bg-white` without dark mode counter-classes (prefer semantic classes `bg-card dark:bg-[#140F24]` or CSS variable-backed utilities).
4. **Elevation and Depth**:
   - Level 0 (Canvas): `#090613`
   - Level 1 (Card/Container): `#140F24` with thin border `border-[#261E3D]`
   - Level 2 (Interactive Rows/Inputs): `#1E1735`
   - Level 3 (Modals/Popovers): `#231A3D` with `backdrop-blur-md`
5. **Glow Effects**: Utilize subtle radial drop shadows (`shadow-[0_0_30px_rgba(91,46,224,0.25)]`) on primary dark-mode buttons and hero cards to mirror the modern neon look.

---

## 3. Absolute AI Behavioral Rules

1. **Git Safety**: NEVER EXECUTE COMMITS (`git commit`). Commits are strictly handled manually by the user.
2. **No Code Comments**: Comments in source code are strictly prohibited. Code must be clean, readable, declarative, and 100% self-documenting through clear, meaningful naming.
3. **No Emojis**: Never use emojis under any circumstances in UI copy or code. Use icons exclusively from the **Lucide React** library (e.g., `Mail`, `Lock`, `Loader2`, `Eye`, `CheckCircle2`, `ArrowRight`, `ArrowUpRight`, `ArrowDownLeft`, `Bell`, `Settings`).
4. **Strict Scope**: Never do more than what is explicitly requested. Do not invent unrequested screens, features, or dependencies.
5. **Naming Conventions & Language**:
   - **Code in English**: All folders, files, variables, components, interfaces, types, and function names must be in English (e.g., `WalletSummaryCard.jsx`, `useWallet.js`).
   - **UI Copy in Spanish (Argentina)**: All user-facing UI copy, labels, validation messages, error notices, and tooltips must be written in Spanish (Argentina).
6. **UI-First & Mock-Driven Strategy**: Do not call backend network endpoints during the screen-building phase. Every view must interact with simulated in-memory mock services and Zustand until the final integration phase.
7. **Mobile-First Approach**: Always design and code mobile screens first (touch targets >= 44px, bottom navigation or drawer), then progressively enhance for tablet and desktop viewports.

---

## 4. Tech Stack & Mandatory Libraries

- **Framework**: React 19 + Vite 6 + Tailwind CSS (via `@tailwindcss/vite`).
- **Base Components**: `shadcn/ui` primitives inside `@/components/ui/` (`Button`, `Card`, `Input`, `Label`, `Dialog`, `Table`, `Badge`, `Skeleton`).
- **Icons**: `lucide-react`.
- **Routing**: `react-router-dom` with route guards and layout wrappers.
- **Forms & Validation**: `react-hook-form` paired with typed schemas using `zod`.
- **State Management**: `zustand` for session, theme preference (`light` / `dark`), and in-memory mock state.
- **Class Utilities**: `clsx` and `tailwind-merge` unified via `cn(...)` in `lib/utils.js`.

---

## 5. Pre-Delivery Verification Checklist

Before marking any task as complete, verify:
- [ ] Matches the **padi.** aesthetic (Violet `#4C1DB8`/`#5B2EE0`, Dark Canvas `#090613`, Card `#140F24`, Gold `#FFD54A`).
- [ ] Supports both Light and Dark mode seamlessly with full contrast.
- [ ] Pill buttons (`rounded-full`) and rounded inputs (`rounded-xl`).
- [ ] Zero comments in the code.
- [ ] Zero emojis used.
- [ ] User-facing text is in Spanish (Argentina).
- [ ] All code identifiers, files, and folders are in English.
- [ ] Numbers, currency, dates, and account codes use `font-mono`.
- [ ] Designed mobile-first and tested for responsive scaling.
- [ ] No `git commit` commands executed.
