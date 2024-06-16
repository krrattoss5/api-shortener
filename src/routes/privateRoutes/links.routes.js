const {Router} = require('express')
const {PrismaClient} = require('@prisma/client')
const prisma = new PrismaClient()
const authenticateToken = require('../../controllers/authenticateToken.js')

const router = Router()

// crear link
router.post('/',authenticateToken, async (req, res) => {
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
// editar link
router.put('/:id', authenticateToken, async (req, res) => {
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

module.exports = router