# Academic Record — UUON Amazing Family Engine

**Author:** Phillip Aguilar Ruiz III  
**Organization:** UUON Foundation Inc.  
**Contact:** phi1@uuonfoundation.com  
**License:** USAL-1.0  
**Version:** 1.0.0  
**UTC Timestamp:** 2026-08-01T00:00:00Z

---

## Origination Scope

This document records the original contributions present at v1.0.0 of the UUON Amazing Family Engine. It constitutes a prior art record for IP attribution purposes.

### 1. Compile-Time MODE Dispatch Architecture

`buildFS(mode, iter)` constructs the GLSL fragment shader source at runtime with `MODE` and `FRAC_ITER` as compile-time `#define` constants. This eliminates runtime branching inside the DE inner loop — the GPU executes zero conditional dispatch per ray step. The four DE functions (`deMB`, `deAS`, `deM1`, `deBJ`) are compiled into a single shader with the active mode selected at link time.

This architecture is original. The individual DE formulas are prior art (Lowe 2010, Knighty 2011).

### 2. XY-Only Sphere Fold Correction (BUG-02)

The Amazing Surf and Surf Mod1 fractals use an XY-only sphere fold — the Z axis is not folded. The original implementation incorrectly computed the fold radius from all three components (full 3D `dot(p,p)`). The corrected implementation (`spFxy` in GLSL, `jSFxy` in JavaScript) computes the fold ratio from XY only (`p.x*p.x + p.y*p.y`), leaving Z unchanged. The `dr` derivative estimator scales by the XY fold ratio only.

This correction is documented here as the authoritative implementation. Both GLSL and CPU mirror functions are in exact parity.

### 3. CPU / GPU Mirror Parity

The engine maintains exact CPU mirrors (`jMB`, `jAS`, `jM1`, `jBJ`) of all four GLSL DE functions. These mirrors share the same fold helper logic (`bxF`, `jSF`, `jSFxy`) and are used for CPU-side marching cube mesh export. The CPU mirrors include all bug fixes applied to the GLSL implementations.

### 4. Marching Cubes OBJ Export with Vertex Normals

The OBJ mesh exporter samples the DE on an NxNxN grid (N configurable: 32/48/64/96), extracts isosurface vertices via marching cubes, and computes per-vertex normals from the DE gradient using finite differences (step = half voxel). Output OBJ uses `v//n` face format. Normal estimation method matches the GLSL tetrahedron gradient approach.

### 5. Token-Gated Iteration Architecture

PIEZ and PSENT ERC-20 token balances on Base Mainnet (chainId 8453) gate access to iteration tiers 12 and 16 respectively. Balance polling is performed client-side every 30 seconds and on window focus. This is documented as UI-only enforcement — server-side session issuance is a planned extension.

### 6. F=(P,E,M,R,C) Formulation

The M layer (Mapping) is formalized as the compile-time MODE dispatch + `upU()` uniform upload chain. This distinguishes the engine from a naive DE renderer: the mapping from P to GPU behavior is architectural, not incidental.

### 7. Genesis Anchor

This engine is part of the UUON PHRAMEWORK, anchored to Base Mainnet block 47259953:
`cf114022b5e4e1d6fdeb36890f35f605857cf2de93b53ebcb9c8e5652413ca04`

---

## Nine-Bug Audit Record

The following issues were identified and resolved prior to v1.0.0 publication:

| ID | Severity | Description | Resolution |
|----|----------|-------------|------------|
| BUG-02 | Critical | XY-only sphere fold used full 3D radius | `spFxy`/`jSFxy` corrected to XY-only |
| BUG-04 | High | OBJ export missing vertex normals | `vn` written; `f v//n` face format |
| BUG-05 | High | `morphBase` stale on mode switch during morph | Refreshed in `setMode()` |
| BUG-06 | Medium | Cycle flash blocked by shader compile | `doFlash()` yields 20ms before compile |
| BUG-07 | Medium | Token balance fetched once only | 30s poll + focus listener |
| BUG-08 | Medium | No warning before heavy export | Warning at quality 96 + iter > 8 |
| BUG-09 | Medium | `BOUND_R2` too small (r=2) | Increased to 64 (r=8) |

---

## Extension Record

| Version | Date | Description |
|---------|------|-------------|
| v1.0.0 | 2026-08-01 | Initial publication. Nine-bug audit complete. Public/proprietary split. |
| — | — | v1.1.0: Server-side token gate via uuon-clouud signed session tokens |
| — | — | v1.2.0: P-vector serializer (save/load JSON state) |
| — | — | v1.3.0: Node.js DE module for API server |

---

*UUON Foundation Inc. · Phillip Aguilar Ruiz III · phi1@uuonfoundation.com · USAL-1.0*
