const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const session = require('express-session');

const app = express();
const port = process.env.PORT || 8000;
const secret = process.env.SECRET || 'secret';
const usersFile = "db/users.json";

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

function readData(file) {
    let data = fs.readFileSync(file);
    return JSON.parse(data);
}

function writeData(file, data) {
    fs.writeFile(file, data, (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
      });
}

function getHashedPassword(password) {
    const sha256 = crypto.createHash('sha256');
    const hash = sha256.update(password).digest('base64');
    return hash;
}

app.get('/', (req, res) => {
    if (req.session.user) {
        res.redirect(`/users/${req.session.user.username}`);
    } else {
        res.render('index');
    }
});

app.get('/register', (req, res) => {
    if (req.session.user) {
        res.redirect(`/users/${req.session.user.username}`);
    } else {
        res.render('register', { message: null });
    }
});

app.post('/register', (req, res) => {
    let users = readData("db/users.json");
    let { name, username, password, confirmPassword } = req.body;
    if (password === confirmPassword) {
        if (users.find(user => user.username === username)) {
            res.render('register', { message: "This username has been taken." });
        } else if (password.length < 6) {
            res.render('register', { message: "Password must be at least 6 characters long." });
        } else {
            password = getHashedPassword(password);
            let newUser = {
                username,
                password,
                name,
                items: []
            };
            users.push(newUser);
            let data = JSON.stringify(users);
            writeData("db/users.json", data);
            req.session.user = newUser;
            res.redirect(`/users/${username}`);
        }
    } else {
        res.render('register', { message: "Passwords don't match." });
    }
});

app.get('/login', (req, res) => {
    if (req.session.user) {
        res.redirect(`/users/${req.session.user.username}`);
    } else {
        res.render('login', { message: null });
    }
});

app.post('/login', (req, res) => {
    let users = readData("db/users.json");
    let { username, password, } = req.body;
    password = getHashedPassword(password);
    let userinfo = users.find(user => (user.username === username && user.password === password));
    if (userinfo) {
        req.session.user = userinfo;
        res.redirect(`/users/${username}`);
    } else {
        res.render('login', { message: "Invalid username or password." });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy( () => {
        console.log("logged out");
    });
    res.redirect("/");
});

app.get('/users/:username', (req, res) => {
    if (req.session.user) {
        let username = req.params.username;
        if (req.session.user.username === username) {
            let users = readData(usersFile);
            let userinfo = users.find(user => user.username === username);
            res.render('user', { username: username, name: userinfo.name, items: userinfo.items });
        } else {
            res.redirect(`/users/${req.session.user.username}`);
        }
    } else {
        res.redirect('/login');
    }
});

app.post('/users/:username', (req, res) => {
    let users = readData(usersFile);
    let username = req.params.username;
    let userinfo = users.find(user => user.username === username);
    let newItem = req.body;
    userinfo.items.push(newItem);
    let data = JSON.stringify(users);
    writeData(usersFile, data);
    res.redirect(`/users/${username}`);
});

app.delete('/users/:username/:id', (req, res) => {
    let users = readData("db/users.json");
    let username = req.params.username;
    let userinfo = users.find(user => user.username === username);
    let index = req.params.id;
    userinfo.items.splice(index, 1);
    let data = JSON.stringify(users);
    writeData(usersFile, data);
    res.redirect(`/users/${username}`);
});

app.listen(port, () => {
    console.log(`Express running on port ${port}`);
});