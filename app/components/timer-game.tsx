"use client";

import React, {
  useEffect,
  useRef,
  useMemo,
  useState,
  useCallback,
  createContext,
  useContext,
} from "react";
import { useOpenUrl } from "@coinbase/onchainkit/minikit";
import { useAccount } from "wagmi";
import {
  ConnectWallet,
  ConnectWalletText,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import {
  Name,
  Identity,
  EthBalance,
  Address,
  Avatar,
} from "@coinbase/onchainkit/identity";
import { type Address as AddressType } from "viem";
import ArrowSvg from "../svg/ArrowSvg";
import GameCompleteScreen from "./game-complete";
import { AnimatedShinyText } from "./animated-shiny-text";
import { NumberTicker } from "./number-ticker";
import {
  Transaction,
  TransactionButton,
  TransactionToast,
  TransactionToastAction,
  TransactionToastIcon,
  TransactionToastLabel,
  TransactionError,
} from "@coinbase/onchainkit/transaction";
import Image from "next/image";

const MAX_SCORES = 8;
const ENTRY_FEE = 1; // $1 to play
const COUNTDOWN_FROM = 7; // 6 seconds countdown
const ROUNDS_PER_GAME = 2; // Two rounds per game
const JACKPOT_ADDRESS = "0x5ce0D48FAD146F39cc908812Ef50ccD821e19C35";
const USDC_CONTRACT_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC on Base
const USDC_CONTRACT_ETH = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC on ETH mainnet
const EAS_GRAPHQL_URL = "https://base.easscan.org/graphql";
const SCHEMA_UID = "0xdc3cf7f28b4b5255ce732cbf99fe906a5bc13fbd764e2463ba6034b4e1881835"; // Timer game schema

// ERC20 token ABI (minimal for transfer function)
const tokenABI = [
  {
    name: "transfer",
    type: "function" as const,
    stateMutability: "nonpayable" as const,
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "function" as const,
    stateMutability: "view" as const,
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "balance", type: "uint256" }],
  },
] as const;

const GameState = {
  INTRO: 0,
  WAITING_PAYMENT: 1,
  ROUND_1: 2,
  ROUND_2: 3,
  COMPLETE: 4,
};

export type Score = {
  attestationUid: string;
  transactionHash: string;
  address: AddressType;
  time: number; // Time in milliseconds
};

type Attestation = {
  decodedDataJson: string;
  attester: string;
  time: string;
  id: string;
  txid: string;
};

// Add type for Farcaster user data
type FarcasterUser = {
  username: string;
  display_name: string;
  pfp_url: string;
};

type FarcasterResponse = {
  [address: string]: {
    username: string;
    display_name: string;
    pfp_url: string;
  }[];
};

async function fetchLastAttestations() {
  const query = `
    query GetAttestations {
      attestations(
        where: { schemaId: { equals: "${SCHEMA_UID}" } }
        orderBy: { time: desc }
        take: 50
      ) {
        decodedDataJson
        attester
        time
        id
        txid
      }
    }
  `;

  try {
    // Add timeout to the fetch operation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout (increased from 5s)
    
    // Try multiple EAS endpoints for redundancy
    const easEndpoints = [
      EAS_GRAPHQL_URL,
      "https://base.easscan.org/graphql",
      "https://api.easscan.org/graphql" // Fallback endpoint
    ];
    
    let lastError = null;
    let data = null;
    
    // Try each endpoint until one works
    for (const endpoint of easEndpoints) {
      try {
        console.log(`Trying EAS endpoint: ${endpoint}`);
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
          signal: controller.signal
        });
        
        if (!response.ok) {
          console.warn(`EAS GraphQL at ${endpoint} responded with status: ${response.status}`);
          continue;
        }

        const result = await response.json();
        
        if (result.errors) {
          console.warn(`GraphQL errors from ${endpoint}:`, result.errors);
          continue;
        }
        
        data = result.data;
        if (data && data.attestations && data.attestations.length > 0) {
          // We have valid data, break out of loop
          break;
        }
      } catch (endpointErr) {
        console.warn(`Error with EAS endpoint ${endpoint}:`, endpointErr);
        lastError = endpointErr;
      }
    }
    
    clearTimeout(timeoutId);
    
    // If we didn't get any data from any endpoint
    if (!data || !data.attestations) {
      console.warn("All EAS endpoints failed. Last error:", lastError);
      return []; // Return empty array instead of mock data
    }
    
    const scores = (data.attestations ?? [])
      .map((attestation: Attestation) => {
        try {
          const parsedData = JSON.parse(attestation?.decodedDataJson ?? "[]");
          const pattern = /(0x[a-fA-F0-9]{40}) scored (\d+\.\d+) on timer/;
          
          if (!parsedData || !parsedData[0]?.value?.value) {
            return null;
          }
          
          const match = parsedData[0].value.value.match(pattern);
          if (match) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [_, address, time] = match;
            
            // Convert attestation timestamp to Date object
            const attestationDate = new Date(parseInt(attestation.time) * 1000);
            
            // Check if the attestation is from May 2025
            const isMay2025 = attestationDate.getFullYear() === 2025 && 
                             attestationDate.getMonth() === 4; // Month is 0-based, so 4 is May
            
            // Only return scores from May 2025
            if (isMay2025) {
              return {
                time: parseFloat(time),
                address,
                attestationUid: attestation.id,
                transactionHash: attestation.txid,
              };
            }
          }
        } catch (err) {
          console.error("Error parsing attestation data:", err);
        }
        return null;
      })
      .filter((item: Score | null): item is Score => item !== null)
      .sort((a: Score, b: Score) => a.time - b.time);
      
    return scores;
  } catch (err) {
    console.warn("Error fetching attestations:", err);
    return []; // Return empty array instead of mock data
  }
}

