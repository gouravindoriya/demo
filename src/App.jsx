import { useEffect, useMemo, useState } from "react";

const STREAM_URL =
  "https://bcast.kanhajewellers.in:7768/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/kanha";
const REFRESH_MS = 1000;

const SERVICES = [
  "Silver Assaying",
  "Gold & Silver Melting",
  "Spot Bullion Trading",
  "Jewellery Calculator Support",
];

const BRANCHES = [
  {
    title: "ETAWAH BRANCH",
    address:
      "ELIXIR GOLD, 1ST FLOOR, RAMESHWARAM MARKET, SARAFA BAZAR, HOMEGANJ, ETAWAH (UP)",
    email: "inbox.elixir@gmail.com",
    phone: "9555573555",
  },
  {
    title: "GWALIOR BRANCH",
    address:
      "Elixir Gold, Srinath Complex, Mor Gali, Sarafa, Lashkar, Gwalior, (MP) 474001",
    email: "inbox.elixir@gmail.com",
    phone: "9555573555",
  },
  {
    title: "JHANSI BRANCH",
    address: "JHANSI",
    email: "inbox.elixir@gmail.com",
    phone: "9555573555",
  },
];

const toNumberOrNull = (value) => {
  if (value === "-") {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const formatValue = (value) => {
  if (value === null) {
    return "-";
  }

  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: value % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value);
};

const parseRates = (raw) => {
  const normalized = raw.replace(/\r/g, " ").replace(/\n/g, " ").replace(/\s+/g, " ").trim();
  const segments = normalized.split(/(?=\b\d{4}\s)/g);

  return segments
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      const match = segment.match(
        /^(\d{4})\s+(.+?)\s+(-|\d+(?:\.\d+)?)\s+(-|\d+(?:\.\d+)?)\s+(-|\d+(?:\.\d+)?)\s+(-|\d+(?:\.\d+)?)$/
      );

      if (!match) {
        return null;
      }

      return {
        id: match[1],
        label: match[2],
        buy: toNumberOrNull(match[3]),
        sell: toNumberOrNull(match[4]),
        high: toNumberOrNull(match[5]),
        low: toNumberOrNull(match[6]),
      };
    })
    .filter(Boolean);
};

