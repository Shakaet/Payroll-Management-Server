const express = require('express')
const app = express()
require('dotenv').config();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 3000


app.use(express.json());
app.use(cors());



// payroll
// jtNyh3mXohIlorwR

app.get('/', (req, res) => {
  res.send('Hello World!')
})



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.bnqcs.mongodb.net/?appName=Cluster0`;

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





    const database = client.db("payrollDB");
    const userCollection = database.collection("users");
    const usersInfoCollection=database.collection("usersInfo")
    const attendenceCollection=database.collection("attendence")




   app.delete("/allemployee/:id",async(req,res)=>{

    let idx=req.params.id

    let query={_id:new ObjectId(idx)}

    const result = await usersInfoCollection.deleteOne(query);
    res.send(result)
   })

   app.get("/allatendence",async(req,res)=>{

    let result=await attendenceCollection.find().toArray()

    res.send(result)
   })


   app.get("/attendance/:employeeEmail", async (req, res) => {
    let employeeEmail = req.params.employeeEmail;
    let filter = { employeeEmail };


    let result=await attendenceCollection.find(filter).toArray()

    res.send(result)

    // let result = await attendenceCollection.find(filter).sort({ date: -1 }).limit(1).toArray();

    // if (result.length > 0) {
    //     res.send(result[0]); // Send only the latest attendance record
    // } else {
    //     res.status(404).json({ message: "No attendance record found" });
    // }
});



  app.put("/attendance/:email",async(req,res)=>{

    const { email } = req.params;
    const updatedAttendance = await attendenceCollection.findOneAndUpdate(
        { employeeEmail: email },
        { $set: { status: "Present" } },
        { new: true, upsert: true }
    );

    res.send(updatedAttendance)
  })


   app.post("/attendance",async(req,res)=>{

    const { employeeEmail } = req.body;
    const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

    const existingAttendance = await attendenceCollection.findOne({ employeeEmail, date: today });

    if (existingAttendance) {
      return res.status(400).json({ message: "Attendance already recorded for today" });
  }

  const attendance = { employeeEmail, date: today, status: "Absent" };
  let result= await attendenceCollection.insertOne(attendance);

  res.send(result)


   })


   app.patch("/updateemployee/:id",async(req,res)=>{


    let updateUserData=req.body
    

    let idx=req.params.id

    let query={_id:new ObjectId(idx)}
    const updateDoc = {
      $set: {
        name: updateUserData.name,
        email: updateUserData.email,
        user_photo: updateUserData.user_photo,
        job_title: updateUserData.job_title,
        job_type: updateUserData.job_type,
        salary: updateUserData.salary,
        work_shift: updateUserData.work_shift
      },
    };

    const result = await usersInfoCollection.updateOne(query, updateDoc);
    res.send(result)



   })

   app.get("/employees/:id",async(req,res)=>{
    let idx=req.params.id

    let query={_id:new ObjectId(idx)}

    let result=await usersInfoCollection.findOne(query)
    res.send(result)
  })



    app.get("/allemployee",async(req,res)=>{

      let result=await usersInfoCollection.find().toArray()
      res.send(result)
    })


    app.post("/addemployees",async(req,res)=>{

      let userData=req.body

      let email=userData?.email

      let query={email}


      let existingUser= await usersInfoCollection.findOne(query)

      if(existingUser){
        return res.status(404).send({message:"Users already existed"})
      }

      let result=await usersInfoCollection.insertOne(userData)

      res.send(result)
      

    })

    app.get("/users/employee/:email",async(req,res)=>{

      let email=req.params.email

     
      let query={email}
      let user= await userCollection.findOne(query)

      let employee=false
      if(user){
        employee= user?.role === "employee"
      }

      res.send({ employee })


    })


    app.get("/users/admin/:email",async(req,res)=>{

      let email=req.params.email

     
      let query={email}
      let user= await userCollection.findOne(query)

      let admin=false
      if(user){
        admin= user?.role === "admin"
      }

      res.send({ admin })


    })


    app.post("/users",async(req,res)=>{

      let users=req.body;
      // console.log(users)
      let email=users?.email
      let query= {email}

      let existingUser= await userCollection.findOne(query)
      if(existingUser){
        return res.status(404).send({message:"Users already existed"})
      }
      let existingUsers= await usersInfoCollection.findOne(query)
      if(existingUser){
        return res.status(404).send({message:"Users already existed"})
      }


      let usersInfo={
        name:users?.name,
        email:email,
        user_photo:users?.user_photo,
        job_title:"Frontend Developer",
        job_type:"remote",
        salary:5000,
        work_Shift:"morning"


    }


      await usersInfoCollection.insertOne(usersInfo)


      const result = await userCollection.insertOne(users);
      res.send(result)
    })














    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




  





app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})