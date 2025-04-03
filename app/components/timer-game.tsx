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
import { useOpenUrl, useNotification } from "@coinbase/onchainkit/minikit";
import {
  Transaction,
  TransactionButton,
  TransactionToast,
  TransactionToastAction,
  TransactionToastIcon,
  TransactionToastLabel,
  TransactionError,
} from "@coinbase/onchainkit/transaction";
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
import { useAccount } from "wagmi";
import { encodeAbiParameters, type Address as AddressType } from "viem";
import ArrowSvg from "../svg/ArrowSvg";

const MAX_SCORES = 8;
const ENTRY_FEE = 1; // $1 to play
const COUNTDOWN_FROM = 15; // 15 seconds countdown
const ROUNDS_PER_GAME = 2; // Two rounds per game

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

const EAS_GRAPHQL_URL = "https://base.easscan.org/graphql";
const SCHEMA_UID =
  "0xdc3cf7f28b4b5255ce732cbf99fe906a5bc13fbd764e2463ba6034b4e1881835"; // We'll update this when we create a new schema
const EAS_CONTRACT = "0x4200000000000000000000000000000000000021";

// EAS attestation ABI
const easABI = [
  {
    name: "attest",
    type: "function" as const,
    stateMutability: "payable" as const,
    inputs: [
      {
        name: "request",
        type: "tuple",
        components: [
          { name: "schema", type: "bytes32" },
          {
            name: "data",
            type: "tuple",
            components: [
              { name: "recipient", type: "address" },
              { name: "expirationTime", type: "uint64" },
              { name: "revocable", type: "bool" },
              { name: "refUID", type: "bytes32" },
              { name: "data", type: "bytes" },
              { name: "value", type: "uint256" },
            ],
          },
        ],
      },
    ],
    outputs: [{ name: "", type: "bytes32" }],
  },
];

type Attestation = {
  decodedDataJson: string;
  attester: string;
  time: string;
  id: string;
  txid: string;
};

