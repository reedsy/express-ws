/* This module does a lot of monkeypatching, but unfortunately that appears to be the only way to
 * accomplish this kind of stuff in Express.
 *
 * Here be dragons. */

import http from 'http';
import express from 'express';
import { WebSocketServer } from 'ws';

import { websocketUrl } from './websocket-url.js';
import { addWsMethod } from './add-ws-method.js';

export function expressWs(app, httpServer, options = {}) {
  let server = httpServer;

  if (server === null || server === undefined) {
    /* No HTTP server was explicitly provided, create one for our Express application. */
    server = http.createServer(app);

    app.listen = function serverListen(...args) {
      return server.listen(...args);
    };
  }

  /* Make our custom `.ws` method available directly on the Express application. You should
   * really be using Routers, though. */
  addWsMethod(app);

  /* Monkeypatch our custom `.ws` method into Express' Router prototype. This makes it possible,
   * when using the standard Express Router, to use the `.ws` method without any further calls
   * to `makeRouter`. When using a custom router, the use of `makeRouter` may still be necessary.
   *
   * Express 4 and Express 5 lay this out differently:
   *   - In Express 4, the `Router` factory function doubles as the prototype object - new
   *     routers are linked to it via `setPrototypeOf(router, Router)` and the routing methods
   *     are assigned directly onto `Router`. Patching `Router` itself is therefore enough.
   *   - In Express 5, the routing methods live on `Router.prototype` (a function-as-prototype
   *     object), and instances inherit from a `new Router()` whose own prototype is
   *     `Router.prototype`. Patching `Router` itself no longer reaches instances; we have to
   *     patch `Router.prototype` instead.
   *
   * Detect Express 5 by the presence of routing methods on the prototype, and patch whichever
   * target actually sits on the lookup chain that `router.ws(...)` resolves through. */
  if (!options.leaveRouterUntouched) {
    const routerPrototype = (express.Router.prototype && typeof express.Router.prototype.get === 'function')
      ? express.Router.prototype
      : express.Router;
    addWsMethod(routerPrototype);
  }

  // allow caller to pass in options to WebSocketServer constructor
  const wsOptions = options.wsOptions || {};
  wsOptions.server = server;
  const wsServer = new WebSocketServer(wsOptions);

  wsServer.on('connection', (socket, request) => {
    if ('upgradeReq' in socket) {
      request = socket.upgradeReq;
    }

    request.ws = socket;
    request.wsHandled = false;

    /* By setting this fake `.url` on the request, we ensure that it will end up in the fake
     * `.get` handler that we defined above - where the wrapper will then unpack the `.ws`
     * property, indicate that the WebSocket has been handled, and call the actual handler. */
    request.url = websocketUrl(request.url);

    const dummyResponse = new http.ServerResponse(request);

    dummyResponse.writeHead = function writeHead(statusCode) {
      if (statusCode > 200) {
        /* Something in the middleware chain signalled an error. */
        dummyResponse._header = ''; // eslint-disable-line no-underscore-dangle
        socket.close();
      }
    };

    app.handle(request, dummyResponse, () => {
      if (!request.wsHandled) {
        /* There was no matching WebSocket-specific route for this request. We'll close
         * the connection, as no endpoint was able to handle the request anyway... */
        socket.close();
      }
    });
  });

  return {
    app,
    getWss: function getWss() {
      return wsServer;
    },
    applyTo: function applyTo(router) {
      addWsMethod(router);
    }
  };
}
