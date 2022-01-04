const {Pool} = require('pg')
const dbPool = new Pool({
   connectionString : 'postgres://vtgjwyctzmibzr:c0bc759e488daab6da8a081ede8feb793f41a62f106599df9496b3faed50d475@ec2-18-233-114-179.compute-1.amazonaws.com:5432/d6ln6hnuicl9f9',
   ssl: {rejectUnauthorized:false}
   
})
module.exports = dbPool