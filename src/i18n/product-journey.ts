/** Illustrated support scenario. No customer data or real requests. */
export const productJourney = {
  "fr": {
    "hero": {
      "eyebrow": "VOS AGENTS. VOS RÈGLES.",
      "title": [
        "Ouvrez vos API aux agents.",
        "Pas toutes les portes."
      ],
      "description": "Votre assistant support doit retrouver une commande, pas modifier une fiche client. Donnez-lui l’accès utile et gardez la trace de ses actions.",
      "primary": "Voir le scénario",
      "secondary": "Guide de démarrage",
      "sceneLabel": "Un assistant support. Un accès limité.",
      "agent": "Assistant support",
      "agentDetail": "Consulter une commande",
      "gateway": "STOA",
      "gatewayDetail": "Droits vérifiés",
      "api": "Vos données",
      "apiDetail": "Commandes · Clients",
      "logLabel": "Un accès précis",
      "logLines": [
        "01 IDENTITÉ : assistant support",
        "02 DROIT : lire les commandes",
        "03 PREUVE : décision tracée"
      ],
      "sceneFootnote": "Un scénario de support client."
    },
    "journey": {
      "eyebrow": "UN BESOIN CONCRET. UNE LIMITE CLAIRE.",
      "title": [
        "Aider un client.",
        "Sans tout autoriser."
      ],
      "description": "Suivez un assistant support : il doit consulter une commande tout en gardant les données client à l’abri des modifications.",
      "tablist": "Les quatre étapes du scénario de support",
      "play": "Voir le scénario",
      "pause": "Mettre en pause",
      "replay": "Rejouer",
      "progressLabel": "Étape",
      "notice": "Scénario illustré. Aucune donnée client ni requête réelle.",
      "steps": [
        {
          "key": "discover",
          "label": "Le besoin",
          "kicker": "01 / UNE DEMANDE CLIENT",
          "title": "Retrouver une commande, sans ouvrir tout le SI.",
          "description": "L’assistant répond à une question de suivi. Une clé trop large lui donnerait aussi le droit de changer des informations client.",
          "detail": "Le risque vient de droits plus larges que le besoin.",
          "visualLabel": "Le périmètre à encadrer",
          "bulletTitle": "Partir du besoin réel",
          "bullets": [
            "Identifier l’assistant",
            "Définir son besoin",
            "Écarter les droits superflus"
          ]
        },
        {
          "key": "authorize",
          "label": "Les droits",
          "kicker": "02 / UN ACCÈS PRÉCIS",
          "title": "Lire une commande. Rien de plus.",
          "description": "Le périmètre choisi donne à l’assistant support le droit de consulter les commandes.",
          "detail": "Dans ce scénario, la modification des données client reste hors de son périmètre.",
          "visualLabel": "Le droit accordé",
          "bulletTitle": "Limiter l’accès utile",
          "bullets": [
            "Assistant support identifié",
            "Lecture des commandes autorisée",
            "Modification des clients exclue"
          ]
        },
        {
          "key": "call",
          "label": "Le contrôle",
          "kicker": "03 / DEUX ACTIONS À TESTER",
          "title": "Deux actions. Deux décisions.",
          "description": "Essayez une consultation de commande, puis une modification de client. Voyez où passe la limite.",
          "detail": "La simulation compare l’action demandée au droit accordé.",
          "visualLabel": "Testez la limite",
          "bulletTitle": "Choisissez une action",
          "bullets": [
            "Consulter une commande",
            "Tenter une modification",
            "Voir la décision"
          ]
        },
        {
          "key": "observe",
          "label": "La preuve",
          "kicker": "04 / UNE DÉCISION EXPLIQUÉE",
          "title": "Qui a demandé quoi, et pourquoi.",
          "description": "Une trace réunit l’identité de l’assistant, l’action demandée et la décision d’accès.",
          "detail": "La trace explique le résultat de l’action sélectionnée.",
          "visualLabel": "Le compte rendu de l’action",
          "bulletTitle": "Comprendre la décision",
          "bullets": [
            "Qui a fait la demande",
            "Quelle action a été tentée",
            "Pourquoi elle est autorisée ou refusée"
          ]
        }
      ]
    },
    "policy": {
      "title": "Un droit limité au besoin",
      "subtitle": "LE PÉRIMÈTRE CHOISI",
      "identity": "Identité",
      "identityValue": "Assistant support",
      "resource": "Ressource",
      "resourceValue": "Commandes",
      "scope": "Droit accordé",
      "scopeValue": "Lecture uniquement",
      "checks": [
        "Assistant identifié",
        "Lecture des commandes permise",
        "Modification des clients exclue"
      ],
      "decision": "Consulter, sans modifier"
    },
    "request": {
      "title": "Le droit fait la différence.",
      "subtitle": "À VOUS D’ESSAYER",
      "requestLabel": "Action demandée",
      "responseLabel": "Décision",
      "note": "Testez une consultation, puis une modification.",
      "allowedAction": "Consulter la commande",
      "blockedAction": "Modifier le client",
      "allowedResult": "Consultation autorisée",
      "blockedResult": "Modification refusée",
      "allowedDetail": "La lecture des commandes fait partie du droit accordé à l’assistant support.",
      "blockedDetail": "La modification des données client sort du périmètre accordé à l’assistant.",
      "decisionLabel": "Décision d’accès",
      "actorLabel": "Qui",
      "actorValue": "Assistant support",
      "actionLabel": "Action demandée",
      "resultLabel": "Résultat",
      "traceLabel": "Ce qui est tracé",
      "traceSteps": [
        "Identité : assistant support",
        "Action : consultation ou modification",
        "Décision : autorisation ou refus"
      ]
    }
  },
  "en": {
    "hero": {
      "eyebrow": "YOUR AGENTS. YOUR RULES.",
      "title": [
        "Open your APIs to agents.",
        "Not every door."
      ],
      "description": "Your support assistant needs to find an order, not edit a customer record. Give it the access it needs and keep a trace of its actions.",
      "primary": "Explore the scenario",
      "secondary": "Quickstart guide",
      "sceneLabel": "One support assistant. A defined scope.",
      "agent": "Support assistant",
      "agentDetail": "Look up an order",
      "gateway": "STOA",
      "gatewayDetail": "Access checked",
      "api": "Your data",
      "apiDetail": "Orders · Customers",
      "logLabel": "Precisely scoped access",
      "logLines": [
        "01 IDENTITY: support assistant",
        "02 ACCESS: read orders",
        "03 EVIDENCE: decision recorded"
      ],
      "sceneFootnote": "A customer support scenario."
    },
    "journey": {
      "eyebrow": "A REAL NEED. A CLEAR BOUNDARY.",
      "title": [
        "Help a customer.",
        "Without allowing everything."
      ],
      "description": "Follow a support assistant: it needs to look up an order while keeping customer records protected from changes.",
      "tablist": "The four steps of the support scenario",
      "play": "Play the scenario",
      "pause": "Pause",
      "replay": "Replay",
      "progressLabel": "Step",
      "notice": "Illustrated scenario. No customer data or real requests.",
      "steps": [
        {
          "key": "discover",
          "label": "The need",
          "kicker": "01 / A CUSTOMER REQUEST",
          "title": "Find an order without opening every system.",
          "description": "The assistant answers an order-status question. An overly broad key would also let it change customer information.",
          "detail": "The risk comes from access that goes beyond the task.",
          "visualLabel": "The scope to define",
          "bulletTitle": "Start with the actual need",
          "bullets": [
            "Identify the assistant",
            "Define its task",
            "Remove unnecessary permissions"
          ]
        },
        {
          "key": "authorize",
          "label": "The access",
          "kicker": "02 / A DEFINED SCOPE",
          "title": "Read an order. Nothing more.",
          "description": "The chosen scope lets the support assistant look up orders.",
          "detail": "In this scenario, changing customer records stays outside its scope.",
          "visualLabel": "The access granted",
          "bulletTitle": "Allow only what is needed",
          "bullets": [
            "Support assistant identified",
            "Order reading allowed",
            "Customer changes excluded"
          ]
        },
        {
          "key": "call",
          "label": "The check",
          "kicker": "03 / TWO ACTIONS TO TRY",
          "title": "Two actions. Two decisions.",
          "description": "Try looking up an order, then editing a customer. See where the boundary lies.",
          "detail": "The simulation checks the requested action against the access granted.",
          "visualLabel": "Try the boundary",
          "bulletTitle": "Choose an action",
          "bullets": [
            "Look up an order",
            "Attempt a change",
            "See the decision"
          ]
        },
        {
          "key": "observe",
          "label": "The evidence",
          "kicker": "04 / AN EXPLAINED DECISION",
          "title": "Who requested what, and why.",
          "description": "A trace brings together the assistant’s identity, the requested action and the access decision.",
          "detail": "The trace explains the result of the selected action.",
          "visualLabel": "The action record",
          "bulletTitle": "Understand the decision",
          "bullets": [
            "Who made the request",
            "Which action was attempted",
            "Why it was allowed or denied"
          ]
        }
      ]
    },
    "policy": {
      "title": "Access limited to the task",
      "subtitle": "THE CHOSEN SCOPE",
      "identity": "Identity",
      "identityValue": "Support assistant",
      "resource": "Resource",
      "resourceValue": "Orders",
      "scope": "Access granted",
      "scopeValue": "Read only",
      "checks": [
        "Assistant identified",
        "Order reading allowed",
        "Customer changes excluded"
      ],
      "decision": "Look up, without changing"
    },
    "request": {
      "title": "The permission makes the difference.",
      "subtitle": "TRY IT YOURSELF",
      "requestLabel": "Requested action",
      "responseLabel": "Decision",
      "note": "Try a lookup, then a change.",
      "allowedAction": "Look up the order",
      "blockedAction": "Edit the customer",
      "allowedResult": "Order lookup allowed",
      "blockedResult": "Customer change denied",
      "allowedDetail": "Reading orders is within the access granted to the support assistant.",
      "blockedDetail": "Changing customer records falls outside the assistant’s granted scope.",
      "decisionLabel": "Access decision",
      "actorLabel": "Who",
      "actorValue": "Support assistant",
      "actionLabel": "Requested action",
      "resultLabel": "Result",
      "traceLabel": "What is recorded",
      "traceSteps": [
        "Identity: support assistant",
        "Action: lookup or change",
        "Decision: allowed or denied"
      ]
    }
  }
} as const;

export type JourneyLocale = keyof typeof productJourney;
