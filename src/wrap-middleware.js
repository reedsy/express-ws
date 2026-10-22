export function wrapMiddleware(middleware) {
  return async (req, res, next) => {
    if (req.ws !== null && req.ws !== undefined) {
      req.wsHandled = true;
      const passOn = (skipOrError) => {
        if (skipOrError) req.wsHandled = false;
        next(skipOrError);
      };
      try {
        /* Unpack the `.ws` property and call the actual handler. */
        await middleware(req.ws, req, passOn);
      } catch (err) {
        /* If an error is thrown, let's send that on to any error handling */
        passOn(err || new Error('Rejected promise'));
      }
    } else {
      /* This wasn't a WebSocket request, so skip this middleware. */
      next();
    }
  };
}
