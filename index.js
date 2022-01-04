const express = require('express')
const db = require('./connection/db')
const bcrypt =  require('bcrypt')
const session = require('express-session')
const flash = require('express-flash')
const app = express()
const PORT =  process.env.PORT || 5000
const upload = require('./middleware/uploadFile')

var isLogin = true
var month = [ 
    'January', 
    'February', 
    'March', 
    'April', 
    'May', 
    'June', 
    'July', 
    'August', 
    'September', 
    'October', 
    'November', 
    'December'
  ]
  let blogs = [
      {
        id : 1,
        title: 'Pasar Coding di Indonesia Dinilai Masih Menjanjikan',
        content:' Ketimpangan sumber daya manusia (SDM) di sektor digital masih menjadi isu yang belum terpecahkan. Berdasarkan penelitian ManpowerGroup, ketimpangan SDM global, termasuk Indonesia, meningkat dua kali lipat dalam satu dekade terakhir. Lorem ipsum,dolor sit amet consectetur adipisicing elit. Quam, molestiae numquam! Deleniti maiores expedita eaque deserunt quaerat! Dicta,eligendi debitis?',
        author : 'andreiy' ,
        post_date : '12 Jul 2021 22:30 WIB'

  }
]

app.set('view engine', 'hbs')
app.use('/public', express.static(__dirname+'/public'))
app.use('/uploads', express.static(__dirname+'/uploads'))
app.use(express.urlencoded({extended:false}))
app.use(
    session(
        {
            cookie:{
                maxAge: 2 * 60 * 60 * 1000,
                secure: false,
                httpOnly: true
            },
            store: new session.MemoryStore(),
            saveUninitialized: true,
            resave : false,
            secret: "secretValue"

        }
    )
)
app.use(flash())




app.get('/', function(request,response){
    db.connect(function(err,client, done){
        if (err) throw err
        console.log(err)

        client.query('SELECT * FROM experience',function(err,result){
            
            console.log(result.rows)
            let dataBlogs = result.rows
            console.log(dataBlogs);
          
           response.render('index',{isLogin:isLogin, dataBlogs:dataBlogs})
        })
    })
   
})
app.get('/form', function(request,response){
    response.render("form")
})
app.get('/register', function(request,response){
    response.render('register')
    
})
app.post('/register', function(req,res){
    const data = req.body
     const hashedPassword = bcrypt.hashSync(data.password, 10)
       
        db.connect(function(err,client, done){
            if (err) throw err
            console.log(err)
    
            client.query( `INSERT INTO author (name,email,password) VALUES ('${data.name}','${data.email}', '${hashedPassword}')`, function(err,result){
                if (err) throw err
                res.redirect('/login')
            })
        })
    })
