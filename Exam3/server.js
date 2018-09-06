var request = require('request');
var express = require('express');
var app = express();

app.use(express.static('public'));

app.set('view engine', 'ejs');

app.get("/kendousers", function (req, res) {
    request('https://shoreexam1.herokuapp.com/users', function(error, response, body) {
        res.sendFile(__dirname + '/views/index.html')
    });
});

app.get("/users", function(req, res) {
    request('https://shoreexam1.herokuapp.com/users', function(error, response, body) {
        //console.log(JSON.parse(body)) 
        //res.json(body)
       res.render('index.ejs', {users: JSON.parse(body)})
    });

});

const port = process.env.PORT || 3303;

// listen for requests :)
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });