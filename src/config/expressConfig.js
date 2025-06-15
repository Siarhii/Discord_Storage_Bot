const express = require('express');

const applyExpressMiddlewares = require('../middleware/expressConfig.middleware.js');

const app = express();
const port = process.env.PORT;

const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

server.setTimeout(0);

//just to make sure any error doesnt go to client (in last part of index.js)
// app.use((err, req, res, next) => {
//     console.error(err.stack);
//     res.status(500).json({ error: 'Internal Server Error (first appUse)' });
// });

applyExpressMiddlewares(app);

module.exports = app;