const express = require('express');
const path = require('path');
const { loginLimiter, refreshTokenLimiter } = require('../middleware/rateLimiters.middleware.js');
const getCipherKey = require('../drive/encryptAndDecrypt/cipherKey.js');
const User = require('../model/user.models.js')
const jwt = require('jsonwebtoken');

const router = express.Router();

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'loginPage.html'));
});

//i will add users manually,this wont be available until i get a better server 
// router.post('/signup', async (req, res, next) => {
//     try {
//         const { username, email, password } = req.body;
//         if (!password || !email || !username) {
//             return res.status(400).send({ message: 'Email,Password or username not found.' })
//         }

//         const user = await User.findOne({ email });
//         if (user) {
//             return res.status(400).json({ message: 'Email Already Exists.' });
//         }

//         let hashedHexPassword = getCipherKey(password).toString('hex');
//         const newUser = new User({
//             username,
//             email,
//             password: hashedHexPassword
//         });
//         await newUser.save();

//         res.status(201).json({ message: 'User created successfully.' });
//     }
//     catch (err) {
//         next(err);
//     }
// })

router.post('/login', loginLimiter, async (req, res, next) => {
    try {
        const { password, email } = req.body;
        if (!password || !email) {
            return res.status(400).send({ message: 'Email or Password not found.' })
        }

        const user = await User.findOne({ email });
        const passwordFromUser = getCipherKey(password).toString('hex');

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        if (user.password != passwordFromUser) {
            return res.status(401).json({ message: 'Invalid email or password' })
        }

        const accessToken = jwt.sign({ userId: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

        user.refreshToken = refreshToken;
        await user.save();

        res.json({ accessToken, refreshToken });
    }
    catch (err) {
        next(err);
    }
})

router.post('/refreshToken', refreshTokenLimiter, (req, res, next) => {
    try {
        let refreshToken = req.body.refreshToken;
        if (!refreshToken || refreshToken === "undefined") {
            return res.status(401).json({ message: 'Refresh token is required' });
        }
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
            if (err) {
                console.log("Error during jwt verify (this error can also be caused by non valid token)")
                return res.status(403).json({ message: 'Invalid token' });
            }

            const userId = decoded.userId;
            const user = await User.findOne({ _id: userId });
            if (!user) {
                return res.status(404).json({ message: 'User Not Found,Try Login in Again' });
            }
            if (user.refreshToken != refreshToken) {
                return res.status(401).send({ message: ":(" })
            }

            const accessToken = jwt.sign({ userId: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

            user.refreshToken = refreshToken;
            await user.save();

            res.status(200).send({ accessToken, refreshToken });
        });
    }
    catch (err) {
        next(err);
    }
})

module.exports = router;
