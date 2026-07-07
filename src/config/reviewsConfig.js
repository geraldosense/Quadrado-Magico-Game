/**
 * Sincronização global de críticas (Firebase Firestore).
 * Para todos os jogadores verem as mesmas avaliações:
 * 1. Crie um projecto em https://console.firebase.google.com
 * 2. Active Firestore Database
 * 3. Regras públicas de leitura/escrita na coleção "reviews" (apenas create + read)
 * 4. Preencha os campos abaixo e defina enabled: true
 */
export const REVIEWS_CONFIG = {
  firebase: {
    enabled: false,
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    collection: 'reviews',
  },
};
