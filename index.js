const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const session = require('express-session');

const app = express();
const port = process.env.PORT;
const mongoDB = process.env.MONGODB_URI;
const secret = process.env.SECRET;
const User = require('./models/user.js');

mongoose.connect(mongoDB, { useNewUrlParser: true , useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.set('view engine', 'ejs');
app.use('/public', express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(session({ 
    secret: secret,
    resave: false,
    saveUninitialized: false
}));

function getHashedPassword(password) {
    const sha256 = crypto.createHash('sha256');
    const hash = sha256.update(password).digest('base64');
    return hash;
}

app.get('/', (req, res) => {
    if (req.session.user) {
        res.redirect(`/users/${req.session.user}`);
    } else {
        res.render('index');
    }
});

app.get('/register', (req, res) => {
    if (req.session.user) {
        res.redirect(`/users/${req.session.user}`);
    } else {
        res.render('register', { message: null });
    }
});

app.post('/register', (req, res) => {
    let { name, username, password, confirmPassword } = req.body;
    if (password.length < 6) {
        res.render('register', { message: "Password must be at least 6 characters long." });
    } else if (username.length < 6) {
        res.render('register', { message: "Username must be at least 6 characters long." });
    } else if (password !== confirmPassword) {
        res.render('register', { message: "Passwords don't match." });
    } else {
        User.findOne({username: username}).exec((err, user) => {
            if (err) {
                throw err;
            } else if (user) {
                res.render('register', { message: "This username is already taken." });
            } else {
                password = getHashedPassword(password);
                let newUser = new User({
                    username: username,
                    password: password,
                    name: name,
                    items: []
                });
                newUser.save();
                req.session.user = username;
                res.redirect(`/users/${username}`);
            }
        });
    }
});

app.get('/login', (req, res) => {
    if (req.session.user) {
        res.redirect(`/users/${req.session.user}`);
    } else {
        res.render('login', { message: null });
    }
});

app.post('/login', (req, res) => {
    let { username, password, } = req.body;
    password = getHashedPassword(password);
    User.findOne({username: username, password: password}).exec((err, user) => {
        if (err) {
            throw err;
        } else if (user) {
            req.session.user = username;
            res.redirect(`/users/${username}`);
        } else {
            res.render('login', { message: "Invalid username or password." });
        }
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

app.get('/users/:username', (req, res) => {
    if (req.session.user) {
        let username = req.params.username;
        if (req.session.user === username) {
            User.findOne({username: username}).exec((err, user) => {
                if (err) {
                    throw err;
                } else {
                    res.render('user', { username: username, name: user.name, items: user.items });
                }
            });
        } else {
            res.redirect(`/users/${req.session.user}`);
        }
    } else {
        res.redirect('/login');
    }
});

app.post('/users/:username', (req, res) => {
    let username = req.params.username;
    let newItem = req.body;
    User.findOne({username: username}).exec((err, user) => {
        if (err) {
            throw err;
        } else {
            user.items.push(newItem);
            user.save();
            res.redirect(`/users/${username}`);
        }
    });
});

app.delete('/users/:username/:id', (req, res) => {
    let username = req.params.username;
    let index = req.params.id;
    User.findOne({username: username}).exec((err, user) => {
        if (err) {
            throw err;
        } else {
            user.items.splice(index, 1);
            user.save();
            res.redirect(`/users/${username}`);
        }
    });
});

app.listen(port, () => {
    console.log(`Express running on port ${port}`);
});