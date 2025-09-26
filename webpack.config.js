// webpack.config.js
module.exports = {
  // ...
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      // what used to be in onBeforeSetupMiddleware:
      devServer.app.get("/healthz", (_req, res) => res.json({ ok: true }));

      // what used to be in onAfterSetupMiddleware:
      middlewares.push((req, _res, next) => {
        req._touched = true;
        next();
      });

      // order matters: unshift() = before built-ins; push() = after built-ins
      // e.g. run BEFORE built-ins:
      // middlewares.unshift(myMiddleware)

      return middlewares;
    },
  },
};
