const passport = require('passport')
const express = require('express')
const session = require('express-session')
const exphbs = require('express-handlebars')
const methodOverride = require('method-override')
const bcrypt = require('bcryptjs')
const usePassport = require('./config/passport')
const app = express()
const PORT = 3000
const db = require('./models')
const Todo = db.Todo
const User = db.User

app.engine('hbs', exphbs({ defaultLayout: 'main', extname: '.hbs' }))
app.set('view engine', 'hbs')
app.use(session({
  secret: 'ThisIsMySecret',
  resave: false,
  saveUninitialized: true
}))
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))

usePassport(app)

//首頁
app.get('/', (req, res) => {
  return Todo.findAll({
    raw: true,
    nest: true
  })
    .then((todos) => { return res.render('index', { todos }) })
    .catch((error) => { return res.status(422).json(error) })
})

//登入
app.post('/users/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/users/login'
}))
app.get('/users/login', (req, res) => {
  res.render('login')
})
app.post('/users/login', (req, res) => {
  res.send('login')
})

//註冊
app.get('/users/register', (req, res) => {
  res.render('register')
})

app.post('/users/register', (req, res) => {
  const { name, email, password, confirmPassword } = req.body
  User.findOne({ where: { email } }).then(user => {
    if (user) {
      console.log('User already exists')
      return res.render('register', {
        name,
        email,
        password,
        confirmPassword
      })
    }
    return bcrypt
      .genSalt(10)
      .then(salt => bcrypt.hash(password, salt))
      .then(hash => User.create({
        name,
        email,
        password: hash
      }))
      .then(() => res.redirect('/'))
      .catch(err => console.log(err))
  })
})

//登出
app.get('/users/logout', (req, res) => {
  res.send('logout')
})

//新增
app.get('/todos/new', (req, res) => {
  return res.render('new')
})
app.post('/todos', (req, res) => {
  const UserId = req.user.id
  const name = req.body.name
  return Todo.create({ name, UserId })
    .then(() => res.redirect('/'))
    .catch(error => console.log(error))
})

//查詢
app.get('/todos/:id', (req, res) => {
  const id = req.params.id
  return Todo.findByPk(id)
    .then(todo => res.render('detail', { todo: todo.toJSON() }))
    .catch(error => console.log(error))
})

//修改
app.get('/todos/:id/edit', (req, res) => {
  const id = req.params.id
  return Todo.findByPk(id)
    .then(todo => res.render('edit', { todo: todo.get() }))
    .catch(error => console.log(error))
})
app.put('/todos/:id', (req, res) => {
  const id = req.params.id
  const { name, isDone } = req.body
  return Todo.findByPk(id)
    .then(todo => {
      todo.name = name
      todo.isDone = isDone === 'on'
      return todo.save()
    })
    .then(() => res.redirect(`/todos/${id}`))
    .catch(error => console.log(error))
})

//刪除
app.delete('/todos/:id', (req, res) => {
  const id = req.params.id
  return Todo.findByPk(id)
    .then(todo => todo.destroy())
    .then(() => res.redirect('/'))
    .catch(error => console.log(error))
})

app.listen(PORT, () => {
  console.log(`App is running on http://localhost:${PORT}`)
})
