const HTTP_PORT = process.env.PORT || 3000;
const course = require("./user.json");
const express = require("express");
const exphbs = require('express-handlebars');
const path = require("path");
const bodyParser = require("body-parser");
const fs = require("fs");
const e = require("express");
const session = require("client-sessions");
const mongoose = require('mongoose')
const app = express();
const data = require('./reader')
const users = data.readData('./user.json')
var accounts = data.readData('./accounts.json')
const verifymodule = require('./verify')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.engine("hbs", exphbs({
  extname: "hbs",
  defaultLayout: false,
  layoutsDir: __dirname + '/views/layouts',
  partialsDir: [
    path.join(__dirname, '/views/partial'),
  ]
}));
app.set("view engine", "hbs");
app.use(express.static('public'));

app.use(session({

  cookieName: 'session',
  secret: 'verysecretkey',
  duration: 60 * 60 * 1000,
  activeDuration: 1000 * 60 * 5,
}));

const MongoClient = require('mongodb').MongoClient;


var userinfo = {
  email: "",
  account: "",
  cheque: "",
  savings: "",
  hasboth: false,
  hascheque: false,
  hassavings: false,
  hasnone: false,
  text: ""
}

app.use('/login', verifymodule)

app.post("/checkchoice", (req, res) => {
  
  if (req.session.user == null) {
    res.render("Login", { body: "Login First" })
    return
  }

  var account = req.body.accountNumber;
  accounts = data.readData('./accounts.json')

  var type = req.body.account;

  var balanceinfo = []

  for (var key in accounts) {
    if (account == key) {
      balanceinfo = {
        number: account,
        type: accounts[key].accountType,
        amount: accounts[key].accountBalance
      }
      break
    }
  }

  client.db("mongodatabase").collection("web322").find({}).toArray((err, result) => {
    userinfo.email = req.session.user;
    for (var key1 in result) {
      if (result[key1].Username == req.session.user) {
        userinfo.cheque = result[key1].Chequing
        userinfo.savings = result[key1].Savings

        break
      }
    }
    if (userinfo.cheque.length != 0 && userinfo.savings.length != 0) {
      userinfo.hasboth = true
    } else {
      userinfo.hasboth = false
    }

    if (type != 'balance' && type != 'openaccount' && type != 'withdrawal' && type != 'deposit') {

      userinfo.text = "Invalid Chioce"
      res.render("MainPage", { body: userinfo });
      return;
    } else if (type == 'balance') {
      if (balanceinfo.number == null) {
        userinfo.text = 'You do not have account or You havent selected one'
        res.render('MainPage', { body: userinfo })
        return
      }

      res.render('CheckBalance', { body: balanceinfo })

    } else if (type == 'deposit') {
      if (balanceinfo.number == null) {
        userinfo.text = 'You do not have account'

        res.render('MainPage', { body: userinfo })
        return
      }

      res.render('DepositAmount', { body: balanceinfo })

    } else if (type == 'withdrawal') {
      if (balanceinfo.number == null) {
        userinfo.text = 'You do not have account'

        res.render('MainPage', { body: userinfo })
        return
      }
      res.render('WithdrawAmount', { body: balanceinfo })

    } else {
      balanceinfo.hasnone = false
      balanceinfo.cheque = false
      balanceinfo.hassavings = false

      if (userinfo.cheque === '' && userinfo.savings === '') {
        console.log(userinfo.cheque + 'NOne' + userinfo.savings)
        balanceinfo.hasnone = true
        res.render('OpenAccount', { body: balanceinfo })
        return;

      } else if (userinfo.cheque === '') {
        balanceinfo.hassavings = true
        res.render('OpenAccount', { body: balanceinfo })
        return;

      } else {
        balanceinfo.hascheque = true
      }
      res.render('OpenAccount', { body: balanceinfo })
      return;
    }



  })




})

/* deposit account*/

app.post("/deposit", (req, res) => {
  if (req.session.user == null) {
    res.render("login", { body: "Login First" })
    return
  }
  userinfo.text = ''
  let account = req.body.account
  let deposit = req.body.deposit
  var balanceinfo = []

  if (isNaN(deposit) || deposit.length == 0) {
    fs.readFile("./accounts.json", "utf-8", (err, accountinfo) => {
      var info = JSON.parse(accountinfo)

      for (var key in info) {
        if (account == key) {
          balanceinfo = {
            number: account,
            type: info[key].accountType,
            amount: info[key].accountBalance,
            text: "Invalid Number"
          }
          break;
        }
      }
      userinfo.text = ''
      res.render('DepositAmount', { body: balanceinfo })
    })
    return

  } else {
    fs.readFile("./accounts.json", "utf-8", (err, accountinfo) => {
      var info = JSON.parse(accountinfo)
      for (var key in info) {
        if (account == key) {
          amount = parseFloat(info[key].accountBalance) + parseFloat(deposit)

          balanceinfo = {
            number: account,
            type: info[key].accountType,
            amount: info[key].accountBalance,
            text: ""
          }

          info[key].accountBalance = amount.toFixed(2)
          info[key].accountBalance = parseFloat(info[key].accountBalance)
          var newFile = JSON.stringify(info, null, 4)
          fs.writeFile("./accounts.json", newFile, (err) => {
            userinfo.account = ""
            userinfo.email = req.session.user
            userinfo.text = ''
            res.render("MainPage", { body: userinfo })
          })
          break
        }
      }
      return
    })

  }

})



