import { NextResponse } from 'next/server';
import { getCorpusStatus } from '@/lib/humanizer/corpusCalibration';

export async function GET() {
  const status = getCorpusStatus();
  return NextResponse.json(status);
}