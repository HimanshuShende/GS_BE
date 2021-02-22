"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var joi_1 = __importDefault(require("joi"));
var APP = express_1.default();
APP.use(express_1.default.json());
var PORT = process.env.PORT || 8080;
APP.get("/", function (req, res) {
    console.log("GET METHOD");
    console.log("Body   : ", req.body);
    console.log("Params : ", req.params);
    console.log("Query  : ", req.query);
    res.send("Hi Rohan");
});
APP.post("/send_mail/", function (req, res) {
    console.log("POST METHOD");
    console.log("Body   : ", req.body);
    console.log("Params : ", req.params);
    console.log("Query  : ", req.query);
    var schema = joi_1.default.object({
        userData: joi_1.default.array().min(1).required(),
        emailMessage: joi_1.default.string().required(),
        attachments: joi_1.default.array()
    });
    var result = schema.validate(req.body);
    if (result.error) {
        res.send(result.error.details[0].message);
        return;
    }
    res.status(200).jsonp("Post method for request body");
});
APP.listen(PORT, function () {
    console.log("Listening to port ", PORT);
});
