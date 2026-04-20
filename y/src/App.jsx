import { useEffect, useState } from "react";

const TOKEN = "goldapi-3q0jfsmo63uilk-io";
const OUNCE_TO_GRAM = 31.1034768;
const GRAMS_PER_TOLA = 11.6638038;
const REFRESH_INTERVAL_MS = 60000;
const COMPANY_NAME = "Elixir Gold Jewellers";
const CONTACT_EMAIL = "inbox.elixir@gmail.com";
const CONTACT_PHONE = "9555573555";

const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

const formatTimeIST = (date) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);

export default function MetalPrices() {
  const [prices, setPrices] = useState({ gold: null, silver: null });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMetal = async (symbol) => {
      console.log(`[GoldAPI] Request started for ${symbol}/INR`);
      const response = await fetch(`https://www.goldapi.io/api/${symbol}/INR`, {
        headers: {
          "x-access-token": TOKEN,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${symbol} (${response.status})`);
      }

      const json = await response.json();
      console.log(`[GoldAPI] Response received for ${symbol}/INR`, json);
      return json;
    };

    const fetchPrices = async () => {
      try {
        console.log("[GoldAPI] Fetch cycle started");
        setIsLoading(true);
        setError("");

        const [goldData, silverData] = await Promise.all([
          fetchMetal("XAU"),
          fetchMetal("XAG"),
        ]);

        const goldPerOunce = Number(goldData.price);
        const silverPerOunce = Number(silverData.price);

        console.log("[GoldAPI] Parsed prices", {
          goldPerOunce,
          silverPerOunce,
        });

        setPrices({
          gold: {
            perOunce: goldPerOunce,
            perGram: goldPerOunce / OUNCE_TO_GRAM,
            per10Gram: (goldPerOunce / OUNCE_TO_GRAM) * 10,
            perTola: (goldPerOunce / OUNCE_TO_GRAM) * GRAMS_PER_TOLA,
          },
          silver: {
            perOunce: silverPerOunce,
            perGram: silverPerOunce / OUNCE_TO_GRAM,
            per10Gram: (silverPerOunce / OUNCE_TO_GRAM) * 10,
            perTola: (silverPerOunce / OUNCE_TO_GRAM) * GRAMS_PER_TOLA,
          },
        });

        setLastUpdated(
          new Date((Number(goldData.timestamp) || Date.now() / 1000) * 1000)
        );
      } catch (fetchError) {
        console.error("[GoldAPI] Fetch failed", fetchError);
        setError(fetchError.message || "India market rates could not be loaded.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrices();

    const intervalId = setInterval(fetchPrices, REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, []);

  const gold22kPer10g = prices.gold ? (prices.gold.per10Gram * 22) / 24 : null;
  const branches = [
    {
      title: "ETAWAH BRANCH",
      address:
        "ELIXIR GOLD, 1ST FLOOR, RAMESHWARAM MARKET, SARAFA BAZAR, HOMEGANJ, ETAWAH (UP)",
    },
    {
      title: "GWALIOR BRANCH",
      address:
        "Elixir Gold, Srinath Complex, Mor Gali, Sarafa, Lashkar, Gwalior, (MP) 474001",
    },
    {
      title: "JHANSI BRANCH",
      address: "JHANSI",
    },
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,#fff8e4_0%,#f8f1df_32%,#f2eee9_62%,#e8edf4_100%)] px-4 py-8 sm:px-6 lg:px-10">
      <section className="mx-auto w-full max-w-6xl overflow-hidden rounded-[28px] border border-[#d7c7a0]/70 bg-white/90 shadow-[0_30px_80px_rgba(78,62,32,0.18)] backdrop-blur">
        <header className="border-b border-[#e8dbc0] bg-[linear-gradient(115deg,#f7e8c4_0%,#f8efd8_38%,#f5ead2_70%,#e9dfc6_100%)] px-6 py-8 sm:px-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-body text-[11px] font-semibold uppercase tracking-[0.28em] text-[#836328]">
              Hallmarked Jewellery Company
            </p>
            <p className="font-body rounded-full border border-[#cdb57d] bg-white/60 px-3 py-1 text-xs text-[#6a4f1e]">
              Since 2009
            </p>
          </div>

          <h1 className="font-display mt-3 text-4xl leading-tight text-[#3b2a13] sm:text-5xl lg:text-6xl">
            {COMPANY_NAME}
          </h1>

          <p className="font-body mt-3 max-w-3xl text-sm leading-relaxed text-[#5f4b22] sm:text-base">
            Premium gold and silver jewellery with transparent daily pricing for retail clients,
            bridal orders, and wholesale showroom billing.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="font-body rounded-full border border-[#d8c089] bg-white/70 px-3 py-1 text-xs font-medium text-[#5f4b22]">
              BIS Hallmarked
            </span>
            <span className="font-body rounded-full border border-[#d8c089] bg-white/70 px-3 py-1 text-xs font-medium text-[#5f4b22]">
              Transparent Billing
            </span>
            <span className="font-body rounded-full border border-[#d8c089] bg-white/70 px-3 py-1 text-xs font-medium text-[#5f4b22]">
              Live India Bullion Rates
            </span>
          </div>
        </header>

        <div className="grid gap-6 px-6 py-6 sm:px-10 sm:py-8 lg:grid-cols-[1.25fr_2fr] lg:gap-8">
          <aside className="rounded-2xl border border-[#eadfc7] bg-[#fbf8f2] p-5">
            <h2 className="font-display text-3xl text-[#3f2f16]">Company Profile</h2>
            <p className="font-body mt-3 text-sm leading-relaxed text-[#62502a]">
              We craft contemporary and traditional jewellery collections with certified purity and
              responsible sourcing. This dashboard is used by our sales team for real-time customer
              quotation.
            </p>

            <div className="mt-5 space-y-2">
              <p className="font-body text-sm text-[#4f4121]">
                <span className="font-semibold">Business:</span> Gold, Silver, Bridal & Custom Design
              </p>
              <p className="font-body text-sm text-[#4f4121]">
                <span className="font-semibold">Segment:</span> Retail Showroom + Wholesale Supply
              </p>
              <p className="font-body text-sm text-[#4f4121]">
                <span className="font-semibold">Market:</span> India (INR)
              </p>
            </div>

            <p className="font-body mt-5 rounded-xl border border-[#e6d6b5] bg-white px-3 py-2 text-xs text-[#725e31]">
              Note: Final invoice may include GST, wastage, and making charges as per design.
            </p>
          </aside>

          <section>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e5d6b8] bg-[#faf6ed] px-4 py-3">
              <p className="font-body text-sm font-medium text-[#5f512f]">
                Currency: INR | Source: GoldAPI | Auto refresh: 60 sec
              </p>
              <p className="font-body text-sm text-[#786746]">
                {lastUpdated
                  ? `Updated: ${formatTimeIST(lastUpdated)} IST`
                  : "Waiting for market timestamp..."}
              </p>
            </div>

            {isLoading && (
              <div className="rounded-2xl border border-[#eadfca] bg-white p-8 text-center">
                <p className="font-body text-base text-[#6a5b37]">
                  Fetching latest India bullion rates...
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <p className="font-body text-sm font-semibold text-red-700">Unable to load prices</p>
                <p className="font-body mt-1 text-sm text-red-600">{error}</p>
              </div>
            )}

            {!isLoading && !error && (
              <div className="grid gap-5 md:grid-cols-2">
                <article className="rounded-2xl border border-[#e5c97a] bg-[linear-gradient(165deg,#fff6dc_0%,#ffefbf_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                  <h3 className="font-display text-3xl text-[#4b390f]">Gold</h3>
                  <p className="font-body mt-1 text-sm uppercase tracking-wide text-[#7d5e1b]">
                    XAU / INR
                  </p>
                  <div className="mt-5 space-y-3">
                    <p className="font-body text-[#4b390f]">
                      <span className="mr-2 text-sm text-[#7d5e1b]">24K per 10g</span>
                      <span className="text-2xl font-semibold">{formatINR(prices.gold.per10Gram)}</span>
                    </p>
                    <p className="font-body text-[#4b390f]">
                      <span className="mr-2 text-sm text-[#7d5e1b]">22K per 10g (est.)</span>
                      <span className="text-lg font-semibold">{formatINR(gold22kPer10g)}</span>
                    </p>
                    <p className="font-body text-[#4b390f]">
                      <span className="mr-2 text-sm text-[#7d5e1b]">Per gram</span>
                      <span className="text-lg font-semibold">{formatINR(prices.gold.perGram)}</span>
                    </p>
                    <p className="font-body text-[#4b390f]">
                      <span className="mr-2 text-sm text-[#7d5e1b]">Per tola</span>
                      <span className="text-lg font-semibold">{formatINR(prices.gold.perTola)}</span>
                    </p>
                  </div>
                </article>

                <article className="rounded-2xl border border-[#d6dde7] bg-[linear-gradient(165deg,#f7fafc_0%,#e8eef6_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                  <h3 className="font-display text-3xl text-[#243246]">Silver</h3>
                  <p className="font-body mt-1 text-sm uppercase tracking-wide text-[#5a6d85]">
                    XAG / INR
                  </p>
                  <div className="mt-5 space-y-3">
                    <p className="font-body text-[#243246]">
                      <span className="mr-2 text-sm text-[#5a6d85]">Per kg</span>
                      <span className="text-2xl font-semibold">
                        {formatINR(prices.silver.perGram * 1000)}
                      </span>
                    </p>
                    <p className="font-body text-[#243246]">
                      <span className="mr-2 text-sm text-[#5a6d85]">Per 10g</span>
                      <span className="text-lg font-semibold">{formatINR(prices.silver.per10Gram)}</span>
                    </p>
                    <p className="font-body text-[#243246]">
                      <span className="mr-2 text-sm text-[#5a6d85]">Per gram</span>
                      <span className="text-lg font-semibold">{formatINR(prices.silver.perGram)}</span>
                    </p>
                  </div>
                </article>
              </div>
            )}
          </section>
        </div>
      </section>

      {/* <footer className="mx-auto mt-6 w-full max-w-6xl overflow-hidden rounded-[28px] border border-[#d7c7a0]/70 bg-[linear-gradient(110deg,#fbf4e6_0%,#f5ecd9_45%,#efe5d0_100%)] px-6 py-7 shadow-[0_22px_48px_rgba(79,60,29,0.12)] sm:px-10">
        <div className="grid gap-5 md:grid-cols-3">
          {branches.map((branch) => (
            <article
              key={branch.title}
              className="rounded-2xl border border-[#e2d2ab] bg-white/70 p-4 shadow-[0_8px_20px_rgba(87,70,38,0.08)]"
            >
              <h3 className="font-body text-xs font-bold uppercase tracking-[0.18em] text-[#7b5d28]">
                {branch.title}
              </h3>
              <p className="font-body mt-3 text-sm leading-relaxed text-[#4f3f1e]">{branch.address}</p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-body mt-3 block text-sm font-medium text-[#5c4312] underline decoration-[#c3a05a] underline-offset-2 hover:text-[#3f2c08]"
              >
                {CONTACT_EMAIL}
              </a>
              <a
                href={`tel:${CONTACT_PHONE}`}
                className="font-body mt-1 block text-sm font-medium text-[#5c4312] hover:text-[#3f2c08]"
              >
                {CONTACT_PHONE}
              </a>
            </article>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#decba0] pt-4">
          <p className="font-body text-sm font-semibold text-[#60491c]">Follow Us</p>
          <div className="flex flex-wrap gap-2">
          
            <a
              href="https://www.facebook.com/"
              target="_blank"
              rel="noreferrer"
              className="font-body rounded-full border border-[#d4b87c] bg-white/80 px-3 py-1 text-xs font-medium text-[#5d4514] hover:bg-[#fff4da]"
            >
              Facebook
            </a>
           
          </div>
        </div>
      </footer> */}
    </main>
  );
}