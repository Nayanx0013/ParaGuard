// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function scorePerplexity(text: string): Promise<any | null> {
    const url = process.env.NEXT_PUBLIC_HF_SPACES_URL;
    if (!url) return null;
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (process.env.HF_ACCESS_TOKEN) {
            headers['Authorization'] = `Bearer ${process.env.HF_ACCESS_TOKEN}`;
        }

        const res = await fetch(`${url}/perplexity`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ text }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!res.ok) return null;
        
        return await res.json();
    } catch {
        return null; // HF Spaces timeout or failure
    }
}