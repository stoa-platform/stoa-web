## What you'll test

| Identity | Operation | Expected result |
| --- | --- | --- |
| Reader | List test orders (`GET /orders`) | Allowed |
| Reader | Create a test order (`POST /orders`) | Denied before the API receives a request |
| Writer | Create the same test order (`POST /orders`) | Allowed by the configured policy |

## Prerequisites

- A non-production STOA environment with a Rust gateway serving MCP, two test identities, and an API reachable from the gateway. Start with the [local Quickstart](https://docs.gostoa.dev/docs/guides/quickstart) and check the [gateway mode](https://docs.gostoa.dev/docs/guides/gateway-modes). The minimal JWT Quickstart checks a REST route. This exercise calls MCP tools.
- A sandbox API that returns test orders for `GET /orders`, accepts a `reference` in a JSON body for `POST /orders`, and records each accepted write. Use synthetic data and an API you control.
- `stoactl` with the `bridge` command, Bash, `jq` and `curl`. For the manifest path below, use a Kubernetes test environment with STOA Tool CRDs and their controller already configured.

## 1. Select two OpenAPI operations

Save the following as `orders.yaml`. Replace the server URL with the sandbox API address as seen **from the gateway**.

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

## 2. Generate and authorize the tools

Preview the operation mapping. Replace `stoa-demo` with the Kubernetes namespace for this lab. A Kubernetes namespace and a STOA tenant are separate settings.

```bash
stoactl bridge orders.yaml --namespace stoa-demo \
  --include-ops list-orders,create-order --dry-run
```

The preview should show `list-orders` mapped to `GET /orders` and `create-order` to `POST /orders`. Run the same command with `--output ./orders-tools` in place of `--dry-run` to generate the manifests. Review them, apply them in your lab using the [Tool CRD workflow](https://docs.gostoa.dev/docs/reference/crds/tool), and check that the gateway has registered both names. Set `READ_TOOL` and `WRITE_TOOL` to the actual names registered on that gateway. If the deployment qualifies a tool name, use the qualified name.

In your test tenant, configure the tool permission policy to explicitly allow both registered tools for their server. Then set up two identities from your identity provider in that same tenant. Give the reader effective `stoa:read` and no role or scope that grants write access. Give the writer effective `stoa:write` for the exercise. Use access tokens valid for the gateway's configured audience. Keep the rest of the policies identical so that you can test the effect of the authorization scopes. See the [authorization policy and tenant boundaries](https://docs.gostoa.dev/docs/reference/platform-security).

The tenant policy determines **which tools can be called in that tenant**. The caller's effective permissions determine **which operations that identity can perform**. A read-only hint in a tool description helps the client understand the tool. The gateway's authorization policy enforces the restriction.

## 3. Check the three MCP calls

Set `STOA_GATEWAY_URL` to the base URL of your test gateway, without `/mcp`. Load the test reader and writer tokens into `READER_TOKEN` and `WRITER_TOKEN` securely. Use an unused synthetic value for `TEST_ORDER_REFERENCE`. Run this block in Bash with `READ_TOOL` and `WRITE_TOOL` set.

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

The script checks the response envelopes, including the `-32001` permission error in the reader's write attempt. Check the API log or test database as well. There should be exactly one `POST /orders` for your test reference, from the writer's request. A permission error on its own does not prove the API saw no write.

## Where the decision happens

```text
Agent → MCP gateway → permitted REST operation → test API
              │
              ├─ Validate the caller's identity and tenant
              ├─ Check the tenant tool policy and the caller's permissions
              └─ Forward only the allowed call
```

If the deployment collects traces or audit events, record the time, tool, outcome and the request identifier available in the response or gateway logs. Check which fields are present for your scenario and how they correlate with the API log. A rejected call may have gateway evidence without an API trace. Avoid recording tokens or request bodies in a published example. See [Observability](https://docs.gostoa.dev/docs/guides/observability).

<h2 id="sovereignty">Self-hosting and data sovereignty</h2>

You can deploy the gateway and control plane on infrastructure you operate. Document where the agent, model, identity provider and trace collector run, along with the network flows each needs. An external model can still receive data that the agent sends to it. A hybrid deployment with a remote control plane has separate management flows. Check those flows for your configuration before drawing conclusions about data residency or operation without internet access.

- [Sovereign deployment](https://docs.gostoa.dev/docs/deployment/sovereign)
- [Hybrid deployment and data flows](https://docs.gostoa.dev/docs/deployment/hybrid)
- [Offline installation](https://docs.gostoa.dev/docs/deployment/offline-install)

## Next steps

- [Run STOA locally](https://docs.gostoa.dev/docs/guides/quickstart)
- [Build and register MCP tools](https://docs.gostoa.dev/docs/guides/mcp-tools-development)
- [Review STOA platform security](https://docs.gostoa.dev/docs/reference/platform-security)
