import { Suspense } from "react";
import SwapInterface from "./SwapInterface";

async function getCoinsData() {
  // Fetch ChoccySwap details
  const ccyRes = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=choccyswap&vs_currencies=usd",
    {
      next: { revalidate: 60 },
    }
  );

  // Fetch trending coins
  const trendingRes = await fetch(
    "https://api.coingecko.com/api/v3/search/trending",
    {
      next: { revalidate: 60 },
    }
  );

  if (!ccyRes.ok || !trendingRes.ok) {
    throw new Error("Failed to fetch coin data");
  }

  const ccyData = await ccyRes.json();
  const trendingData = await trendingRes.json();

  return { ccyData, trendingData };
}

interface TrendingCoin {
  item: {
    id: string;
    name: string;
    symbol: string;
    price_btc: number;
  };
}

export default async function Swap() {
  const { ccyData, trendingData } = await getCoinsData();

  // Create CCY object with real data
  const ccy = {
    id: "choccyswap",
    name: "ChoccySwap",
    symbol: "CCY",
    price: ccyData.choccyswap.usd,
  };

  // Get Bitcoin price for conversion
  const btcRes = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
    {
      next: { revalidate: 60 },
    }
  );
  const btcData = await btcRes.json();
  const btcUsdPrice = btcData.bitcoin.usd;

  const trendingCoins = trendingData.coins.map((coin: TrendingCoin) => ({
    id: coin.item.id,
    name: coin.item.name,
    symbol: coin.item.symbol,
    price: coin.item.price_btc * btcUsdPrice, // Convert BTC price to USD
  }));

  // Place CCY at the top of the list
  const allCoins = [ccy, ...trendingCoins];

  return (
    <main
      id="swap"
      className="flex flex-col relative z-0 min-h-screen items-center justify-center px-8 lg:px-24 py-16 bg-black  overflow-hidden"
    >
      <h3 className="text-[#ED8FDD] font-medium text-[45px] font-oswald mb-4">
        SWAP
      </h3>
      <Suspense fallback={<div>Loading...</div>}>
        <SwapInterface trendingCoins={allCoins} />
      </Suspense>
      {/* <Image
        width={633}
        height={633}
        src="/glow.png"
        alt="bg"
        className="absolute -z-[1]  md:opacity-100 opacity-50 -right-[20%] bottom-10"
      />
      <Image
        width={633}
        height={633}
        src="/glow.png"
        alt="bg"
        className="absolute -z-[1] md:opacity-100 opacity-20 -left-[20%] bottom-60"
      />
      <Image
        width={633}
        height={633}
        src="/glow.png"
        alt="bg"
        className="absolute -z-[1] md:opacity-100 opacity-30 -translate-x-1/2 left-1/2 -translate-y-1/2 top-1/2"
      /> */}
      <div
        className="absolute -z-[1] top-0 left-0"
        style={{
          backgroundImage: "url('/feature-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          height: "100%",
          width: "100%",
        }}
      />
    </main>
  );
}
