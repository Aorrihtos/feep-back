const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
    definition: {
        openapi: "3.0.0",
        info: { title: 'FEEP API', version: '1.0.0'}
    },
    apis: ['index.js', 'database/connector.js']
};

// Docs en JSON format
const swaggerSpec = swaggerJSDoc(options);

// Function to setup our docs
const swaggerDocs = (app, port) => {
    app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    console.log(`Version 1 Docs are available at http://localhost:${port}/api/v1/docs`);
}

module.exports = {swaggerDocs}