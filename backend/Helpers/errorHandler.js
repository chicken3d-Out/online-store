function errorHandler (err, req, res, next){
    //Jwt Error
    if(err.name === 'UnauthorizedError'){
        res.status(404).json({message: 'The user is not authorized!'})
    }
    //Validation Error
    if(err.name === 'ValidationError'){
        res.status(404).json({message: err})
    }
    //General Error
    if(err){
        res.status(404).json({message: 'Server Error!'})
    }
}
module.exports = errorHandler;