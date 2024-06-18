const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const {PrismaClient} = require('@prisma/client')
const prisma = new PrismaClient()
require('dotenv').config()
const {SECRET_KEY} = process.env

const createUser = async (req, res) => {
  console.log('entro')
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

    await prisma.user.create({
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

}

const loginUser = async (req, res) => {
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

}

const getCurrentUser = async (req, res) => {
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
    delete user.password

    return res.status(200).json({...user,countries: countries})
  } catch (error) {
    return res.status(400).json({message: error.message})
  }
}

const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;


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
}

const updatePreferences = async (req, res) => {
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
}

const deleteUser = async (req, res) => {
  try {
    await prisma.user.delete({
      where:{
        id: req.user.userId
      }
    });
    return res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  createUser,
  loginUser,
  getCurrentUser,
  updatePassword,
  updatePreferences,
  deleteUser
}