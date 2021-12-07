const expressJwt = require('express-jwt');
require('dotenv/config')
function authJwt(){
    const api = process.env.API_URL;
    return expressJwt({
        secret: process.env.secret,
        algorithms: ['HS256'],
        isRevoked: isRevoked  
    }).unless({
        //exclude login path for jwt authentication
        path: [
            //make images path public
            { url: /\/public\/uploads(.*)/, methods: ['GET', 'OPTIONS']},
            //Products GET routes
            { url: /\/api\/v1\/products(.*)/, methods: ['GET', 'OPTIONS']},
            //Categories GET routes
            { url: /\/api\/v1\/categories(.*)/, methods: ['GET', 'OPTIONS']},
            `${api}/users/login`, `${api}/users/register`
        ]
    })
}

async function isRevoked( req, payload, done){
    //if user login is not admin 
    if(!payload.isAdmin){
        done(null, true);
    }
    //if user is an admin
    done();
}
module.exports = authJwt;
