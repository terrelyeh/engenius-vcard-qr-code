const PROMPT = `This is a business card image. Extract ALL contact information visible and return ONLY a valid JSON object with exactly these keys:
{"fullName":"","org":"","title":"","phoneMobile":"","phoneWork":"","emailWork":"","website":"","address":""}
Rules:
- fullName: the person's full name only (not company name). Keep Chinese characters as-is.
- org: company or organization name (full name including Co./Ltd./股份有限公司 etc.)
- title: job title only (e.g. "Project Manager", "專案經理")
- phoneMobile: mobile/cell number (with country code if shown)
- phoneWork: office/work phone number (with country code if shown, exclude extensions)
- emailWork: email address
- website: website URL (include https://)
- address: full mailing address on one line
Use "" for any field not found. Return only the raw JSON, no markdown fences, no explanation.`;

export async function onRequestPost(context) {
  try {
    const GEMINI_KEY = context.env.GEMINI_KEY;
    if (!GEMINI_KEY) {
      return Response.json({ error: 'GEMINI_KEY not configured' }, { status: 500 });
    }

    const { base64, mimeType } = await context.request.json();

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [
            { text: PROMPT },
            { inline_data: { mime_type: mimeType, data: base64 } }
          ]}],
          generationConfig: { temperature: 0 }
        })
      }
    );

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      return Response.json({ error: data.error?.message || `Gemini HTTP ${geminiRes.status}` }, { status: 502 });
    }

    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
