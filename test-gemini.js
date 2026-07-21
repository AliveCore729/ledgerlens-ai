const fs = require('fs');
const env = fs.readFileSync('/home/shreyansh/Chiiikuuu/ledgerlens-ai/.env.production', 'utf-8');
const envVars = Object.fromEntries(env.split('\n').filter(Boolean).map(line => line.split('=')));

const url = `${envVars.GEMINI_PROXY_URL}/v1beta/models/gemini-2.5-flash:generateContent`;
fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-goog-api-key': envVars.GEMINI_API_KEY,
  },
  body: JSON.stringify({
    contents: [{ parts: [{ text: 'Hello' }] }],
    generationConfig: { responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 0 }, maxOutputTokens: 65536 }
  })
})
.then(res => res.json())
.then(console.log)
.catch(console.error);
