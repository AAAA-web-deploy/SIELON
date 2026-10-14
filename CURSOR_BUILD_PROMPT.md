Build SuperIntelligence Elon ($SIELON) from scratch using this complete kit. The desktop experience must apply the image-based WebGL particle effects of https://quantuminuhub.com/ to our approved fictional Elon/SI story. Deliver the working local site, verify it, and report the result. Do not publish or change hosting.

This replaces the earlier desktop build instructions. Keep the confirmed characters, dialogue, imagery, two desktop pages and existing mobile design. Do not turn the result into a generic token landing page or reproduce Quantum Inu's dog, branding, Solana content or quantum-science story.

1. Files and stack

Use HTML, CSS and vanilla JavaScript. Use the supplied local Three.js 0.186.1 only for the WebGL scene; this requirement supersedes the earlier prohibition on a 3D library. No React, Next.js, router, GSAP, build framework, external CDN, API service, model download or dependency installation is required.

The kit's `site/` contains the approved assets, current mobile/static baseline and configuration. Rebuild the desktop layouts cleanly; the baseline is not the finished redesign. Preserve any actual contract, tokenomics and official URLs from the user's previous project when available.

Use `site/quantum-field.js` and `site/quantum-math.js` as the original SIELON particle-engine starting point. The local library is `site/vendor/three.min.js`, with its MIT license. `site/particle-sources.json` and `design/PORTRAIT_SOURCES.json` supply the approved human portrait crop, transparent SI portrait and mechanical-wrist crop. Do not substitute a rigged 3D head: the reference itself uses image-sampled particles and photographic planes.

Use the exact copy and alt descriptions in `design/APPROVED_STORY_COPY.json`, `design/DESKTOP_SCENE_MAP.json` and the asset manifest. All images are supplied. The reaction-02 notebook has already been corrected; use that file. Do not regenerate images or use placeholders.

Rebuild desktop motion wiring. Retain the legacy token/copy/meme behavior and mobile functionality, but disable old hero-tilt and scene-motion loops wherever the new modules own the same element. Each transform has one owner.

2. Identity and presentation

Name: SuperIntelligence Elon. Ticker: $SIELON. Tagline: “Same face. A future built together.”

Use photorealistic characters, black/deep navy backgrounds, warm amber lighting and restrained cyan-blue accents. Real Elon wears a plain black shirt; SI-Elon has the SI shirt and geometric pendant. Faces are natural and unmarked. His mechanical wrist provides the story reveal.

The opening includes: “An Ethereum meme token inspired by a fictional Elon–SI partnership.” Keep the fiction context near the title and “Fictional story. No affiliation with Elon Musk.” in the footer. Crew/engineer characters and their dialogue are fictional.

Follow the reference's visual depth: large live typography behind/in front of a recognizable portrait sculpture, sparse navigation, a dark spacious stage, actual particles with depth, responsive motion and deliberate transitions. Keep the approved photographic film identity. Glow supplements the composition; it does not replace 3D behavior.

3. Desktop has two real pages

At 768px and above, create `index.html` (Home) and `story.html` (Story), with normal links, direct loading, refresh and Back support. No server rewrite rules or custom client router.

Home is the interactive opening, practical token/community access and entrance to Story. Its Start the Story button goes to `story.html`. Do not repeat the complete narrative below the desktop opening.

The desktop Home opening can use a 260vh scroll container with a sticky stage beneath the header. This is a short visual introduction, not the whole token story. Normalize its scroll progress to 0–1 using the real container/viewport dimensions. Ordinary scrolling remains in control; never capture wheel events or restrict reading time. Keep Start the Story and genuine community/token controls available throughout.

Story begins with “Which Elon is real?” and the complete cinematic photo sequence below. Preserve ordinary vertical scrolling, varied scene widths and short dialogue inside the pictures. Use token/community sections or the token dialog on these two pages, not more routes.

4. Implement the reference's actual particle effects

Use one WebGL scene per active page. A global CSS tilt or glowing border alone does not meet this requirement. The supplied engine implements portrait sampling, shallow 3D relief, pointer springs, split/morph/collapse/pair states and lifecycle methods. Integrate it, visually tune the sampling/framing, and complete the surrounding effects below.

