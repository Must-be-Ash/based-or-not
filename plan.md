# Timed Right Game - Project Plan

## Project Objective
To transform the existing Snake game into a precision-based timing game where players:
- Pay $1 USDC to play two rounds
- Try to press a button as close as possible to 00.000 seconds (without going to zero)
- Track scores on a leaderboard where lower times rank higher
- Compete for a jackpot accumulated from player fees

## Current Application Architecture

### Tech Stack
- Next.js framework (React-based)
- TypeScript
- Tailwind CSS for styling
- Coinbase's OnchainKit for web3 integration (Farcaster, wallet connectivity)
- Wagmi for blockchain interactions
- Viem for Ethereum data types and encoding
- EAS (Ethereum Attestation Service) for recording scores on-chain

### Current Project Structure
```
.
├── README.md
├── app
│   ├── api
│   │   ├── notify
│   │   │   └── route.ts
│   │   └── webhook
│   │       └── route.ts
│   ├── components
│   │   └── snake.tsx
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── providers.tsx
│   ├── svg
│   │   ├── ArrowSvg.tsx
│   │   ├── Check.tsx
│   │   └── SnakeLogo.tsx
│   └── theme.css
├── far-mini.md
├── lib
│   ├── notification-client.ts
│   ├── notification.ts
│   └── redis.ts
├── next-env.d.ts
├── next.config.mjs
├── package-lock.json
├── package.json
├── plan.md
├── postcss.config.mjs
├── public
│   └── snake.png
├── tailwind.config.ts
└── tsconfig.json
```

### Current File Structure & Components

#### Key Files
- `app/page.tsx`: Main entry point for the application
- `app/components/snake.tsx`: Core game logic and rendering
- `app/providers.tsx`: Web3 and other providers setup
- `app/layout.tsx`: Root layout component

#### Game Architecture
- The game uses React state management for tracking game state
- Canvas-based rendering for the Snake game
- On-chain attestations for recording high scores
- Wallet connection for player identification
- Game states (INTRO, RUNNING, PAUSED, WON, DEAD, etc.)

#### Key Game Flow
1. Player connects wallet 
2. Game initializes (Snake appears on screen)
3. Player navigates Snake to collect targets
4. Score increases as targets are collected
5. When player dies, high score is recorded if eligible
6. Attestations are created on-chain for high scores
7. Leaderboard displays top scores

## Required Modifications

### File Structure Changes
1. **New Files to Create:**
   - `app/components/timer-game.tsx`: Main game component for the Timed Right game
   - `app/svg/TimerLogo.tsx`: Logo for the new game
   - `app/svg/ButtonSvg.tsx`: Button visual component
   - `public/timer.png`: Game icon/splash image

2. **Files to Modify:**
   - `app/page.tsx`: Update to use TimerGame component instead of Snake
   - `app/layout.tsx`: Update metadata (title, description)
   - `.env`: Add any new environment variables needed for payment processing
   - `lib/redis.ts`: Add support for jackpot tracking

3. **Files to Keep (with minimal or no changes):**
   - Most API routes
   - Provider setups
   - Global styling

4. **Files that can be deprecated (but not deleted for backward compatibility):**
   - `app/components/snake.tsx`: Will be replaced by timer-game.tsx
   - `app/svg/SnakeLogo.tsx`: Will be replaced by TimerLogo.tsx
   - `public/snake.png`: Will be replaced by timer.png

### Game Logic Changes
1. Replace Snake game with Timed Right:
   - Remove snake movement and collision detection
   - Implement countdown timer from 15 seconds to 0
   - Create button that records timing when pressed
   - Track player's best timing across two attempts
   - Implement payment integration for $1 entry fee

### UI/UX Changes
1. Replace Snake visuals with:
   - Prominent countdown timer display (showing milliseconds)
   - Clear "PRESS" button
   - Visual feedback for button presses
   - Round indication (1/2 or 2/2)
   - Payment status indicator

2. Modify leaderboard to:
   - Sort by proximity to zero (ascending order)
   - Display time with millisecond precision
   - Show jackpot amount prominently
   - Indicate current leader clearly

### Data Structure Changes
1. Modify score data model:
   - Change from integer score to time measurement (milliseconds)
   - Track both attempts per player
   - Record payment confirmation
   - Update attestation schema for time-based recording

2. Add jackpot functionality:
   - Track total contributions
   - Mechanism to distribute to winner
   - Reset system for new rounds

### Technical Implementation Plan
1. Modify `app/components/snake.tsx` to `app/components/timer-game.tsx`:
   - Replace game loop with precise timer implementation
   - Implement time calculation logic (distance from zero)
   - Add payment handling via wallet connection

2. Update `app/page.tsx`:
   - Replace Snake component with TimerGame
   - Update game description and instructions
   - Modify layout to emphasize timer and button

3. Update attestation systems:
   - Modify schema for time-based scores
   - Update query to sort by proximity to zero
   - Ensure backward compatibility with existing data

## Development Phases
1. **Phase 1**: Core timer mechanism
   - Implement countdown timer with millisecond precision
   - Create button interaction with timing calculation
   - Develop two-round system

2. **Phase 2**: Payment integration
   - Implement $1 payment requirement
   - Create jackpot accumulation system
   - Add payment verification

3. **Phase 3**: Leaderboard and UI refinement
   - Update leaderboard sorting and display
   - Polish UI for timer and button elements
   - Add visual feedback and animations

4. **Phase 4**: Testing and deployment
   - Test payment flows
   - Ensure timing precision works across devices
   - Verify leaderboard functionality

## Technical Considerations
- Ensure timing precision is consistent across devices
- Handle payment confirmation securely
- Implement fair jackpot distribution mechanism
- Consider latency issues in button press timing

By maintaining the same structural pattern as the Snake game but replacing the core game mechanics, we can efficiently transform the application while leveraging the existing web3 integration, wallet connectivity, and attestation systems.
