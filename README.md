# 🌉 laavka - powerful bridge between javascript runtimes

laavka is a powerful environment-agnostic bridge, which was first designed for foreground vs. background script communication, often used when developing web-based extensions. But since its flexible architecture, it may be used with websockets or any message-based communication mechanism, as it is the only requirement of laavka, for the client and server to be able to interchange messages freely.

## Installation

**TODO: npm publish**

## Getting started

laavka uses client-server architecture, to create client use `createClientProxy()`, to create server use `ResponseServer` class.

To see a full example using websocket take a look at the examples/websocket.

```ts
// server.ts
import { ResponseServer, isBridgeRequest } from "laavka";

export class BridgeHandler {
  async ping() {
    return "pong";
  }
}

const handler = new ResponseServer(new BridgeHandler());

// create a response to a request
if (isBridgeRequest(data)) {
  const res = await handler.createResponse(data);
  // ...send the response
}
```

```ts
// client.ts
import { createClientProxy, isBridgeResponse } from "laavka";
import type { BridgeHandler } from "./server";

const [bridge, handleResponse] = createClientProxy<BridgeHandler>({
  postMessage: (msg) => {
    console.log("sending:", msg);
    webSocket.send(JSON.stringify(msg));
  },
});

// in the handler for the server responses use
if (isBridgeResponse(data)) {
  handleResponse(data);
}

// to use the bridge, simply call its methods
const pong = await bridge.pong();
```

## Features

### Type-safety across the runtime bounds

Because the client bridge object shares the same interface as the server handler, it is type checked in the same way as calling it directly.

### Platform agnostic

This library lets you decide how the messages between get sent between client and server, so it is easy to integrate with many different platforms.

### Nesting

laavka allows you to organize methods to different objects.

```ts
bridge.users.getAll();
```

### Return callbacks

Bridge methods can return a function which can the client call.

```ts
// server
class BridgeHandler {
  async methodWithCleanup() {
    return async () => {
      // cleanup
    };
  }
}

// client
const cleanup = await bridge.methodWithCleanup();
await cleanup();
```

### Async iterators

Bridge can also return async iterators, which allows streaming data from server to client.

```ts
// server
class BridgeHandler {
  async *userRegisteredEvents() {
    yield "user1 registered";
    yield "user2 registered";
  }
}

// client
for await (const event of await bridge.userRegisteredEvents()) {
  console.log(event);
}
```

### SerializedError

Whenever bridge server throws, laavka tries to serialize the error and send it to the client. Error serialized this way will be of SerializedError instance.

```ts
// server
class BridgeHandler {
  async throw() {
    throw new Error("whoops");
  }
}

// client
try {
  await bridge.throw();
} catch (e) {
  console.log(e.message); // outputs: "whoops"
}
```

## Limitations

For laavka to support the function callbacks and async iterators, it needs to store some state on the server. Right now the server relies on the client to always call the functions and to deplete the iterators, so they will get removed from the state, because laavka right now does not implement any mechanism to solve this issue. This may not be an issue for user applications or extension, but it may be possibly a huge memory leak for a long running server.
