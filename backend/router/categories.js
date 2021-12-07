const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const { Categories } = require('../model/categories')

//GET Request
router.get('/retrieve', async (req, res) => {
    const categoriesList = await Categories.find()

    if(!categoriesList){
        res.status(404).json({ status: false })
    }
    res.send(categoriesList)
})
//GET RequestID
router.get('/retrieve/:id', async (req, res) => {
    const categoryID = await Categories.findById(req.params.id)

    if(!categoryID){
        res.status(404).json({
            message: 'Category ID was not found!',
            success: false
        })
    }
    res.status(200).json(categoryID)
})
//POST Request
router.post('/create', async (req, res) => {
    let category = new Categories({
        name: req.body.name,
        icon: req.body.icon,
        color: req.body.color  
    })
    category = await category.save()
    if(!category){
        return res.status(404).send({
            message: 'Category Cannot Be Created!',
            status: false
        })
    }
    res.send(category)
})
//PUT Request
router.put('/update/:id', async (req, res) => {
    const categoryUpdate = await Categories.findByIdAndUpdate(req.params.id, 
        {
            name: req.body.name,
            icon: req.body.icon,
            color: req.body.color
        },
        {new: true})
    if (!categoryUpdate){
        res.status(404).json({
            message: 'Failed to update category!',
            success: false
        })
    }
    res.status(200).json(categoryUpdate)
})
//DELETE Request 
router.delete('/delete/:id', async (req, res) => {
    //Check if product ID is valid
    if(!mongoose.isValidObjectId(req.params.id)){
        res.status(404).json({ message: 'Invalid ID', status: false })
    }else {
        const deleteCategories = await Categories.findByIdAndRemove(req.params.id)

        if(!deleteCategories){
            res.status(404).json({
                message: 'Failed To delete a Category',
                siccess: false
            })
        }
        res.status(200).json({
            message: 'Successfully Deleted a Category',
            success: true
        })
    }
})

module.exports = router