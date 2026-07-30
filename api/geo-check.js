// Fonction serverless Vercel — GEO check pour Le Pipeline
// Utilisée par /instruments/geo-bilingue.html et /instruments/citable.html.
//
// Activation :
//   1. Créer un compte sur platform.deepseek.com et générer une clé API.
//   2. Dans Vercel → Settings → Environment Variables : DEEPSEEK_API_KEY = cette clé.
//   3. Dans les deux pages HTML, passer USE_API = true.
//   4. Redéployer. Tant que la clé n'est pas là, les pages tournent en « mode démo ».
//
// Sans dépendance (fetch natif de Node 18+ sur Vercel). API DeepSeek compatible
// format OpenAI — https://api.deepseek.com/chat/completions.
//
// Modèle : deepseek-chat (DeepSeek-V3, non-reasoning) — rapide et peu coûteux,
// suffisant pour une classification courte en JSON. Changer MODEL ci-dessous
// pour deepseek-reasoner si un raisonnement plus poussé devient nécessaire.

const MODEL = 'deepseek-chat';
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    res.status(503).json({ error: 'api_key_absente', hint: 'Configurer DEEPSEEK_API_KEY dans Vercel.' });
    return;
  }

  const { mode = 'bilingue', entreprise = '', secteur = '', marche = 'Québec' } = req.body || {};
  const co = String(entreprise).slice(0, 200);
  const sec = String(secteur).slice(0, 200);
  const zone = String(marche).slice(0, 80);

  // Deux formats de sortie selon l'instrument appelant — décrits en toutes lettres
  // dans le prompt, car le mode JSON de DeepSeek ne valide pas un schéma strict.
  const prompt = mode === 'citable'
    ? `Tu évalues la « citabilité » d'une entreprise par les modèles d'IA (GEO). `
      + `Entreprise : "${co}". Secteur : "${sec}". Marché : "${zone}". `
      + `Estime un indice de citabilité de 0 à 100 (probabilité qu'un LLM la cite comme source `
      + `pour une question d'acheteur du secteur) et donne 2 à 4 pistes concrètes en français. `
      + `Réponds UNIQUEMENT avec un objet JSON de cette forme exacte, sans texte autour : `
      + `{"score": <entier 0-100>, "pistes": [<chaînes en français>]}`
    : `Tu mesures l'écart de citation bilingue d'une entreprise. `
      + `Entreprise : "${co}". Secteur : "${sec}". Marché : "${zone}". `
      + `Pose mentalement la même question d'acheteur en anglais puis en français `
      + `(« meilleures entreprises de ${sec} à ${zone} ») et estime, de 0 à 100, `
      + `la probabilité que l'entreprise soit citée dans chaque langue. `
      + `Réponds UNIQUEMENT avec un objet JSON de cette forme exacte, sans texte autour : `
      + `{"en": <entier 0-100>, "fr": <entier 0-100>}`;

  try {
    const r = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Tu réponds uniquement en JSON valide, sans balises markdown ni texte explicatif.' },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!r.ok) {
      const detail = await r.text();
      res.status(502).json({ error: 'deepseek_error', status: r.status, detail: detail.slice(0, 500) });
      return;
    }

    const data = await r.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      res.status(502).json({ error: 'reponse_vide' });
      return;
    }
    const parsed = JSON.parse(text);
    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: 'exception', message: String(e).slice(0, 300) });
  }
}
