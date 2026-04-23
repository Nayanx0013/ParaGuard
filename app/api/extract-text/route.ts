import { NextResponse } from 'next/server';
import { createClient } from "@/lib/supabase/server";
import mammoth from 'mammoth';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Protection against Memory Exhaustion DOS (Limit file size to 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit.' }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = '';

    if (file.type === 'application/pdf') {
      // Dynamic import to bypass Next.js ES Modules packaging issues with pdf-parse
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdf = require('pdf-parse');
      const data = await pdf(buffer);
      text = data.text;
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.endsWith('.docx')
    ) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a PDF or DOCX file.' },
        { status: 400 }
      );
    }

    // Clean up empty lines/weird spacing from raw PDF extractions
    text = text.replace(/\\n/g, ' \n').replace(/\s{2,}/g, ' ').trim();

    return NextResponse.json({ text });
  } catch (error) {
    console.error('File extraction error:', error);
    return NextResponse.json({ error: 'Failed to extract text from file' }, { status: 500 });
  }
}