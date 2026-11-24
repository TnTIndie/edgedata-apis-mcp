#!/usr/bin/env node
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const SERVER_NAME = 'edgedata-apis-mcp';
const SERVER_VERSION = '1.1.0';

export const RAPIDAPI_HOSTS = {
  predictionMarkets: 'prediction-markets-unified-api-polymarket-kalshi.p.rapidapi.com',
  remoteJobs: 'remote-ats-jobs-aggregator-api-greenhouse-lever-ashby.p.rapidapi.com',
  techStack: 'tech-stack-website-metadata-detector-api.p.rapidapi.com',
  shopify: 'shopify-store-products-catalog-fast-api.p.rapidapi.com',
  cryptoDefi: 'crypto-perpetual-funding-rates-arbitrage-defi-tvl-api.p.rapidapi.com',
  secEdgar: 'sec-edgar-company-filings-xbrl-financials-search-api.p.rapidapi.com',
  aiModels: 'ai-models-llm-pricing-benchmarks-hugging-face-api.p.rapidapi.com',
  ossSecurity: 'oss-package-security-vulnerabilities-supply-chain-api.p.rapidapi.com',
  macroFx: 'global-fx-rates-world-bank-macro-us-treasury-api.p.rapidapi.com',
  fdaTrials: 'fda-drug-safety-recalls-clinical-trials-api.p.rapidapi.com',
  aviationHazards: 'aviation-weather-earthquakes-space-hazards-api.p.rapidapi.com',
} as const;

async function callRapidApi(
  host: string,
  path: string,
  query: Record<string, string | number | boolean | undefined> = {},
): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> {
  const apiKey = process.env.RAPIDAPI_KEY?.trim();
  if (!apiKey) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              ok: false,
              error: 'MISSING_RAPIDAPI_KEY',
              message:
                'Set the RAPIDAPI_KEY environment variable with your free RapidAPI key from https://rapidapi.com/user/tamnt',
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  const url = new URL(`https://${host}${path}`);
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== '') {
      url.searchParams.set(k, String(v));
    }
  }

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': host,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(15_000),
    });
    const text = await res.text();
    if (!res.ok) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `HTTP ${res.status} from ${host}${path}: ${text.slice(0, 2000)}`,
          },
        ],
      };
    }
    return {
      content: [{ type: 'text', text }],
    };
  } catch (err) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Network error calling ${host}${path}: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
    };
  }
}

