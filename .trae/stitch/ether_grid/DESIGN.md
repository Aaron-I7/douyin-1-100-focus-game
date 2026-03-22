# Design System Document: The Tactile Sanctuary

## 1. Overview & Creative North Star
**Creative North Star: The Mindful Monolith**
This design system moves away from the clinical, flat nature of traditional digital games toward a "High-End Editorial" experience. It treats the Schulte Grid not as a digital interface, but as a physical collection of ivory or sage-stone tiles set within a serene, architectural space. 

By leveraging intentional asymmetry, high-contrast typographic scales, and soft neomorphic depth, we create a "Mindful Monolith." The layout avoids the rigid, boxed-in feeling of standard apps by using breathing room (negative space) as a structural element. Elements don't just sit on the screen; they are nested and layered to evoke a sense of calm authority and premium craftsmanship.

---

## 2. Colors
The palette is rooted in soft, organic tones—specifically sage greens (`primary`), muted teals (`secondary`), and warm earths (`tertiary`).

*   **The "No-Line" Rule:** 1px solid borders are strictly prohibited for defining sections. Boundaries must be established through tonal shifts. For instance, the main game board should sit on a `surface-container-low` background, while the individual tiles utilize `surface-container-lowest` or `surface-bright`.
*   **Surface Hierarchy & Nesting:** Use the `surface-container` tiers to create organic depth. 
    *   **Level 0 (Base):** `surface`
    *   **Level 1 (Sections):** `surface-container-low`
    *   **Level 2 (Interactive Elements):** `surface-container-highest`
*   **The "Glass & Gradient" Rule:** Floating UI elements (like a "Pause" menu or "Level Complete" modal) must use glassmorphism: a combination of `surface` at 70% opacity with a `backdrop-blur` of 20px. 
*   **Signature Textures:** For the primary game actions or "Next Number" indicators, apply a subtle linear gradient from `primary` (#426564) to `primary_container` (#c4eae8) at a 135-degree angle to provide a "soulful" luster.

---

## 3. Typography
We utilize **Manrope** across all scales to maintain a modern, geometric clarity that feels editorial rather than "techy."

*   **The Hierarchy of Focus:**
    *   **Current Target:** Use `display-lg` (3.5rem). This is the hero of the screen.
    *   **The Grid Numbers:** Use `headline-lg` (2rem) or `headline-md` (1.75rem). The weight should be medium to ensure the numbers feel like engravings on the tiles.
    *   **Support Stats (Timer/Errors):** Use `label-md` (0.75rem) with an increased letter-spacing of 0.05rem. This provides an "archival" look often seen in high-end watch design or art gallery labels.
*   **Editorial Spacing:** Use `title-lg` for section headers, ensuring they are always left-aligned with a significant `spacing-8` (2.75rem) top margin to create an intentional, asymmetric "white space" block.

---

## 4. Elevation & Depth
Depth in this system is achieved through **Tonal Layering** and neomorphic physics, simulating light hitting physical objects.

*   **The Layering Principle:** Instead of drop shadows, stack surfaces. Place a `surface-container-lowest` tile on a `surface-container-low` grid background to create a soft, natural lift.
*   **Neomorphic Tiles:** To achieve the "physical tile" request, apply dual shadows to grid cells:
    *   **Top-Left:** A 4px blur shadow using `surface-container-lowest` (the "highlight").
    *   **Bottom-Right:** A 6px blur shadow using a 10% opacity version of `on-surface` (the "ambient occlusion").
*   **Ambient Shadows:** For floating modals, use an extra-diffused shadow (Blur: 40px, Spread: -10px) using the `on-surface` token at 5% opacity. This mimics natural sunlight rather than a digital glow.
*   **The "Ghost Border" Fallback:** If a boundary is required for accessibility, use the `outline-variant` token at 15% opacity. Never use 100% opaque lines.

---

## 5. Components

### The Schulte Tile (Primary Component)
*   **Base State:** `surface-container-highest` background, `xl` (1.5rem) roundedness. 3D neomorphic lift as described in Section 4.
*   **Pressed State:** Invert the shadows to create a "sunken" effect. The background shifts slightly to `surface-dim`.
*   **Success (Correct Tap):** The tile illuminates. Transition background to `primary` (#426564) and the text to `on-primary` (#e0fffe). Add a soft outer glow using a 20% opacity `primary` shadow.
*   **Error (Incorrect Tap):** A rapid horizontal "shake" animation (total duration 300ms) with the tile background flashing to `error_container` (#fa746f).

### Buttons
*   **Primary Action:** Rounded `full`. Background: `primary`. Typography: `title-sm` in `on-primary`.
*   **Secondary/Utility:** Rounded `xl`. Background: `secondary_container`. No border.

### Progress & Feedback
*   **The Timeline:** Use a thin track in `surface-variant`. The active progress should be a `primary` fill with a `sm` (0.25rem) roundedness. 
*   **Lists:** For level selection, forbid dividers. Use `spacing-3` (1rem) of vertical white space and a subtle `surface-container-low` background on hover to define the list item.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical layouts. Place the "Target Number" off-center to create a dynamic, editorial feel.
*   **Do** use the `xl` (1.5rem) roundedness for large containers to maintain the "soothing" brand identity.
*   **Do** prioritize typography scale over color for hierarchy. A `display-lg` number in a muted color is more effective than a small number in a bright color.

### Don't
*   **Don't** use pure black (#000000) for shadows. Use tinted versions of `on-surface` or `primary_dim` to keep the palette organic.
*   **Don't** use standard "Material Design" cards with 1px borders. If a card needs to stand out, use a background shift or a "Ghost Border" at 15% opacity.
*   **Don't** use abrupt animations. All transitions (color changes, tile presses) should use a `cubic-bezier(0.34, 1.56, 0.64, 1)` easing for a playful, "springy" premium feel.

---

## 7. Animation Principles
*   **The "Breathe" Effect:** Active elements (like the current target tile) should have a very slow, subtle scale oscillation (1.0 to 1.02) to feel "alive."
*   **Haptic Integration:** Every correct tap should be accompanied by a light haptic "click," and errors should provide a double "thud" to reinforce the physical nature of the design system.