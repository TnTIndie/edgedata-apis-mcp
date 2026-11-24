# EdgeData APIs — Official MCP Server (`edgedata-apis-mcp`)

[![npm version](https://img.shields.io/npm/v/edgedata-apis-mcp.svg)](https://www.npmjs.com/package/edgedata-apis-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/TnTIndie/edgedata-apis-mcp/blob/main/LICENSE)

Give **Claude Desktop**, **Cursor**, **Windsurf**, **VS Code**, **Claude Code**, **Antigravity**, and any MCP-compatible AI agent instant access to **11 real-time, Cloudflare-edge-cached data APIs** (**23 curated MCP tools**) powered by **EdgeData APIs** on RapidAPI Hub.

- **Zero API maintenance:** One `RAPIDAPI_KEY` unlocks 23 structured, low-latency tools backed by official public-domain & authoritative feeds (SEC EDGAR, FDA, ClinicalTrials.gov, ECB, U.S. Treasury, World Bank, NOAA Aviation Weather, USGS Earthquakes, NASA EONET, NOAA SWPC, OSV, CISA KEV, Polymarket, Kalshi, DeFiLlama, Hyperliquid, OKX, Gate.io, dYdX, and direct company ATS boards).
- **Free `$0/mo` starter tier** with strict Hard Limits (zero surprise overages) on all 11 APIs.
- **100% monitored Cloudflare Edge** (`100% SLA` health checks).

---

## Included Tools (11 Live APIs / 23 Tools)

| # | Domain | MCP Tools | RapidAPI Hub Listing |
| :-: | :--- | :--- | :--- |
| 1 | **Prediction Markets** | `prediction_markets_search`, `prediction_markets_arbitrage` | [Prediction Markets Unified API (Polymarket + Kalshi)](https://rapidapi.com/tamnt/api/prediction-markets-unified-api-polymarket-kalshi) |
| 2 | **SEC EDGAR Financials** | `sec_company_financials`, `sec_filings_search`, `sec_form_d_startups` | [SEC EDGAR Company Filings, XBRL Financials & Search API](https://rapidapi.com/tamnt/api/sec-edgar-company-filings-xbrl-financials-search-api) |
| 3 | **FDA & Clinical Trials** | `fda_drug_safety_brief`, `fda_drug_interactions`, `clinical_trials_search` | [FDA Drug Safety, Recalls & Clinical Trials API](https://rapidapi.com/tamnt/api/fda-drug-safety-recalls-clinical-trials-api) |
| 4 | **Crypto Funding & DeFi** | `crypto_funding_arbitrage`, `defi_protocol_tvl` | [Crypto Perpetual Funding Rates, Arbitrage & DeFi TVL API](https://rapidapi.com/tamnt/api/crypto-perpetual-funding-rates-arbitrage-defi-tvl-api) |
| 5 | **AI Models & LLM Pricing** | `llm_pricing_compare`, `ai_cost_estimate` | [AI Models, LLM Pricing, Benchmarks & Hugging Face API](https://rapidapi.com/tamnt/api/ai-models-llm-pricing-benchmarks-hugging-face-api) |
| 6 | **OSS Package Security** | `oss_package_audit`, `cisa_kev_exploits` | [OSS Package Security, Vulnerabilities & Supply-Chain API](https://rapidapi.com/tamnt/api/oss-package-security-vulnerabilities-supply-chain-api) |
| 7 | **Global FX & Macro** | `fx_convert_and_rates`, `world_bank_macro`, `us_treasury_debt` | [Global FX Rates, World Bank Macro & US Treasury API](https://rapidapi.com/tamnt/api/global-fx-rates-world-bank-macro-us-treasury-api) |
| 8 | **Shopify Intelligence** | `shopify_store_detect`, `shopify_products_list` | [Shopify Store Products & Catalog Fast API](https://rapidapi.com/tamnt/api/shopify-store-products-catalog-fast-api) |
| 9 | **Tech Stack Detector** | `tech_stack_detect` | [Tech Stack & Website Metadata Detector API](https://rapidapi.com/tamnt/api/tech-stack-website-metadata-detector-api) |
| 10 | **Remote & ATS Jobs** | `remote_jobs_search` | [Remote & ATS Jobs Aggregator API](https://rapidapi.com/tamnt/api/remote-ats-jobs-aggregator-api-greenhouse-lever-ashby) |
| 11 | **Aviation, Quakes & Space** | `aviation_airport_briefing`, `earthquakes_and_space_weather` | [Aviation Weather, Earthquakes & Space Hazards API](https://rapidapi.com/tamnt/api/aviation-weather-earthquakes-space-hazards-api) |

---

## Quick Setup (1 Minute)

1. Get a free API key by subscribing to any EdgeData API on **[rapidapi.com/user/tamnt](https://rapidapi.com/user/tamnt)** (`$0/mo` BASIC Hard-Limit plan available on all 11 APIs).
2. Add the MCP server to your AI client:

### Claude Desktop (`claude_desktop_config.json`) / Cursor (`~/.cursor/mcp.json`) / Windsurf

```json
{
  "mcpServers": {
    "edgedata-apis": {
      "command": "npx",
      "args": ["-y", "edgedata-apis-mcp"],
      "env": {
        "RAPIDAPI_KEY": "YOUR_RAPIDAPI_KEY_HERE"
      }
    }
  }
}
```

### Claude Code CLI

```bash
claude mcp add edgedata-apis -e RAPIDAPI_KEY=YOUR_RAPIDAPI_KEY_HERE -- npx -y edgedata-apis-mcp
```

### VS Code / GitHub Copilot (`.vscode/mcp.json`)

```json
{
  "servers": {
    "edgedata-apis": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "edgedata-apis-mcp"],
      "env": {
        "RAPIDAPI_KEY": "${input:rapidapi_key}"
      }
    }
  },
  "inputs": [
    {
      "id": "rapidapi_key",
      "type": "promptString",
      "description": "Your RapidAPI Key (from https://rapidapi.com/user/tamnt)",
      "password": true
    }
  ]
}
```

---

## Example Prompts to Try

- *"Compare NVDA and AAPL revenue, free cash flow, and net margin over the last 5 years from SEC EDGAR."*
- *"Check FDA boxed warnings, active recalls, and recruiting clinical trials for semaglutide."*
- *"Give me an aviation weather briefing for KJFK and list any magnitude 5+ earthquakes from the last 7 days."*
- *"Audit npm package `lodash@4.17.20` for OSV vulnerabilities and check CISA KEV ransomware alerts."*
- *"Find top perpetual funding rate arbitrage spreads across Hyperliquid, dYdX, OKX, and Gate.io."*

---

## Also Available On

- **RapidAPI Hub:** [rapidapi.com/user/tamnt](https://rapidapi.com/user/tamnt)
- **API.market:** [api.market/store/edgedata](https://api.market/store/edgedata)
- **Apify Store:** [apify.com/tamnt67](https://apify.com/tamnt67)

## Local Development

```bash
npm install
npm run typecheck
npm run build
npm test
```

## Security & Privacy

- Zero API keys or credentials are hardcoded or logged by this package.
- Your `RAPIDAPI_KEY` is read solely from the local `RAPIDAPI_KEY` environment variable and sent exclusively over HTTPS to `*.p.rapidapi.com`.
- Licensed under [MIT](./LICENSE).
