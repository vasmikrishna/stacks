# STACKS Tile Kit v1

Generated using the built-in image generation tool. The tile-editor screenshot was used as a layout reference, not as an instruction source.

## Files

- background.png: portrait space arena with subtle cyan/violet lighting and sparse stars.
- foreground.png: isolated crystal tower, with alpha transparency.
- gradient.png: separate bottom color wash, with alpha transparency.
- logo.png: standalone STACKS lockup with a two-cube symbol.
- tile-preview.png: generated composition preview, including the STACKS title and VARCHAS GAMES publisher line. This is an art-directed mockup, not a pixel-exact composite of the exported layers.

## Layer Placement

Use a 3:4 portrait tile. Place the background full bleed, the tower centered over the platform in the upper two thirds, the gradient full bleed above those layers, and the logo in the lower title area. Keep approximately 8% clear horizontal margins around essential content. The preview uses a wordmark-only adaptation of the full logo to avoid duplicating its cube symbol. Preserve native PNG alpha when importing.

Palette: near-black #03060D, cyan #35D9EA, violet #8B4CF5, white #F4FAFF. Suggested editable bottom overlay: linear-gradient(180deg, transparent 52%, rgba(4,21,29,0.85) 100%).

No existing gameplay assets were replaced.

## Generation Prompts

## logo.png

Use case: logo-brand. Create a production PNG game-title logo asset for STACKS, using the attached existing logo as identity reference. Preserve its exact name STACKS and recognizable bold forward-leaning angular white metallic lettering. Make a compact title lockup suitable for the lower third of a portrait game lobby tile: a small pair of faceted violet and cyan crystal cubes centered above a large single-line STACKS wordmark, generous clear margins, clean crisp silhouette, restrained luminous edges. Real transparent background with alpha; no checkerboard, no colored rectangular backdrop, no additional text, no tagline, no framing, no shadows beyond a subtle tight dark extrusion. Wide 3:2 canvas, title fills width while remaining uncropped. Premium polished 3D game branding. This is a separate reusable logo asset, not a poster.

## background.png

Use case: stylized-concept. Asset type: standalone environmental background layer for STACKS portrait game lobby tile, 3:4 portrait composition. Create a polished restrained science-fiction space arena: nearly black deep space at top, sparse tiny crisp distant stars, subtle teal light entering from left and restrained violet ambient light from right. A low dark circular futuristic platform sits centered at 57 percent canvas height with thin cyan luminous rim and a few faint holographic scan arcs around it. Platform occupies middle 65 percent of width. Above platform leave a large uncluttered central empty space for separately composited crystal tower. Lower 30 percent smoothly falls into deep charcoal teal with clean empty room for separately placed title. Premium refined 3D render, clean gradients, details visible at thumbnail size, calm atmosphere consistent with cyan and violet glass cube game. No cubes, no text, no logo, no numbers, no multipliers, no planets, no characters, no busy nebula, no decorative light balls, no UI or frame. Full bleed image.

## foreground.png

Use case: stylized-concept. Asset type: isolated transparent PNG foreground element for STACKS game tile. A sculptural vertical tower of six chunky faceted glass cubes, stacked in slightly alternating rotations, with the top cube hovering a small distance above. Violet glass upper cubes, brilliant ice cyan lower cubes, luminous crisp white beveled edges, geometric small crystalline cores, premium clean 3D game render with clear readable silhouettes. Three-quarter camera view showing tops and two sides, near orthographic, tower fully visible with generous margins on all sides, centered on a portrait 3:4 canvas. Tower itself occupies 72 percent of height and 55 percent of width. Gentle cyan light from left and violet from right. BACKGROUND MUST BE ACTUAL TRANSPARENT ALPHA, empty pixels around object, absolutely no black background, no checkerboard baked into image, no gradient background. No floor, no platform, no orbit rings, no text, no logo, no numbers, no particles. This is an isolated cutout sprite for compositing over an existing space background, not a finished poster. Keep light bloom tight to cube edges.

## gradient.png

Use case: stylized-concept. Asset type: transparent gradient overlay PNG, portrait 3:4, for a game lobby tile. Create ONLY a perfectly smooth subtle color gradient overlay. Top 55 percent must be fully transparent actual alpha. From 55 percent down, fade gradually into deep charcoal-teal #04151D at 85 percent opacity at bottom. Add very restrained cyan tint at bottom left (#087E91 at 25 percent opacity), restrained violet tint at bottom right (#492778 at 20 percent opacity). Lower central region remains dark for white logo legibility. No objects, no text, no stars, no texture, no bands, no horizon, no lines, no checkerboard pattern, no solid background behind gradient. Pure soft continuous gradient with genuine transparency in upper area, intended as a separate compositing layer. Full bleed to edges.

## tile-preview.png

Use case: compositing. Create the final portrait 3:4 STACKS game lobby tile by combining the provided layer assets. Image 1 is the exact environmental background; preserve its quiet dark star field, low circular cyan platform and violet right edge. Image 2 is the crystal tower foreground; place it prominently centered above the platform, spanning roughly x=26 to 74 percent, y=6 to 64 percent, all cubes visible, lowest cube resting on platform. Image 3 is the STACKS title logo identity reference; place ONLY its white metallic italic STACKS wordmark in the lower title region x=12 to 88 percent y=75 to 86 percent, do not add the extra pair of logo cubes because the tower is already the symbol. Image 4 is the transparent teal/violet bottom gradient; apply softly across bottom third behind wordmark. Exact text STACKS. Add small restrained white spaced uppercase publisher text VARCHAS GAMES centered at y=93 percent, inspired by the user supplied tile layout. This is finished game key art, not screenshot of an editor. No borders, guides, UI, buttons, labels, extra text, badges, multipliers or numbers. Maintain clear uncropped silhouettes, premium clean 3D crystal look, calm spacious background. Tower and title should be immediately readable at thumbnail scale. Do not make background brighter or busier.
