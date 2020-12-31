const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express();
const port = process.env.PORT || 8000;
const mongoDB = process.env.MONGODB_URI || 'mongodb+srv://sayan:testing1234@cluster0.uywsm.mongodb.net/development?retryWrites=true&w=majority';
const secret = process.env.SECRET || 'secret';
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
        User.findOne({username: username}).exec(async (err, user) => {
            if (err) {
                throw err;
            } else if (user) {
                res.render('register', { message: "This username is already taken." });
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
        res.render('login', { message: null });
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
                res.render('login', { message: "Incorrect password. Please try again." });
            }
        } else {
            res.render('login', { message: "Invalid username. Please try again." });
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