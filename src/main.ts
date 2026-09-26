const app = document.querySelector<HTMLDivElement>("#app");

if (app) {
  app.innerHTML = `
    <main style="font-family: system-ui, sans-serif; max-width: 640px; margin: 4rem auto; padding: 0 1rem;">
      <h1>RAG Lab</h1>
      <p>An in-browser Retrieval-Augmented Generation playground.</p>
      <p>Scaffold deployed — pipeline explorer coming next.</p>
    </main>
  `;
}
