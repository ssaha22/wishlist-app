const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const session = require('express-session');
const bcrypt = require('bcrypt');

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
        res.render('register', { error: null, user: {} });
    }
});

app.post('/register', (req, res) => {
    let { name, username, password, confirmPassword } = req.body;
    if (username.length < 6) {
        res.render('register', { error: "short-username", user: req.body });
    } else if (password.length < 6) {
        res.render('register', { error: "short-password", user: req.body });
    } else if (password !== confirmPassword) {
        res.render('register', { error: "passwords-not-matching", user: req.body });
    } else {
        User.findOne({username: username}).exec(async (err, user) => {
            if (err) {
                throw err;
            } else if (user) {
                res.render('register', { error: "username-taken", user: req.body });
            } else {
                password = await bcrypt.hash(password, 10);
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
        res.render('login', { error: null, user: {} });
    }
});

app.post('/login', (req, res) => {
    let { username, password } = req.body;
    User.findOne({username: username}).exec(async (err, user) => {
        if (err) {
            throw err;
        } else if (user) {
            if (await bcrypt.compare(password, user.password)) {
                req.session.user = username;
                res.redirect(`/users/${username}`);
            } else {
                res.render('login', { error: "incorrect-password", user: req.body });
            }
        } else {
            res.render('login', { error: "invalid-username", user: req.body });
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

app.put('/users/:username/:id', (req, res) => {
    let username = req.params.username;
    let index = req.params.id;
    let updatedItem = req.body;
    User.findOne({username: username}).exec((err, user) => {
        if (err) {
            throw err;
        } else {
            user.items[index] = updatedItem;
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