async function fetchJackpotAmount() {
  try {
    // Get the chain ID to determine which USDC contract to use
    const response = await fetch('/api/network');
    const { chainId } = await response.json();
    
    // Default to Base if we can't determine the network
    const usdcContract = chainId === 1 ? USDC_CONTRACT_ETH : USDC_CONTRACT_BASE;
    
    // Fetch the USDC balance using public RPC endpoints
    const baseRpcUrl = chainId === 1 
      ? 'https://ethereum.publicnode.com' 
      : 'https://base.publicnode.com';
    
    // Build the balanceOf request
    const data = {
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_call',
      params: [
        {
          to: usdcContract,
          data: `0x70a08231000000000000000000000000${JACKPOT_ADDRESS.substring(2)}` // balanceOf function signature + address
        },
        'latest'
      ]
    };
    
    const balanceResponse = await fetch(baseRpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await balanceResponse.json();
    
    if (result.result) {
      // Convert hex result to decimal and adjust for 6 decimals (USDC has 6 decimals)
      const balance = parseInt(result.result, 16) / 1000000;
      return balance || 0; // Return actual balance or 0 if null/undefined
    }
    
    // If request failed, fall back to current active players estimate
    const scores = await fetchLastAttestations();
    return scores.length * ENTRY_FEE || 0;
  } catch (error) {
    console.error('Failed to fetch jackpot amount:', error);
    // Fall back to a basic calculation based on active players
    try {
      const scores = await fetchLastAttestations();
      return scores.length * ENTRY_FEE || 0;
    } catch {
      return 0; // Default to 0 if everything fails
    }
  }
}

type HighScoresContextType = {
  highScores: Score[];
  checkIsHighScore: (currentTime: number | null) => boolean;
  invalidateHighScores: () => void;
  loadHighScores: () => Promise<void>;
  jackpotAmount: number;
};

const emptyHighScoresContext = {} as HighScoresContextType;
export const HighScoresContext = createContext<HighScoresContextType>(
  emptyHighScoresContext,
);
export function useHighScores() {
  const context = useContext(HighScoresContext);
  if (context === emptyHighScoresContext) {
    throw new Error(
      "useHighScores must be used within an HighScoresProvider component",
    );
  }
  return context;
}

function HighScoresProvider({ children }: { children: React.ReactNode }) {
  const [highScores, setHighScores] = useState<Score[]>([]);
  const [invalidate, setInvalidate] = useState(true);
  const [jackpotAmount, setJackpotAmount] = useState(0);

  const loadHighScores = useCallback(async () => {
    if (invalidate) {
      setInvalidate(false);
      const scores = await fetchLastAttestations();
      setHighScores(scores ?? []);
      
      // Fetch the actual jackpot amount from the contract
      const amount = await fetchJackpotAmount();
      setJackpotAmount(amount);
    }
  }, [invalidate]);

  const invalidateHighScores = useCallback(() => {
    setInvalidate(true);
  }, []);

  const checkIsHighScore = useCallback(
    (currentTime: number | null) => {
      if (currentTime === null) {
        return false; // If no time recorded, it's not a valid score
      }

      // Don't score zero times
      if (currentTime <= 0) {
        return false;
      }

      // If less than MAX_SCORES scores or current time is closer to zero than the highest time
      if (
        (highScores?.length ?? 0) < MAX_SCORES ||
        (highScores && highScores.length > 0 ? 
          currentTime < highScores[highScores.length - 1].time : 
          true)
      ) {
        return true;
      }
      return false;
    },
    [highScores],
  );

  const value = useMemo(
    () => ({
      highScores,
      invalidateHighScores,
      checkIsHighScore,
      loadHighScores,
      jackpotAmount,
    }),
    [highScores, invalidateHighScores, checkIsHighScore, loadHighScores, jackpotAmount],
  );

  return (
    <HighScoresContext.Provider value={value}>
      {children}
    </HighScoresContext.Provider>
  );
}

export function WalletControl() {
  return (
    <Wallet className="[&>div:nth-child(2)]:!opacity-20 md:[&>div:nth-child(2)]:!opacity-100">
      <ConnectWallet className="w-11 h-11 bg-[#0052FF] rounded-full hover:bg-[#0052FF]/90 focus:bg-[#0052FF] cursor-pointer select-none transition-all duration-150 border-[2px] border-white min-w-11 [box-shadow:0_4px_0_0_#002299,0_6px_4px_0_rgba(0,34,153,0.3)] z-30">
        <ConnectWalletText>{""}</ConnectWalletText>
      </ConnectWallet>
      <WalletDropdown>
        <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
          <Avatar />
          <Name />
          <Address />
          <EthBalance />
        </Identity>
        <WalletDropdownDisconnect />
      </WalletDropdown>
    </Wallet>
  );
}

function formatTime(seconds: number | null): string {
  if (seconds === null || seconds <= 0) return "00.000";
  
  const wholeSeconds = Math.floor(seconds);
  const milliseconds = Math.floor((seconds - wholeSeconds) * 1000);
  
  return `${wholeSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

// Calculate color based on how close to zero
function getTimeColor(time: number | null): string {
  if (time === null || time <= 0) return "text-red-500";
  if (time < 0.5) return "text-green-500";
  if (time < 1) return "text-blue-500";
  return "text-black";
}

type IntroProps = {
  onStartGame: () => void;
};

function Intro({ onStartGame }: IntroProps) {
  const { highScores, jackpotAmount, loadHighScores } = useHighScores();
  const openUrl = useOpenUrl();
  const { address, chainId } = useAccount();
  const [farcasterUsers, setFarcasterUsers] = useState<Record<string, FarcasterUser>>({});

  useEffect(() => {
    loadHighScores();
  }, [loadHighScores]);

  // Add effect to fetch Farcaster data when highScores changes
  useEffect(() => {
    async function fetchFarcasterData() {
      if (highScores.length === 0) return;
      
      // Get unique addresses
      const addresses = [...new Set(highScores.map(score => score.address.toLowerCase()))];
      
      try {
        const response = await fetch(`/api/farcaster?addresses=${addresses.join(',')}`);
        if (!response.ok) {
          throw new Error('Failed to fetch Farcaster data');
        }
        const data = await response.json() as FarcasterResponse;
        
        // Transform the data into a more usable format
        const users: Record<string, FarcasterUser> = {};
        Object.entries(data).forEach(([address, userArray]) => {
          if (userArray?.[0]) {
            users[address.toLowerCase()] = {
              username: userArray[0].username,
              display_name: userArray[0].display_name,
              pfp_url: userArray[0].pfp_url
            };
          }
        });
        
        setFarcasterUsers(users);
      } catch (error) {
        console.error('Error fetching Farcaster data:', error);
      }
    }

    fetchFarcasterData();
  }, [highScores]);

  const handleHighScoreClick = (score: Score) => {
    openUrl(`https://basescan.org/tx/${score.transactionHash}`);
  };

  const handleProfileClick = (username: string) => {
    openUrl(`https://warpcast.com/${username}`);
  };

  // Function to get Farcaster username or display address
  const getDisplayName = (address: string): string => {
    const lowerAddress = address.toLowerCase();
    const farcasterUser = farcasterUsers[lowerAddress];
    if (farcasterUser) {
      return `@${farcasterUser.username}`;
    }
    // If no Farcaster username, return shortened address
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Determine which USDC contract to use based on the connected network
  const usdcContract = chainId === 1 ? USDC_CONTRACT_ETH : USDC_CONTRACT_BASE;

  return (
    <div className="absolute inset-0 flex flex-col items-center bg-[#E5E5E5] z-10 m-[10px] mb-[30px] pb-6 rounded-xl">
      <div className="mt-12 text-center max-w-[90%]">
        <h1 className="text-5xl font-bold mb-3 font-serif text-blue-600 leading-tight tracking-tight">
          Timed Right        </h1>
        <p className="text-xl mb-2 text-gray-700 font-serif">
          Press the button as close to <span className="font-mono font-bold text-blue-600">00.000</span> as possible{" "}
          <AnimatedShinyText className="font-mono text-xl font-bold text-blue-600 dark:text-blue-500">
            WITHOUT HITTING ZERO MFER!
          </AnimatedShinyText>
        </p>
        <p className="text-lg mb-4 text-gray-600 font-serif">${ENTRY_FEE} USDC to play • {ROUNDS_PER_GAME} rounds • Don&apos;t hit zero!</p>
      </div>
      
      <div className="flex flex-col items-center justify-between flex-1 w-full gap-4 pb-12">
        <div className="flex flex-col items-center gap-4">
          <div className="text-xl font-semibold font-serif text-center">CURRENT JACKPOT</div>
          <div className="timer-jackpot mb-4">
            <span className="jackpot-dollar">$</span>
            <NumberTicker 
              value={jackpotAmount} 
              className="whitespace-pre-wrap text-[4.5rem] font-bold font-mono tracking-tighter text-[#FF9500] glow-text" 
            />
          </div>
          
          {!address ? (
            <div>
              <Wallet>
                <ConnectWallet className="px-10 py-4 bg-[#0052FF] text-white text-2xl font-bold rounded-full 
                  hover:bg-[#0052FF]/90 transform hover:scale-105 transition-all duration-200 
                  [box-shadow:0_8px_0_0_#002299,0_12px_6px_0_rgba(0,34,153,0.3)]
                  hover:shadow-blue-200 active:translate-y-1 active:[box-shadow:0_4px_0_0_#002299] timer-button-press font-serif">
                  <ConnectWalletText>Connect Wallet to Play</ConnectWalletText>
                </ConnectWallet>
              </Wallet>
            </div>
          ) : (
            <div>
              <Transaction
                calls={[
                  {
                    address: usdcContract,
                    abi: tokenABI,
                    functionName: "transfer",
                    args: [
                      JACKPOT_ADDRESS, 
                      BigInt(1000000) // $1 USDC (6 decimals)
                    ],
                  },
                ]}
                onSuccess={() => {
                  // Start the game after successful payment
                  onStartGame();
                  // Refresh jackpot amount
                  loadHighScores();
                }}
                onError={(error: TransactionError) =>
                  console.error("Payment failed:", error)
                }
              >
                <TransactionButton
                  text={`Start Game ($${ENTRY_FEE})`}
                  className="px-10 py-4 bg-[#0052FF] text-white text-2xl font-bold rounded-full 
                    hover:bg-[#0052FF]/90 transform hover:scale-105 transition-all duration-200 
                    [box-shadow:0_8px_0_0_#002299,0_12px_6px_0_rgba(0,34,153,0.3)]
                    hover:shadow-blue-200 active:translate-y-1 active:[box-shadow:0_4px_0_0_#002299] timer-button-press font-serif"
                />
                <TransactionToast className="mb-4">
                  <TransactionToastIcon />
                  <TransactionToastLabel />
                  <TransactionToastAction />
                </TransactionToast>
              </Transaction>
            </div>
          )}
        </div>
        
        <div className="relative w-full flex flex-col items-center mt-8">
          <h1 className="leaderboard-title mb-1">LEADERBOARD</h1>
          <div className="leaderboard-divider mb-2"></div>
          
          <div className="leaderboard-container w-[90%] max-w-[400px] overflow-hidden rounded-lg bg-white/30 backdrop-blur-sm shadow-lg max-h-[200px] overflow-y-auto">
            {highScores.length === 0 ? (
              <div className="p-3 text-center font-serif">No scores yet. Be the first to play!</div>
            ) : (
              highScores
                .sort((a, b) => a.time - b.time)
                .map((score, index) => {
                  const farcasterUser = farcasterUsers[score.address.toLowerCase()];
                  return (
                    <div
                      key={score.attestationUid}
                      className={`flex items-center w-full p-2 transition-all duration-200 border-b border-blue-100 font-serif
                        ${index === 0 ? 'bg-amber-50' : ''}`}
                    >
                      <span className={`w-8 font-bold ${index === 0 ? 'text-amber-500' : index === 1 ? 'text-gray-500' : index === 2 ? 'text-amber-700' : 'text-gray-700'}`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                      </span>
                      
                      {/* Profile section - clickable for Farcaster profile */}
                      <button
                        type="button"
                        className="flex items-center flex-grow hover:bg-blue-50 rounded-lg px-2 py-1 transition-colors"
                        onClick={() => farcasterUser?.username && handleProfileClick(farcasterUser.username)}
                        disabled={!farcasterUser?.username}
                      >
                        <div className="flex items-center space-x-2">
                          {farcasterUser?.pfp_url && (
                            <Image 
                              src={farcasterUser.pfp_url} 
                              alt="Profile" 
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                          )}
                          <span className={`text-black font-medium ${farcasterUser?.username ? 'hover:text-blue-600 cursor-pointer' : ''}`}>
                            {getDisplayName(score.address)}
                          </span>
                        </div>
                      </button>

                      {/* Score section - clickable for BaseScan transaction */}
                      <button
                        type="button"
                        onClick={() => handleHighScoreClick(score)}
                        className="flex items-center space-x-2 hover:bg-blue-50 rounded-lg px-2 py-1 transition-colors ml-auto"
                      >
                        <div className="text-blue-500">
                          <ArrowSvg />
                        </div>
                        <div className={`text-right font-mono font-bold time-highlight ${getTimeColor(score.time)}`}>
                          {formatTime(score.time)}
                        </div>
                      </button>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type TimerDisplayProps = {
  time: number;
  round: number;
  bestTime: number | null;
  isPressedTime: boolean;
};

function TimerDisplay({ time, round, bestTime, isPressedTime }: TimerDisplayProps) {
  const timeColor = getTimeColor(time);
  
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="text-2xl mb-4 font-semibold font-serif">Round {round}/{ROUNDS_PER_GAME}</div>
      <div className={`text-8xl font-serif font-bold mb-6 transition-all duration-200 time-highlight ${timeColor} 
        ${isPressedTime ? 'scale-125 animate-ping-once' : 'animate-pulse-slow'}`}>
        {formatTime(time)}
      </div>
      {bestTime !== null && (
        <div className="text-lg bg-white/30 px-4 py-1 rounded-full shadow-inner font-serif">
          Best Time: <span className={`font-serif font-bold ${getTimeColor(bestTime)}`}>{formatTime(bestTime)}</span>
        </div>
      )}
    </div>
  );
}

export default function TimerGame() {
  const [gameState, setGameState] = useState(GameState.INTRO);
  const [timeRemaining, setTimeRemaining] = useState(COUNTDOWN_FROM);
  const [round, setRound] = useState(1);
  const [pressedTime, setPressedTime] = useState<number | null>(null);
  const [round1Time, setRound1Time] = useState<number | null>(null);
  const [round2Time, setRound2Time] = useState<number | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const { address } = useAccount(); // Add wallet account hook

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Handle game state changes
  useEffect(() => {
    if (gameState === GameState.ROUND_1 || gameState === GameState.ROUND_2) {
      // Start the timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      setTimeRemaining(COUNTDOWN_FROM);
      setPressedTime(null);
      
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = Math.max(0, prev - 0.004); // Increase decrement to match real seconds
          if (newTime === 0) {
            // If timer hits zero, player loses this round but should continue
            clearInterval(intervalRef.current!);
            setPressedTime(0);
            
            // Automatically transition to next round or complete after a delay
            setTimeout(() => {
              if (gameState === GameState.ROUND_1) {
                setRound1Time(0); // Record zero time for this round
                setGameState(GameState.ROUND_2);
                setRound(2);
              } else if (gameState === GameState.ROUND_2) {
                setRound2Time(0); // Record zero time for this round
                setGameState(GameState.COMPLETE);
              }
            }, 1500);
          }
          return newTime;
        });
      }, 1); // Update every 1ms for accurate millisecond countdown
    } else {
      // Clear the timer when not in a round
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [gameState]);

  // Update best time when round times change
  useEffect(() => {
    // Calculate best time from both rounds (excluding zeros)
    const validTimes = [round1Time, round2Time].filter((time): time is number => 
      time !== null && time > 0
    );
    
    if (validTimes.length > 0) {
      // We have at least one valid time
      const newBestTime = Math.min(...validTimes);
      setBestTime(newBestTime);
    } else if (round1Time === 0 && round2Time === 0) {
      // Both rounds were zero
      setBestTime(null);
    } else if (round1Time === 0 && round2Time === null) {
      // First round was zero, second round not played yet
      setBestTime(null); 
    } else if (round1Time === null && round2Time === 0) {
      // Should never happen, but just in case
      setBestTime(null);
    } else {
      // No valid scores yet
      setBestTime(null);
    }
  }, [round1Time, round2Time]);

  const handleStartGame = useCallback(() => {
    // Only allow starting the game if wallet is connected
    if (!address) return;
    
    // In a real implementation, we would process the payment here
    setGameState(GameState.ROUND_1);
    setRound(1);
    setRound1Time(null);
    setRound2Time(null);
    setBestTime(null);
  }, [address]);

  const handleButtonPress = useCallback(() => {
    if (pressedTime !== null) return; // Already pressed in this round
    
    const currentTime = timeRemaining;
    setPressedTime(currentTime);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Store the time for the current round
    if (gameState === GameState.ROUND_1) {
      setRound1Time(currentTime);
    } else if (gameState === GameState.ROUND_2) {
      setRound2Time(currentTime);
    }
    
    // Move to next round or complete after a delay
    setTimeout(() => {
      if (gameState === GameState.ROUND_1) {
        setGameState(GameState.ROUND_2);
        setRound(2);
      } else if (gameState === GameState.ROUND_2) {
        setGameState(GameState.COMPLETE);
      }
    }, 1500); // Show the pressed time for 1.5 seconds
  }, [gameState, pressedTime, timeRemaining]);

  const handlePlayAgain = useCallback(() => {
    setGameState(GameState.INTRO);
    setRound1Time(null);
    setRound2Time(null);
    setBestTime(null);
  }, []);

  return (
    <HighScoresProvider>
      <div className="flex flex-col items-center justify-center h-full relative">
        {gameState === GameState.INTRO && (
          <Intro onStartGame={handleStartGame} />
        )}
        
        {(gameState === GameState.ROUND_1 || gameState === GameState.ROUND_2) && (
          <div className="flex flex-col items-center justify-center h-full animate-fadeIn">
            <div className="flex flex-col items-center justify-center gap-14 mt-24 mb-20">
              <TimerDisplay 
                time={pressedTime !== null ? pressedTime : timeRemaining} 
                round={round} 
                bestTime={round === 2 && round1Time && round1Time > 0 ? round1Time : null}
                isPressedTime={pressedTime !== null}
              />
              
              <button
                type="button"
                disabled={pressedTime !== null}
                className={`relative px-16 py-8 rounded-full text-2xl font-bold transition-all duration-200 timer-button-press font-serif
                  ${pressedTime !== null 
                    ? 'bg-gray-400 text-white cursor-not-allowed opacity-50' 
                    : 'text-white shadow-lg bg-[#0052FF]'} 
                  ${isButtonPressed && !pressedTime ? 'transform translate-y-1 shadow' : 'shadow-xl hover:shadow-blue-200'} 
                  ${isButtonHovered && !pressedTime ? 'scale-105' : ''}`}
                onClick={handleButtonPress}
                onMouseEnter={() => setIsButtonHovered(true)}
                onMouseLeave={() => {
                  setIsButtonHovered(false);
                  setIsButtonPressed(false);
                }}
                onMouseDown={() => setIsButtonPressed(true)}
                onMouseUp={() => setIsButtonPressed(false)}
              >
                <span className="relative z-10">PRESS</span>
                {!pressedTime && (
                  <span className="absolute inset-0 bg-[#0052FF]/70 rounded-full animate-pulse-slow opacity-60"></span>
                )}
              </button>
              
              <div className="text-lg font-medium text-center px-6 py-3 rounded-lg bg-white/30 shadow-inner max-w-[90%] font-serif">
                {pressedTime === null ? (
                  <span className="animate-pulse-slow">Press the button as close to 00.000 as possible!</span>
                ) : pressedTime > 0 ? (
                  <span className="text-green-600">Great timing! <span className={`font-serif font-bold time-highlight ${getTimeColor(pressedTime)}`}>{formatTime(pressedTime)}</span></span>
                ) : (
                  <span className="text-red-500">Too late! You hit zero.</span>
                )}
              </div>
            </div>
          </div>
        )}
        
        {gameState === GameState.COMPLETE && (
          <GameCompleteScreen 
            bestTime={bestTime} 
            onPlayAgain={handlePlayAgain} 
          />
        )}
      </div>
    </HighScoresProvider>
  );
} 