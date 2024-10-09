"use client";

import React, { useState, useEffect } from "react";
import { Search, ArrowUpDown, X } from "lucide-react";
import Image from "next/image";

type Token = {
  id: string;
  symbol: string;
  name: string;
  price: number;
  address?: string;
};

const STATIC_TOKENS: Omit<Token, "price">[] = [
  { id: "choccyswap", symbol: "CCY", name: "ChoccySwap" },
  { id: "usd", symbol: "USD", name: "US Dollar" },
  { id: "eur", symbol: "EUR", name: "Euro" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
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

    const conversion = (parsedAmount * fromToken.price) / toToken.price;
    setResult(conversion.toFixed(6));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch top coins data
        const topCoinsRes = await fetch(
          "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=30&page=1&sparkline=false"
        );
        if (!topCoinsRes.ok) {
          throw new Error(`HTTP error! status: ${topCoinsRes.status}`);
        }
        const topCoinsData = await topCoinsRes.json();

        // Fetch prices for static tokens
        const staticTokenIds = STATIC_TOKENS.map((token) => token.id).join(",");
        const staticTokensRes = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${staticTokenIds}&vs_currencies=usd`
        );
        if (!staticTokensRes.ok) {
          throw new Error(`HTTP error! status: ${staticTokensRes.status}`);
        }
        const staticTokensPrices = await staticTokensRes.json();

        type Coin = {
          id: string;
          name: string;
          symbol: string;
          current_price: number;
        };

        const topTokens: Token[] = topCoinsData.map((coin: Coin) => ({
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol.toUpperCase(),
          price: coin.current_price || 1,
        }));

        const staticTokens: Token[] = STATIC_TOKENS.map((token) => ({
          ...token,
          price: staticTokensPrices[token.id]?.usd || 1, // Default to 1 if price not found
        }));

        // Combine static tokens and top tokens, removing duplicates
        const allTokensList = [
          ...staticTokens,
          ...topTokens.filter(
            (token) => !STATIC_TOKENS.some((st) => st.id === token.id)
          ),
        ];

        setAllTokens(allTokensList);

        // Set initial tokens
        const choccySwapToken =
          allTokensList.find((token) => token.id === "choccyswap") ||
          staticTokens[0];
        const usdToken =
          allTokensList.find((token) => token.id === "usd") || staticTokens[1];

        setToken1(choccySwapToken);
        setToken2(usdToken);

        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch token data. Using default values.");

        const defaultTokens: Token[] = STATIC_TOKENS.map((token) => ({
          ...token,
          price: token.symbol === "ETH" ? 2000 : 1, // Default prices
        }));
        setAllTokens(defaultTokens);
        setToken1(defaultTokens[0]); // ChoccySwap
        setToken2(defaultTokens[1]); // USD

        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Perform initial conversion when tokens are set
  useEffect(() => {
    if (token1 && token2) {
      convert(amount1, token1, token2, setAmount2);
    }
  }, [token1, token2]);

  const filteredTokens = allTokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const swapTokens = () => {
    setToken1(token2);
    setToken2(token1);
    const tempAmount = amount1;
    setAmount1(amount2);
    setAmount2(tempAmount);
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
      <div className="flex items-center justify-center mb-4">
        <Image src="/logo.png" alt="logo" width={256} height={92} />
      </div>
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
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
            className="flex-grow bg-[#ED8FDD] bg-opacity-[3%] text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ED8FDD]"
          />
        </div>
      </div>
      <button
        // href={"/"}
        onClick={swapTokens}
        className="w-full mt-6 bg-[#630468] text-white rounded-full px-3 py-2 hover:bg-opacity-80 transition-colors flex items-center justify-center"
      >
        <ArrowUpDown className="mr-2 h-4 w-4" />
        Swap
      </button>
      <div className="mt-6 space-y-6">
        <div className="flex items-center space-x-2">
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
            className="flex-grow bg-[#ED8FDD] bg-opacity-[3%] text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ED8FDD]"
          />
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
          <div className="bg-[#000000] p-4 rounded-lg w-80 border border-[#ED8FDD]">
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
            <div className="space-y-2 max-h-60 overflow-y-auto hide-scrollbar">
              {filteredTokens.map((token) => (
                <button
                  key={token.id}
                  onClick={() => handleTokenSelect(token)}
                  className="w-full text-left px-3 py-2 rounded hover:bg-[#ED8FDD] hover:bg-opacity-[8%] transition-colors flex items-center space-x-2"
                >
                  <span className="font-medium">{token.symbol}</span>
                  <span className="text-gray-400 text-sm">{token.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
