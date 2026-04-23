import { NextResponse } from 'next/server';
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const formData = await request.formData();
    const content = formData.get('content') as string;
    const format = formData.get('format') as string;

    if (!content || !format) {
      return NextResponse.json({ error: 'Missing content or format' }, { status: 400 });
    }

    // Prevent malicious formats or header injection
    const allowedFormats = ['doc', 'txt'];
    if (!allowedFormats.includes(format.toLowerCase())) {
      return NextResponse.json({ error: 'Invalid format requested.' }, { status: 400 });
    }

    const safeFormat = format.toLowerCase();
    const filename = `Paraphrased_Result.${safeFormat}`;
    const contentType = safeFormat === 'doc' ? 'application/msword;charset=utf-8' : 'text/plain;charset=utf-8';

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
