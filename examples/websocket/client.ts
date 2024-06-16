import { WebSocket } from "ws";
import { createClientProxy, isBridgeResponse } from "laavka";
import type { BridgeHandler } from "./server";

// Open up a websocket connection to the server
const webSocket = new WebSocket("http://localhost:8080");
await new Promise((resolve, reject) => {
	webSocket.onopen = resolve;
	webSocket.onerror = reject;
});

// Create a bridge object and server-response handler
const [bridge, handleResponse] = createClientProxy<BridgeHandler>({
	postMessage: (msg) => {
		console.log("sending:", msg);
		webSocket.send(JSON.stringify(msg));
	},
});

// Messages sent from the server need to be forwarded to the response handler
webSocket.on("message", (raw) => {
	const data = JSON.parse(raw.toString());
	if (isBridgeResponse(data)) {
		console.log("received:", data);
		handleResponse(data);
	}
});

// Call the bridge method
console.log(await bridge.ping());

// Close the connection
webSocket.close();
