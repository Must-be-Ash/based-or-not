import { NextResponse } from 'next/server';

// This is a simple API route that returns the chain ID
// In a real app, this would be obtained from the server context
// or determined based on the environment
export async function GET() {
  return NextResponse.json({ 
    chainId: 8453, // Base chain ID (default)
    name: 'Base' 
  });
} 