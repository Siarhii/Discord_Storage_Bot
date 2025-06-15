const { rateLimit } = require('express-rate-limit');

const globalRateLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 50,
    message: "Too many requests from this IP, please try again in 10 minutes.",
});

const apiLimiter = rateLimit({
    windowMs: 10 * 1000,
    max: 4,
    message: "Too many storedFile requests from this IP, please try again in 10 seconds.",
});

const fileUploadLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, 
    max: 4, 
    message: "Too many file upload requests from this IP, please try again later in 10 mins.",
});

const loginLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, 
    max: 4, 
    message: "Too many login requests from this IP, please try again later in 60 mins.",
});

const refreshTokenLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, 
    max: 5, 
    message: "Too many refresh Token requests from this IP, please try again later in 60 mins.",
})

const deleteFileLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, 
    max: 5, 
    message: "Too many delete file requests from this IP, please try again later in 10 mins.",
})

const downloadRoutesLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 12,
    message: "Too many requests from this IP, please try again in 10 minutes.",
});

const downloadRequestLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 4,
    message: "Too many download requests from this IP, please try again in 10 minutes.",
});

module.exports = {
    globalRateLimiter,
    fileUploadLimiter,
    loginLimiter,
    apiLimiter,
    refreshTokenLimiter,
    deleteFileLimiter,
    downloadRoutesLimiter,
    downloadRequestLimiter
}