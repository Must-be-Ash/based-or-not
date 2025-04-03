"use client";

import React from "react";
import { useNotification } from "@coinbase/onchainkit/minikit";
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
} from "@coinbase/onchainkit/wallet";
import {
  Address,
} from "@coinbase/onchainkit/identity";
import { useAccount } from "wagmi";
import { encodeAbiParameters } from "viem";
import { useHighScores } from "./timer-game";

// Constants
const ENTRY_FEE = 1;
const ROUNDS_PER_GAME = 2;
const SCHEMA_UID =
  "0xdc3cf7f28b4b5255ce732cbf99fe906a5bc13fbd764e2463ba6034b4e1881835";
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

function formatTime(seconds: number | null): string {
  if (seconds === null || seconds <= 0) return "00.000";
  
  const wholeSeconds = Math.floor(seconds);
  const milliseconds = Math.floor((seconds - wholeSeconds) * 1000);
  
  return `${wholeSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

function getTimeColor(time: number | null): string {
  if (time === null || time <= 0) return "text-red-500";
  if (time < 0.5) return "text-green-500";
  if (time < 1) return "text-blue-500";
  return "text-black";
}

type StatsProps = {
  round: number;
  bestTime: number | null;
  width?: number;
};

function Stats({ round, bestTime, width = 300 }: StatsProps) {
  const { highScores } = useHighScores();
  const record = highScores?.[0]?.time;
  
  return (
    <div className="bg-white/80 p-4 rounded-xl shadow-md mx-auto" style={{ width }}>
      <div className="grid grid-cols-2 gap-3">
        {record && (
          <>
            <div className="text-lg font-pixelify text-gray-800 font-bold">BEST TIME</div>
            <div className={`text-lg text-right font-mono font-bold ${getTimeColor(record)}`}>{formatTime(record)}</div>
          </>
        )}
        <div className="text-lg font-pixelify text-gray-800 font-bold">ROUND</div>
        <div className="text-lg text-right font-mono font-bold">{round} / {ROUNDS_PER_GAME}</div>
        {bestTime !== null && bestTime > 0 && (
          <>
            <div className="text-lg font-pixelify text-gray-800 font-bold">YOUR BEST</div>
            <div className={`text-lg text-right font-mono font-bold ${getTimeColor(bestTime)}`}>{formatTime(bestTime)}</div>
          </>
        )}
      </div>
    </div>
  );
}

type GameCompleteProps = {
  bestTime: number | null;
  onPlayAgain: () => void;
};

export default function GameComplete({ bestTime, onPlayAgain }: GameCompleteProps) {
  const { invalidateHighScores, checkIsHighScore, highScores } = useHighScores();
  const sendNotification = useNotification();
  const { address } = useAccount();
  
  // Only show the "no valid time" screen if bestTime is completely null
  // This will still allow players to submit a score if they had one good round
  if (bestTime === null) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#E5E5E5] z-20 m-[10px] mb-[30px] rounded-xl animate-fadeIn">
        <h1 className="text-4xl mb-6 font-bold text-blue-600 font-serif">
          GAME COMPLETE
        </h1>
        <p className="text-2xl mb-4 text-red-500 font-serif">No valid time recorded.</p>
        <p className="text-lg mb-8 text-gray-600 font-serif">You hit zero on both rounds!</p>
        
        <button
          type="button"
          className="px-8 py-3 bg-[#0052FF] text-white text-lg font-bold rounded-full 
            hover:bg-[#0052FF]/90 transform hover:scale-105 transition-all duration-200 shadow-lg
            hover:shadow-blue-200 active:translate-y-1 active:shadow timer-button-press font-serif"
          onClick={onPlayAgain}
        >
          Play Again (${ENTRY_FEE})
        </button>
      </div>
    );
  }
  
  // At this point, bestTime is guaranteed to be a valid number (either from round 1 or round 2)
  const isHighScore = checkIsHighScore(bestTime);
  const validBestTime = bestTime; // This is safe now since we've checked it's not null

  // Check if this score breaks the current record
  const isNewRecord = highScores.length > 0 && validBestTime < highScores[0].time;
  const previousRecordHolder = isNewRecord ? highScores[0].address : null;
  
  // Function to notify the previous record holder
  const notifyPreviousRecordHolder = async (previousHolderAddress: string, newTime: number) => {
    try {
      // Fetch the FID (Farcaster ID) for the address - in a real implementation,
      // this would need to be mapped from the wallet address to a Farcaster ID
      // For now, we'll use a simple API call to simulate this
      const response = await fetch('/api/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fid: previousHolderAddress, // In a real implementation, you'd map the address to a Farcaster ID
          notification: {
            title: 'Your record has been broken!',
            body: `Someone just scored ${formatTime(newTime)} and broke your record on the precision timer!`,
          }
        }),
      });
      
      if (!response.ok) {
        console.error('Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };
  
  return (
    <div className="absolute inset-0 flex flex-col bg-[#E5E5E5] z-20 m-[10px] mb-[30px] rounded-xl animate-fadeIn">
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
      
      {/* First section - Stats at top with more padding */}
      <div className="pt-20 w-full px-8">
        <Stats round={ROUNDS_PER_GAME} bestTime={validBestTime} width={300} />
      </div>
      
      {/* Second section - Main content with even more spacing */}
      <div className="flex-1 flex flex-col items-center justify-center gap-10 mt-20 mb-12">
        {isHighScore && address && (
          <fieldset className="border-2 border-blue-300 rounded-md p-3 bg-white/30 max-w-[300px] hidden">
            <legend className="text-sm px-2 bg-blue-500 text-white rounded-full font-serif">Attestation</legend>
            <div className="text-gray-800 px-2 py-1 italic text-center font-serif">
              <Address className="text-inherit font-semibold" address={address} /> scored{" "}
              <span className={`font-serif font-bold time-highlight ${getTimeColor(validBestTime)}`}>{formatTime(validBestTime)}</span> on timer
            </div>
          </fieldset>
        )}

        {isHighScore && !address && (
          <div>
            <Wallet>
              <ConnectWallet className="px-8 py-4 bg-[#0052FF] text-white text-xl font-bold rounded-full 
                hover:bg-[#0052FF]/90 transform hover:scale-105 transition-all duration-200 shadow-lg
                hover:shadow-blue-200 active:translate-y-1 font-pixelify">
                <ConnectWalletText>Login to save your time</ConnectWalletText>
              </ConnectWallet>
            </Wallet>
          </div>
        )}
        
        {isHighScore && address && (
          <div className="flex justify-center w-full">
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
                          [`${address} scored ${validBestTime.toFixed(4)} on timer`],
                        ),
                        value: BigInt(0),
                      },
                    },
                  ],
                },
              ]}
              onSuccess={async () => {
                await sendNotification({
                  title: "Congratulations!",
                  body: `You scored a new time of ${formatTime(validBestTime)} on the precision timer!`,
                });
                
                // If this score broke a record, notify the previous record holder
                if (isNewRecord && previousRecordHolder) {
                  await notifyPreviousRecordHolder(previousRecordHolder, validBestTime);
                }
                
                invalidateHighScores();
                // After successful submission, allow playing again
                onPlayAgain();
              }}
              onError={(error: TransactionError) =>
                console.error("Attestation failed:", error)
              }
            >
              <TransactionButton
                text="Submit your time"
                className="px-8 py-4 bg-[#0052FF] text-white text-xl font-bold rounded-full 
                  hover:bg-[#0052FF]/90 transform hover:scale-105 transition-all duration-200 shadow-lg
                  hover:shadow-blue-200 active:translate-y-1 font-pixelify"
              />
              <TransactionToast className="mb-4">
                <TransactionToastIcon />
                <TransactionToastLabel />
                <TransactionToastAction />
              </TransactionToast>
            </Transaction>
          </div>
        )}
        
        {/* Only show Play Again button if not a high score */}
        {!isHighScore && (
          <button
            type="button"
            className="px-12 py-4 bg-[#0052FF] text-white text-xl font-bold rounded-full 
              hover:bg-[#0052FF]/90 transform hover:scale-105 transition-all duration-200 shadow-lg
              hover:shadow-blue-200 active:translate-y-1 active:shadow font-pixelify mt-8"
            onClick={onPlayAgain}
          >
            Play Again (${ENTRY_FEE})
          </button>
        )}
      </div>
    </div>
  );
} 