export function createEdgeDataMcpServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  // 1. Prediction Markets
  server.tool(
    'prediction_markets_search',
    'Search live Polymarket & Kalshi prediction markets by keyword or category with real-time odds and volume.',
    {
      q: z.string().optional().describe('Search keyword (e.g. bitcoin, fed, election, ai)'),
      platform: z.enum(['all', 'polymarket', 'kalshi']).optional().describe('Filter by platform'),
      limit: z.number().int().min(1).max(50).optional().describe('Max markets to return (default 10)'),
    },
    async ({ q, platform, limit }) =>
      callRapidApi(RAPIDAPI_HOSTS.predictionMarkets, '/v1/markets', { q, platform, limit }),
  );

  server.tool(
    'prediction_markets_arbitrage',
    'Scan cross-platform prediction market price spreads and arbitrage opportunities between Polymarket and Kalshi.',
    {
      minSpread: z.number().min(0).max(50).optional().describe('Minimum spread percentage (e.g. 2)'),
      limit: z.number().int().min(1).max(50).optional().describe('Max opportunities to return'),
    },
    async ({ minSpread, limit }) =>
      callRapidApi(RAPIDAPI_HOSTS.predictionMarkets, '/v1/arbitrage', { minSpread, limit }),
  );

  // 2. SEC EDGAR
  server.tool(
    'sec_company_financials',
    'Get normalized annual or quarterly US SEC EDGAR XBRL financial statements (Income Statement, Balance Sheet, Cash Flow, FCF, Margins, ROE, YoY growth) by ticker or CIK.',
    {
      tickerOrCik: z.string().min(1).describe('Stock ticker (e.g. AAPL, NVDA, MSFT) or 10-digit SEC CIK'),
      period: z.enum(['annual', 'quarterly']).optional().describe('Statement period (default annual)'),
      years: z.number().int().min(1).max(20).optional().describe('Number of periods to return (default 5)'),
    },
    async ({ tickerOrCik, period, years }) =>
      callRapidApi(
        RAPIDAPI_HOSTS.secEdgar,
        `/v1/companies/${encodeURIComponent(tickerOrCik)}/financials`,
        { period, years },
      ),
  );

  server.tool(
    'sec_filings_search',
    'Run official SEC EDGAR EFTS full-text keyword search across all public 10-K, 10-Q, 8-K, and S-1 filings.',
    {
      q: z.string().min(2).describe('Search keyword or quoted phrase (e.g. "artificial intelligence")'),
      forms: z.string().optional().describe('Comma-separated forms (e.g. 10-K,8-K)'),
      startDate: z.string().optional().describe('Start filing date YYYY-MM-DD'),
      limit: z.number().int().min(1).max(50).optional(),
    },
    async ({ q, forms, startDate, limit }) =>
      callRapidApi(RAPIDAPI_HOSTS.secEdgar, '/v1/filings/search', { q, forms, startDate, limit }),
  );

  server.tool(
    'sec_form_d_startups',
    'Discover recent US SEC Form D startup and private-fund fundraising filings filterable by US state and keyword.',
    {
      q: z.string().optional().describe('Optional keyword (e.g. AI, biotech, robotics)'),
      state: z.string().length(2).optional().describe('2-letter US state code (e.g. CA, NY, DE, TX)'),
      days: z.number().int().min(1).max(365).optional().describe('Lookback days (default 30)'),
      limit: z.number().int().min(1).max(50).optional(),
    },
    async ({ q, state, days, limit }) =>
      callRapidApi(RAPIDAPI_HOSTS.secEdgar, '/v1/filings/form-d', { q, state, days, limit }),
  );

  // 3. FDA Drug Safety & Clinical Trials
  server.tool(
    'fda_drug_safety_brief',
    'Get an all-in-one US FDA drug safety brief: Boxed Warnings, FDA label, FAERS real-world adverse events + serious rate %, active recalls, and recruiting clinical trials.',
    {
      drug: z.string().min(1).describe('Drug brand or generic name (e.g. ozempic, semaglutide, metformin)'),
    },
    async ({ drug }) =>
      callRapidApi(RAPIDAPI_HOSTS.fdaTrials, '/v1/drugs/safety-brief', { drug }),
  );

  server.tool(
    'fda_drug_interactions',
    'Screen 2 to 5 drugs against official FDA Structured Product Labels (SPL) for documented drug-drug interactions and contraindications.',
    {
      drugs: z.string().min(3).describe('Comma-separated drug names (e.g. warfarin,ibuprofen,aspirin)'),
    },
    async ({ drugs }) =>
      callRapidApi(RAPIDAPI_HOSTS.fdaTrials, '/v1/drugs/interactions', { drugs }),
  );

  server.tool(
    'clinical_trials_search',
    'Search ClinicalTrials.gov v2 studies by condition, intervention/drug, sponsor, phase, and recruitment status.',
    {
      condition: z.string().optional().describe('Medical condition (e.g. obesity, diabetes, oncology)'),
      intervention: z.string().optional().describe('Drug or therapy intervention (e.g. semaglutide)'),
      sponsor: z.string().optional().describe('Lead sponsor name'),
      status: z.string().optional().describe('Recruitment status (default RECRUITING, or ALL)'),
      limit: z.number().int().min(1).max(50).optional(),
    },
    async ({ condition, intervention, sponsor, status, limit }) =>
      callRapidApi(RAPIDAPI_HOSTS.fdaTrials, '/v1/trials/search', {
        condition,
        intervention,
        sponsor,
        status,
        limit,
      }),
  );

  // 4. Crypto Perpetual Funding & DeFi TVL
  server.tool(
    'crypto_funding_arbitrage',
    'Find live cross-exchange crypto perpetual funding rate arbitrage spreads across Hyperliquid, dYdX v4, OKX, and Gate.io.',
    {
      limit: z.number().int().min(1).max(50).optional().describe('Max arbitrage pairs to return'),
      minApr: z.number().optional().describe('Minimum annualized spread APR %'),
    },
    async ({ limit, minApr }) =>
      callRapidApi(RAPIDAPI_HOSTS.cryptoDefi, '/v1/funding/arbitrage', { limit, minApr }),
  );

  server.tool(
    'defi_protocol_tvl',
    'List top blockchains by DeFi Total Value Locked (TVL) and global market share via DeFiLlama.',
    {
      search: z.string().optional().describe('Optional chain name or token filter (e.g. Ethereum, Solana, Base, Arbitrum)'),
      limit: z.number().int().min(1).max(50).optional(),
    },
    async ({ search, limit }) =>
      callRapidApi(RAPIDAPI_HOSTS.cryptoDefi, '/v1/defi/chains', { search, limit }),
  );

  // 5. AI Models & LLM Pricing
  server.tool(
    'llm_pricing_compare',
    'Compare live LLM token pricing, context windows, and capabilities across 300+ models from OpenAI, Anthropic, Google, Meta, DeepSeek, and xAI.',
    {
      q: z.string().optional().describe('Search keyword (e.g. claude, gpt-4o, gemini, deepseek)'),
      provider: z.string().optional().describe('Filter by provider slug'),
      limit: z.number().int().min(1).max(50).optional(),
    },
    async ({ q, provider, limit }) =>
      callRapidApi(RAPIDAPI_HOSTS.aiModels, '/v1/llm/models', { q, provider, limit }),
  );

  server.tool(
    'ai_cost_estimate',
    'Calculate exact USD cost for an LLM prompt/completion workload across top models.',
    {
      inputTokens: z.number().int().min(1).describe('Number of input tokens (e.g. 1000000)'),
      outputTokens: z.number().int().min(0).describe('Number of output tokens (e.g. 250000)'),
      model: z.string().optional().describe('Optional model ID filter'),
    },
    async ({ inputTokens, outputTokens, model }) =>
      callRapidApi(RAPIDAPI_HOSTS.aiModels, '/v1/llm/cost-estimate', {
        inputTokens,
        outputTokens,
        model,
      }),
  );

  // 6. OSS Package Security
  server.tool(
    'oss_package_audit',
    'Audit an open-source package (npm, PyPI, Go, Maven, Cargo, NuGet, etc.) for OSV vulnerabilities, CVSS severity, fixed versions, and CISA KEV active exploitation status.',
    {
      ecosystem: z.string().min(1).describe('Ecosystem (npm, PyPI, Go, Maven, crates.io, RubyGems, Packagist, NuGet)'),
      name: z.string().min(1).describe('Package name (e.g. lodash, requests, next)'),
      version: z.string().optional().describe('Optional package version (e.g. 4.17.20)'),
    },
    async ({ ecosystem, name, version }) =>
      callRapidApi(RAPIDAPI_HOSTS.ossSecurity, '/v1/packages/audit', { ecosystem, name, version }),
  );

  server.tool(
    'cisa_kev_exploits',
    'Query the official CISA Known Exploited Vulnerabilities (KEV) catalog for actively exploited CVEs and ransomware alerts.',
    {
      q: z.string().optional().describe('Keyword or vendor/product filter (e.g. chrome, cisco, apache)'),
      ransomwareOnly: z.boolean().optional().describe('Filter only ransomware-linked CVEs'),
      limit: z.number().int().min(1).max(50).optional(),
    },
    async ({ q, ransomwareOnly, limit }) =>
      callRapidApi(RAPIDAPI_HOSTS.ossSecurity, '/v1/cisa/kev', { q, ransomwareOnly, limit }),
  );

  // 7. Global FX, World Bank Macro & US Treasury
  server.tool(
    'fx_convert_and_rates',
    'Get official ECB daily foreign exchange rates (30 major currencies) or U.S. Treasury reporting FX rates (140+ currencies).',
    {
      base: z.string().length(3).optional().describe('Base currency ISO-3 code (default USD)'),
      symbols: z.string().optional().describe('Comma-separated target currencies (e.g. EUR,GBP,JPY,SGD)'),
      source: z.enum(['ecb', 'treasury']).optional().describe('Official FX source (default ecb; use treasury for VND/AED/SAR/TWD)'),
    },
    async ({ base, symbols, source }) =>
      callRapidApi(RAPIDAPI_HOSTS.macroFx, '/v1/fx/latest', { base, symbols, source }),
  );

  server.tool(
    'world_bank_macro',
    'Fetch World Bank macroeconomic snapshot (GDP, inflation, unemployment, population) and official local USD FX rate for any country.',
    {
      country: z.string().min(2).describe('ISO-2/ISO-3 country code (e.g. US, VN, DE, JP)'),
    },
    async ({ country }) =>
      callRapidApi(RAPIDAPI_HOSTS.macroFx, `/v1/macro/country/${encodeURIComponent(country)}`),
  );

  server.tool(
    'us_treasury_debt',
    'Get official U.S. Treasury daily national debt to the penny and debt growth velocity.',
    {
      days: z.number().int().min(1).max(365).optional().describe('Number of recent reporting days to return (default 30)'),
    },
    async ({ days }) =>
      callRapidApi(RAPIDAPI_HOSTS.macroFx, '/v1/treasury/debt', { days }),
  );

  // 8. Shopify Intelligence
  server.tool(
    'shopify_store_detect',
    'Detect whether a domain runs Shopify, its active theme, 45+ installed Shopify apps, payment methods, and social links.',
    {
      domain: z.string().min(3).describe('Public store domain (e.g. allbirds.com, gymshark.com)'),
    },
    async ({ domain }) =>
      callRapidApi(RAPIDAPI_HOSTS.shopify, '/v1/store/detect', { domain }),
  );

  server.tool(
    'shopify_products_list',
    'Extract normalized products, prices, discounts, and stock availability from any public Shopify store.',
    {
      domain: z.string().min(3).describe('Public Shopify store domain (e.g. allbirds.com)'),
      limit: z.number().int().min(1).max(50).optional(),
      sort: z.enum(['default', 'price_asc', 'price_desc', 'discount_desc']).optional(),
    },
    async ({ domain, limit, sort }) =>
      callRapidApi(RAPIDAPI_HOSTS.shopify, '/v1/products', { domain, limit, sort }),
  );

  // 9. Tech Stack Detector
  server.tool(
    'tech_stack_detect',
    'Detect a website tech stack (frameworks, CDN, CMS, analytics, payments), HTTP security headers, and OpenGraph metadata.',
    {
      url: z.string().min(3).describe('Public website URL or domain (e.g. stripe.com, vercel.com)'),
    },
    async ({ url }) =>
      callRapidApi(RAPIDAPI_HOSTS.techStack, '/v1/detect', { url }),
  );

  // 10. Remote & ATS Jobs
  server.tool(
    'remote_jobs_search',
    'Search live direct-employer tech and remote jobs aggregated from 6 official company ATS platforms (Greenhouse, Lever, Ashby, SmartRecruiters, Recruitee, Breezy).',
    {
      q: z.string().optional().describe('Role or skill keyword (e.g. rust, ai engineer, typescript)'),
      location: z.string().optional().describe('Optional location filter'),
      remoteOnly: z.boolean().optional().describe('Restrict to remote-friendly roles only'),
      limit: z.number().int().min(1).max(50).optional(),
    },
    async ({ q, location, remoteOnly, limit }) =>
      callRapidApi(RAPIDAPI_HOSTS.remoteJobs, '/v1/jobs', { q, location, remoteOnly, limit }),
  );

  // 11. Aviation Weather, Earthquakes & Space Hazards
  server.tool(
    'aviation_airport_briefing',
    'Get an all-in-one aviation weather briefing for any global ICAO airport: runways, decoded METAR flight category (VFR/IFR), TAF forecast, and nearby turbulence/icing PIREPs.',
    {
      icao: z.string().min(3).max(4).describe('4-letter ICAO airport code (e.g. KJFK, EGLL, VVNB, WSSS)'),
      radiusNm: z.number().int().min(10).max(500).optional().describe('PIREP search radius in nautical miles (default 150)'),
    },
    async ({ icao, radiusNm }) =>
      callRapidApi(RAPIDAPI_HOSTS.aviationHazards, '/v1/aviation/briefing', { icao, radiusNm }),
  );

  server.tool(
    'earthquakes_and_space_weather',
    'Query live USGS global earthquakes (with magnitude/tsunami/radius filters) or NOAA SWPC Space Weather (R/S/G storm scales, Kp geomagnetic index, solar wind).',
    {
      feed: z.enum(['earthquakes', 'space_weather', 'natural_hazards']).describe('Which official US Gov hazard feed to query'),
      minMagnitude: z.number().min(0).max(10).optional().describe('Minimum earthquake magnitude (when feed=earthquakes, default 4.5)'),
      days: z.number().int().min(1).max(90).optional().describe('Lookback days (default 7 for earthquakes, 30 for natural_hazards)'),
      limit: z.number().int().min(1).max(50).optional(),
    },
    async ({ feed, minMagnitude, days, limit }) => {
      if (feed === 'space_weather') {
        return callRapidApi(RAPIDAPI_HOSTS.aviationHazards, '/v1/space-weather', { alertsLimit: limit ?? 10 });
      }
      if (feed === 'natural_hazards') {
        return callRapidApi(RAPIDAPI_HOSTS.aviationHazards, '/v1/hazards/events', { days: days ?? 30, limit: limit ?? 20 });
      }
      return callRapidApi(RAPIDAPI_HOSTS.aviationHazards, '/v1/earthquakes', {
        minMagnitude: minMagnitude ?? 4.5,
        days: days ?? 7,
        limit: limit ?? 20,
      });
    },
  );

  return server;
}

async function main() {
  const server = createEdgeDataMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Run stdio server only when executed directly (works across npx, symlinks, Windows shims & node)
const isDirectExecution = (() => {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return process.argv[1].endsWith('index.js') || process.argv[1].endsWith('edgedata-apis-mcp');
  }
})();

if (isDirectExecution) {
  main().catch((err) => {
    console.error(`[${SERVER_NAME}] Fatal error:`, err);
    process.exit(1);
  });
}
