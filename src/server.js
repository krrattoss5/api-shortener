const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const morgan = require('morgan')
const app = express()
const {PrismaClient} = require('@prisma/client')

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

app.get('/:id', async (req,res) => {
  const {shortId} = req.params

    const data = await prisma.link.findUnique({
      where: {
        shortUrl: shortId
      }
    })

    try {
      if(!data){
        throw Error('URL Not found!')
      }

      return {
        redirect: {
          destination: data.url
        }
      }
    } catch (error) {
      res.status(500).json({message: error.message})
    }


})

module.exports = app
