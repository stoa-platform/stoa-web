/** Product marketing copy. Documentation remains the getting-started and reference destination. */
export const productHomeLinks = {
  cab: 'https://cab-ingenierie.com/',
  labs: 'https://cab-ingenierie.com/labs',
  docs: 'https://docs.gostoa.dev/',
  quickstart: 'https://docs.gostoa.dev/docs/guides/quickstart',
  architecture: 'https://docs.gostoa.dev/docs/concepts/architecture',
  apiReference: 'https://docs.gostoa.dev/docs/api/control-plane',
  github: 'https://github.com/stoa-platform/stoa',
} as const;

export const productHome = {
  fr: {
    meta: {
      title: 'STOA — La plateforme pour vos API et agents IA',
      description: 'STOA relie vos API à vos équipes et aux agents IA. Découvrez la console, la gouvernance des accès et l’observabilité.',
    },
    nav: {
      label: 'Navigation principale',
      logoLabel: 'STOA — accueil',
      product: 'Le produit',
      features: 'Fonctionnalités',
      architecture: 'Architecture',
      resources: 'Ressources',
      github: 'GitHub',
      docs: 'Documentation',
      menu: 'Menu',
    },
    hero: {
      label: 'LA PLATEFORME API & AGENTS IA',
      title: ['Connectez les agents IA', 'à votre univers d’API.'],
      lead: [
        'Un catalogue partagé. Des accès maîtrisés. Des échanges traçables.',
        'STOA relie vos équipes et vos agents aux services de votre entreprise.',
      ],
      explore: 'Explorer le produit',
      start: 'Guide de démarrage',
      caption: 'Code publié sous Apache 2.0 · Documentation accessible',
    },
    preview: {
      label: 'Dans la console STOA',
      eyebrow: 'CAPTURES DU PRODUIT · DÉMONSTRATION',
      historicalNotice: 'Captures de démonstration historiques, non actuelles.',
      consoleTitle: 'STOA Console',
      tablistLabel: 'Choisir une vue de la console',
      enlarge: 'Agrandir',
      dialogTitle: 'Console STOA · capture de démonstration historique',
      close: 'Fermer',
      views: [
        {
          key: 'catalogue',
          label: 'Catalogue d’API',
          source: 'console-catalogue.png',
          alt: 'Capture de la console STOA : catalogue d’API dans un environnement de démonstration.',
          caption: 'Catalogue d’API — capture de démonstration.',
        },
        {
          key: 'trafic',
          label: 'Trafic & observabilité',
          source: 'console-trafic.png',
          alt: 'Capture de la console STOA : vue Call Flow et graphiques d’observabilité dans un environnement de démonstration.',
          caption: 'Observabilité — données de démonstration, non actuelles.',
        },
      ],
    },
    features: {
      "eyebrow": "POUR LES ÉQUIPES PLATEFORME ET LES DÉVELOPPEURS",
      "title": [
        "Ouvrir les accès utiles.",
        "Comprendre les échanges."
      ],
      "description": "STOA aide les équipes plateforme et les développeurs à exposer leurs API aux agents IA, avec des droits définis et une visibilité sur les appels.",
      "items": [
        {
          "key": "catalogue",
          "title": [
            "Qui peut faire quoi ?",
            "Des droits explicites."
          ],
          "description": "Associez chaque consommateur aux services et aux actions qu’il peut utiliser.",
          "detailsLabel": "Identités & autorisations",
          "details": "L’authentification et les règles d’autorisation déterminent l’accès aux services exposés. Leur configuration dépend de votre architecture."
        },
        {
          "key": "governance",
          "title": [
            "Comment l’intégrer ?",
            "Devant vos API existantes."
          ],
          "description": "Placez une passerelle entre les agents et les services que vous exposez, avec un plan de contrôle pour le catalogue et les règles.",
          "detailsLabel": "Intégration & prérequis",
          "details": "L’intégration se prépare selon vos protocoles, votre hébergement et vos mécanismes d’identité. La documentation décrit les composants et les prérequis."
        },
        {
          "key": "observability",
          "title": [
            "Pourquoi cet échec ?",
            "Un contexte visible."
          ],
          "description": "Retrouvez le résultat et le contexte des appels pour distinguer un accès refusé d’une difficulté côté service.",
          "detailsLabel": "Journaux, métriques & traces",
          "details": "Les journaux, métriques et traces éclairent le parcours d’un appel. Le niveau de détail disponible dépend de la configuration."
        }
      ]
    },
    architecture: {
      eyebrow: 'Pensé pour votre architecture',
      title: ['Vos services restent', 'au cœur du système.'],
      description: 'La passerelle gère les appels. Le plan de contrôle porte le catalogue et les politiques. Les agents et applications accèdent ainsi à vos API par un point de passage défini.',
      link: 'Explorer l’architecture',
      diagram: {
        label: 'Schéma de principe : le plan de contrôle gère le catalogue et les politiques ; les agents et applications appellent les API existantes à travers la passerelle STOA.',
        tag: 'SCHÉMA DE PRINCIPE / STOA',
        controlPlane: 'Plan de contrôle',
        controlPlaneDetail: 'Catalogue · Politiques',
        consumers: 'Agents & apps',
        consumersDetail: 'Consommateurs',
        gateway: 'Passerelle STOA',
        gatewayDetail: 'Accès · Routage',
        services: 'Vos API',
        servicesDetail: 'Services existants',
        caption: 'MCP & API · Identité · Traçabilité',
      },
    },
    resources: {
      "eyebrow": "POUR ÉVALUER STOA",
      "title": [
        "Comprendre. Essayer.",
        "Décider sur des faits."
      ],
      "description": "Commencez par un premier appel, situez la passerelle dans votre système puis examinez le code.",
      "items": [
        {
          "key": "quickstart",
          "tag": "01 / ESSAYER",
          "title": "Faire un premier appel",
          "description": "Suivez le guide et ses prérequis pour tester un accès via STOA.",
          "href": productHomeLinks.quickstart
        },
        {
          "key": "docs",
          "tag": "02 / INTÉGRER",
          "title": "Situer la passerelle",
          "description": "Comprenez les composants, le déploiement et la place de STOA dans votre architecture.",
          "href": productHomeLinks.architecture
        },
        {
          "key": "github",
          "tag": "03 / EXAMINER",
          "title": "Examiner le code",
          "description": "Consultez les sources publiées sous licence Apache 2.0.",
          "href": productHomeLinks.github
        }
      ]
    },
    documentationPaths: {
      label: 'Documentation : prise en main et référence',
      guide: 'Guide de démarrage',
      architecture: 'Architecture',
      apiReference: 'Référence API',
    },
    footer: {
      tagline: 'Vos API. Vos équipes. Vos agents IA.',
      product: 'Le produit',
      docs: 'Documentation',
      github: 'GitHub',
      cab: { label: 'Un produit CAB Ingénierie', description: 'Conseil & accompagnement' },
      labs: { label: 'STOA Labs', description: 'Explorations techniques' },
    },
  },
  en: {
    meta: {
      title: 'STOA — The platform for your APIs and AI agents',
      description: 'STOA connects your APIs to your teams and AI agents. Explore the console, access governance and observability.',
    },
    nav: {
      label: 'Main navigation',
      logoLabel: 'STOA — home',
      product: 'The product',
      features: 'Features',
      architecture: 'Architecture',
      resources: 'Resources',
      github: 'GitHub',
      docs: 'Documentation',
      menu: 'Menu',
    },
    hero: {
      label: 'THE API & AI AGENT PLATFORM',
      title: ['Connect AI agents', 'to your API ecosystem.'],
      lead: [
        'A shared catalogue. Controlled access. Traceable exchanges.',
        'STOA connects your teams and agents to your company’s services.',
      ],
      explore: 'Explore the product',
      start: 'Quickstart guide',
      caption: 'Code published under Apache 2.0 · Documentation available',
    },
    preview: {
      label: 'Inside the STOA console',
      eyebrow: 'PRODUCT SCREENSHOTS · DEMONSTRATION',
      historicalNotice: 'Historical demonstration screenshots, not current data.',
      consoleTitle: 'STOA Console',
      tablistLabel: 'Choose a console view',
      enlarge: 'Enlarge',
      dialogTitle: 'STOA Console · historical demonstration screenshot',
      close: 'Close',
      views: [
        {
          key: 'catalogue',
          label: 'API catalogue',
          source: 'console-catalogue.png',
          alt: 'STOA console screenshot: API catalogue in a demonstration environment.',
          caption: 'API catalogue — demonstration screenshot.',
        },
        {
          key: 'trafic',
          label: 'Traffic & observability',
          source: 'console-trafic.png',
          alt: 'STOA console screenshot: Call Flow view and observability charts in a demonstration environment.',
          caption: 'Observability — demonstration data, not current data.',
        },
      ],
    },
    features: {
      "eyebrow": "FOR PLATFORM TEAMS AND DEVELOPERS",
      "title": [
        "Enable the right access.",
        "Understand the exchanges."
      ],
      "description": "STOA helps platform teams and developers expose their APIs to AI agents, with defined permissions and visibility into calls.",
      "items": [
        {
          "key": "catalogue",
          "title": [
            "Who can do what?",
            "Explicit permissions."
          ],
          "description": "Connect each consumer to the services and actions it is allowed to use.",
          "detailsLabel": "Identity & authorisation",
          "details": "Authentication and authorisation rules determine access to exposed services. Their configuration depends on your architecture."
        },
        {
          "key": "governance",
          "title": [
            "How does it fit?",
            "In front of existing APIs."
          ],
          "description": "Place a gateway between agents and the services you expose, with a control plane for the catalogue and rules.",
          "detailsLabel": "Integration & prerequisites",
          "details": "Plan the integration around your protocols, hosting and identity mechanisms. The documentation describes the components and prerequisites."
        },
        {
          "key": "observability",
          "title": [
            "Why did it fail?",
            "Context you can see."
          ],
          "description": "Find call results and context to distinguish denied access from a service-side issue.",
          "detailsLabel": "Logs, metrics & traces",
          "details": "Logs, metrics and traces help explain a call’s path. The level of detail available depends on the configuration."
        }
      ]
    },
    architecture: {
      eyebrow: 'Designed for your architecture',
      title: ['Your services remain', 'at the heart of the system.'],
      description: 'The gateway handles calls. The control plane manages the catalogue and policies. Agents and applications can then access your APIs through a defined entry point.',
      link: 'Explore the architecture',
      diagram: {
        label: 'Conceptual diagram: the control plane manages the catalogue and policies; agents and applications call existing APIs through the STOA gateway.',
        tag: 'CONCEPTUAL DIAGRAM / STOA',
        controlPlane: 'Control plane',
        controlPlaneDetail: 'Catalogue · Policies',
        consumers: 'Agents & apps',
        consumersDetail: 'Consumers',
        gateway: 'STOA gateway',
        gatewayDetail: 'Access · Routing',
        services: 'Your APIs',
        servicesDetail: 'Existing services',
        caption: 'MCP & APIs · Identity · Traceability',
      },
    },
    resources: {
      "eyebrow": "EVALUATE STOA",
      "title": [
        "Understand. Try.",
        "Decide on evidence."
      ],
      "description": "Start with a first call, see where the gateway fits in your system, then examine the code.",
      "items": [
        {
          "key": "quickstart",
          "tag": "01 / TRY",
          "title": "Make a first call",
          "description": "Follow the guide and its prerequisites to test access through STOA.",
          "href": productHomeLinks.quickstart
        },
        {
          "key": "docs",
          "tag": "02 / INTEGRATE",
          "title": "Place the gateway",
          "description": "Understand the components, deployment and STOA’s role in your architecture.",
          "href": productHomeLinks.architecture
        },
        {
          "key": "github",
          "tag": "03 / EXAMINE",
          "title": "Examine the code",
          "description": "Browse the source code published under the Apache 2.0 licence.",
          "href": productHomeLinks.github
        }
      ]
    },
    documentationPaths: {
      label: 'Documentation: getting started and reference',
      guide: 'Quickstart guide',
      architecture: 'Architecture',
      apiReference: 'API reference',
    },
    footer: {
      tagline: 'Your APIs. Your teams. Your AI agents.',
      product: 'The product',
      docs: 'Documentation',
      github: 'GitHub',
      cab: { label: 'A CAB Ingénierie product', description: 'Consulting & support' },
      labs: { label: 'STOA Labs', description: 'Technical explorations' },
    },
  },
} as const;

export type ProductHomeLocale = keyof typeof productHome;
