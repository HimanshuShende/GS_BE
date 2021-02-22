import express from "express";
import Joi from "joi";

// creates express instance which handles the requests
const APP = express();
// fetches PORT variable from environment, if not present than selects 8080
const PORT = process.env.PORT || 8080
// creates our mailchimp client instance with the API key which is also fetched from environment variables
const apiKey = process.env.API_KEY;
const mailchimp = require("@mailchimp/mailchimp_transactional")(apiKey);
// array which holds the failed and successfully sent mails
let failureArray: any[];
let successArray: any[];
let setEmailArray: string[];
interface User {
    email: string,
    name: string,
    type: "to"|"cc"|"bcc"
}

APP.use(express.json())
APP.use(express.urlencoded({
    extended: true
}));
// handles the get method
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
// handles the post method 
APP.post("/send_mail/", (req, res)=>{
    // initialting the arrays as empty at the start
    failureArray  = [];
    successArray  = [];
    setEmailArray = [];
    // a Joi object schema used for validating each user data
    // following tells that each user data must contain defined key-value pair along with the limits
    const userObject = Joi.object({
        email: Joi.string().required(), // string, required
        name: Joi.string(), // optional 
        type: Joi.custom((str, descr)=>{ // custom Joi validator which checks wheter the type key holds the values "to"/"cc"/"bcc", , required
            if (['to', 'cc', 'bcc'].includes(str)){
                return true
            }
            else{
                console.log(str, false)
                return descr.error("any.custom", {
                    error: new Error("it's not one of the following: to/cc/bcc") 
                })
            }
        }).required()
    })
    // a Joi object schema which validates the incoming request body
    const reqSchema = Joi.object({
        userData: Joi.array().min(1).required(), // an array which must contain atleast one user data, requires
        emailMessage: Joi.string().required(), // message to be sent, required
        attachments: Joi.array() // attachments, optional
    })

    // holds the User typed Object which are validated below
    const success: User[] = [];
    // checks the request body for the validation using joi object(reqSchema) defined above
    const reqSchemaResult = reqSchema.validate(req.body)
    if (reqSchemaResult.error){
        // returns the error messages if the request body is invalid
        res.send(reqSchemaResult.error.details[0].message);
    }else{
        // lopps over each user data and validates them using Joi Object(userObject) defined above
        req.body.userData.forEach((user:any, index:any)=>{
            const userObjectResult = userObject.validate(user)
            if (userObjectResult.error) {
                // if the user is invalid than puts it in the failureArray along with the error associated with it and return it as a part of response
                failureArray.push({
                    ...user,
                    error: userObjectResult.error.details[0].message 
                })
            }else{
                // for preventing duplication of the userData with same email address
                if (!setEmailArray.includes(user.emial)){
                    // if the user is valid than puts it in the success which will be sent to the mailer service(mailchimp)
                    success.push(user)
                    // adds to the array if not present in it, otherwise doesn't
                    setEmailArray.push(user.email)
                }
            }
        });
    }
    // initiates a mailchimp response variable
    let mailchimp_response: any;
    const send_mail = async () =>{
        // holds the response sent back by the mailchimp, which is an array of user data in the format {"email": "", "status": "", "_id": "", "rejected_reason": "if status is 'rejected'"}
        mailchimp_response = await mailchimp.messages.send({
            message: {
                "html": req.body.emailMessage,
                "to": success,
                "auto_text": true,
        
            }
        })
        return mailchimp_response
    }
    // resolves the send_mail Promise
    send_mail().then((mail_resp)=>{
        // takes the mailchimp_response returned by the promise after executing, then converts it into an array
        // loops over this array and seperates and put them in the failureArray if status is 'rejected'/'invalid', otherwise in successArray
        Array.from(mail_resp).forEach(async (elem: any)=> {
            if (elem.status === "rejected" || elem.status === "rejected") failureArray.unshift(elem)
            else successArray.push(elem)
        })
        // send the response
        res.status(200).jsonp({
            status: 200,
            message: `${successArray.length} Sent, ${failureArray} failed.`,
            data: {
                success: successArray,
                failure: failureArray
            }
        })
    });
    // executes this block the promise is rejected, and sends the following response
    send_mail().catch((reason)=>{
        res.jsonp({
            status: "Unexpected error occured",
            message: reason,
            data: {
                validationError: failureArray
            }
        })
    })
})

// listens to the PORT given for the requests
APP.listen(PORT, ()=>{
    console.log("Listening to port ", PORT, "...")
})