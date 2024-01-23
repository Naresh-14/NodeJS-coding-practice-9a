const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'userData.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server at Running http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error : ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

//register user API
app.post('/register/', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const selectRegisterQuery = `
  SELECT * FROM user  WHERE username = '${username}';
  `
  const dbRegister = await db.get(selectRegisterQuery)

  if (dbRegister === undefined) {
    const createUserQuery = `
      INSERT INTO 
        user (username, name, password, gender, location) 
      VALUES 
        (
          '${username}', 
          '${name}',
          '${hashedPassword}', 
          '${gender}',
          '${location}'
        )`
    const dbResponse = await db.run(createUserQuery)
    const newUserId = dbResponse.lastID
    response.send(`Created new user with ${newUserId}`)
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

//login user Api
app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const selectLoginQuery = `
  SELECT * FROM user WHERE username = '${username}';
  `
  const dbUser = await db.run(selectLoginQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatching = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatching === true) {
      response.status(200)
      response.send('Login success')
    } else {
      response.status(400)
      response.send('Invalid user')
    }
  }
})

app.put('/change-password/', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const hashedNewPassword = await bcrypt.hash(newPassword, 20)
  const selectChangePasswordQuery = `
  SELECT * FROM user WHERE username = '${username}';
  `
  const dbUser = await db.run(selectChangePasswordQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid Current password')
  } else {
    const isPasswordMatching = bcrypt.compare(oldPassword, dbUser.newPassword)
    if (isPasswordMatching === true) {
      response.status(200)
      response.send('Password Updated')
    } else {
      response.status(400)
      response.send('Invalid Current password')
    }
  }
})

module.exports = app