| Effect | SIELON behavior |
|---|---|
| Portrait sculpture | Form a recognizable human Elon from the approved photograph and colored particles. Keep a photographic plane blended into the resting form so his face stays natural and clear. |
| Hold to split | On the focused opening control, pointerdown or Space/Enter separates the human and SI forms into two side branches at different depths. Release, pointercancel, lost capture, blur and Escape return them smoothly. Exactly two principal characters; any faint trails are visual echoes. |
| Pointer waves | Moving across the sculpture repels nearby particles. A damped spring returns them to their source positions. Waves follow local pointer movement, not random whole-photo shaking. |
| Morph | Scroll transforms the portrait samples into the mechanical-wrist samples, with curved particle travel between shapes. Retain the real wrist photograph in the Story page. Do not morph faces into distorted new faces. |
| Collapse/reform | The particles spiral into a small warm focal point, then return as the two recognizable Elons. Holding during this phase briefly resolves the field into the point; release reforms it. This is decoration, never a gate for dialogue. |
| Depth and connection | Add sparse amber/cyan ribbons or shallow elliptical energy lines with real z positions; when the two forms separate, one restrained connecting strand follows them. Keep lines out of eyes and important text. |
| Camera/film transitions | Use a restrained forward transition through the field, then settle back to a stable two-face composition. Story stills use independently raised photo/caption planes and shallow pointer tilt. Avoid spinning photos or endless wobble. |

Home progress: 0–0.22 recognizable portrait/optional split; 0.22–0.49 portrait-to-wrist particle morph; 0.49–0.64 collapse to the focal point; 0.64–0.94 reformation into two Elons; 0.94–1 stable two-face composition, approved tagline and Story entrance. These are visual states, not extra narrative events. Keep the title, fiction context and useful controls readable throughout.

Use a 35-degree perspective camera and the supplied initial z=10 framing. Cap group yaw at about 3.2 degrees and pitch at about 1.6 degrees. Fit the scene to actual viewport aspect ratio so both separated faces stay inside the stage. The supplied engine starts with 18,000 portrait points, caps at 20,000 and device pixel ratio 1.5. Use time-based smoothing around 120ms, bounded spring displacement and deterministic samples.

For focus during collapse, softly reduce/blur peripheral field detail around the pointer while keeping the focal point sharp. Implement a small local render-target shader only if necessary; do not import a postprocessing suite. Preserve natural skin colors, subtle light and clear silhouettes. Do not cover the scene with a heavy blue tint.

Wire the engine's `setProgress`, `move`, `leave`, `setSplit`, `setPaused`, `setReducedMotion` and `destroy` methods. Use passive scroll listeners and requestAnimationFrame. The hold control is a real accessible button with a short hint. It must not intercept navigation, copy-address, social or Story controls. Only prevent Space/Enter scrolling while that control has focus.

`site/field-loader.js` provides the gated integration: a `[data-field-stage]` container, a `[data-particle-host]` child and a `[data-field-hold]` button. Give the optional reveal container `data-field-mode="wrist"`; after opening it, dispatch `sielon:field-open`. Dispatch `sielon:modal` with `detail.open` for token-dialog pause/resume. Keep the fallback photograph in the DOM and hide it only while a functioning field is ready. Size the host and canvas explicitly to the stage; navigation and readable HTML remain separate foreground layers. The canvas is decorative with aria-hidden; retain a readable/screen-reader description of the fictional two-Elon scene independently of shader visibility.

On Story, add one desktop-only Inspect wrist enhancement at the reveal. Lazily initialize a particle field inside its optional detail area, set progress around 0.42 to show wrist particles, and support pointer waves/hold-to-resolve there. Keep the original complete photograph and approved dialogue visible whether the detail is open or closed. Close the detail with its button or Escape. Pause/dispose its renderer when appropriate. Do not initialize another renderer for every still.

5. Mobile is unchanged

Below 768px, retain the baseline header, opening photograph, Start the Story `#story` anchor, ten original story beats, two stacked lookalike crops, typography/spacing, community/token information, downloads and continuous downward scrolling.

The three new reaction scenes, new Home scroll stage, wrist field and all new 3D interactions are desktop-only. Do not initialize or download Three.js on mobile. Preserve the original complete mobile sequence on both Home and direct `story.html`, with the same anchors and controls. No mobile page-switching requirement, automatic redirects, pinned scenes or mandatory touch interactions.

