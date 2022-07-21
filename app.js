require('dotenv').config(); 

const express = require('express'); 
const path = require('path'); 
const cors = require('cors'); 
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const emailValidator = require('deep-email-validator'); 
const sqlite3 = require('sqlite3'); 
const sqlite = require('aa-sqlite'); 


const app = express(); 

app.set('view engine', 'ejs'); 

app.use('/public', express.static(__dirname + '/public'));
app.use(cors()); 
app.use(bodyParser.urlencoded({limit: '5000mb', extended: true, parameterLimit: 100000000000}));
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))
app.use(express.json()); 
app.use(express.urlencoded({ extended: false }))
app.use(flash())


let db = new sqlite3.Database('./users.db', sqlite3.OPEN_READWRITE, (err) => {
  if(err){
    return console.log(err.message); 
  }
  console.log("Connection Successful");

}); 

sqlite.open('./users.db');



const initializePassport = require('./passport-config')
initializePassport(passport, userByEmail, userById); 


async function userByEmail(email){
  try{
      let sqla = `SELECT * FROM users WHERE email LIKE '${email}'`; 
      let rows = await sqlite.all(sqla);
      //console.log(rows[0]); 
      return rows[0];  
  }catch(err){
      console.log(err); 
  }
}


async function userById(id){
  try{
      let sqlab = `SELECT * FROM users WHERE id LIKE '${id}'`; 
      let rows = await sqlite.all(sqlab);
      //console.log(rows[0]); 
      return rows[0];  
  }catch(err){
      console.log(err); 
  }
}




//const users = []



const PORT = process.env.PORT || 5555; 





app.post('/auth/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/auth/successLogin',
    failureRedirect: '/auth/failLogin'
  })); 

app.get('/auth/successLogin', (req, res) => {
    res.json({
        "status": 0, 
        "message": "Successful Login"
    }); 
}); 

app.get('/auth/failLogin', (req, res) => {
    res.json({
        "status": 1, 
        "message": "Login Failed"
    }); 
}); 

app.post('/auth/register', checkNotAuthenticated, async (req, res) => {
    if(!registrationValidator(req.body.email)){
      return res.json({
        "status": 1,
        "message": "Invalid Email"
      }); 
    }
    let ifUserThere = await userExistsYes(req.body.email); 
    if(ifUserThere){
      return res.json({
        "status": 1,
        "message": 'Email already signed up'
      }); 
    }
    else{
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        // users.push({
        //   id: Date.now().toString(),
        //   email: req.body.email,
        //   password: hashedPassword
        // })
        // console.log(users); 

       // res.redirect('/login')

       let insertUser = `INSERT INTO users(email, password,score) VALUES (?,?,?)`; 

       db.run(insertUser, [req.body.email, hashedPassword,0], (err) =>{
          if(err){
            return console.log(err.message); 
          }

       }); 

       res.json("http://localhost:5555/login"); 
      } catch {
        res.redirect('/register')
      }
    }
}); 


app.post('/logout', checkAuthenticated, function(req, res, next) {
    req.logout(function(err) {
      if (err) { return next(err); }
      res.json({
        "status": 0,
        "message": "worked"
      }); 
    });
  });


app.post('/challenges', checkAuthenticated, async (req, res) => {
    let flagGuess = req.body.flagGuess; 
    let challengeId = req.body.id; 

    if(!authenticateGuess(flagGuess)){
      return res.json({
        'status': 1,
        'message': 'Invalid Flag Type'
      }); 
    }
    else if(await solvedBefore(req.user.id, challengeId)){
      return res.json({
        'status': 1, 
        'message': 'Challenge Solved Before'
      }); 
    }
    else{
      //lookup flag 
      let theChallenge = await getFlagFromId(challengeId); 

      if(theChallenge.flag == flagGuess){
        addScore(req.user.email, req.user.score, req.user.id, theChallenge.point); 
       // console.log(req.user.email, req.user.score, challengeId, theChallenge.point);
        
       addSolve(req.user.id, theChallenge.id); 
       
        return res.json({
          'status': 0,
          'message': 'Correct!',
          'id': challengeId
        }); 
      }
      else{
        return res.json({
          'status': 1,
          'message': 'Incorrect Answer'
        }); 
      }
    }
  }); 


