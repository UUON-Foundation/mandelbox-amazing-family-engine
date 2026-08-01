# UUON Amazing Family Engine

**UUON Foundation Inc. — Phillip Aguilar Ruiz III**
`@uuon-foundation/amazing-family-engine` · License: USAL-1.0

Real-time GPU ray marching fractal renderer. Four fractal types rendered via WebGL2 GLSL 300es distance estimators — no polygon mesh, no rasterization. Geometry is pure mathematics evaluated pixel by pixel on the GPU every frame. Connected to Base Mainnet via ethers v6 with PIEZ/PSENT token-gated iteration tiers.

Part of the **UUON PHRAMEWORK**, anchored to Base Mainnet block 47259953.

---

## Live Engine

**[→ Launch Amazing Family Engine](https://uuon-foundation.github.io/uuon-amazing-family-engine/)**

---

## The Four Fractals

| Mode | Author | Year | Geometry |
|------|--------|------|----------|
| **Mandelbox** | Tom Lowe | 2010 | Box fold + full 3D sphere fold. Solid crystalline volumes with recursive interior structure. |
| **Amazing Surf** | Knighty | 2011 | XY-only sphere fold, Z axis escapes. Infinite layered surfaces with open vertical corridors. |
| **Surf Mod1** | — | — | Amazing Surf + fixed Julia offset. Breaks translational symmetry, reveals attractor geometry. |
| **Box Julia** | — | — | Mandelbox with constant additive c. Collapses Mandelbox iteration to reveal the attractor skeleton. |

The fractal formulas are prior art. The IP is in the architecture — see below.

---

## F=(P,E,M,R,C) Formulation

| Symbol | Name | This Engine |
|--------|------|-------------|
| **P** | Parameters | `{ mode, iter, scale, fold, minR, fixR }` — 6 values, ~48 bytes |
| **E** | Encoding | GLSL DE function applied per ray, per pixel, every frame |
| **M** | Mapping | Compile-time `MODE` dispatch + `upU()` uniform chain — maps P to GPU shader behavior at compile time |
| **R** | Representation | WebGL2 framebuffer (live) · PNG export · OBJ mesh with vertex normals |
| **C** | Compression | P=48B → R≈180KB–2MB → **C≈3,750:1 to 40,000:1** |

### Compression Table

| Configuration | P (bytes) | R (approx) | C ratio |
|---------------|-----------|------------|---------|
| Mandelbox / iter 8 / quality 48 | 48 | ~180 KB | ~3,750:1 |
| Mandelbox / iter 16 / quality 96 | 48 | ~2 MB | ~40,000:1 |
| Amazing Surf / iter 8 / quality 64 | 48 | ~400 KB | ~8,300:1 |
| Box Julia / iter 12 / quality 48 | 48 | ~280 KB | ~5,800:1 |

---

## Public / Proprietary Split

```
uuon-amazing-family-engine/
├── index.html          [PUBLIC]  — renderer shell, UI, animation, OBJ export
├── core/
│   └── engine.js       [PROPRIETARY — .gitignored]
│                        Served from https://uuon.world/engine/amazing-family/core.js
│                        Exposes window.AFE
├── docs/
│   ├── ACADEMIC-RECORD.md
│   └── FPERC-diagram.svg
├── api/
│   └── README.md       — planned API server spec
├── LICENSE             — USAL-1.0
├── NOTICE              — provenance + third-party deps
├── .env.example
├── .gitignore          — core/engine.js excluded
└── .github/workflows/gitleaks.yml
```

### What `index.html` contains (public)
- WebGL2 scene setup, render loop
- All UI controls, animation modes, tab system
- Wallet connection (ethers v6), token gate UI
- OBJ mesh export pipeline (calls `window.AFE.jDE`)
- PNG export

### What `core/engine.js` contains (proprietary)
- `buildFS(mode, iter)` — full GLSL fragment shader source builder
- `deMB`, `deAS`, `deM1`, `deBJ` — four GLSL DE implementations
- `jMB`, `jAS`, `jM1`, `jBJ` — CPU mirror DE functions (exact match)
- `jSF`, `jSFxy` — fold helpers with BUG-02 XY fix
- `jDE(U, x, y, z)` — CPU dispatcher

### window.AFE API surface
```javascript
window.AFE.buildFS(mode, iter)  // → GLSL fragment shader string
window.AFE.jDE(U, x, y, z)     // → scalar DE value for CPU mesh export
window.AFE.version              // → '1.0.0'
```

---

## Ray Marching Architecture

```
Camera ray → Bounding sphere test (r=8) → March loop →
  DE(p) → step forward by DE result →
  Hit: shade (Lambert + Blinn-Phong + soft shadow + AO + gamma)
  Miss: white background
```

| Parameter | Value | Notes |
|-----------|-------|-------|
| MAX_STEPS | 128–256 | Scales with iter depth |
| SURF_EPS | 0.0002–0.0005 | Hit threshold, scales with iter |
| STEP_FAC | 0.5 | Safety multiplier |
| BOUND_R2 | 64 (r=8) | Bounding sphere, catches fractal extent at large scale |

Normal estimation: 4-sample tetrahedron gradient of DE.
Soft shadows: 16-step secondary ray, penumbra ∝ DE/t.
AO: 5-sample cone along surface normal.

---

## Nine-Bug Audit (v1.0.0)

All nine issues identified in the pre-publication audit were resolved:

| ID | Issue | Fix |
|----|-------|-----|
| BUG-02 | XY-only sphere fold used full 3D radius | `spFxy` and `jSFxy` now use XY radius only; Z unchanged |
| BUG-04 | OBJ export missing vertex normals | `vn` entries written; faces use `v//n` format |
| BUG-05 | `morphBase` stale on mode switch during morph | Refreshed in `setMode()` when `animMode===5` |
| BUG-06 | Cycle shader rebuild blocked main thread before flash | `doFlash()` yields 20ms before `rebuildShader()` |
| BUG-07 | Token balances fetched once only | 30s polling interval + `window focus` listener |
| BUG-08 | No warning before heavy quality+iter combos | Warning shown for quality 96 + iter > 8 |
| BUG-09 | `BOUND_R2` too small (r=2) | Increased to 64 (r=8) |

---

## Token Gate — Base Mainnet

| Token | Contract | Unlocks |
|-------|----------|---------|
| PIEZ | `0xfb9c83432331EAf6f4a9D9488828823587d6f3da` | Iter 12, Shape API |
| PSENT | `0x985A1ebac4388DFb6EB4FE1171dCa9c6a5DB9cE7` | Iter 16, OBJ mesh export, NFT metadata prep |

**Note:** Token gate is currently UI-only. Server-side enforcement via `uuon-clouud` signed session tokens is the next architectural priority.

---

## Dependencies

| Dependency | Version | License | Use |
|------------|---------|---------|-----|
| ethers | 6.15.0 | MIT | Base Mainnet wallet + token queries |
| Share Tech Mono | — | SIL OFL | UI typography |
| WebGL2 / GLSL 300es | — | Open standard | GPU rendering |

No build step. No bundler. Single HTML file + proprietary core.

---

## Known Limitations

| Limitation | Impact | Resolution Path |
|------------|--------|-----------------|
| Token gate is UI-only | Bypassable via DevTools | Server-side session issuance from uuon-clouud |
| No P-vector serializer | Sessions not reproducible from UI | Save/load JSON P vector |
| No API server | Browser-only — no programmatic access | Node.js DE module, then Express endpoints |

---

## License

USAL-1.0 — Phillip Aguilar Ruiz III / UUON Foundation Inc.
Attribution required. AI training use prohibited.
Commercial licensing: phi1@uuonfoundation.com
