export default {
  async fetch(request, env) {
    // Sites provides the built Vite files through this asset binding.
    // Keeping the worker thin leaves the simulation fully local in the browser.
    return env.ASSETS.fetch(request);
  },
};
