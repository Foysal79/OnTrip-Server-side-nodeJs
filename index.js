const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken'); // json web token
require('dotenv').config() /// environment variables

const port = process.env.PORT || 5000;

/// middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// const uri = "mongodb+srv://<username>:<password>@cluster0.haioro2.mongodb.net/?retryWrites=true&w=majority";
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.haioro2.mongodb.net/?retryWrites=true&w=majority`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const packageCollection = client.db("OntripDB").collection("package");
    const userCollection = client.db("OntripDB").collection("users");
    const bookingCollection = client.db("OntripDB").collection("bookedPakages");
    const MyWishlistCollection = client.db("OntripDB").collection("MyWishlist");
    const storyCollection = client.db("OntripDB").collection("story");

    // jwt api 
    app.post('/jwt', async(req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn : '1h'
      })

      res.send({token});

    } )
    // middlewares 
    const verifyToken = (req, res, next) => {
      console.log('inside verify token', req.headers.authorization);
      if(!req.headers.authorization)
      {
           return res.status(401).send({message : 'forbidden access'})
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if(err)
        {
          return res.status(401).send({message : 'forbidden access'})
        }
        req.decoded = decoded;
        next();

      }  )
    }

    /// admin medileware

    const verifyAdmin = async(req, res, next) => {
      const email = req.decoded.email;
      const query = { email : email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if(!isAdmin) 
      {
        return res.status(403).send({message : "forbidden access"});

      }
      next();

    }
    /// guid middleware

    const verifyGuid = async(req, res, next) => {
      const email = req.decoded.email;
      const query = { email : email };
      const user = await userCollection.findOne(query);
      const isGuid = user?.role === 'guid';
      if(!isGuid) 
      {
        return res.status(403).send({message : "forbidden access"});

      }
      next();

    }


    // package api
    app.post('/allpackges', async(req, res) => {
        const packages = req.body;
        const result = await packageCollection.insertOne(packages);
        res.send(result);
    })

      // all story post 
    app.post('/allStory', async(req, res) => {
        const packages = req.body;
        const result = await storyCollection.insertOne(packages);
        res.send(result);
    })
    


    app.get('/allpackges', async(req, res) => {
      const allPackages = await packageCollection.find().toArray();
      res.send(allPackages); 
    } )

    // all story
    app.get('/allStory', async(req, res) => {
      const allPackages = await storyCollection.find().toArray();
      res.send(allPackages); 
    } )


           /// single story details
           app.get('/Story/:id', async(req, res) => {
            const id = req.params.id;
        const query = {_id : new ObjectId(id)};
        const result = await storyCollection.findOne(query);
        res.send(result);
           } )




    // booking packages

    

    app.get('/bookedPackges', verifyToken,   async(req, res) => {
    
    
      let query = {};
      if(req.query.email)
      {
        query = {
          touristEmail: req.query.email ,
        }
      }
      console.log("query", query);
      const cursor = bookingCollection.find(query);
      const results = await cursor.toArray();
      res.send(results);
      
  
     })

    //  my wislist get loade data email wasie
    app.get('/myWishList',    async(req, res) => {
    
    
      let query = {};
      if(req.query.email)
      {
        query = {
          email : req.query.email ,
        }
      }
      console.log("my wislist query", query);
      //const cursor = MyWishlistCollection.find(query);
      const cursor = MyWishlistCollection.find(query);
      const results = await cursor.toArray();
      res.send(results);
      
  
     })


    //  status upadte
    app.patch('/bookedPackges/:id', async(req, res) => {
      const id = req.params.id;
      const filter = {_id : new ObjectId(id)};
      const updatedBooking = req.body;
      console.log(updatedBooking);
      const updateDoc = {
        $set: {
          status : updatedBooking.status,
        }
      }
      const result = await bookingCollection.updateOne(filter, updateDoc);
      res.send(result);
    
    
    
     } )






    //  guid assigned tour
    app.get('/assignedTour',  async(req, res) => {
    
    
      let query = {};
      if(req.query.email)
      {
        query = {
          
          Guid: req.query.email ,
        }
      }
      
      const cursor = bookingCollection.find(query);
      const results = await cursor.toArray();
      res.send(results);
      
  
     })



// booking packages
    app.post('/bookedPackges', async(req, res) => {
      const bookingPackges = req.body;
      const result = await bookingCollection.insertOne(bookingPackges);
      res.send(result);

    } )
// My Wishlist post 
    app.post('/myWishList', async(req, res) => {
      const bookingPackges = req.body;
      const result = await MyWishlistCollection.insertOne(bookingPackges);
      res.send(result);

    } )

    // booking packages debated
    app.delete('/bookedPackges/:id', async(req, res) => {
      const id = req.params.id;
      console.log('data base delate id is : ', id);
      const query = { _id: new ObjectId(id)};
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
     } )

     
    // My Wishlist delated 
    app.delete('/myWishList/:id', async(req, res) => {
      const id = req.params.id;
      console.log('data base delate id is : ', id);
      const query = { _id: new ObjectId(id)};
      const result = await MyWishlistCollection.deleteOne(query);
      res.send(result);
     } )


       /// single package
       app.get('/singlePackages/:id', async(req, res) => {
        const id = req.params.id;
    const query = {_id : new ObjectId(id)};
    const result = await packageCollection.findOne(query);
    res.send(result);
       } )



    // user api 
    app.post('/users', async(req, res) => {
      const user = req.body;
      const query = {email: user.email }
      const existingUser = await userCollection.findOne(query);
      if(existingUser)
      {
        return res.send({message: "user already exist", insertedId: null})
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    })

    app.get('/users', verifyToken, verifyAdmin, async(req, res) => {
      console.log(req.headers);
      const result = await userCollection.find().toArray();
      res.send(result);

    } )
      //  guide session
    app.get('/users/allGuid', async(req, res) => {
      console.log(req.headers);
      const result = await userCollection.find({role : 'guid'}).toArray();
      res.send(result);

    } )



    // user or guid delaes update 

    app.patch('/users/:id', async(req, res) => {
      const id = req.params.id;
      const updateService = req.body;
      console.log(id, updateService);
      const filter = { _id : new ObjectId(id) };
      
      const updated = {
        $set:{
          contact : updateService.contact ,
          guidImg : updateService.guidImg ,
          education : updateService.education ,
          workExprience : updateService.workExprience ,
          
        }
      }
  
      const result = await userCollection.updateOne(filter, updated)
      res.send(result);
  
     } )





    // single user or guid data 
    app.get("/users/:email", async(req, res) => {
      const id = req.params.email;
      const query = { 
      
        email : id,

      }
      const cursor = userCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);

    })


    app.get('/guid/:id', async(req, res) => {
      const id = req.params.id;
  const query = {_id : new ObjectId(id)};
  const result = await userCollection.findOne(query);
  res.send(result);
     } )

   /// verify admin
    app.get('/users/admin/:email', verifyToken,   async(req, res) => {
      const email = req.params.email;
      if(email !== req.decoded.email)
      {
        return res.status(403).send({message: 'unauthorized access'})
      }
      const query = {
        email : email
      }
      const user = await userCollection.findOne(query);
      let admin = false;
      if(user)
      {
        admin = user?.role === 'admin';
      }
      res.send({admin});
    
     } )

   /// verify guid
    app.get('/users/guid/:email', verifyToken,   async(req, res) => {
      const email = req.params.email;
      if(email !== req.decoded.email)
      {
        return res.status(403).send({message: 'unauthorized access'})
      }
      const query = {
        email : email
      }
      const user = await userCollection.findOne(query);
      let guid = false;
      if(user)
      {
        guid = user?.role === 'guid';
      }
      res.send({guid});
    
     } )


    app.patch('/users/admin/:id', verifyToken, verifyAdmin,  async(req, res) => {
      const id = req.params; 
      const filter = {_id : new ObjectId(id)};
      const updateDoc = {
        $set: {
          role : 'admin'
        }
      }
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    } )

    app.patch('/users/guid/:id', verifyToken, verifyAdmin, async(req, res) => {
      const id = req.params; 
      const filter = {_id : new ObjectId(id)};
      const updateDoc = {
        $set: {
          role : 'guid'
        }
      }
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    } )



    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('OnTrip is Working')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})