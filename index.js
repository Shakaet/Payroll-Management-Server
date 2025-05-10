const express = require('express')
const app = express()
require('dotenv').config();
const cors = require('cors');
const nodemailer = require("nodemailer");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
var jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const port = process.env.PORT || 3000
const stripe = require('stripe')(process.env.PAYMENT_KEY);


app.use(cors({
  origin:["http://localhost:5173","http://localhost:5174"],
  credentials:true
}))



app.use(cookieParser());





app.use(express.json());
// app.use(cors());


 
  // console.log(process.env.Sending_API_Key)






// payroll
// jtNyh3mXohIlorwR

let varifyToken=(req,res,next)=>{
  // console.log("middleware running")

  let token =req.cookies?.token
  // console.log(token)
  console.log(token)



  

  if(!token){
    return res.status(401).send({message:"unauthorized token"})
  }


  jwt.verify(token, process.env.JWT_Secret,(err, decoded)=>{

    if(err){
      return res.status(401).send({message:"unauthorized token"})
    }

    req.user=decoded
    next()
  });
}

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
    const taskDB=database.collection("taskdb")
    const paymentsCollection = database.collection("payments");


    app.post("/jwt",async(req,res)=>{
      

      let userData=req.body
  
      let token= jwt.sign(userData, process.env.JWT_Secret, { expiresIn: "1h" });
  
      res
      .cookie('token', token, {
        httpOnly: true, 
        secure:false  ,    // Prevent JavaScript access to the cookie
        // secure: process.env.NODE_ENV === "production",
        // sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",         // Send cookie over HTTPS only
        
    })
      .send({success:true})
      
    });

    app.post("/logout",(req,res)=>{
      res
      .clearCookie('token',  {
        httpOnly: true,
        secure:false,
        // secure: process.env.NODE_ENV === "production",
        // sameSite: process.env.NODE_ENV === "production" ? "none" : "strict", // Use true in production with HTTPS
      })
      .send({success:true})
    })



    app.post("/createPaymentIntent",varifyToken,async(req,res)=>{

      let {price}=req.body
      let amount=parseInt(price*100)
      console.log(amount)
      const paymentIntent = await stripe.paymentIntents.create({

        amount:amount,
        currency:"usd",
        payment_method_types:["card"]
        
    })

    res.send({
      clientSecret:paymentIntent.client_secret
    })
  })


  // app.post("/payments",async(req,res)=>{

  //   let paymentData=req.body
  //   console.log(paymentData)


  //   let intertedPayment=await paymentsCollection.insertOne(paymentData)

  //   try {
  //     const transporter = nodemailer.createTransport({
  //       host: process.env.EMAIL_HOST,
  //       port: process.env.EMAIL_PORT,
  //       auth: {
  //         user: process.env.EMAIL_USER,
  //         pass: process.env.EMAIL_PASS,
  //       },
  //     });
      
  
  //     // Mail content
  //     const mailOptions = {
  //       from: `"Salary Sent" <${process.env.EMAIL_USER}>`,
  //       to: process.env.ADMIN_EMAIL,
  //       subject: "Employees Salary sent Successfully",
  //       html: `
  //         <h2>📝Employees Salary Pay Report</h2>
  //         <p><strong>✅ Tasks Completed:</strong> transection id ${paymentData.transectionId}</p>
          
  //       `,
  //     };
  
  //     await transporter.sendMail(mailOptions);
  
  //     res.status(200).send({ message: "Report submitted and email sent to admin!" });
  //   } catch (error) {
  //     console.error("Email sending failed:", error);
  //     res.status(500).send({ error: "Failed to send email" });
  //   }


   
    

 
  
      



  //   res.send({intertedPayment})

  // })

  app.post("/payments",varifyToken, async (req, res) => {
    let paymentData = req.body;
    console.log(paymentData);
  
    try {
      let intertedPayment = await paymentsCollection.insertOne(paymentData);
  
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
  
      const mailOptions = {
        from: `"Salary Sent" <${process.env.EMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL,
        subject: "Employees Salary sent Successfully",
        html: `
          <h2>📝Employees Salary Pay Report</h2>
          <p><strong>✅ Tasks Completed:</strong> transection id ${paymentData.transectionId}</p>
        `,
      };
  
      await transporter.sendMail(mailOptions);
  
      res.status(200).send({
        message: "Report submitted and email sent to admin!",
        intertedPayment,
      });
    } catch (error) {
      console.error("Email sending failed:", error);
      res.status(500).send({ error: "Failed to send email" });
    }
  });

  app.patch("/myPayment/:id",async(req,res)=>{


    let idx=req.params.id


    let query={_id:new ObjectId(idx)}

    let status=req.body.status
    console.log(status)

    const updateDoc = {
      $set: {
        status: status
      },
    };
    const options = { upsert: true };

    const result = await paymentsCollection.updateOne(query, updateDoc, options);

    res.send(result)



  })

  app.get("/mypaymentHistory/:email",async(req,res)=>{

    let rec_email=req.params.email

    let query={rec_email}


    let result=await paymentsCollection.find(query).toArray()
    res.send(result)
  })


  app.get("/allpaymentHistory",varifyToken,async(req,res)=>{


    let result=await paymentsCollection.find().toArray()
    res.send(result)
  })





    app.get("/adminCount",async(req,res)=>{

      let query={role:"admin"}
      let result=await userCollection.find(query).toArray()
      res.send(result)
    })
    app.get("/employeeCount",async(req,res)=>{

      let query={role:"employee"}
      let result=await userCollection.find(query).toArray()
      res.send(result)
    })
    app.get("/userCount",async(req,res)=>{

      
      let result=await userCollection.find().toArray()
      res.send(result)
    })


    app.delete("/alltask/:id",async(req,res)=>{

      let idx=req.params.id

    let query={_id:new ObjectId(idx)}

    const result = await taskDB.deleteOne(query);
    res.send(result)






    })


    app.get("/alltask",async(req,res)=>{

       result= await taskDB.find().toArray()

      res.send(result)


    })



    app.patch("/mytask/:id",async(req,res)=>{

      let idx=req.params.id

      let query={_id:new ObjectId(idx)}

      let status=req.body.status
      // console.log(status)

      const updateDoc = {
        $set: {
          status: status
        },
      };
      const options = { upsert: true };

      const result = await taskDB.updateOne(query, updateDoc, options);

      res.send(result)



    })



    app.get("/mytask/:email",async(req,res)=>{

      let email=req.params.email

      let query={email}

      let result= await taskDB.find(query).toArray()

      res.send(result)
    })




    app.post("/addtask",async(req,res)=>{

      let formData=req.body

      // console.log(formData)
      let result= await taskDB.insertOne(formData)

      res.send(result)
    })





    app.delete("/api/leave-request/:id",async(req,res)=>{


      let idx=req.params.id
      // console.log(idx)

      const query = { _id:new ObjectId(idx) };
      const result = await leaveCollection.deleteOne(query);
      res.send(result)


    })




    app.get('/api/leave-request',async(req,res)=>{

      let result=await leaveCollection.find().toArray()

      res.send(result)
    })


    app.patch('/api/data/:id',async(req,res)=>{


      // let data=req.body


      let idx=req.params.id

      let query={_id:new ObjectId(idx)}

      let {email}= req.query

    

      const filter = {email};
      console.log(email)


      const updateDoc = {
        $set: {
          status: "approved"
        },
      };
      const options = { upsert: true };


      await userCollection.deleteOne(filter);
      await usersInfoCollection.deleteOne(filter);

      const result = await leaveCollection.updateOne(query, updateDoc, options);

      res.send(result)









     
      
    })







    app.post("/api/leave-request",varifyToken,async(req,res)=>{


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


    app.get("/allemployee/:id",varifyToken,async(req,res)=>{

      let idx=req.params.id
  
      let query={_id:new ObjectId(idx)}
  
      const result = await usersInfoCollection.findOne(query);
      res.send(result)
     })




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


   app.post("/attendance",varifyToken,async(req,res)=>{

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



    app.get("/allemployee",varifyToken,async(req,res)=>{

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