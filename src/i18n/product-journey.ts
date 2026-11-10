/** Illustrated product journey. Examples do not execute requests. */
export const productJourney = {
  "fr": {
    "hero": {
      "eyebrow": "API & AGENTS IA · UNE PLATEFORME",
      "title": [
        "Connectez vos agents.",
        "Gardez la main sur vos API."
      ],
      "description": "Un catalogue pour trouver le bon service, des règles pour y accéder, une trace pour comprendre chaque échange.",
      "primary": "Voir STOA en action",
      "secondary": "Guide de démarrage",
      "sceneLabel": "Un appel, du départ à la trace",
      "agent": "Agent / application",
      "agentDetail": "Demande un service",
      "gateway": "STOA",
      "gatewayDetail": "Identité · Accès · Routage",
      "api": "Votre API",
      "apiDetail": "Service existant",
      "logLabel": "Parcours illustré",
      "logLines": [
        "01 IDENTITÉ",
        "02 ACCÈS",
        "03 TRACE"
      ],
      "sceneFootnote": "Schéma illustratif. Aucune requête envoyée."
    },
    "journey": {
      "eyebrow": "LE PRODUIT, ÉTAPE PAR ÉTAPE",
      "title": [
        "Suivez un appel.",
        "Comprenez chaque étape."
      ],
      "description": "De la découverte du service à la lecture de sa trace, explorez le rôle de STOA dans un échange.",
      "tablist": "Les quatre étapes d’un appel",
      "play": "Voir le parcours",
      "pause": "Mettre en pause",
      "replay": "Rejouer",
      "progressLabel": "Étape",
      "notice": "Parcours illustré. Les vues console sont des captures de démonstration historiques ; aucune requête n’est envoyée.",
      "steps": [
        {
          "key": "discover",
          "label": "Découvrir",
          "kicker": "01 / CATALOGUE",
          "title": "Le service que vous cherchez, au bon endroit.",
          "description": "Repérez les API disponibles et retrouvez leur contexte dans un catalogue partagé.",
          "detail": "La capture présente le catalogue d’un environnement de démonstration.",
          "visualLabel": "Console STOA · catalogue",
          "bulletTitle": "Ce que vous retrouvez",
          "bullets": [
            "Un catalogue de services",
            "Une API identifiée",
            "Son contexte d’utilisation"
          ]
        },
        {
          "key": "authorize",
          "label": "Autoriser",
          "kicker": "02 / ACCÈS",
          "title": "Un accès associé à une identité.",
          "description": "L’identité du consommateur et l’accès demandé sont confrontés aux règles configurées.",
          "detail": "Cette politique est un exemple pour expliquer le contrôle d’accès.",
          "visualLabel": "Illustration · contrôle d’accès",
          "bulletTitle": "Les points de contrôle",
          "bullets": [
            "Identité du consommateur",
            "Ressource demandée",
            "Droit de lecture illustré"
          ]
        },
        {
          "key": "call",
          "label": "Appeler",
          "kicker": "03 / PASSERELLE",
          "title": "Un appel qui suit un chemin défini.",
          "description": "L’agent passe par STOA pour joindre le service demandé.",
          "detail": "La requête et la réponse sont des exemples statiques, sans exécution.",
          "visualLabel": "Illustration · requête et réponse",
          "bulletTitle": "Le chemin de l’échange",
          "bullets": [
            "Une demande de l’agent",
            "Un passage par la passerelle",
            "Une réponse du service"
          ]
        },
        {
          "key": "observe",
          "label": "Observer",
          "kicker": "04 / TRACE",
          "title": "Le résultat, avec son contexte.",
          "description": "Retrouvez la circulation des appels et les indications utiles au diagnostic.",
          "detail": "Cette vue d’observabilité est une capture historique, pas un relevé en temps réel.",
          "visualLabel": "Console STOA · observabilité",
          "bulletTitle": "Ce que vous pouvez examiner",
          "bullets": [
            "Vue du trafic",
            "Résultats des appels",
            "Éléments de diagnostic"
          ]
        }
      ]
    },
    "policy": {
      "title": "Vérifier l’accès",
      "subtitle": "EXEMPLE DE POLITIQUE",
      "identity": "Identité",
      "identityValue": "agent-demo",
      "resource": "Ressource",
      "resourceValue": "/example/orders",
      "scope": "Droit demandé",
      "scopeValue": "lecture",
      "checks": [
        "Identité reconnue",
        "Ressource identifiée",
        "Lecture autorisée"
      ],
      "decision": "Accès autorisé · exemple"
    },
    "request": {
      "title": "Du point d’entrée à la réponse",
      "subtitle": "EXEMPLE STATIQUE",
      "requestLabel": "Requête illustrée",
      "responseLabel": "Réponse illustrée",
      "note": "GET /example/orders est un exemple pédagogique, sans exécution ni appel au produit."
    }
  },
  "en": {
    "hero": {
      "eyebrow": "APIS & AI AGENTS · ONE PLATFORM",
      "title": [
        "Connect your agents.",
        "Keep control of your APIs."
      ],
      "description": "A catalogue to find the right service, rules to access it, and a trace to understand each exchange.",
      "primary": "See STOA in action",
      "secondary": "Quickstart guide",
      "sceneLabel": "An API call, from request to trace",
      "agent": "Agent / application",
      "agentDetail": "Requests a service",
      "gateway": "STOA",
      "gatewayDetail": "Identity · Access · Routing",
      "api": "Your API",
      "apiDetail": "Existing service",
      "logLabel": "Illustrated journey",
      "logLines": [
        "01 IDENTITY",
        "02 ACCESS",
        "03 TRACE"
      ],
      "sceneFootnote": "Illustrative diagram. No request is sent."
    },
    "journey": {
      "eyebrow": "THE PRODUCT, STEP BY STEP",
      "title": [
        "Follow a call.",
        "Understand each step."
      ],
      "description": "From finding a service to reading its trace, explore STOA’s role in an exchange.",
      "tablist": "The four steps of an API call",
      "play": "Play the journey",
      "pause": "Pause",
      "replay": "Replay",
      "progressLabel": "Step",
      "notice": "Illustrated journey. Console views are historical demonstration screenshots; no request is sent.",
      "steps": [
        {
          "key": "discover",
          "label": "Discover",
          "kicker": "01 / CATALOGUE",
          "title": "The service you need, in the right place.",
          "description": "Find available APIs and their context in a shared catalogue.",
          "detail": "The screenshot shows the catalogue in a demonstration environment.",
          "visualLabel": "STOA console · catalogue",
          "bulletTitle": "What you can find",
          "bullets": [
            "A catalogue of services",
            "An identified API",
            "Its usage context"
          ]
        },
        {
          "key": "authorize",
          "label": "Authorize",
          "kicker": "02 / ACCESS",
          "title": "Access tied to an identity.",
          "description": "The consumer’s identity and requested access are checked against the configured rules.",
          "detail": "This example policy illustrates the access check.",
          "visualLabel": "Illustration · access check",
          "bulletTitle": "The control points",
          "bullets": [
            "Consumer identity",
            "Requested resource",
            "Illustrated read permission"
          ]
        },
        {
          "key": "call",
          "label": "Call",
          "kicker": "03 / GATEWAY",
          "title": "A call with a defined path.",
          "description": "The agent goes through STOA to reach the requested service.",
          "detail": "The request and response are static examples, with no execution.",
          "visualLabel": "Illustration · request and response",
          "bulletTitle": "The path of the exchange",
          "bullets": [
            "A request from the agent",
            "A pass through the gateway",
            "A response from the service"
          ]
        },
        {
          "key": "observe",
          "label": "Observe",
          "kicker": "04 / TRACE",
          "title": "The result, with its context.",
          "description": "See the flow of calls and the information that helps diagnose issues.",
          "detail": "This observability view is a historical screenshot, not a real-time reading.",
          "visualLabel": "STOA console · observability",
          "bulletTitle": "What you can examine",
          "bullets": [
            "Traffic overview",
            "Call results",
            "Diagnostic information"
          ]
        }
      ]
    },
    "policy": {
      "title": "Check access",
      "subtitle": "EXAMPLE POLICY",
      "identity": "Identity",
      "identityValue": "agent-demo",
      "resource": "Resource",
      "resourceValue": "/example/orders",
      "scope": "Requested permission",
      "scopeValue": "read",
      "checks": [
        "Identity recognised",
        "Resource identified",
        "Read access allowed"
      ],
      "decision": "Access allowed · example"
    },
    "request": {
      "title": "From entry point to response",
      "subtitle": "STATIC EXAMPLE",
      "requestLabel": "Illustrated request",
      "responseLabel": "Illustrated response",
      "note": "GET /example/orders is an educational example. It is not executed and does not call the product."
    }
  }
} as const;

export type JourneyLocale = keyof typeof productJourney;
