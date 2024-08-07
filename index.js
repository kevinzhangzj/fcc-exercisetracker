const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')
const bodyParser = require('body-parser')

mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
const users = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  count: {
    type: Number,
    required: true,
  },
  log: {
    type: [{
      description: String,
      duration: Number,
      date: String,
    }],
    required: true,
  }
})
let User = mongoose.model('User', users);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', bodyParser.urlencoded({ extended: false }), (req, res) => {
  const _username = req.body.username;
  if (!_username) {
    res.json({ error: "invalid username" })
    return;
  }
  User.findOne({ username: _username }).then(doc => {
    if (doc) {
      res.json({
        username: doc.username,
        _id: doc._id
      })
    } else {
      const u = new User({
        username: _username,
        count: 0,
        log: []
      });
      u.save().then(doc => {
        res.json({
          username: doc.username,
          _id: doc._id
        })
      })
    }
  }).catch(error => {
    console.log(error);
    res.json({
      error: "internal error"
    })
  })
})
app.get('/api/users', (req, res) => {
  User.find(null).select({ username: true, _id: true }).then(doc => {
    res.json(doc);
  }).catch(err => {
    console.log(err);
    res.json({
      error: 'internal error'
    })
  })
})
app.post('/api/users/:_id/exercises', bodyParser.urlencoded({ extended: false }), (req, res) => {
  const _id = req.params._id;
  const _desc = req.body.description;
  const _dura = req.body.duration;
  const _date = req.body.date;
  if (!(_id && _desc && _dura)) {
    res.json({
      error: 'not enough params'
    })
    return;
  }
  User.findOne({ _id: _id }).then(_u => {
    if (!_u) {
      res.json({
        error: "can't find user"
      })
      return;
    }
    let d = new Date();
    if (_date) {
      d = new Date(_date);
    }
    _u.count += 1;
    _u.log.push({
      description: _desc,
      duration: parseInt(_dura),
      date: d.toDateString()
    });
    _u.save().then(doc => {
      res.json({
        username: doc.username,
        description: _desc,
        duration: parseInt(_dura),
        date: d.toDateString(),
        _id: doc._id
      })
    });
  }).catch(err => {
    console.log(err);
    res.json({
      err: 'internal error'
    })
  })
})
app.get('/api/users/:_id/logs', (req, res) => {
  const _id = req.params._id;
  const _from = req.query.from;
  const _to = req.query.to;
  const _limit = req.query.limit;

  User.findOne({ _id: _id }).then(u=>{
    if(!u){
      res.json({error:'user not found'});
      return ;
    }
    let logs=u.log;
    if(_from){
      logs=logs.filter(log=>new Date(log.date)>=new Date(_from));
    }
    if(_to){
      logs=logs.filter(log=>new Date(log.date)<=new Date(_to));
    }
    if(_limit){
      const n=parseInt(_limit);
      if(!isNaN(n)){
        logs=logs.slice(0,n);
      }
    }
    res.json({
      log:logs,
      _id:u._id,
      username:u.username,
      count:u.count,
    });
  }).catch(err=>{
    console.log(err);
    res.json({error:'internal error'});
  })
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