function App() {
  const [rates, setRates] = useState([]);
  const [status, setStatus] = useState("Connecting...");
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    let activeController = new AbortController();

    const readStream = async (signal) => {
      try {
        setStatus("Connecting...");
        setError("");

        const timestamp = Math.floor(Date.now() / 1000);
        const response = await fetch(`${STREAM_URL}?_=${timestamp}`, { signal });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const applyData = (textChunk) => {
          const parsedRows = parseRates(textChunk);
          if (parsedRows.length) {
            setRates(parsedRows);
            setLastUpdated(new Date());
            setStatus("Live rates updated");
          }
        };

        if (!response.body) {
          const textBody = await response.text();
          console.log("Non-stream response", textBody);
          applyData(textBody);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let combinedText = "";

        setStatus("Streaming live rates...");

        while (true) {
          const { value, done } = await reader.read();

          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          combinedText += chunk;
          console.log("Stream chunk", chunk);
          applyData(combinedText);
        }
      } catch (streamError) {
        if (streamError.name !== "AbortError") {
          console.error("Stream error", streamError);
          setError(streamError.message || "Unable to fetch live rates");
          setStatus("Connection error");
        }
      }
    };

    const start = () => {
      readStream(activeController.signal);
    };

    start();

    const intervalId = setInterval(() => {
      activeController.abort();
      activeController = new AbortController();
      setStatus("Refreshing feed...");
      start();
    }, REFRESH_MS);

    return () => {
      clearInterval(intervalId);
      activeController.abort();
    };
  }, []);

  const highlightCards = useMemo(() => {
    const findByLabel = (term) => rates.find((item) => item.label.includes(term));

    return [
      { title: "Gold Comex", row: findByLabel("GOLD COMEX"), unit: "$" },
      { title: "Silver Comex", row: findByLabel("SILVER COMEX"), unit: "$" },
      { title: "INR Exchange", row: findByLabel("INR EX"), unit: "INR" },
    ];
  }, [rates]);

  const legacyBhav = useMemo(() => {
    const findByLabel = (term) => rates.find((item) => item.label.includes(term));

    const goldComex = findByLabel("GOLD COMEX");
    const goldJune = findByLabel("GOLD JUNE") || findByLabel("GOLD JUN");
    const silverComex = findByLabel("SILVER COMEX");
    const silverMay = findByLabel("SILVER MAY");
    const goldGwalior = findByLabel("GOLD 99.50-10 GM") || findByLabel("GOLD JEWAR 22 CT");
    const silverGwalior =
      findByLabel("SILVER CUT 9999-1 KG") || findByLabel("SWASTIK SILVER-1 KG");

    return {
      goldMcx: goldComex ? formatValue(goldComex.sell) : "-",
      goldJuneBuy: goldJune ? formatValue(goldJune.buy) : "-",
      goldGwalior: goldGwalior ? formatValue(goldGwalior.sell) : "-",
      silverMcx: silverComex ? formatValue(silverComex.sell) : "-",
      silverMayBuy: silverMay ? formatValue(silverMay.buy) : "-",
      silverGwalior: silverGwalior ? formatValue(silverGwalior.sell) : "-",
    };
  }, [rates]);

  const parseDisplayNumber = (value) => {
    if (value === "-") {
      return null;
    }

    const numericValue = Number(String(value).replace(/,/g, ""));
    return Number.isFinite(numericValue) ? numericValue : null;
  };

  const formatOffsetValue = (value, offset) => {
    const numericValue = parseDisplayNumber(value);
    return numericValue === null ? "-" : `₹ ${numericValue + offset}`;
  };

  const adminRateCards = [
    { title: "Gold MCX", value: `$ ${legacyBhav.goldMcx}` },
    { title: "Silver MCX", value: `$ ${legacyBhav.silverMcx}` },
    { title: "Indian Gold", value: `₹ ${legacyBhav.goldJuneBuy}` },
    { title: "Indian Silver", value: `₹ ${legacyBhav.silverMayBuy}` },
  ];

  const gwaliorGold = formatOffsetValue(legacyBhav.goldJuneBuy, 1000);
  const gwaliorSilver = formatOffsetValue(legacyBhav.silverMayBuy, 1000);

  return (
    <>
   
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#191919_0%,#0f0f0f_50%,#060606_100%)] text-[#f6e6b8] pb-10">
      <div className="border-b border-[#3c321e] bg-[#060606]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs sm:text-sm">
          <p>ELIXIR GOLD | +91-9555573555 | inbox.elixir@gmail.com</p>
          <p>Working Hours: 11:00 AM - 8:00 PM</p>
        </div>
      </div>

      <header className="mx-auto max-w-7xl px-4 pb-4 pt-8">
        <div className="rounded-3xl border border-[#45391e] bg-[linear-gradient(135deg,#1b1b1b_0%,#101010_60%,#090909_100%)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.55)] sm:p-10">
          <div>
        
            <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-[#f7e6b0] sm:text-5xl">
              ELIXIR GOLD LIVE DESK
            </h1>
            {/* <p className="mt-3 max-w-3xl text-sm text-[#d6c08a] sm:text-base">
              Premium black theme dashboard for jewellers with live Buy/Sell/High/Low updates and
              old Elixir branch details integrated in one modern interface.
            </p> */}

           
          </div>

          
           <div className="mt-0 rounded-2xl border border-[#40351e] bg-[#0b0b0b] p-3 text-sm text-[#dac48f]">

             <div className="mt-0 rounded-2xl border border-[#4c4026] bg-[#0e0e0e] px-4 mx-0 py-3 text-sm text-[#f0d58d]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p>
                  Last updated at  
                  {/* <span className="font-semibold">{status}</span> */}
                </p>
                <p>
                  Last Updated: {lastUpdated ? lastUpdated.toLocaleTimeString("en-IN") : "Waiting..."}
                </p>
              </div>
              {error && <p className="mt-2 text-red-400">Error: {error}</p>}
            </div >

            <div className="mt-3 rounded-2xl border border-[#4a3d24] bg-[#0d0d0d] p-3">

              <div className="grid gap-3 sm:grid-cols-2">
                {adminRateCards.map((card) => (
                  <article key={card.title} className="rounded-xl border border-[#5a4a2b] bg-[linear-gradient(140deg,#171717_0%,#0f0f0f_100%)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c7a966]">{card.title}</p>
                    <p className="mt-2 text-xl font-semibold text-[#f5d993] sm:text-2xl">{card.value}</p>
                  </article>
                ))}
                <article className="rounded-xl border border-[#5a4a2b] bg-[linear-gradient(140deg,#171717_0%,#0f0f0f_100%)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c7a966]">Gwalior Gold</p>
                  <p className="mt-2 text-xl font-semibold text-[#f5d993] sm:text-2xl">{gwaliorGold}</p>
                </article>
                <article className="rounded-xl border border-[#5a4a2b] bg-[linear-gradient(140deg,#171717_0%,#0f0f0f_100%)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c7a966]">Gwalior Silver</p>
                  <p className="mt-2 text-xl font-semibold text-[#f5d993] sm:text-2xl">{gwaliorSilver}</p>
                </article>
              </div>
            </div>
            </div>

         
        </div>
      </header>

      {/* <section className="mx-auto max-w-7xl px-4 pb-4">
        <div className="overflow-hidden rounded-xl border border-[#41351d] bg-[#0c0c0c] py-2">
          <div className="whitespace-nowrap px-4 text-sm font-medium text-[#e7c774]">
            ELIXIR LIVE RATES | GOLD COMEX | SILVER COMEX | INR EXCHANGE | FUTURES | PRODUCTS | JEWAR
          </div>
        </div>
      </section> */}

      {/* <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-6 md:grid-cols-3">
        {highlightCards.map((card) => (
          <article
            key={card.title}
            className="rounded-2xl border border-[#4d4024] bg-[linear-gradient(130deg,#181818_0%,#0c0c0c_100%)] p-5 shadow-[0_16px_28px_rgba(0,0,0,0.45)]"
          >
            <h2 className="font-display text-2xl text-[#f4db99]">{card.title}</h2>
            <p className="mt-3 text-3xl font-semibold text-[#fff1c8]">
              {card.row ? `${formatValue(card.row.sell)} ${card.unit}` : "Waiting..."}
            </p>
            <p className="mt-2 text-sm text-[#ccb175]">
              L: {card.row ? formatValue(card.row.low) : "-"} | H: {card.row ? formatValue(card.row.high) : "-"}
            </p>
          </article>
        ))}
      </section> */}

      <section className="mx-auto max-w-7xl px-4 pb-10">
        <div className="overflow-hidden rounded-3xl border border-[#4f4227] bg-[#0a0a0a] shadow-[0_20px_45px_rgba(0,0,0,0.55)]">
          <div className="border-b border-[#463a22] bg-[#111] px-5 py-4">
            <h3 className="font-display text-3xl text-[#f2d792]">Market Board</h3>
            <p className="mt-1 text-sm text-[#c8ab6b]">Live rates from old feed integrated in new Elixir black theme</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#1d1710] text-[#f8e7bb]">
                <tr>
                  <th className="px-4 py-3 font-medium">Instrument</th>
                  <th className="px-4 py-3 font-medium">Buy</th>
                  <th className="px-4 py-3 font-medium">Sell</th>
                  <th className="px-4 py-3 font-medium">High</th>
                  <th className="px-4 py-3 font-medium">Low</th>
                </tr>
              </thead>
              <tbody>
                {rates.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-[#bea15f]">
                      Waiting for stream data...
                    </td>
                  </tr>
                )}

                {rates.map((row, index) => (
                  <tr
                    key={row.id}
                    className={index % 2 === 0 ? "bg-[#0f0f0f] text-[#f0d59a]" : "bg-[#151515] text-[#e4c887]"}
                  >
                    <td className="px-4 py-3 font-medium">{row.label}</td>
                    <td className="px-4 py-3">{formatValue(row.buy)}</td>
                    <td className="px-4 py-3">{formatValue(row.sell)}</td>
                    <td className="px-4 py-3">{formatValue(row.high)}</td>
                    <td className="px-4 py-3">{formatValue(row.low)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8">
        <div className="rounded-3xl border border-[#44391f] bg-[#0b0b0b] p-5 sm:p-7">
          <h3 className="font-display text-3xl text-[#f0d38f]">Our Services</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((item) => (
              <div key={item} className="rounded-xl border border-[#534528] bg-[#121212] px-4 py-3 text-sm text-[#e2c27f]">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto mb-8 max-w-7xl rounded-3xl border border-[#44391f] bg-[#090909] px-4 py-6 sm:px-6">
        <h3 className="font-display text-3xl text-[#f2d58f]">Branches</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {BRANCHES.map((branch) => (
            <article key={branch.title} className="rounded-2xl border border-[#504327] bg-[#111] p-4 text-[#dec080]">
              <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f3d995]">
                {branch.title}
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-[#c5aa6e]">{branch.address}</p>
              <a className="mt-3 block text-sm text-[#f1d590]" href={`mailto:${branch.email}`}>
                {branch.email}
              </a>
              <a className="mt-1 block text-sm text-[#f1d590]" href={`tel:${branch.phone}`}>
                {branch.phone}
              </a>
            </article>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#40351f] pt-4 text-sm text-[#d6ba7d]">
          <p>Follow Us: Facebook</p>
          <p>© 2022 All Rights Reserved. ELIXIR GOLD</p>
        </div>

      </footer>

      
    </main>
     </>
  );
}

export default App;