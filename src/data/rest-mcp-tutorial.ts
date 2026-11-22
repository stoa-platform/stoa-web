import { getLocalizedHref, type Lang } from '../i18n/utils';

export const tutorialPath = '/tutorials/expose-rest-as-mcp/';
export const videoFiles = {
  source: '/media/tutorials/rest-mcp-orders.mp4',
  poster: '/media/tutorials/rest-mcp-orders.webp',
  width: 1120,
  height: 784,
  duration: 21,
  // Date of the first public release of this recording on STOA Learn.
  uploadDate: '2026-11-22',
  captions: {
    fr: '/media/tutorials/rest-mcp-orders.fr.vtt',
    en: '/media/tutorials/rest-mcp-orders.en.vtt',
  },
};

const text = {
  fr: {
    link: 'Tutoriel REST → MCP',
    skip: 'Aller au contenu',
    sovereignty: 'Auto-hébergement et souveraineté',
    title: 'Exposer une API REST comme outil MCP avec STOA',
    description: 'Exposez deux opérations OpenAPI via une passerelle MCP auto-hébergée. Autorisez la lecture et vérifiez que l’écriture refusée n’atteint pas l’API.',
    intro: 'Un agent qui consulte des commandes n’a pas besoin de pouvoir les créer. Exposez les deux opérations d’une API de test via une passerelle STOA auto-hébergée, puis vérifiez les droits de deux identités.',
    videoTitle: 'Démonstration REST → MCP avec deux identités',
    videoDescription: 'Capture d’un essai réel sur STOA 0.9.27 et une API de commandes de test. Le lecteur peut lister les commandes. Son écriture est refusée avant l’API, qui reçoit ensuite un seul POST, envoyé par le rédacteur.',
    play: 'Lire la vidéo',
    download: 'Ouvrir la vidéo MP4',
    learn: 'Faire l’exercice sur STOA Learn',
    learnHref: 'https://learn.gostoa.dev/cours/exposer-api-rest-en-mcp',
  },
  en: {
    link: 'REST to MCP tutorial',
    skip: 'Skip to content',
    sovereignty: 'Self-hosting and sovereignty',
    title: 'Expose a REST API as an MCP Tool with STOA',
    description: 'Expose two OpenAPI operations through a self-hosted MCP gateway. Allow reads and verify that a denied write never reaches the API.',
    intro: 'An agent that checks orders does not need permission to create them. Expose both operations of a test API through a self-hosted STOA gateway, then verify what each of two identities can do.',
    videoTitle: 'REST to MCP demonstration with two identities',
    videoDescription: 'A recording of the test on STOA 0.9.27 with a sandbox orders API. The reader can list orders. Its write is denied before reaching the API, and only the writer sends a POST to the API.',
    play: 'Play video',
    download: 'Open the MP4 video',
    learn: 'Try the exercise on STOA Learn',
    learnHref: 'https://learn.gostoa.dev/en/courses/expose-rest-api-as-mcp',
  },
};

export function tutorial(lang: Lang, site: URL) {
  const t = text[lang];
  const path = getLocalizedHref(lang, tutorialPath);
  return {
    ...t,
    path,
    canonical: new URL(path, site).href,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: t.videoTitle,
      description: t.videoDescription,
      thumbnailUrl: new URL(videoFiles.poster, site).href,
      uploadDate: videoFiles.uploadDate,
      duration: 'PT' + videoFiles.duration + 'S',
      contentUrl: new URL(videoFiles.source, site).href,
      inLanguage: lang,
    },
  };
}
