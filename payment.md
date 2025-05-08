# Payment Implementation - Charging Users $1 USDC to Play

This example shows how to charge users 1 USDC to perform an action (play a game) on Base using the `@coinbase/onchainkit` library.

## Constants

```typescript
const ENTRY_FEE = 1; // $1 to play
const JACKPOT_ADDRESS = "0x5ce0D48FAD146F39cc908812Ef50ccD821e19C35";
const USDC_CONTRACT_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC on Base
const USDC_CONTRACT_ETH = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC on ETH mainnet
```

## ERC20 Token ABI

```typescript
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
```

## Network API Endpoint

The application uses a network API endpoint to determine which blockchain network the user is on, which affects which USDC contract to use for payments:

```typescript
// app/api/network/route.ts
import { NextResponse } from 'next/server';

// This is a simple API route that returns the chain ID
export async function GET() {
  return NextResponse.json({ 
    chainId: 8453, // Base chain ID (default)
    name: 'Base' 
  });
}
```

This API is used in the payment process when:
1. Fetching the jackpot amount (to determine which USDC contract to query)
2. Determining which USDC contract to use for the payment transaction

## Network Detection in Jackpot Fetching

```typescript
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
    
    // [...rest of function...]
  }
}
```

## Payment Transaction Component

```tsx
// In the Intro component - determines which USDC contract to use based on the connected network
const usdcContract = chainId === 1 ? USDC_CONTRACT_ETH : USDC_CONTRACT_BASE;

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
```

## How the Files Work Together

1. **Network Detection**: 
   - `app/api/network/route.ts` provides the chain ID (8453 for Base mainnet)
   - This allows the app to work on both Base and Ethereum mainnet

2. **Payment Processing**:
   - `timer-game.tsx` uses the network information to select the correct USDC contract
   - For Base: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
   - For Ethereum: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`

3. **Transaction Execution**:
   - The user is charged 1 USDC (1,000,000 in wei due to 6 decimals)
   - The funds are sent to the jackpot address: `0x5ce0D48FAD146F39cc908812Ef50ccD821e19C35`
   - The `@coinbase/onchainkit` Transaction component handles the wallet interactions

## Key Points

1. The code uses the USDC token contract on Base (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`)
2. The network API endpoint enables multi-chain support (both Base and Ethereum)
3. The payment amount is 1 USDC (represented as 1,000,000 in the contract call due to USDC's 6 decimals)
4. The `Transaction` component from `@coinbase/onchainkit` handles the wallet connection and transaction flow
5. On successful payment (`onSuccess`), the game starts and the jackpot amount refreshes