app.get('/login', function(request,response){
    response.render("login")
})
app.post('/login', function(request,response){
    const {email, password} = request.body
    const query = `SELECT * FROM author WHERE email = '${email}'`
    db.connect(function(err,client,done){
        if (err) throw err
        client.query(query,function(err,result){
            if (err) throw err
            if(result.rows.length==0){
                request.flash('danger', 'Email or password is wrong')
                return response.redirect('/login')
            }
            let isMatch = bcrypt.compareSync(password, result.rows[0].password)
            console.log(isMatch);
            if(isMatch){
                request.session.isLogin = true
                request.session.author = {
                    id : result.rows[0].id,
                    name: result.rows[0].name,
                    email: result.rows[0].email
                }
                request.flash('success', 'Heloo')
                response.redirect('/blog')

            }else{
                request.flash('danger', 'Email or password is wrong')
                response.redirect('/login')
            }
        })
    })
})
app.get('/logout', function(request,response){
    request.session.destroy()
    response.redirect('/blog')
   
})
app.get('/add-blog', function(request,response){
    response.render('add-blog',{author:request.session.author})
})
app.get('/blog-detail/:id', function(request,response){
    let id = request.params.id
    db.connect(function(err,client, done){
        if (err) throw err
        console.log(err)

        client.query(`SELECT * FROM blog WHERE id = ${id}`,function(err,result){
            
            console.log(result.rows)
            let dataBlogs = result.rows[0]
            response.render('blog-detail', {isLogin :isLogin, blogs:dataBlogs,author:request.session.author})
        })
    })
    
   
})
app.get('/delete-blog/:index', function(req,res){
    let index = req.params.index
    db.connect(function(err,client, done){
        if (err) throw err
        console.log(err)

        client.query(`DELETE  FROM blog WHERE id = ${index}`,function(err,result){
            
            res.redirect('/blog')
        })
    })
})
app.get('/edit-blog/:index',function(req,res){
    let index = req.params.index
  
    res.render('edit-blog',{index:index,author:req.session.author})
})
app.post('/edit-blogs',upload.single('image'), function(req,res){
    
    let image = req.file.filename
    let data = req.body
    let i=Number(data.id)
    const query = `UPDATE blog SET title = '${data.title}', content = '${data.content}', image = '${image}' WHERE id = ${i}`;
    db.connect(function(err,client, done){
        if (err) throw err
        console.log(err)

        client.query(query, function(err,result){
            if (err) throw err
            res.redirect('/blog')
        })
    })
    
  
    
})
app.get('/blog', function(req,res){
    let query = `SELECT blog.id, blog.title, blog.content, blog.image, author.name AS author, blog.post_date
    FROM blog LEFT JOIN author
    ON blog.author_id = author.id`
    db.connect(function(err,client, done){
        if (err) throw err
        console.log(err)

        client.query(query,function(err,result){
            
            console.log(result.rows)
            let dataBlogs = result.rows
           dataBlogs = dataBlogs.map(function(blog){
               return {
                   ...blog,
                   post_date : getFulltime(blog.post_date),
                   post_age : getDistancetime(blog.post_date),
                   isLogin:req.session.isLogin,
                   image : './uploads/' + blog.image
               }
           })
           res.render('blog',{isLogin:req.session.isLogin, blogs:dataBlogs, author:req.session.author})
        })
    })
    
})

app.post('/blog',upload.single('image'), function(req,res){
    let data = req.body
    if(!req.session.author.id){
        req.flash('danger','please login to show the content')
        return res.redirect('/add-blog')
    }
    let image = req.file.filename
    let authorId = req.session.author.id
    let query = `INSERT INTO blog (title,content,image,author_id) VALUES ('${data.title}','${data.content}', '${image}', '${authorId}')`
    db.connect(function(err,client, done){
        if (err) throw err
        console.log(err)

        client.query(query, function(err,result){
            if (err) throw err
            res.redirect('/blog',)
        })
    })
})

app.listen(PORT,function(){
    console.log(`running on port : ${PORT}`);
})
function getFulltime (time){
    let date = time.getDate()
    let monthIndex = time.getMonth()
    let year = time.getFullYear()
    let hours = time.getHours()
    let minutes = time.getMinutes()
    return  `${date}-${monthIndex}-${year}- ${hours}:${minutes} WIB`
    
  }
  function getDistancetime(time){
    let timePost= time
    let timeNow = new Date()
    let distance = timeNow- timePost
    let milieSeconds  = 1000
    let secondInMinutes = 60
    let minuteInHours = 60
    let hourInDay = 23
    let distanceDay = Math.floor(distance/(milieSeconds * secondInMinutes * minuteInHours * hourInDay))
    if(distanceDay >= 1){
      return`${distanceDay} day ago`
  
    }else{
      let distanceHours = Math.floor(distance / (milieSeconds * secondInMinutes * minuteInHours))
      if(distanceHours >=1){
        return`${distanceHours} hours ago`
      }else{
        let distanceMinutes = Math.floor(distance /(milieSeconds * secondInMinutes))
        if(distanceMinutes>=1){
        return`${distanceMinutes} minutes ago`
        }else{
          let distanceSeconds = Math.floor(distance/ milieSeconds)
          return(`${distanceSeconds} seconds ago`)
        }
      }
    }
    
  }