"use client";

import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css"; // Import Swiper styles

type Token = {
  id: string;
  symbol: string;
  name: string;
  price: number;
  address?: string;
  image?: string;
};

const CHOCCY_TOKEN: Omit<Token, "price" | "image"> = {
  id: "choccyswap",
  symbol: "CCY",
  name: "ChoccySwap",
};

const STATIC_TOKENS: Omit<Token, "price" | "image">[] = [
  { id: "chromaway", symbol: "CHR", name: "Chromia" },
  { id: "tether", symbol: "USDT", name: "Tether" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "usd-coin", symbol: "USDC", name: "USD Coin" },
];

export default function Component() {
  const [amount1, setAmount1] = useState("1000.00");
  const [amount2, setAmount2] = useState("0");
  const [token1, setToken1] = useState<Token | null>(null);
  const [token2, setToken2] = useState<Token | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showTokenList, setShowTokenList] = useState(false);
  const [activeInput, setActiveInput] = useState<"top" | "bottom" | null>(null);
  const [allTokens, setAllTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Conversion function
  const convert = (
    amount: string,
    fromToken: Token | null,
    toToken: Token | null,
    setResult: (value: string) => void
  ) => {
    if (!fromToken || !toToken) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      setResult("0");
      return;
    }

    const usdValue = parsedAmount * fromToken.price;
    const conversion = usdValue / toToken.price;
    setResult(conversion.toFixed(6));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch top coins data with contract addresses using proxy
        const topCoinsResponse = await fetch(
          "/api/coingecko?endpoint=/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=30&page=1&sparkline=false"
        );
        if (!topCoinsResponse.ok) {
          throw new Error(`HTTP error! status: ${topCoinsResponse.status}`);
        }
        const topCoinsData = await topCoinsResponse.json();

        // Fetch prices and contract addresses for static tokens using proxy
        const staticTokenIds = [CHOCCY_TOKEN, ...STATIC_TOKENS]
          .map((token) => token.id)
          .join(",");
        const staticTokensResponse = await fetch(
          `/api/coingecko?endpoint=/coins/markets?vs_currency=usd&ids=${staticTokenIds}&order=market_cap_desc&per_page=5&page=1&sparkline=false`
        );
        if (!staticTokensResponse.ok) {
          throw new Error(`HTTP error! status: ${staticTokensResponse.status}`);
        }
        const staticTokensData = await staticTokensResponse.json();

        // Fetch token addresses
        const addressesResponse = await fetch(
          `/api/coingecko?endpoint=/coins/list?include_platform=true`
        );
        if (!addressesResponse.ok) {
          throw new Error(`HTTP error! status: ${addressesResponse.status}`);
        }
        const addressesData = await addressesResponse.json();

        const addressMap = addressesData.reduce(
          (
            acc: Record<string, string>,
            coin: { id: string; platforms: { ethereum?: string } }
          ) => {
            if (coin.platforms && coin.platforms.ethereum) {
              acc[coin.id] = coin.platforms.ethereum;
            }
            return acc;
          },
          {}
        );

        type CoinData = {
          id: string;
          name: string;
          symbol: string;
          current_price: number;
          image?: string;
        };

        const processTokenData = (data: CoinData[]): Token[] => {
          return data.map((coin) => ({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol.toUpperCase(),
            price: coin.current_price || 1,
            address: addressMap[coin.id],
            image: coin.image,
          }));
        };

        const topTokens = processTokenData(topCoinsData);
        const staticTokens = processTokenData(staticTokensData);

        // Create ChoccySwap token with a mock price (you can adjust this as needed)
        const choccySwapToken: Token = {
          ...CHOCCY_TOKEN,
          price: 0.017, // This sets 1 CCY = $0.017
          image: "/neon logo.svg",
        };

        // Combine tokens, ensuring ChoccySwap is first, followed by static tokens, then others
        const allTokensList = [
          choccySwapToken,
          ...staticTokens.filter((token) => token.id !== choccySwapToken.id),
          ...topTokens.filter(
            (token) =>
              ![
                choccySwapToken.id,
                ...STATIC_TOKENS.map((st) => st.id),
              ].includes(token.id)
          ),
        ];

        setAllTokens(allTokensList);

        // Set initial tokens
        setToken1(choccySwapToken);
        setToken2(
          allTokensList.find((token) => token.symbol === "USDC") ||
            allTokensList[1]
        );

        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch token data. Using default values.");

        const defaultTokens: Token[] = [
          { ...CHOCCY_TOKEN, price: 0.017, image: "/neon logo.svg" },
          ...STATIC_TOKENS.map((token) => ({
            ...token,
            price: token.symbol === "USDC" ? 1 : 2000,
            image: undefined,
          })),
        ];
        setAllTokens(defaultTokens);
        setToken1(defaultTokens[0]);
        setToken2(defaultTokens[1]);

        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (token1 && token2) {
      convert(amount1, token1, token2, setAmount2);
    }
  }, [token1, token2, amount1]);

  const filteredTokens = allTokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const swapTokens = () => {
    setToken1(token2);
    setToken2(token1);
    setAmount1(amount2);
    convert(amount2, token2, token1, setAmount1);
  };

  const handleTokenSelect = (token: Token) => {
    if (activeInput === "top") {
      if (token.id === token2?.id) {
        setToken2(token1);
      }
      setToken1(token);
    } else {
      if (token.id === token1?.id) {
        setToken1(token2);
      }
      setToken2(token);
    }
    setShowTokenList(false);
    setSearchTerm("");
    setActiveInput(null);
  };

  const handleAmount1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount1(value);
    convert(value, token1, token2, setAmount2);
  };

  const handleAmount2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount2(value);
    convert(value, token2, token1, setAmount1);
  };

  if (isLoading) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="relative w-full font-poppins max-w-md mx-auto p-3 py-6 md:p-6 bg-[#FFFFFF] bg-opacity-[5%] text-white rounded-3xl border border-[#ED8FDD] shadow-lg">
      {error && (
        <div className="mb-4 p-2 bg-red-500 bg-opacity-20 rounded text-red-300 text-sm">
          {error}
        </div>
      )}
      <div className="flex items-center justify-center mb-4 gap-1 ">
        <Image
          className="pointer-events-none"
          src="/neon logo.svg"
          alt="ChoccySwap"
          width={48}
          height={48}
        />
        <Image
          src="/writing.svg"
          alt="ChoccySwap"
          width={120}
          height={68}
          className="pt-2 pointer-events-none"
        />
      </div>
      <div className="relative">
        <div className="space-y-6">
          <div className="bg-[#ed8fdd14]  flex items-center justify-between  rounded-lg p-3">
            <button
              onClick={() => {
                setShowTokenList(true);
                setActiveInput("top");
              }}
              className="w-24 bg-[#ED8FDD] bg-opacity-[20%] text-white rounded px-3 py-2 hover:bg-opacity-[30%] transition-colors"
            >
              {token1?.symbol || "Select"}
            </button>
            <input
              type="number"
              value={amount1}
              onChange={handleAmount1Change}
              className="bg-transparent text-right text-white font-semibold focus:outline-none"
            />
          </div>
          {/* {token1 && (
          <div className="text-sm text-gray-400">
            ≈ {formatUSD(parseFloat(amount1) * token1.price)}
          </div>
        )} */}
        </div>
        <div
          onClick={swapTokens}
          className="absolute -translate-x-1/2 left-1/2 top-[40%] -translate-y-1/2 w-full flex items-center mt-4 justify-center"
        >
          <button className="w-fit h-fit" onClick={swapTokens}>
            <Swap />
          </button>
        </div>
        <div className="mt-2 space-y-6">
          <div className="bg-[#ed8fdd14]   flex items-center justify-between  rounded-lg p-3">
            <button
              onClick={() => {
                setShowTokenList(true);
                setActiveInput("bottom");
              }}
              className="w-24 bg-[#ED8FDD] bg-opacity-[20%] text-white rounded px-3 py-2 hover:bg-opacity-[30%] transition-colors"
            >
              {token2?.symbol || "Select"}
            </button>
            <input
              type="number"
              value={amount2}
              onChange={handleAmount2Change}
              className="bg-transparent text-right text-white font-semibold focus:outline-none"
            />
          </div>
        </div>
      </div>
      <button className="w-full mt-6 bg-[#630468] text-white rounded-full px-3 py-2 hover:bg-opacity-[20%] transition-colors">
        + More settings
      </button>
      <div className="grid grid-cols-2 gap-4 mt-6">
        <button className="w-full bg-[#ED8FDD] bg-opacity-[20%] text-white rounded px-3 py-2 hover:bg-opacity-[30%] transition-colors">
          BUY
        </button>
        <button className="w-full bg-[#ED8FDD] bg-opacity-[20%] text-white rounded px-3 py-2 hover:bg-opacity-[30%] transition-colors">
          ADVANCED MODE
        </button>
      </div>
      {showTokenList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hide-scrollbar">
          <div className="bg-[#000000] p-4 rounded-3xl w-80 border border-[#ED8FDD]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Select Token</h2>
              <button
                onClick={() => setShowTokenList(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search tokens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#ED8FDD] bg-opacity-[3%] text-white rounded px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-[#ED8FDD]"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <Swiper
              spaceBetween={5} // Adjusts the gap between slides
              slidesPerView={4}
              freeMode={true} // Enables drag-to-scroll effect
            >
              {filteredTokens.map((token) => (
                <SwiperSlide className="" key={token.id}>
                  <button
                    className="bg-gray-900  flex gap-1 px-3 py-1 rounded "
                    onClick={() => handleTokenSelect(token)}
                  >
                    {token.symbol}
                  </button>
                </SwiperSlide>
              ))}
            </Swiper>

            <div className="space-y-2 max-h-60 overflow-y-auto hide-scrollbar mt-2">
              {filteredTokens.map((token) => (
                <button
                  key={token.id}
                  onClick={() => handleTokenSelect(token)}
                  className="w-full text-left px-3 py-2 rounded hover:bg-[#ED8FDD] hover:bg-opacity-[8%] transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 flex-shrink-0">
                      {token.image && (
                        <Image
                          src={token.image}
                          alt={token.symbol}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      )}
                    </div>
                    <div className="flex flex-col flex-grow overflow-hidden">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{token.symbol}</span>
                        <span className="text-gray-400 text-sm truncate">
                          {token.name}
                        </span>
                      </div>
                      {token.address && (
                        <div className="text-xs text-gray-500 truncate">
                          {token.address}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Swap() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
    >
      <g
        fill="none"
        stroke="white"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
      >
        <path d="M3 12a9 9 0 0 1 9-9a9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5m5 4a9 9 0 0 1-9 9a9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M8 16H3v5" />
      </g>
    </svg>
  );
}
