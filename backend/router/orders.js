const express = require('express')
const router = express.Router()
const { Order } = require('../model/order')
const { OrderItem } = require('../model/order-item')

//GET Request
router.get('/retrieve', async (req, res) => {
    const orderList = await Order.find().populate('user', 'name').sort({'dateOrdered': -1})

    if(!orderList){
        res.status(404).json({
            status: false
        })
    }
    res.send(orderList)
})
//GET Specific Order
router.get('/retrieve/:id', async (req, res) => {
    const order = await Order.findById(req.params.id)
    //Populate relational table to orders
    .populate('user', 'name')
    .populate({ path: 'orderItems', populate: 
                { path: 'product', populate: 'category' } 
            })
    if(!order){
        res.status(404).json({
            status: false
        })
    }
    res.send(order)
})
//GET Total Sales
router.get('/get/totalsales', async (req, res) => {
    const totalSales = await Order.aggregate([
        { $group: {_id: null, totalSales: { $sum: '$totalPrice' }} }
    ])
    if(!totalSales){
        res.status(404).json({
            message: 'Unable to get totalsales',
            success: false
        })
    }
    res.status(200).json({
        totalSales: totalSales.pop().totalSales
    })
})
//Statistics
router.get('/get/count', async (req, res) => {

    const orderCount = await Order.countDocuments()
    if(!orderCount){
        res.status(404).json({success: false})
    }
    res.status(200).json({
        orderCount: orderCount
    })
})
//GET List of all orders by a user
router.get('/get/userorders/:userid', async (req, res) => {
    const userOrderList = await Order.find({user: req.params.userid})
    .populate('user', 'name')
    .populate({ path: 'orderItems', populate: 
                { path: 'product', populate: 'category' } 
            }).sort({'dateOrdered': -1})
    if(!userOrderList){
        res.status(404).json({
            status: false
        })
    }
    res.send(userOrderList)
})
//POST Request
router.post('/create', async (req, res) => {
    //save first the products to database
    const orderItemsId = Promise.all(req.body.orderItems.map(async (orderItem) => {
        let newItems = new OrderItem({
            quantity: orderItem.quantity,
            product: orderItem.product
        })
        newItems = await newItems.save()
        //return only the ID
        return newItems._id
    }))
    //Resolve Promise
    const orderItemsIdResolved = await orderItemsId;

    //calculate for total price
    const totalPrices = await Promise.all(orderItemsIdResolved.map(async (orderItemId)=>{
        const orderItems = await OrderItem.findById(orderItemId).populate('product', 'price')
        const totalPrice = orderItems.product[0].price * orderItems.quantity;
        return totalPrice
    }))
    //Sum all price of selected products
    const totalPrice = totalPrices.reduce((a, b) => a + b, 0)

    //save now the oeder details to database
    let order = new Order({
        orderItems : orderItemsIdResolved,
        shippingAddress1 : req.body.shippingAddress1,
        shippingAddress2 : req.body.shippingAddress2,
        city : req.body.city,
        zip : req.body.zip,
        country : req.body.country,
        phone : req.body.phone,
        status : req.body.status,
        totalPrice : totalPrice,
        user : req.body.user
    })
    order = await order.save()
    if(!order){
        return res.status(404).send({
            message: 'Order Cannot Be Created!',
            status: false
        })
    }
    res.send(order)
})
//PUT Request
router.put('/update/:id', async (req, res) => {
    const orderUpdate = await Order.findByIdAndUpdate(req.params.id, 
        {
            status: req.body.status
        },
        {new: true})
    if (!orderUpdate){
        res.status(404).json({
            message: 'Failed to update order!',
            success: false
        })
    }
    res.status(200).json(orderUpdate)
})
//DELETE Request 
router.delete('/delete/:id', async (req, res) => {
    Order.findByIdAndRemove(req.params.id).then(async (order) => {
        if(order){
            await order.orderItems.map(async (orderItem) => {
                await OrderItem.findByIdAndRemove(orderItem)
            })
            res.status(200).json({
                message: 'Successfully Deleted an Order',
                success: true
            })
        }else {
            res.status(404).json({
                message: 'Failed to Delete Order',
                success: false
            })
        }
    }).catch((err) => {
        res.status(404).json({
            message: 'Failed to Delete Order',
            error: err,
            success: false
        })
    })
})

module.exports = router