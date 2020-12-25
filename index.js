const express = require('express');
const app = express();
const port = 8000;

app.set('view engine', 'ejs');

app.use('/public', express.static('public'))

app.get('/', (req, res) => {
    res.render('index');
})

app.listen(port, () => {
    console.log(`Express running on port ${port}`);
});