async function fetchLastAttestations() {
  const query = `
    query GetAttestations {
      attestations(
        where: { schemaId: { equals: "${SCHEMA_UID}" } }
        orderBy: { time: desc }
        take: 8
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
    const response = await fetch(EAS_GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    const { data } = await response.json();
    const scores = (data?.attestations ?? [])
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
            return {
              time: parseFloat(time),
              address,
              attestationUid: attestation.id,
              transactionHash: attestation.txid,
            };
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
    console.error("Error fetching attestations:", err);
    return [];
  }
}

type HighScoresContextType = {
  highScores: Score[];
  checkIsHighScore: (currentTime: number) => boolean;
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
      
      // In a real implementation, we would fetch the jackpot amount from a contract or API
      // For demo purposes, we'll estimate it based on number of players * entry fee
      setJackpotAmount(scores.length * ENTRY_FEE);
    }
  }, [invalidate]);

  const invalidateHighScores = useCallback(() => {
    setInvalidate(true);
  }, []);

  const checkIsHighScore = useCallback(
    (currentTime: number) => {
      if (currentTime <= 0) {
        return false; // If timer reached 0, it's not a valid score
      }

      // If less than MAX_SCORES scores or current time is closer to zero than the highest time
      if (
        (highScores?.length ?? 0) < MAX_SCORES ||
        currentTime < (highScores?.[highScores.length - 1]?.time ?? Number.MAX_VALUE)
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

function formatTime(seconds: number): string {
  if (seconds <= 0) return "00.000";
  
  const wholeSeconds = Math.floor(seconds);
  const milliseconds = Math.floor((seconds - wholeSeconds) * 1000);
  
  return `${wholeSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

// Calculate color based on how close to zero
function getTimeColor(time: number): string {
  if (time <= 0) return "text-red-500";
  if (time < 0.5) return "text-green-500";
  if (time < 1) return "text-blue-500";
  return "text-black";
}

type StatsProps = {
  round: number;
  bestTime: number | null;
  width?: number;
};

function Stats({ round, bestTime, width = 390 }: StatsProps) {
  const { highScores } = useHighScores();
  const record = highScores?.[0]?.time;
  
  return (
    <div className="grid grid-cols-2 bg-white/30 p-4 rounded-lg shadow-md" style={{ width }}>
      {record && (
        <>
          <div className="text-lg mb-4 w-[200px] font-semibold font-serif">BEST TIME</div>
          <div className={`text-lg mb-4 text-right font-serif font-bold ${getTimeColor(record)}`}>{formatTime(record)}</div>
        </>
      )}
      <div className="text-lg mb-4 w-[200px] font-semibold font-serif">ROUND</div>
      <div className="text-lg mb-4 text-right font-bold font-serif">{round} / {ROUNDS_PER_GAME}</div>
      {bestTime !== null && (
        <>
          <div className="text-lg mb-4 w-[200px] font-semibold font-serif">YOUR BEST</div>
          <div className={`text-lg mb-4 text-right font-serif font-bold ${getTimeColor(bestTime)}`}>{formatTime(bestTime)}</div>
        </>
      )}
    </div>
  );
}

type GameCompleteProps = {
  bestTime: number;
  onPlayAgain: () => void;
};

function GameComplete({ bestTime, onPlayAgain }: GameCompleteProps) {
  const { invalidateHighScores, checkIsHighScore } = useHighScores();
  const sendNotification = useNotification();
  const { address } = useAccount();
  const isHighScore = checkIsHighScore(bestTime);

  const handleAttestationSuccess = useCallback(async () => {
    if (!address) {
      return null;
    }

    await sendNotification({
      title: "Congratulations!",
      body: `You scored a new time of ${formatTime(bestTime)} on the precision timer!`,
    });

    invalidateHighScores();
  }, [address, invalidateHighScores, bestTime, sendNotification]);

  const transactionButton = useMemo(() => {
    if (!address) {
      return (
        <Wallet>
          <ConnectWallet>
            <ConnectWalletText>Login to save your time</ConnectWalletText>
          </ConnectWallet>
        </Wallet>
      );
    }

    return (
      <Transaction
        calls={[
          {
            address: EAS_CONTRACT,
            abi: easABI,
            functionName: "attest",
            args: [
              {
                schema: SCHEMA_UID,
                data: {
                  recipient: address,
                  expirationTime: BigInt(0),
                  revocable: false,
                  refUID:
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                  data: encodeAbiParameters(
                    [{ type: "string" }],
                    [`${address} scored ${bestTime.toFixed(4)} on timer`],
                  ),
                  value: BigInt(0),
                },
              },
            ],
          },
        ]}
        onSuccess={handleAttestationSuccess}
        onError={(error: TransactionError) =>
          console.error("Attestation failed:", error)
        }
      >
        <TransactionButton
          text="Submit your time"
          className="mx-auto w-[60%]"
          successOverride={{
            text: "View Leaderboard",
            onClick: onPlayAgain,
          }}
        />
        <TransactionToast className="mb-4">
          <TransactionToastIcon />
          <TransactionToastLabel />
          <TransactionToastAction />
        </TransactionToast>
      </Transaction>
    );
  }, [address, bestTime, handleAttestationSuccess, onPlayAgain]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#E5E5E5] z-20 m-[10px] mb-[30px] rounded-xl animate-fadeIn">
      {isHighScore && (
        <div className="confetti-container">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>
      )}
      
      <h1 className="text-4xl mb-4 font-bold text-blue-600 font-serif">
        GAME COMPLETE
      </h1>
      {isHighScore && <p className="text-2xl mb-4 text-green-600 animate-pulse font-serif">Great timing!</p>}
      <div className="text-2xl mb-4 font-serif font-semibold">
        Your best time: <span className={`${getTimeColor(bestTime)} time-highlight`}>{formatTime(bestTime)}</span>
      </div>
      
      <Stats round={1} bestTime={bestTime} width={300} />
      
      {isHighScore && address && (
        <fieldset className="border-2 border-blue-300 rounded-md mb-4 p-2 bg-white/30 mt-4 max-w-[300px]">
          <legend className="text-sm px-2 bg-blue-500 text-white rounded-full font-serif">Attestation</legend>
          <div className="text-gray-800 px-2 py-1 italic text-center font-serif">
            <Address className="text-inherit font-semibold" address={address} /> scored{" "}
            <span className={`font-serif font-bold time-highlight ${getTimeColor(bestTime)}`}>{formatTime(bestTime)}</span> on timer
          </div>
        </fieldset>
      )}

      {isHighScore && transactionButton}
      <button
        type="button"
        className="mt-6 px-8 py-3 bg-[#0052FF] text-white text-lg font-bold rounded-full 
          hover:bg-[#0052FF]/90 transform hover:scale-105 transition-all duration-200 shadow-lg
          hover:shadow-blue-200 active:translate-y-1 active:shadow timer-button-press font-serif"
        onClick={onPlayAgain}
      >
        Play Again (${ENTRY_FEE})
      </button>
    </div>
  );
}

type IntroProps = {
  onStartGame: () => void;
};

function Intro({ onStartGame }: IntroProps) {
  const { highScores, jackpotAmount, loadHighScores } = useHighScores();
  const openUrl = useOpenUrl();

  useEffect(() => {
    loadHighScores();
  }, [loadHighScores]);

  const handleHighScoreClick = (score: Score) => {
    openUrl(`https://basescan.org/tx/${score.transactionHash}`);
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center bg-[#E5E5E5] z-10 m-[10px] mb-[30px] pb-6 rounded-xl">
      <div className="mt-20 text-center max-w-[90%]">
        <h1 className="text-5xl font-bold mb-6 font-serif text-blue-600 leading-tight tracking-tight">
          PRECISION TIMER
        </h1>
        <p className="text-xl mb-4 text-gray-700 font-serif">
          Press the button as close to <span className="font-mono font-bold text-blue-600 timer-cursor">00.000</span> as possible!
        </p>
        <p className="text-lg mb-6 text-gray-600 font-serif">${ENTRY_FEE} to play • {ROUNDS_PER_GAME} rounds • Don&apos;t hit zero!</p>
      </div>
      
      <div className="flex flex-col items-center justify-between flex-1 w-full gap-6 pb-20">
        <div className="flex flex-col items-center gap-8">
          <div className="text-xl font-semibold font-serif text-center">CURRENT JACKPOT</div>
          <div className="timer-jackpot mb-2">
            ${jackpotAmount}
          </div>
          
          <button
            type="button"
            className="px-10 py-5 bg-[#0052FF] text-white text-2xl font-bold rounded-full 
              hover:bg-[#0052FF]/90 transform hover:scale-105 transition-all duration-200 
              [box-shadow:0_8px_0_0_#002299,0_12px_6px_0_rgba(0,34,153,0.3)]
              hover:shadow-blue-200 active:translate-y-1 active:[box-shadow:0_4px_0_0_#002299] timer-button-press font-serif"
            onClick={onStartGame}
          >
            Start Game (${ENTRY_FEE})
          </button>
        </div>
        
        <div className="relative w-full flex flex-col items-center">
          <h1 className="leaderboard-title">LEADERBOARD</h1>
          <div className="leaderboard-divider"></div>
          
          <div className="w-[90%] max-w-[400px] overflow-hidden rounded-lg bg-white/30 backdrop-blur-sm shadow-lg">
            {highScores.length > 0 ? (
              highScores
                .sort((a, b) => a.time - b.time) // Sort by time (ascending)
                .map((score, index) => (
                  <button
                    type="button"
                    key={score.attestationUid}
                    className={`flex items-center w-full p-3 transition-all duration-200 hover:bg-blue-50 border-b border-blue-100 font-serif
                      ${index === 0 ? 'bg-amber-50' : ''}`}
                    onClick={() => handleHighScoreClick(score)}
                  >
                    <span className={`w-8 font-bold ${index === 0 ? 'text-amber-500' : index === 1 ? 'text-gray-500' : index === 2 ? 'text-amber-700' : 'text-gray-700'}`}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                    </span>
                    <div className="flex items-center flex-grow">
                      <Identity
                        className="!bg-inherit space-x-1 px-0 [&>div]:space-x-2"
                        address={score.address}
                      >
                        <Name className="text-black font-medium" />
                      </Identity>
                      <div className="px-2 text-blue-500">
                        <ArrowSvg />
                      </div>
                    </div>
                    <div className={`text-right flex-grow font-mono font-bold time-highlight ${getTimeColor(score.time)}`}>
                      {formatTime(score.time)}
                    </div>
                  </button>
                ))
            ) : (
              <div className="p-4 text-center font-serif">No scores yet. Be the first to play!</div>
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
      <div className="text-xl mb-2 font-semibold font-serif">Round {round}/{ROUNDS_PER_GAME}</div>
      <div className={`text-7xl font-serif font-bold mb-6 transition-all duration-200 time-highlight ${timeColor} 
        ${isPressedTime ? 'scale-125 animate-ping-once' : 'animate-pulse-slow'}`}>
        {formatTime(time)}{!isPressedTime && <span className="timer-cursor"></span>}
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
  const [bestTime, setBestTime] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [isButtonPressed, setIsButtonPressed] = useState(false);

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
          const newTime = Math.max(0, prev - 0.01);
          if (newTime === 0) {
            // If timer hits zero, player loses this round
            clearInterval(intervalRef.current!);
            setPressedTime(0);
          }
          return newTime;
        });
      }, 10); // Update every 10ms for smooth countdown
    } else {
      // Clear the timer when not in a round
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [gameState]);

  const handleStartGame = useCallback(() => {
    // In a real implementation, we would process the payment here
    setGameState(GameState.ROUND_1);
    setRound(1);
    setBestTime(null);
  }, []);

  const handleButtonPress = useCallback(() => {
    if (pressedTime !== null) return; // Already pressed in this round
    
    const currentTime = timeRemaining;
    setPressedTime(currentTime);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Update best time if this is better
    if (currentTime > 0 && (bestTime === null || currentTime < bestTime)) {
      setBestTime(currentTime);
    }
    
    // Move to next round or complete
    setTimeout(() => {
      if (gameState === GameState.ROUND_1) {
        setGameState(GameState.ROUND_2);
        setRound(2);
      } else if (gameState === GameState.ROUND_2) {
        setGameState(GameState.COMPLETE);
      }
    }, 1500); // Show the pressed time for 1.5 seconds
  }, [bestTime, gameState, pressedTime, timeRemaining]);

  const handlePlayAgain = useCallback(() => {
    setGameState(GameState.INTRO);
    setBestTime(null);
  }, []);

  return (
    <HighScoresProvider>
      <div className="flex flex-col items-center justify-center h-full relative">
        {gameState === GameState.INTRO && (
          <Intro onStartGame={handleStartGame} />
        )}
        
        {(gameState === GameState.ROUND_1 || gameState === GameState.ROUND_2) && (
          <div className="flex flex-col items-center justify-center p-4 animate-fadeIn">
            <TimerDisplay 
              time={pressedTime !== null ? pressedTime : timeRemaining} 
              round={round} 
              bestTime={bestTime}
              isPressedTime={pressedTime !== null}
            />
            
            <button
              type="button"
              disabled={pressedTime !== null}
              className={`mt-12 relative px-16 py-8 rounded-full text-2xl font-bold transition-all duration-200 timer-button-press font-serif
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
            
            <div className="mt-8 text-lg font-medium text-center px-4 py-2 rounded-lg bg-white/30 shadow-inner max-w-[80%] font-serif">
              {pressedTime === null ? (
                <span className="animate-pulse-slow">Press the button as close to 00.000 as possible!</span>
              ) : pressedTime > 0 ? (
                <span className="text-green-600">Great timing! <span className={`font-serif font-bold time-highlight ${getTimeColor(pressedTime)}`}>{formatTime(pressedTime)}</span></span>
              ) : (
                <span className="text-red-500">Too late! You hit zero.</span>
              )}
            </div>
          </div>
        )}
        
        {gameState === GameState.COMPLETE && bestTime !== null && (
          <GameComplete bestTime={bestTime} onPlayAgain={handlePlayAgain} />
        )}
      </div>
    </HighScoresProvider>
  );
} 