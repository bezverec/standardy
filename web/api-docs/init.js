window.addEventListener("DOMContentLoaded", () => {
  window.ui = SwaggerUIBundle({
    url: "/openapi.json",
    dom_id: "#swagger-ui",
    deepLinking: true,
    filter: true,
    docExpansion: "list",
    defaultModelsExpandDepth: 0,
    supportedSubmitMethods: ["get"],
    validatorUrl: null,
    persistAuthorization: false,
  });
});
