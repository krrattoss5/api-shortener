const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const morgan = require('morgan')
const app = express()
const {PrismaClient} = require('@prisma/client')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const SECRET_KEY = '19568514Lj.'
const prisma = new PrismaClient()

// app.name('api-shortener')

app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // update to match the domain you will make the request from
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  next();
});

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};


app.post('/create-user', async (req, res) => {
  const {
    email,
    password,
    username,
    name,
    lastname,
  } = req.body

  try {
    const existUser = await prisma.user.findUnique({
      where: {
        email: email,
        username: username
      }
    })

    if(existUser){
       return res.status(403).json({message: 'El usuario ya existe!'})
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        name,
        lastname,
      }
    })

    return res.status(200).json({message: 'Usuario registrado con exito!'})
  } catch (error) {
    return res.status(500).json({message: error.message})
  }

})

app.post('/login', async (req, res) => {
  const {username, password} = req.body

  try {
    const user = await prisma.user.findUnique({
      where:{
        username
      }
    })

    if(!user){
      return res.status(404).json({message: 'Usuario inexistente!'})
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if(!isPasswordValid){
      return res.status(400).json({message: 'Usuario ó Contraseña invalidos'})
    }

    const token = await jwt.sign({userId: user.id}, SECRET_KEY, {expiresIn: '1h'})
    return res.json({token})
  } catch (error) {
    return res.status(500).json({message: error.message})
  }

})

// crear token

app.post('/', async (req, res) => {
  const {url} = req.body
  const shortUrl = Math.random().toString(36).substring(2,7)

  try {
    const data = await prisma.link.create({
      data: {url, shortUrl}
    })

    return res.status(200).json(data)
  } catch (error) {
    return res.status(500).json({message: error.message})
  }

})

app.get('/:shortId', async (req,res) => {
  const {shortId} = req.params

    try {

      const data = await prisma.link.findUnique({
        where: {
          shortUrl: shortId
        }
      })

      const request = await fetch("https://ipinfo.io/json?token=754f00ca799206")
      const jsonResponse = await request.json()

      console.log(jsonResponse)

      if(!data){
        return res.status(404).json({message: 'URL Not found!'})
      }

      return res.redirect(data.url)
    } catch (error) {
      res.status(500).json({message: error.message})
    }


})

module.exports = app
