"use client";

import {
  useMiniKit,
  useAddFrame,
  useOpenUrl,
} from "@coinbase/onchainkit/minikit";
import { useCallback, useEffect, useMemo, useState } from "react";
import TimerGame from "./components/timer-game";
import Check from "./svg/Check";
import { WalletControl } from "./components/wallet-control";

export default function App() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const [frameAdded, setFrameAdded] = useState(false);

  const addFrame = useAddFrame();
  const openUrl = useOpenUrl();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  const handleAddFrame = useCallback(async () => {
    const frameAdded = await addFrame();
    setFrameAdded(Boolean(frameAdded));
  }, [addFrame, setFrameAdded]);

  const saveFrameButton = useMemo(() => {
    if (context && !context.client.added) {
      return (
        <button
          type="button"
          onClick={handleAddFrame}
          className="cursor-pointer bg-transparent font-semibold text-sm"
        >
          + SAVE FRAME
        </button>
      );
    }

    if (frameAdded) {
      return (
        <div className="flex items-center space-x-1 text-sm font-semibold animate-fade-out">
          <Check />
          <span>SAVED</span>
        </div>
      );
    }

    return null;
  }, [context, handleAddFrame, frameAdded]);

  return (
    <div className="flex flex-col min-h-screen sm:min-h-[900px] font-sans bg-[#E5E5E5] text-black items-center timer-dark relative">
      <div className="w-screen max-w-[520px] h-full min-h-[900px] relative">
        <header className="flex justify-between items-center py-3 px-4 absolute top-0 w-full z-30">
          <div className="flex items-center justify-start">
            <WalletControl />
          </div>
          <div className="flex items-center gap-2">
            <div className="text-gray-700 text-sm font-semibold">
              mustbeash.base.eth
            </div>
            {saveFrameButton}
          </div>
        </header>

        <main className="font-serif h-full py-8">
          <TimerGame />
        </main>

        <footer className="absolute bottom-4 flex items-center w-screen max-w-[520px] justify-center">
          <div className="mt-4 ml-4 px-4 py-2 flex justify-start rounded-2xl font-semibold opacity-40 border border-black text-xs">
            BUILT BY{" "}
            <button
              type="button"
              className="mx-1 underline"
              onClick={() => openUrl("https://x.com/Must_be_Ash")}
            >
              @must_be_ash
            </button>{" "}
            AT{" "}
            <button
              type="button"
              className="mx-1 underline"
              onClick={() => openUrl("https://x.com/navigate_ai")}
            >
              @navigate_ai
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
