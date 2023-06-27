const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: 'FEEP API',
            description: 'First version of FEEP API, the first gamified social network!',
            version: '1.0.0',
            url: 'http://localhost:3000/api/v1',
            contact: {
                name: "Sergio Ferrer", // your name
                email: "sergioferrerept@gmail.com", // your email
                url: "https://www.linkedin.com/in/sergio-ferrer-canet-a1957b24a/", // your website
            }
        },
        servers: [
            {
                url: 'http://localhost/3000/api/v1',
                description: 'Development server'
            }
        ]
    },
    apis: [
        'routes/BlockRoutes.js',
        'routes/CommentRoutes.js',
        'routes/FollowRoutes.js',
        'routes/LikeRoutes.js',
        'routes/PostRoutes.js',
        'routes/RankRoutes.js',
        'routes/UserRoutes.js',
        'database/connector.js'
    ]
};

// Docs en JSON format
const swaggerSpec = swaggerJSDoc(options);

// Function to setup our docs
const swaggerDocs = (app, port) => {
    app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    console.log(`Version 1 Docs are available at http://localhost:${port}/api/v1/docs`);
}

module.exports = {swaggerDocs}