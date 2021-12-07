const express = require('express')
const { Categories } = require('../model/categories')
const { Product } = require('../model/product')
const router = express.Router()
const mongoose = require('mongoose')
const multer = require('multer')
//only allowed file extensions
const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype]
    //Make an error and make it true if mimetype doesnt match
    let uploadError = new Error('Invalid Image Type!')
    if(isValid){
        //make the uploadError null if extension is valid
        uploadError = null
    }
      cb(uploadError, 'public/uploads')
    },
    filename: function (req, file, cb) {
      const fileName = file.originalname.split(' ').join('-');
      const extension = FILE_TYPE_MAP[file.mimetype]
      cb(null, `${fileName}-${Date.now()}.${extension}`)
    }
  })
  
const uploadOptions = multer({ storage: storage })

//GET Request
router.get('/retrieve', async (req, res) => {
    const productList = await Product.find()

    if(!productList){
        res.status(404).json({ status: false })
    }
    res.send(productList)
})
//GET Specific Product
router.get('/retrieve/:id', async (req, res) => {
    if(!mongoose.isValidObjectId(req.params.id)){
        res.status(404).json({ message: 'Invalid ID', status: false })
    }
    const product = await Product.findById(req.params.id).populate('category')

    if(!product){
        res.status(404).json({ message: 'Invalid ID', status: false })
    }
    res.send(product)
})
//GET Specific Column in Product
/*
router.get('/retrieve', async (req, res) => {
    const product = await Product.find().select('name image')

    if(!product){
        res.status(404).json({ status: false })
    }
    res.send(product)
})*/

//POST Request
router.post('/create', uploadOptions.single('image') ,async (req, res) => {
    //Check if category ID Exist
    const categoryID = await Categories.findById(req.body.category)
    if(!categoryID){
        res.status(404).json({
            message: 'Category Id doesnt exist',
            success: false
        })
    }
    const file = req.file
    if(!file){
        res.status(404).json({
            message: 'Missing an Image!',
            success: false
        })
    }
    //store filename of the image
    const fileName = file.filename;
    //get path of the image
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

    const product = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: `${basePath}${fileName}`,
        images: req.body.images,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
        dateCreated: req.body.dateCreated
    })
    
        const newProduct = await product.save()
        if(!newProduct){
            res.status(404).json({
                message: 'Failed to Create a new Product',
                success: false
            })
        }
        res.status(201).json(newProduct)
    
})
//PUT Request
router.put('/update/:id', uploadOptions.single('image') ,async (req, res) => {
    //Check if product ID is valid
    if(!mongoose.isValidObjectId(req.params.id)){
        res.status(404).json({ message: 'Invalid ID', status: false })
    }
    //Check if category ID Exist
    const categoryID = await Categories.findById(req.body.category)
    if(!categoryID){
        res.status(404).json({
            message: 'Category Id doesnt exist',
            success: false
        })
    }
    //check if product is valid
    const product = await Product.findById(req.params.id)
    if(!product){
        res.status(404).json({message: 'Invalid Product!'})
    }

    const file = req.file;
    let imagePath;
    if(file){
        const fileName = file.filename
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        imagePath = `${fileName}${basePath}`
    }else {
        imagePath = product.image;
    }

    const productUpdate = await Product.findByIdAndUpdate(req.params.id, 
        {
            name: req.body.name,
            description: req.body.description,
            richDescription: req.body.richDescription,
            image: imagePath,
            images: req.body.images,
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured,
            dateCreated: req.body.dateCreated
        },
        {new: true})
    if(!productUpdate){
        res.status(404).json({
            message: 'Failed to update product!',
            success: false
        })
    }
    res.status(200).json(productUpdate)
})
//Update the gallery images 
router.put('/gallery-images/:id', uploadOptions.array('images', 10), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Invalid Product ID');
    }
    const files = req.files;
    let imagesPaths = [];
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

    if(files) {
        //get all the filenames
        files.map((file) => {
            imagesPaths.push(`${basePath}${file.filename}`);
        });
    }
    console.log(imagesPaths)

    const product = await Product.findByIdAndUpdate(
        req.params.id,
        {
            images: imagesPaths
        },
        { new: true }
    );
    if (!product) return res.status(500).json('the gallery cannot be updated!');
    res.status(200).json(product);
});
//DELETE Request 
router.delete('/delete/:id', async (req, res) => {
    //Check if product ID is valid
    if(!mongoose.isValidObjectId(req.params.id)){
        res.status(404).json({ message: 'Invalid ID', status: false })
    }
    const deleteProduct = await Product.findByIdAndRemove(req.params.id)

    if(!deleteProduct){
        res.status(404).json({
            message: 'Failed To delete Product',
            siccess: false
        })
    }
    res.status(200).json({
        message: 'Successfully Deleted a Product',
        success: true
    })
})

//Statistics
router.get('/get/count', async (req, res) => {

    const productCount = await Product.countDocuments()
    if(!productCount){
        res.status(404).json({success: false})
    }
    res.status(200).json({
        productCount: productCount
    })
})
//Get Featured Product
router.get('/get/featured/:count', async (req, res) => {
    //Get Count in Params
    const count = req.params.count ? req.params.count : 0
    //Limit the count of featured
    const product = await Product.find({isFeatured: true}).limit(+count)
    if(!product){
        res.status(404).json({success: false})
    }
    res.status(200).json(product)
})
//Filter Product Category
router.get('/filter', async (req, res) => {
    let filter = {};
    if(req.query.categories){
        filter = {category: req.query.categories.split(',')}
    }
    const productList = await Product.find(filter).populate('category')
    if(!productList){
        res.status(404).json({success: false})
    }
    res.status(200).json(productList)
})


module.exports = router
