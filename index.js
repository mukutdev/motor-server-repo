const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors')
const jwt = require('jsonwebtoken');
require('dotenv').config()
//middleware

app.use(cors())
app.use(express.json())

//verify jwt function

function verifyJwt(req, res, next) {

    const authHeader = req.headers.authorization

    if(!authHeader){
        res.status(401).send('unauthorized access') 
    }

    const token = authHeader.split(' ')[1]

    jwt.verify(token , process.env.ACCESS_TOKEN , (err , decoded)=>{
        if(err){
            res.status(403).send({message : 'forbidden access'})
        }

        req.decoded = decoded
        next()
    })
}


//mongodb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.h5qu391.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){

    try{
        const carsCollections = client.db('CarsDatabase').collection('allCars');
        const userCollections = client.db('CarsDatabase').collection('allUsers')
        const categoryCollections = client.db('CarsDatabase').collection('categories')
        const bookingCollections = client.db('CarsDatabase').collection('booking')

        app.get('/allCars' , async (req, res) =>{
            const query = {}
            const result = await carsCollections.find(query).toArray()
            res.send(result)

        })
        
       
        //getting all categories name
        app.get('/categories' , async (req, res) =>{

            const query = {}
            const result = await categoryCollections.find(query).toArray()
            res.send(result)

        })

        //getting all cars by category
        app.get('/categories/:id', async (req, res) =>{

            const id = req.params.id
            const query = {categoryId : id}
            const result = await carsCollections.find(query).toArray()
            res.send(result)
        })

          // jwt issuing function

          app.get('/jwt' , async (req, res) => {
            
            const email = req.query.email
            const query = {email : email}
            const user = await userCollections.findOne(query)
            if(user){
                const token = jwt.sign({email} , process.env.ACCESS_TOKEN , {expiresIn : '1d'})
                return res.send({accessToken : token})
            }
          
            res.status(403).send({accessToken : 'not found'})

        })

        // add new user to to database
        app.put('/users/:email' , async(req, res) =>{
            const email = req.params.email
            const user = req.body
            const filter = {email: email}
            const options = {upsert : true}
            const updatedDoc = {
                $set : user
            }
            // const result = await userCollections.insertOne(user)
            const result = await userCollections.updateOne(filter , updatedDoc , options)
            res.send(result)
            // console.log(result);
        })

        //get users based on accountMode
        app.get('/users/role/:email' , async (req, res)=>{
            const email = req.params.email
            console.log(email);
            const query = {email : email}
            const result = await userCollections.findOne(query)
            res.send(result)
        })

        //booking api

        app.post('/bookings' , async (req, res)=>{

            const booking = req.body
            const result = await bookingCollections.insertOne(booking)
            res.send(result)

        })

    }
    finally{

    }

}
run().catch(err =>console.log(err))






app.get('/' , (req , res) => {
    res.send('server is up and running');
})

app.listen(port , ()=>{
    console.log('server listening on port' , port);
})