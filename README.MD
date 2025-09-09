# Dextr

Dextr is an LVR-minimizing DEX that matches orders to LP liquidity at a trusted oracle price, slashing MEV and Loss-Versus-Rebalancing.
It uses a virtual order book (USDC/WDOT in the MVP) with admin/keeper matching for deterministic, fair fills.

> **Inspiration:** This idea was inspired by CoW Protocol’s article on Loss Versus Rebalancing (LVR):
> https://cow.fi/learn/what-is-loss-versus-rebalancing-lvr

---

## What’s in this MVP?

- **Single ink! contract** (`DextrStorage`)
- **Internal ledgers** for two tokens: **USDC** and **WDOT** (no external ERC-20s)
- **Virtual LP balances:** `(provider, token) → Liquidity { id, token, creator, amount }`
- **Orders:** `id → Order { id, token_in, creator, amount_in, status }`
- **Mock oracle:** admin-set integers (`usdc_per_wdot`, `wdot_per_usdc`)
- **Admin matcher:** `admin_match_order(order_id, lp)` clears at oracle price and emits `OrderMatched`
- **Faucet mints** for quick testing: `mint_usdc`, `mint_wdot`
- **Unit tests** that seed LPs, set oracle, post orders, and match

> All amounts are **raw integers**. Pick a convention in UI/tests (e.g., 6dp for USDC, 10/12/18dp for WDOT) and stick to it.

---

## Build & Test

```bash
# Rust & cargo (Edition 2024-ready toolchain recommended)
rustup default stable
cargo --version

# Run unit tests
cargo test
```

# Dextr — Screenshots

> Store images at `docs/img/` so paths below render on GitHub.

- [Dashboard](#dashboard)
- [Faucet](#faucet)
- [Add Liquidity](#add-liquidity)

---

## Dashboard

![Dextr Dashboard](docs/img/Dashboard.png)

_Overview of balances, oracle price, open orders, and LP liquidity._

---

## Faucet

![Faucet](docs/img/Faucet.png)

_Mint test balances (USDC/WDOT) to any address for quick local testing._

---

## Add Liquidity

![Add Liquidity](docs/img/AddLiquidity.png)

_Lock user balances into virtual LP pools so orders can match against them._
