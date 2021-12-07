const express = require('express')
const router = express.Router()
const { Users } = require('../model/users')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

//GET Request
router.get('/retrieve', async (req, res) => {
    const userList = await Users.find().select('-passwordHash')
    if(!userList){
        res.status(404).json({
            status: false
        })  
    }
    res.send(userList)
})
//GET only one user
router.get('/retrieve/:id', async (req, res) => {
    const user = await Users.findById(req.params.id).select('-passwordHash')
    if(!user){
        res.status(404).json({
            status: false
        })
    }
    res.send(user)
})
//Statistics
router.get('/get/count', async (req, res) => {

    const userCount = await Users.countDocuments()
    if(!userCount){
        res.status(404).json({success: false})
    }
    res.status(200).json({
        userCount: userCount
    })
})
//POST Request
router.post('/create', async (req, res) => {
    const user = new Users({
        name: req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.password, 10),
        street: req.body.street,
        apartment: req.body.apartment,
        city: req.body.city,
        zip: req.body.zip,
        country: req.body.country,
        phoneNumber: req.body.phoneNumber,
        isAdmin: req.body.isAdmin,
    })
    
    const newUser = await user.save()
    if(!newUser){
        res.status(404).json({
            message: 'Failed to Create a new User',
            success: false
        })
    }
    res.status(201).json(newUser)
})

//Authenticate user
router.post('/login', async (req, res) => {
    const secret = process.env.secret
    const user = await Users.findOne({email: req.body.email})
    if(!user){
        res.status(404).json({message: 'Email Doesnt Exist'})
    }
    if(user && bcrypt.compareSync(req.body.password, user.passwordHash)){
        const token = jwt.sign(
            {
                userID: user.id,
                isAdmin: user.isAdmin
            },secret,
            { expiresIn: '1d' }
        )
        res.status(200).json({user : user.email, token: token})
    }else {
        res.status(400).json({message: 'Password doesnt match!'})
    }
})
//PUT Request
router.put('/update/:id', async (req, res) => {
    const userExist = await Users.findById(req.params.id)
    let password;
    if(req.body.password){
        password = bcrypt.hashSync(req.body.password, 10)
    }else {
        password = userExist.passwordHash;
    }
    const userUpdate = await Users.findByIdAndUpdate(req.params.id, 
        {
            name: req.body.name,
            email: req.body.email,
            passwordHash: password,
            street: req.body.street,
            apartment: req.body.apartment,
            city: req.body.city,
            zip: req.body.zip,
            country: req.body.country,
            phoneNumber: req.body.phoneNumber,
            isAdmin: req.body.isAdmin,
        },
        {new: true})
    if (!userUpdate){
        res.status(404).json({
            message: 'Failed to update user!',
            success: false
        })
    }
    res.status(200).json(userUpdate)
})
//Register new User
router.post('/register', async (req, res) => {
    const user = new Users({
        name: req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.password, 10),
        street: req.body.street,
        apartment: req.body.apartment,
        city: req.body.city,
        zip: req.body.zip,
        country: req.body.country,
        phoneNumber: req.body.phoneNumber,
        isAdmin: req.body.isAdmin,
    })
    
    const newUser = await user.save()
    if(!newUser){
        res.status(404).json({
            message: 'Failed to Create a new User',
            success: false
        })
    }
    res.status(201).json(newUser)
})
//DELETE Request 
router.delete('/delete/:id', async (req, res) => {
    //Check if product ID is valid
    if(!mongoose.isValidObjectId(req.params.id)){
        res.status(404).json({ message: 'Invalid ID', status: false })
    }
    const deleteUser = await Users.findByIdAndRemove(req.params.id)

    if(!deleteUser){
        res.status(404).json({
            message: 'Failed To delete User',
            siccess: false
        })
    }
    res.status(200).json({
        message: 'Successfully Deleted a User',
        success: true
    })
})
module.exports = router