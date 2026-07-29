// Fonction serverless Vercel — GEO check pour Le Pipeline
// Utilisée par /instruments/geo-bilingue.html et /instruments/citable.html.
//
// Activation :
//   1. Dans Vercel → Settings → Environment Variables : ANTHROPIC_API_KEY = votre clé.
//   2. Dans les deux pages HTML, passer USE_API = true.
//   3. Redéployer. Tant que la clé n'est pas là, les pages tournent en « mode démo ».
//
// Sans dépendance (fetch natif de Node 18+ sur Vercel). Pour passer au SDK officiel,
// `npm i @anthropic-ai/sdk` et remplacer l'appel fetch par client.messages.create.
//
// Modèle : claude-opus-5 par défaut. Pour un outil public à fort trafic, claude-sonnet-5
// est un compromis coût/latence raisonnable — changer MODEL ci-dessous.

const MODEL = 'claude-opus-5';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    res.status(503).json({ error: 'api_key_absente', hint: 'Configurer ANTHROPIC_API_KEY dans Vercel.' });
    return;
  }

  const { mode = 'bilingue', entreprise = '', secteur = '', marche = 'Québec' } = req.body || {};
  const co = String(entreprise).slice(0, 200);
  const sec = String(secteur).slice(0, 200);
  const zone = String(marche).slice(0, 80);

  // Deux formats de sortie selon l'instrument appelant.
  const schema = mode === 'citable'
    ? {
        type: 'object', additionalProperties: false,
        required: ['score', 'pistes'],
        properties: {
          score: { type: 'integer' },
          pistes: { type: 'array', items: { type: 'string' } }
        }
      }
    : {
        type: 'object', additionalProperties: false,
        required: ['en', 'fr'],
        properties: {
          en: { type: 'integer' },
          fr: { type: 'integer' }
        }
      };

  const prompt = mode === 'citable'
    ? `Tu évalues la « citabilité » d'une entreprise par les modèles d'IA (GEO). `
      + `Entreprise : "${co}". Secteur : "${sec}". Marché : "${zone}". `
      + `Estime un indice de citabilité de 0 à 100 (probabilité qu'un LLM la cite comme source `
      + `pour une question d'acheteur du secteur) et donne 2 à 4 pistes concrètes en français. `
      + `Réponds uniquement selon le schéma JSON.`
    : `Tu mesures l'écart de citation bilingue d'une entreprise. `
      + `Entreprise : "${co}". Secteur : "${sec}". Marché : "${zone}". `
      + `Pose mentalement la même question d'acheteur en anglais puis en français `
      + `(« meilleures entreprises de ${sec} à ${zone} ») et estime, de 0 à 100, `
      + `la probabilité que l'entreprise soit citée dans chaque langue (champs "en" et "fr"). `
      + `Réponds uniquement selon le schéma JSON.`;

  try {
    const r = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        output_config: { format: { type: 'json_schema', schema } },
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!r.ok) {
      const detail = await r.text();
      res.status(502).json({ error: 'anthropic_error', status: r.status, detail: detail.slice(0, 500) });
      return;
    }

    const data = await r.json();
    // Les classifieurs de sécurité peuvent décliner : vérifier stop_reason avant de lire content.
    if (data.stop_reason === 'refusal') {
      res.status(200).json({ error: 'refus', message: 'Requête déclinée par le modèle.' });
      return;
    }
    const textBlock = (data.content || []).find(b => b.type === 'text');
    if (!textBlock) {
      res.status(502).json({ error: 'reponse_vide' });
      return;
    }
    const parsed = JSON.parse(textBlock.text);
    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: 'exception', message: String(e).slice(0, 300) });
  }
}
