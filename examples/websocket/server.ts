import { createServer } from "http";
import { WebSocketServer } from "ws";
import { ResponseServer, isBridgeRequest } from "laavka";

// Setup a simple http server and websocket server
const server = createServer();
const wss = new WebSocketServer({ server: server });

// Bridge class definition
export class BridgeHandler {
	async ping() {
		return "pong";
	}
}

// Create a handler which wil handle requests from clients
const handler = new ResponseServer(new BridgeHandler());

wss.on("connection", (ws) => {
	const sesh = handler.getSeshToken();

	ws.on("error", console.error);

	ws.on("message", async (raw) => {
		const data = JSON.parse(raw.toString()); // This may throw if the raw data is not a JSON-valid string

		// Test if the message is a valid bridge request
		if (isBridgeRequest(data)) {
			// Create a response for the request
			const res = await handler.createResponse(data, { sesh });
			console.log("responding with:", res);

			// Send the response to the client
			ws.send(JSON.stringify(res));
		}
	});
});

server.listen(8080);
