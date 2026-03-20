# Design System Strategy: The Kinetic Broadcast

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Kinetic Broadcast."** 

Unlike static corporate interfaces, this system mimics the high-stakes, high-energy atmosphere of a live premium sports broadcast. It moves away from "flat" design into a world of layered depth, where information feels projected onto glass surfaces rather than printed on a page. We break the traditional grid through **Intentional Asymmetry**: using large-scale display type that bleeds off-canvas and staggered container heights to create a sense of forward motion. The interface shouldn't just sit there; it should feel like it’s vibrating with live data.

## 2. Colors & Surface Architecture
The palette is built on high-contrast functionality. We use deep, "void" blacks and navies to make the functional 'Stadium Red' and 'Action Green' pop with emergency-level clarity.

### The "No-Line" Rule
Traditional 1px solid borders are strictly prohibited for sectioning. Boundaries must be defined through **Tonal Transitions**. To separate a sidebar from a main feed, transition from `surface` (#131313) to `surface-container-low` (#1C1B1B). This creates a sophisticated, seamless environment that feels like a single engineered piece of hardware.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of semi-translucent materials:
*   **Base Layer:** `surface-container-lowest` (#0E0E0E) for the deepest background areas.
*   **Content Track:** `surface` (#131313) for the primary interaction zone.
*   **Feature Cards:** `surface-container-high` (#2A2A2A) to bring specific data points closer to the user.

### The "Glass & Gradient" Rule
To achieve the "Premium Broadcast" feel, floating elements (Modals, Hover Cards, Navigation Bars) must utilize **Glassmorphism**. 
*   **Fill:** Use a semi-transparent `surface-container` with a `backdrop-blur` of 12px to 20px.
*   **Soul Gradients:** Primary CTAs should never be flat. Apply a subtle linear gradient from `primary` (#FFB4AA) to `primary_container` (#CC1616) at a 45-degree angle to simulate stadium lighting.

## 3. Typography: The Athletic Editorial
The typography system uses **Lexend** to bridge the gap between technical legibility and "Bebas-style" athletic aggression.

*   **Display & Headline:** Used for scores, headers, and callouts. These should be set in Bold or ExtraBold. Use `display-lg` (3.5rem) for hero moments, often with tight letter-spacing (-0.02em) to mimic sports jersey numbering.
*   **Titles:** `title-lg` (1.375rem) serves as the anchor for content cards. 
*   **Body & Labels:** `body-md` (0.875rem) is the workhorse. Labels (`label-sm`) must always be in High-Contrast `on-surface` (#E5E2E1) or `primary` to ensure readability against dark backgrounds.

The hierarchy is "Top-Heavy," meaning we prioritize massive headlines and tiny, precise labels, skipping the middle ground to create a more dramatic, editorial look.

## 4. Elevation & Depth
We eschew traditional drop shadows in favor of **Tonal Layering** and **Atmospheric Perspective**.

*   **The Layering Principle:** Depth is achieved by stacking. A `surface-container-highest` card placed on a `surface` background provides all the "lift" required.
*   **Ambient Shadows:** For high-priority floating elements (like a "Live" scoreboard), use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(0,0,0,0.4)`.
*   **The "Ghost Border" Fallback:** If a container requires a boundary (e.g., inside a crowded data list), use a **Ghost Border**: `outline-variant` (#5D3F3C) at 10% opacity. This creates a "razor-thin" etched glass look.
*   **Light Edges:** Use a top-aligned `1px` inner-stroke of `rgba(255,255,255,0.1)` on glass components to simulate a "specular highlight" on the edge of a glass pane.

## 5. Components

### Buttons
*   **Primary:** Gradient fill (`primary` to `primary-container`), `md` (0.375rem) corner radius. Typography: `label-md` Bold, All-Caps.
*   **Secondary:** Ghost style. Transparent fill, Ghost Border (10% opacity), white text.
*   **Action Green:** Specifically for "Live" or "Success" states using `secondary_container` (#1FA64A).

### Input Fields
*   **State:** Use `surface-container-lowest` for the field background to create an "inset" feel.
*   **Focus:** Transition the Ghost Border to 40% opacity `primary`. No heavy glow effects.

### Cards & Lists
*   **Rule:** **No Divider Lines.** Use `spacing-6` (1.3rem) of vertical whitespace to separate list items, or alternating background tints between `surface-container-low` and `surface-container-lowest`.
*   **Layout:** Use asymmetrical padding (e.g., more padding on the left than the right) for headline cards to create a "motion" effect.

### Glass Tags (Badges)
*   Used for "LIVE," "FINAL," or "HALFTIME."
*   **Style:** `backdrop-blur`, 1px `rgba(255,255,255,0.1)` border, and `label-sm` bold text.

## 6. Do’s and Don’ts

### Do
*   **Do** use extreme scale. Make headlines huge and data labels tiny but sharp.
*   **Do** use `Action Green` (#3EBD5E) sparingly for "Success" or "Live" indicators only.
*   **Do** lean into the dark. Use `#050505` for the deepest backgrounds to create infinite contrast.
*   **Do** use the Spacing Scale (especially `8`, `12`, and `16`) to create "breathing room" that feels intentional and premium.

### Don’t
*   **Don’t** use 100% opaque white borders. They break the "broadcast glass" illusion.
*   **Don’t** use standard "Material Design" blue for links. Stick to the `Stadium Red` or `Action Green` functional accents.
*   **Don’t** use rounded corners larger than `xl` (0.75rem) for main containers. Keep the "Athletic" edge sharp.
*   **Don’t** crowd the layout. If a screen feels full, increase the spacing tokens rather than adding dividers.