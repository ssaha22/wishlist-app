const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');

const app = express();
const port = process.env.PORT || 8000;

app.set('view engine', 'ejs');
app.use('/public', express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

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

app.post('/', (req, res) => {
    let items = readData("db/items.json");
    let newItem = req.body;
    items.push(newItem);
    let data = JSON.stringify(items);
    writeData("db/items.json", data);
    res.redirect('/');
});

app.delete('/:id', (req, res) => {
    let items = readData("db/items.json");
    let index = req.params.id;
    items.splice(index, 1);
    let data = JSON.stringify(items);
    writeData("db/items.json", data);
    res.redirect('/');
});

app.listen(port, () => {
    console.log(`Express running on port ${port}`);
});