app.get('/', (req, res) => {
    if(req.isAuthenticated()){
        res.render('logged');        
    }
    else{
   // res.sendFile(path.join(__dirname, './public/html/index.html')); 
      res.render('index'); 
    }
}); 

app.get('/about', (req, res) => {
    if(req.isAuthenticated()){
      res.render('logged_about'); 
    }
    else{
      res.render('about'); 
    }
}); 

app.get('/leaderboard', async (req, res) => {
    let usersForLeaderboard = await findAllUsers(); 
    
   

    if(req.isAuthenticated()){
      let data = {
        'users': usersForLeaderboard,
        'you': req.user.email
      };
      res.render('logged_leaderboard', {data: data}); 
    }
    else{
      res.render('leaderboard', {data: usersForLeaderboard}); 
    }
}); 

app.get('/challenges', checkAuthenticated, async (req, res) => {
    let allChallenges = await getAllChallenges(); 
    let userSolves = await allUserSolves(req.user.id); 
    let data = {
      'allChallenges': allChallenges, 
      'userSolves': userSolves
    };

    res.render('challenges', {data: data}); 
}); 



app.get('/account', checkAuthenticated, (req, res) => {
   
   res.render('account', {user: req.user}); 
}); 



app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login'); 
}); 

app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register'); 
}); 

async function userExistsYes(email){
  try{  
    let sqla = `SELECT * FROM users WHERE email IS '${email}'`; 
    let rows = await sqlite.all(sqla); 


    if(rows.length == 0){
      return false; 
    }
    return true; 
  } catch(err){

  }
}

async function addSolve(user, challenge){
  try{
    let sqla = `INSERT INTO solves(userId, challengeID) VALUES(${user}, ${challenge})`
    await sqlite.run(sqla); 
    return; 
  }catch(err){
    console.log(err); 
  }
}

async function findAllUsers(){
  try{
    let sqla = `SELECT * FROM users`; 
    let rows = await sqlite.all(sqla); 
    let userData = []; 
    
    for(let i = 0; i < rows.length; i++){
      let userName = rows[i].email.split('@')[0]; 
      let temp = {
        'username': userName, 
        'score': rows[i].score
      }; 
      userData.push(temp); 
    }
    return userData; 
  }catch(err){
    console.log(err) 
  }
}

async function solvedBefore(user, challenge){
  try{
    let sqla = `SELECT * FROM solves WHERE userId IS ${user} AND challengeID IS ${challenge}`
    let rows = await sqlite.all(sqla); 

   // console.log(rows, rows.length); 

    if(rows.length == 0){
      return false; 
    }
    return true; 
  } catch(err){
    console.log(err); 
  }
}

async function allUserSolves(user){
  try{
    let sqla = `SELECT * FROM solves WHERE userId is ${user}`; 
    let rows = await sqlite.all(sqla);
    return rows; 
  } catch(err){
    console.log(err); 
  }
}

async function addScore(email, score, id, point){

  try{
    let sqla = `UPDATE users SET score = ${score+point} WHERE id = ${id}`; 
    await sqlite.all(sqla); 
    return; 
  }catch(err){
    console.log(err); 
  }
}

async function getAllChallenges(){
  try{
      let sqla = `SELECT * FROM challenges`; 
      let rows = await sqlite.all(sqla);
      //console.log(rows[0]); 
      return rows;  
  }catch(err){
      console.log(err); 
  }
}

function authenticateGuess(guess){
    if(guess.substr(0,5) == 'flag{' && guess.substr(guess.length-1, 1) == '}'){
      return true; 
    }
    return false; 
}

async function getFlagFromId(id){
  try{
    let sqla = `SELECT * FROM challenges WHERE ID IS ${id}`; 
    let rows = await sqlite.all(sqla); 

    return rows[0]; 
  } catch(err){
      console.log(err); 
  }
}

function registrationValidator(email){
    //check if sas email 
    if(email.split('@')[1] !== 'sas.edu.sg'){
        return false; 
    }
    return isEmailValid(email); 
}

async function isEmailValid(email){
  return emailValidator.validate(email); 
}


function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next()
    }
  
    res.redirect('/login')
  }
  
  function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect('/')
    }
    next()
  }

app.listen(PORT, () =>{
    console.log(`Listening on http://localhost:${PORT}`); 
}); 



