## Ce que vous allez tester

| Identité | Opération | Résultat attendu |
| --- | --- | --- |
| Lecteur | Lister les commandes de test (`GET /orders`) | Autorisé |
| Lecteur | Créer une commande de test (`POST /orders`) | Refusé avant que l’API ne reçoive la requête |
| Écrivain | Créer cette même commande de test (`POST /orders`) | Autorisé par la politique configurée |

## Prérequis

- Un environnement STOA hors production avec une passerelle Rust en mode MCP, deux identités de test et une API joignable depuis la passerelle. Appuyez-vous sur le [guide de démarrage local](https://docs.gostoa.dev/fr/docs/guides/quickstart) et vérifiez le [mode de la passerelle](https://docs.gostoa.dev/fr/docs/guides/gateway-modes). Le Quickstart JWT minimal vérifie une route REST. Cet exercice appelle des outils MCP.
- Une API de test qui renvoie des commandes pour `GET /orders`, accepte un champ JSON `reference` pour `POST /orders` et enregistre chaque écriture acceptée. Utilisez des données fictives sur une API que vous contrôlez.
- `stoactl` avec la commande `bridge`, Bash, `jq` et `curl`. Pour appliquer les manifestes ci-dessous, utilisez un environnement Kubernetes de test où les ressources Tool de STOA et leur contrôleur sont déjà configurés.

## 1. Sélectionner deux opérations OpenAPI

Enregistrez le contenu suivant sous `orders.yaml`. Remplacez l’adresse du serveur par celle de l’API de test **du point de vue de la passerelle**.

```yaml
openapi: 3.0.3
info:
  title: Orders sandbox
  version: 1.0.0
servers:
  - url: http://orders.test.svc.cluster.local:8080
paths:
  /orders:
    get:
      operationId: list-orders
      summary: List test orders
      responses:
        '200':
          description: List of test orders
    post:
      operationId: create-order
      summary: Create a test order
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [reference]
              properties:
                reference:
                  type: string
      responses:
        '201':
          description: Test order created
```

## 2. Générer et autoriser les outils

Prévisualisez la correspondance entre opérations et outils. Remplacez `stoa-demo` par l’espace de noms Kubernetes de votre environnement de test. Un espace de noms Kubernetes et un tenant STOA sont deux réglages distincts.

```bash
stoactl bridge orders.yaml --namespace stoa-demo \
  --include-ops list-orders,create-order --dry-run
```

L’aperçu doit associer `list-orders` à `GET /orders` et `create-order` à `POST /orders`. Relancez la même commande avec `--output ./orders-tools` à la place de `--dry-run` pour générer les manifestes. Relisez-les, appliquez-les dans l’environnement de test selon la [procédure pour les ressources Tool](https://docs.gostoa.dev/fr/docs/reference/crds/tool) et vérifiez que la passerelle a enregistré les deux outils. Dans `READ_TOOL` et `WRITE_TOOL`, utilisez les noms exacts enregistrés sur cette passerelle, avec leur préfixe si le déploiement en ajoute un.

Dans votre tenant de test, configurez la politique pour autoriser explicitement les deux outils enregistrés pour leur serveur. Préparez ensuite deux identités dans le même tenant auprès de votre fournisseur d’identité. Donnez au lecteur le droit effectif `stoa:read`, sans rôle ni droit qui lui donnerait accès à l’écriture. Donnez à l’écrivain le droit effectif `stoa:write` pour cet exercice. Utilisez des jetons d’accès destinés à l’audience configurée sur la passerelle. Gardez les autres politiques identiques pour isoler l’effet des droits. Consultez la [référence sur l’autorisation et l’isolation des tenants](https://docs.gostoa.dev/fr/docs/reference/platform-security).

La politique du tenant détermine **quels outils peuvent être appelés dans ce tenant**. Les droits effectifs déterminent **quelles opérations l’identité peut effectuer**. Le repère « lecture seule » dans la description aide le client à comprendre l’outil. La politique de la passerelle applique la restriction.

## 3. Vérifier les trois appels MCP

Renseignez l’URL de base de votre passerelle de test dans `STOA_GATEWAY_URL`, sans `/mcp`. Chargez les jetons de test dans `READER_TOKEN` et `WRITER_TOKEN` par un moyen sécurisé. Utilisez une référence fictive encore inutilisée dans `TEST_ORDER_REFERENCE`. Exécutez ce bloc dans Bash avec `READ_TOOL` et `WRITE_TOOL` renseignés.

```bash
set -euo pipefail
: "${STOA_GATEWAY_URL:?}" "${READER_TOKEN:?}" "${WRITER_TOKEN:?}" "${TEST_ORDER_REFERENCE:?}"
: "${READ_TOOL:?}" "${WRITE_TOOL:?}"

call_tool() {
  local token=$1 tool=$2 id=$3 arguments=$4
  jq -cn --arg tool "$tool" --argjson id "$id" --argjson args "$arguments" \
    '{jsonrpc:"2.0", id:$id, method:"tools/call", params:{name:$tool, arguments:$args}}' |
    curl --silent --show-error --fail-with-body --max-time 15 \
      --header 'Content-Type: application/json' \
      --header @<(printf 'Authorization: Bearer %s\n' "$token") \
      --data-binary @- "${STOA_GATEWAY_URL%/}/mcp"
}

read_result=$(call_tool "$READER_TOKEN" "$READ_TOOL" 1 '{}')
jq -e '.jsonrpc == "2.0" and .id == 1 and .error == null and
       (.result.content | type == "array" and length > 0) and .result.isError != true' \
  <<< "$read_result" >/dev/null

order=$(jq -cn --arg ref "$TEST_ORDER_REFERENCE" '{reference:$ref}')
denied=$(call_tool "$READER_TOKEN" "$WRITE_TOOL" 2 "$order")
jq -e '.jsonrpc == "2.0" and .id == 2 and .error.code == -32001 and
       .error.data.httpStatus == 403 and .result == null' \
  <<< "$denied" >/dev/null

write_result=$(call_tool "$WRITER_TOKEN" "$WRITE_TOOL" 3 "$order")
jq -e '.jsonrpc == "2.0" and .id == 3 and .error == null and
       (.result.content | type == "array" and length > 0) and .result.isError != true' \
  <<< "$write_result" >/dev/null

printf '%s\n' 'MCP checks passed: read allowed, read-only write denied, authorized write allowed.'
```

Le script contrôle les réponses, dont le code de refus `-32001` à la tentative d’écriture du lecteur. Vérifiez aussi le journal ou la base de test de l’API. Il doit y avoir un seul `POST /orders` pour cette référence, provenant de l’appel de l’écrivain. Le refus seul ne prouve pas l’absence d’écriture côté API.

## Où s’appliquent les droits

```text
Agent → Passerelle MCP → Opération REST autorisée → API de test
                │
                ├─ Valider l’identité et le tenant
                ├─ Vérifier la politique par outil et les droits de l’appelant
                └─ Transmettre uniquement l’appel autorisé
```

Si votre déploiement collecte des traces ou des événements d’audit, relevez l’heure, le nom de l’outil, le résultat et l’identifiant de requête disponible dans la réponse ou le journal de la passerelle. Vérifiez quels champs existent pour votre scénario et comment ils se rapprochent du journal de l’API. Un refus peut laisser une preuve dans la passerelle sans trace côté API. Dans un exemple publié, excluez les jetons et le contenu des requêtes. Voir le [guide d’observabilité](https://docs.gostoa.dev/fr/docs/guides/observability).

<h2 id="sovereignty">Auto-hébergement et souveraineté des données</h2>

Vous pouvez déployer la passerelle et le plan de contrôle sur votre infrastructure. Situez aussi l’agent, le modèle, le fournisseur d’identité et les collecteurs de traces. Documentez les flux réseau dont chacun a besoin. Un modèle externe peut recevoir des données que l’agent lui transmet. Un déploiement hybride avec un plan de contrôle distant implique des échanges de gestion distincts. Vérifiez les flux de votre configuration avant de conclure sur la résidence des données ou le fonctionnement sans accès à Internet.

- [Déploiement souverain](https://docs.gostoa.dev/fr/docs/deployment/sovereign)
- [Déploiement hybride et flux de données](https://docs.gostoa.dev/fr/docs/deployment/hybrid)
- [Installation hors ligne](https://docs.gostoa.dev/fr/docs/deployment/offline-install)

## Étapes suivantes

- [Essayer STOA en local](https://docs.gostoa.dev/fr/docs/guides/quickstart)
- [Développer et enregistrer des outils MCP](https://docs.gostoa.dev/fr/docs/guides/mcp-tools-development)
- [Examiner la sécurité de STOA](https://docs.gostoa.dev/fr/docs/reference/platform-security)
