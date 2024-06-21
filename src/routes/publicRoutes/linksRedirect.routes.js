const {Router} = require('express')
const router = Router()
const {PrismaClient} = require('@prisma/client')
const prisma = new PrismaClient()

router.get('/:shortId', async (req,res) => {
  const userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress
  const {shortId} = req.params
  console.log('====================================')
  console.log(userIP)
  console.log('====================================')
    try {
      const testAll = await fetch(`https://ipinfo.io/[${userIP}]?token=754f00ca799206`)
      const responseAll = await testAll.json()

      console.log('====================================');
      console.log(responseAll);
      console.log('====================================');

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

module.exports = router