Use CSS-switched desktop/mobile Story links so the mobile anchor works without JavaScript. Scope new desktop composition rules to the appropriate media query. At desktop widths with a coarse pointer, show static portraits/photo stages; do not add mandatory gesture controls.

6. Desktop movie-story composition

Use a maximum 1240px stage, at least 48px horizontal margins at 1024px+, and 28px at 768–1023px. Preserve full image proportions and essential action. Use restrained square film frames, deep soft shadows, unequal widths and deliberate spacing. Avoid uniform rounded cards, random overlaps and article-style side paragraphs.

The story should have approximately 70% image area/emphasis and 30% concise live text. Dialogue is HTML layered over a quiet lower picture area with a dark gradient. If all dialogue cannot fit without covering meaningful action, use a blended dark extension below that image. Never hide lines or require hover to read them.

| Order | Asset | Placement |
|---|---|---|
| 1 | story-01-interview | Left establishing still, 72% width, max 840px. |
| 2 | story-02-comparison | Complete panoramic image, 92% width, max 1120px; text-free. |
| 3 | story-03-meeting | Centered principal scene, max 1000px. |
| 4 | reaction-01-confident | Broad left reaction, 76%, max 930px. |
| 5 | reaction-02-double-take | Smaller right reaction, 60%, max 720px; 28px gap after 4. |
| 6 | story-04-breakfast | First matching-habit film plane. |
| 7 | story-05-gaming | Second matching-habit plane. At 1100px+, equal columns with 32px gap and gaming 48px lower; otherwise separate offset stills. |
| 8 | story-06-ideas | Right connecting shot, 74%, max 900px. |
| 9 | story-07-reveal | Dominant centered full photograph, max 1020px, plus optional desktop wrist field. |
| 10 | story-08-handshake | Broad partnership scene, max 1100px. |
| 11 | story-09-dance | Wide complete stage photograph, max 1120px. |
| 12 | reaction-03-stage-surprise | Right reaction payoff, 76%, max 930px. |
| 13 | story-10-workshop | Centered final shot, max 1050px, then black closing transition. |

Existing story variants are in `assets/`; reactions are in `assets/new/`. Use the supplied 720/1440 WebP files with JPEG fallbacks and accurate intrinsic dimensions. Existing scenes are 4:3; comparison is 1440×600; reactions are 1440×810. No stretching or destructive crops. The notebook must remain visibly supported by the woman's hand.

Use the supplied native desktop-depth helper for photographic planes only. Cap tilt around 3–3.5 degrees and lift at 18–24px; captions can float 18px ahead. Keep 24px between transformed frame bounds. Key meeting/reveal holds may add at most 14vh only if the complete frame/caption fits below the measured header. Mobile and reduced motion have no holds.

7. Complete script — preserve exact words

Interview: “The interview ends. The cameras switch off.” Then “A FEW DAYS LATER.”

Comparison: show Elon watching the earlier Elon Ma video and meeting the almost identical double through the supplied images. No visible explanatory paragraph or extra dialogue.

Meeting:
ELON: “Okay… that’s strange.”
THE MAN: “The security team said the same thing.”

Reaction 1:
PRODUCER: “I've worked with Elon for years. That's him.”
SECURITY: “Then who's this?”

Reaction 2:
PRODUCER: “Same face. Same smile…”
SECURITY: “I was certain five seconds ago.”

Breakfast narration: “Asked what they want for breakfast, both answer together.”
ELON + THE MAN: “Steak, eggs, and coffee.”
ELON: “Same breakfast?”
THE MAN: “And usually no lunch.”

Gaming:
ELON: “What do you do to clear your head?”
THE MAN: “Play a game. Diablo, for example.”
ELON: “That calms your mind?”
THE MAN: “Exactly.”

Ideas narration: “Rockets, robots, the future. He understands—and brings ideas of his own.”
ELON: “You’ve clearly watched my interviews.”
THE MAN: “There’s a little more to it.”

Reveal narration: A knock at the door. “We’re ready for you.”
ELON: “Where do you live? Where do you work?”
THE MAN: “I’m Robot-Elon. SuperIntelligence created me.”

Handshake:
ELON: “And you came here to meet me?”
SI-ELON: “I’d like to work with you.”
ELON: “Then let’s work together.”

Dance: “Two Elons walk onto the stage. The audience reaches for their phones. SI-Elon tries a small dance move. Elon laughs and joins him.”

