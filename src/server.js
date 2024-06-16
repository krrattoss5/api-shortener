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
const cors = require('cors')

// app.name('api-shortener')
// Configuración de CORS

app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(cors({
  origin: '*',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'], // Asegúrate de permitir 'Authorization'
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

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
  const {email, password} = req.body

  try {
    const user = await prisma.user.findUnique({
      where:{
        email:email
      }
    })

    if(!user?.id){
      return res.status(404).json({message: 'Usuario inexistente!'})
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if(!isPasswordValid){
      return res.status(400).json({message: 'Usuario ó Contraseña invalidos'})
    }

    const token = await jwt.sign({userId: user.id}, SECRET_KEY, {expiresIn: '3d'})
    return res.json({token})
  } catch (error) {
    return res.status(500).json({message: error.message})
  }

})

app.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where:{
        id: req.user.userId
      },
      include:{
        links: {
          include:{
            linkCountries: true
          }
        }
      }
    })

    const countries = await prisma.country.findMany()

    return res.status(200).json({...user,password:'',countries: countries})
  } catch (error) {
    return res.status(400).json({message: error.message})
  }
})

app.post('/',authenticateToken, async (req, res) => {
  const {url, customShort, name} = req.body

  urlTested = url.slice(0,4) !== 'http' ? `https://${url}` : url

  let domain = urlTested.slice(8)

  const index = domain.indexOf('/')

  domain = index < 0 ? domain : domain.slice(0,index)

  const shortUrl = customShort.length > 0 ? customShort : Math.random().toString(36).substring(2,7)

  try {
    const link = await prisma.link.create({
      data: {
        url:urlTested,
        shortUrl:shortUrl,
        domain:domain,
        name: name,
        userId: req.user.userId
      }
    })

    return res.status(200).json(link)
  } catch (error) {
    return res.status(500).json({message: error.message})
  }

})

app.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { url, name, customShort } = req.body;
  const linkId = Number(id)

  // Validar que el id sea un número
  // if (isNaN(id)) {
  //   return res.status(400).json({ message: 'Invalid ID' });
  // }

  try {
    const link = await prisma.link.findUnique({
      where: { id: linkId } // Convertir id a número
    });

    if (!link) {
      return res.status(404).json({ message: 'Link not found!' });
    }

    await prisma.link.update({
      where: {
        id: linkId
      }, // Convertir id a número
      data: {
        url: url,
        name: name,
        shortUrl: customShort }
    });

    return res.status(200).json({ message: 'Link updated!' });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
});

app.get('/:shortId', async (req,res) => {
  const {shortId} = req.params

    try {

      const link = await prisma.link.findUnique({
        where: {
          shortUrl: shortId
        },
        include:{
          linkCountries: true
        }
      })

      if(!link){
        return res.status(404).json({message: 'URL Not found!'})
      }

      const response = await fetch("https://ipinfo.io/json?token=754f00ca799206")
      const jsonResponse = await response.json()
      const countryName = jsonResponse?.country

      let country = await prisma.country.findUnique({
        where:{
          name: countryName
        }
      })

      if(!country){
        country = await prisma.country.create({
          data:{
            name: countryName
          }
        })
      }

      const linkCountry = await prisma.linkCountry.findUnique({
        where:{
          linkId_countryId: {
            linkId: link.id,
            countryId: country.id
          }
        }
      })

      if(linkCountry){
        await prisma.linkCountry.update({
          where:{
            id: linkCountry.id
          },
          data:{
            visits:{
              increment:1
            }
          }
        })
      } else {
        await prisma.linkCountry.create({
          data:{
            linkId: link.id,
            countryId: country.id
          }
        })
      }

      await prisma.link.update({
        where:{
          id:link.id
        },
        data:{
          clicks:{
            increment:1
          }
        }
      })

      return res.redirect(link.url)
    } catch (error) {
      res.status(500).json({message: error.message})
    }


})

app.post('/updatePreferences', authenticateToken, async (req, res) => {
  const { name, email } = req.body;
  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: { name, email }
    });
    return res.status(200).json(updatedUser);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post('/updatePassword', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;


  try {

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)

    if(!isPasswordValid){
      return res.status(400).json({message: 'Contraseña invalida'})
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: req.user.userId },
      data: { password: hashedPassword }
    });

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.delete('/deleteAccount', authenticateToken, async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.user.userId } });
    return res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// app.get('/detail?shortId', (req, res) => {
//   const {shortId} = req.query

//   console.log(shortId)
// })

module.exports = app
