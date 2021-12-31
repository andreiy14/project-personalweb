const {Pool} = require('pg')
const dbPool = new Pool({
    database : 'blog',
    port : 5432,
    user : 'postgres',
    password : 'Dumbways2021'
    
})
module.exports = dbPool