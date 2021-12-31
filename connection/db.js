const {Pool} = require('pg')
const dbPool = new Pool({
    database : 'blog',
    port : 5432,
    user : 'postgres',
    password : 'Dumbways2021',
    connectionString: 'postgres://wydgdiwfoygpsi:9d4a3b4c1329c48165d0aeed93cbddd3a0c28500a5f815039eb21b7dae402511@ec2-18-235-235-165.compute-1.amazonaws.com:5432/deu9diao78kehu',
    ssl:{
        rejectUnauthorized:false,
    },
})
module.exports = dbPool