Stage reaction:
ENGINEER: “I know Elon. Apparently, I know two now.”

Workshop: “Later, they enter the workshop together.”
ELON: “What’s next?”
SI-ELON: “SI will create our story too. Hopefully, it fixes my dancing.”

No new narrative dialogue follows the final joke. Fade through a 64px desktop/32px mobile black transition into SuperIntelligence Elon, $SIELON and the approved tagline. Keep the joke readable until it naturally scrolls away.

8. Token, community and sharing

Keep one configuration file. Preserve supplied real values; otherwise use null/pending. Network is Ethereum mainnet, chainId 1. Never invent a contract, supply, taxes, LP status, ownership status, official link or launch fact.

Near the desktop opening, provide configured Telegram, X, chart/trading and Copy CA controls. Hide optional unknown trading controls; show honest pending community/token states elsewhere. Validate Ethereum addresses as 0x plus 40 hexadecimal characters and preserve exact casing when displayed/copied. Long addresses wrap without overflow.

Token opens a native dialog on fine-pointer desktop and scrolls to inline information on phones/coarse pointer. Every trigger works; Close/Escape/backdrop close it and restore focus to the exact opener. Keep dialogs outside transformed 3D parents. Pause particle rendering while a dialog is open and resume afterward.

Keep the two community meme previews: dance with the final SI joke, wrist reveal with “I’m Robot-Elon. SuperIntelligence created me.” Use native Canvas for on-demand 1200×1200 JPEGs: complete 4:3 picture in the top 1200×900, dark caption area below. Include the project name, ticker and small fiction label. Provide Download meme and Copy caption; reuse local files/system fonts.

Set route-appropriate canonical and og:url. Home is https://sielon.world/ and Story is https://sielon.world/story.html. Use the absolute static branding image https://sielon.world/assets/brand-banner.jpg, 1500×500, with meaningful alt text and X large-image-card metadata. Do not use dynamic canvas/blob URLs as social preview images.

9. Loading, fallback and lifecycle

Render readable HTML and the approved static hero immediately. Lazily import the particle module/local Three.js only on eligible fine-pointer desktop after initial content is painted. Load story images as they approach the viewport; never serve original PNGs at runtime or preload the entire gallery. Use system fonts and cached local textures.

If WebGL fails, a texture fails, context is lost, reduced motion is enabled or JavaScript is absent, retain the complete static design and readable script. Hide unavailable optional gesture controls. Do not leave a blank scene, permanent loading screen or dead hold button. Dynamic media-query changes must pause/destroy/reset effects correctly.

Pause animation offscreen and when the tab is hidden. Reuse typed buffers, bound dt and particle displacement, avoid per-frame allocations and excessive renderers. If sustained performance is poor, reduce pixel ratio before particle count. Keep essential content independent of shader success. Do not add autoplay video/audio or third-party tracking.

10. Verification and completion

Run `node tools/verify.mjs` and `node tools/build.mjs`; adapt the checks to cover both new pages and export both static HTML files plus every asset/module. Preview with `node tools/serve.mjs`.

Inspect both desktop routes at 1440×900, 1280×800, 1024×768 and 800×900; inspect both routes on mobile at 414×896, 390×844, 360×800 and 320×700.

Verify actual portrait recognition, hold/release splitting, local pointer waves and spring return, scroll morphing, collapse/reformation, connecting depth, wrist enhancement and cinematic framing. Test keyboard, pointer cancellation, reduced motion, no JavaScript, WebGL failure/context loss, modal pause/resume and resize across 767/768px. Confirm title/control clearance of at least 24px, no horizontal overflow, no hidden faces/action/dialogue, no broken images, no console errors and correct navigation/direct refresh.

Compare mobile to the supplied baseline: same ten scenes, crops, text, spacing and ordinary down-scroll; new reaction/3D additions absent; no Three.js request on mobile. Check all token/social/copy/dialog/meme controls and exact-case contract copying. Restore genuine configuration after any temporary test data.

The reference inspection browser had WebGL disabled. The supplied engine is a starting implementation, not a claim that the finished 3D site has been visually verified. You must inspect the final animation in a WebGL-capable browser; if that is unavailable, report the limitation explicitly. Do not count a static fallback as a passed 3D test.

Finish with changed files, actual validation/browser results, local preview command and pending factual configuration. Complete the site rather than returning a plan. Do not deploy.
