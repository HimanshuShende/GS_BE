import express from "express";
import Joi from "joi";

// creates express instance which handles the requests
const APP = express();
// fetches PORT variable from environment, if not present than selects 8080
const PORT = process.env.PORT || 8080
// creates our mailchimp client instance with the API key
const apiKey = process.env.API_KEY;
const mailchimp = require("@mailchimp/mailchimp_transactional")(apiKey);
let failureArray: any[];
let successArray: any[];
interface User {
    email: string,
    name: string,
    type: "to"|"cc"|"bcc"
}

APP.use(express.json())
APP.use(express.urlencoded({
    extended: true
}));

APP.get("/", (req, res)=>{
    res.send(
        `<style>
        *{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        </style>
        <h1 style="width:100vw;height:100vh;display:flex;justify-content:center;align-items:center;font-size: 3rem;font-weight: 700;">
            GlobalShala Backend Task
        </h1>`
        )
})

APP.post("/send_mail/", (req, res)=>{
    failureArray = [];
    successArray = [];

    const userObject = Joi.object({
        email: Joi.string().required(),
        name: Joi.string(),
        type: Joi.custom((str, descr)=>{
            if (['to', 'cc', 'bcc'].includes(str)){
                return true
            }
            else{
                console.log(str, false)
                return descr.error("any.custom", {
                    error: new Error("it's not one of the following: to/cc/bcc") 
                })
            }
        })
    })

    const reqSchema = Joi.object({
        userData: Joi.array().min(1).required(),
        emailMessage: Joi.string().required(),
        attachments: Joi.array()
    })

    const success: User[] = [];

    const reqSchemaResult = reqSchema.validate(req.body)
    if (reqSchemaResult.error){
        res.send(reqSchemaResult.error.details[0].message);
    }else{
        req.body.userData.forEach((user:any, index:any)=>{
            const userObjectResult = userObject.validate(user)
            if (userObjectResult.error) {
                failureArray.push({
                    ...user,
                    error: userObjectResult.error.details[0].message 
                })
            }else{
                success.push(user)
            }
        });
    }

    let mailchimp_response: any;
    const run = async () =>{
        mailchimp_response = await mailchimp.messages.send({
            message: {
                "html": req.body.emailMessage,
                "to": success,
                "auto_text": true,
        
            }
        })
        return mailchimp_response
    }
    run().then((mail_resp)=>{
        Array.from(mail_resp).forEach(async (elem: any)=> {
            if (elem.status === "rejected" || elem.status === "rejected")failureArray.unshift(elem)
            else successArray.push(elem)
        })
        res.status(200).jsonp({
            status: 200,
            message: "Email Sent",
            data: {
                success: successArray,
                failure: failureArray
            }
        })
    });

    run().catch((reason)=>{
        res.jsonp({
            status: "Unexpected error occured",
            message: reason,
            data: {
                validationError: failureArray
            }
        })
    })
})

APP.listen(PORT, ()=>{
    console.log("Listening to port ", PORT, "...")
})