const express = require('express')
const app = express()
require('dotenv').config();
const cors = require('cors');
const nodemailer = require("nodemailer");
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
    const leaveCollection=database.collection("leaveReq")




    app.get('/api/leave-request',async(req,res)=>{

      let result=await leaveCollection.find().toArray()

      res.send(result)
    })


    app.patch('/api/leave-request/:id',async(req,res)=>{

      console.log(data)

      
    })







    app.post("/api/leave-request",async(req,res)=>{


      let leaveReqData=req.body

      // console.log(leaveReqData)

      let email=leaveReqData.email

      let query={email}

      let AllreadyUser=await leaveCollection.findOne(query)

      if(AllreadyUser){

        res.status(500).send({message: "You are already sent Request" })
      }

      let result= await leaveCollection.insertOne(leaveReqData);

      res.send(result)


    })



    app.post("/api/submitReport", async (req, res) => {
      const { tasksCompleted, hoursWorked, issuesFaced, nextDayPlan, remarks } = req.body;
      console.log(tasksCompleted)
    
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
        
    
        // Mail content
        const mailOptions = {
          from: `"Daily Report Bot" <${process.env.EMAIL_USER}>`,
          to: process.env.ADMIN_EMAIL,
          subject: "New Daily Report Submitted",
          html: `
            <h2>📝 Daily Update Report</h2>
            <p><strong>✅ Tasks Completed:</strong> ${tasksCompleted}</p>
            <p><strong>⏱ Hours Worked:</strong> ${hoursWorked}</p>
            <p><strong>⚠️ Issues Faced:</strong> ${issuesFaced}</p>
            <p><strong>📅 Next Day Plan:</strong> ${nextDayPlan}</p>
            <p><strong>🗒 Remarks:</strong> ${remarks}</p>
          `,
        };
    
        await transporter.sendMail(mailOptions);
    
        res.status(200).send({ message: "Report submitted and email sent to admin!" });
      } catch (error) {
        console.error("Email sending failed:", error);
        res.status(500).send({ error: "Failed to send email" });
      }
    });




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