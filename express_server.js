var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080;
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

var cookieSession = require('cookie-session')
app.use(cookieSession({
  name: 'session',
  keys: ["random:"]
}));

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync ("dishwasher-funk" , 10)
  }
};

var urlDatabase = {
  "b2xVn2" : {id: "b2xVn2",
              longUrl: "http://www.lighthouselabs.ca",
              owner: "userRandomID"
 },
  "9sm5xK": {id:"9sm5xK",
            longUrl: "http://www.google.com" ,
            owner: "user2RandomID"}
};

function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklnmopqrstuvwxya0123456789";
    for(var i = 0; i < 6; i++){
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

function urlsForUser(id){
  var cookiesId = id;
  var answer = {};
    for(url in urlDatabase){

      if(urlDatabase[url].owner === cookiesId){
      answer[url] = urlDatabase[url]
      }
    }
    return  answer;
};

app.get('/', (req, res) => {
  res.end("hello!");
});

app.get("/urls" , (req, res) =>{
  var user_id = req.session.user_id
  var resultUserId = urlsForUser(user_id)
  let templateVars = {urls: resultUserId, username: users[req.session.user_id]}
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  var username = req.session.user_id

    if( username === undefined){
      return res.redirect("/login")
    }
  let templateVars = {username: users[req.session.user_id]}
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) =>{
  var username = req.session.user_id
  var shortURL = req.params.id
  var userId = urlDatabase[shortURL].owner
  let templateVars = {shortURL: req.params.id , longURL: urlDatabase , username: users[req.session.user_id]};

    if(username !== userId ){
      return res.redirect("/urls")
    }
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longUrl
  res.redirect(longURL);
});

app.post("/urls", (req, res) =>{
  let shortURL = generateRandomString()
  var userId = req.session.user_id;
  var longUrl = req.body.longURL
  urlDatabase[shortURL] = {id:shortURL , longUrl:longUrl , owner: userId}
  res.redirect("/urls")
});

app.post("/urls/:id/delete" , (req, res) =>{
  var username = req.session.user_id
  var shortURL = req.params.id
  var userId = urlDatabase[shortURL].owner

    if(username !== undefined && username === userId ){
      delete urlDatabase[req.params.id]
    }
  res.redirect("/urls")
});

app.post("/urls/:id" , (req, res) => {
  var username = req.session.user_id
  var shortURL = req.params.id
  var userId = urlDatabase[shortURL].owner

    if(username !== undefined && username === userId ){
      urlDatabase[req.params.id].longUrl = req.body.longURL
    }
  res.redirect("/urls/");
});

app.get("/login" , (req, res)=>{
  res.render("login.ejs");
});

app.post("/login" ,(req, res) =>{
  var email = req.body.email;
  var password = req.body.password;

    for(id in users){
      var HashPassword = users[id].password
      if(users[id].email === email && bcrypt.compareSync(password, HashPassword)){
        req.session.user_id = id;
        return res.redirect("/urls");
      }else if(users[id].email === email && !bcrypt.compareSync(password, HashPassword)){
        return res.send("403 password is not right")
      }
    }
  res.send("403 email can not found");
});

app.post("/logout", (req, res) =>{
  req.session = null;
  res.redirect("/urls")
});

app.get("/register", (req, res) =>{
  res.render("registerPage")
});

app.post("/register", (req, res) => {
var email = req.body.email;
var password = bcrypt.hashSync(req.body.password, 10);
let generated = generateRandomString();

  for( id in users){
    if(users[id].email  === email){
      return res.send("400 Existing user email")
    }
  }
    if(email === "" || password === ""){
      return res.send("400 email or password are empty")
  }
  users[generated] = {id: generated, email: email, password: password};
  req.session.user_id = generated
  res.redirect("/urls")
});

app.get("/urls.json", (req, res) =>{
  res.json(urlDatabase);
});

app.get("/hello", (req, res) =>{
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