/* account widthdraw */

app.post("/withdrawal", (req, res) => {
  if (req.session.user == null) {
    res.render("login", { body: "Login First" })
    return
  }
  userinfo.text = ''
  let account = req.body.account
  let withdrawal = req.body.withdrawal

  var balanceinfo = []

  if (isNaN(withdrawal) || withdrawal.length == 0) {
    fs.readFile("./accounts.json", "utf-8", (err, accountinfo) => {
      var info = JSON.parse(accountinfo)

      for (var key in info) {
        if (account == key) {
          balanceinfo = {
            number: account,
            type: info[key].accountType,
            amount: info[key].accountBalance,
            text: "Invalid Number"
          }
          break;
        }
      }
      res.render('WithdrawAmount', { body: balanceinfo })
    })
    return
  } else {
    fs.readFile("./accounts.json", "utf-8", (err, accountinfo) => {
      var info = JSON.parse(accountinfo)
      for (var key in info) {
        if (account == key) {
          amount = info[key].accountBalance - withdrawal
          if (amount < 0) {
            balanceinfo = {
              number: account,
              type: info[key].accountType,
              amount: info[key].accountBalance,
              text: "Insufficient Funds"
            }
            res.render("WithdrawAmount", { body: balanceinfo })
            break;
          } else {
            info[key].accountBalance = amount.toFixed(2)
            info[key].accountBalance = parseFloat(info[key].accountBalance)
            var newFile = JSON.stringify(info, null, 4)
            console.log(newFile)
            fs.writeFile("./accounts.json", newFile, (err) => {
              userinfo.account = ""
              userinfo.email = req.session.user
              userinfo.text = ''
              res.render("MainPage", { body: userinfo })
            })
            break
          }
        }
      }
      return
    })
  }

})



/* open account */

app.post("/account", (req, res) => {

  if (req.session.user == null) {
    res.render("login", { body: "Login First" })
    return
  }
  userinfo.text = ''
  var mtype = req.body.type
  var account = {
    "accountType": mtype,
    "accountBalance": 0
  }
  var newOne = ""

  fs.readFile("./accounts.json", "utf-8", (err, accountinfo) => {
    var info = JSON.parse(accountinfo)
    var num = +info.lastID + 1
    num = num.toString()
    var len = info.lastID.length - num.length - 1

    for (var i = 0; i < len; i++) {
      newOne = newOne + "0"
    }
    newOne = newOne + num
    info[newOne] = account
    info.lastID = newOne;
    fs.writeFile("./accounts.json", JSON.stringify(info, null, 4), (err) => {

    })
    if (mtype == "Savings") {
      client.db("mongodatabase").collection("web322").updateOne({ Username: req.session.user }, { $set: { "Savings": newOne } })
    } else {
      client.db("mongodatabase").collection("web322").updateOne({ Username: req.session.user }, { $set: { "Chequing": newOne } })
    }
    client.db("mongodatabase").collection("web322").find({ Username: req.session.user }).toArray((err, result) => {
     
      if (!result) {
        userinfo.cheque = result[0].Chequing
        userinfo.savings = result[0].Savings
      }
      else {
        if (mtype == "Savings") {
          userinfo.savings = newOne
        } else {
          userinfo.cheque = newOne
        }
      }


      if (userinfo.cheque != '' && userinfo.savings != '') {
        userinfo.hasboth = true
      } else {
        userinfo.hasboth = false
      }
      
      userinfo.text = mtype + " " + "Account" + " # " + newOne + " Created"
      res.render("MainPage", { body: userinfo });
      return;

    })

  })

})




app.get("/cancel", (req, res) => {
  if (req.session.user == null) {
    res.render("login", { body: "Login First" })
    return
  }
  userinfo.email = req.session.user
  client.db("mongodatabase").collection("web322").find({}).toArray((err, result) => {

    for (var key1 in result) {
      if (result[key1].Username == req.session.user) {
        userinfo.cheque = result[key1].Chequing
        userinfo.savings = result[key1].Savings

        break
      }
    }
    if (userinfo.cheque.length != 0 && userinfo.savings.length != 0) {
      userinfo.hasboth = true
    } else {
      userinfo.hasboth = false
    }
    userinfo.text = ''
    res.render("MainPage", { body: userinfo });
    return;

  })


});

app.get('/', (req, res) => {
  res.render('Login');
});

app.post("/logout", (req, res) => {
  req.session.user = null
  userinfo.text = ''
  userinfo = {}

  res.redirect("/")

});


const uri="mongodb+srv://dvaghela:dvaghela@senecaweb.ajpgd.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }

  console.log('DB connected');

  const collections = client.db("mongodatabase").collection("web322");
  collections.find({}).toArray((err, result) => {
  });

  const server = app.listen(HTTP_PORT, () => {
    console.log(`Server is running on port ${HTTP_PORT}`);
  });
});


