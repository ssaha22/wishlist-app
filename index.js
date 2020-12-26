const fs = require('fs');
const express = require('express');
var bodyParser = require('body-parser');

const app = express();
const port = 8000;

app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use('/public', express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

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

app.get('/', (req, res) => {
    let items = readData("db/items.json");
    res.render('index', { items: items });
});

app.get('/add', (req, res) => {
    res.render('add');
});

app.post('/add', (req, res) => {
    let items = readData("db/items.json");
    let newItem = req.body;
    items.push(newItem);
    let data = JSON.stringify(items);
    writeData("db/items.json", data);
    res.redirect('/');
});

app.listen(port, () => {
    console.log(`Express running on port ${port}`);
});