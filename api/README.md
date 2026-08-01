# Amazing Family Engine — API Server Spec

**UUON Foundation Inc. — Phillip Aguilar Ruiz III**  
Status: Planned — not yet built  
Stack: Node.js / Express / uuon-clouud

---

## Planned Endpoints

### POST /api/engines/amazing-family/render
Accepts P vector, returns rendered frame as PNG.
```json
{ "mode": 0, "iter": 8, "scale": -1.5, "fold": 1.0, "minR": 0.5, "fixR": 1.0 }
```

### POST /api/engines/amazing-family/mesh
PSENT-gated. Accepts P vector + quality, returns OBJ mesh.
```json
{ "mode": 0, "iter": 8, "quality": 48, "range": 1.8, "scale": -1.5, ... }
```

### POST /api/engines/amazing-family/gate
Accepts wallet address, verifies PIEZ/PSENT balances server-side.
Returns signed session token. Closes the UI-only token gate vulnerability.
```json
{ "address": "0x..." }
```
Response:
```json
{ "token": "...", "piez": true, "psent": false, "expires": 1234567890 }
```

### GET /api/engines/amazing-family/state/:id
Returns stored P vector by ID.

---

## Planned File Tree

```
api/
├── README.md              — this file
└── lib/
    ├── de.js              — CPU DE functions extracted from core/engine.js
    └── gate.js            — server-side token verification
```

## Next Session Starting Point

Extract `jMB`, `jAS`, `jM1`, `jBJ`, `jSF`, `jSFxy`, `bxF`, and `jDE`
from `core/engine.js` into `api/lib/de.js` as a Node.js CommonJS module.
That module is the foundation of the mesh and render endpoints.

The gate endpoint requires:
- ethers v6 (already in uuon-clouud dependencies)
- JWT signing for session tokens
- Base Mainnet RPC connection
