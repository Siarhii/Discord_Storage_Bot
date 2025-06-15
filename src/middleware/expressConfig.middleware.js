const express = require('express');
const path = require('path');
// const cors = require('cors');
const { globalRateLimiter } = require('./rateLimiters.middleware.js');

module.exports = (app) => {

    const corsOptions = {
        origin: 'https://returdBot.duckdns.org:8080', 
        optionsSuccessStatus: 200
    };
    
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static(path.join(__dirname, '../public')));
    app.use((req, res, next) => {
        req.setTimeout(900000); // 15 minutes
        res.setTimeout(900000); 
        next();
    });
    app.set('views', path.join(__dirname, '../views'));
    app.set('view engine', 'ejs');
    
    // app.use(cors(corsOptions));
    app.use(globalRateLimiter);
};
