/**
 * Comunidade global — críticas visíveis em todos os dispositivos.
 *
 * CONFIGURAÇÃO (2 minutos, uma vez):
 * 1. https://jsonbin.io — conta gratuita
 * 2. Criar bin: {"reviews":[]}
 * 3. API Keys → Access Key com permissão Read + Update
 * 4. Colar binId e accessKey abaixo
 */
export const REVIEWS_CONFIG = {
  mode: 'community',

  community: {
    binId: '',
    accessKey: '',
    // Opcional: proxy Vercel (se fizer deploy de api/reviews.js)
    proxyUrl: '',
  },

  jsonbin: {
    binId: '',
    accessKey: '',
  },

  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    collection: 'reviews',
  },
};

export function getCommunityUrls() {
  const cfg = REVIEWS_CONFIG.community ?? {};
  if (cfg.binId?.trim() && cfg.accessKey?.trim()) {
    const id = cfg.binId.trim();
    return {
      mode: 'jsonbin',
      getUrl: `https://api.jsonbin.io/v3/b/${id}/latest`,
      putUrl: `https://api.jsonbin.io/v3/b/${id}`,
      accessKey: cfg.accessKey.trim(),
    };
  }
  if (cfg.proxyUrl?.trim()) {
    const url = cfg.proxyUrl.trim();
    return { mode: 'proxy', getUrl: url, putUrl: url, accessKey: null };
  }
  return { mode: null, getUrl: '', putUrl: '', accessKey: null };
}
