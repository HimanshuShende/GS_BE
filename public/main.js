"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var joi_1 = __importDefault(require("joi"));
var APP = express_1.default();
var PORT = process.env.PORT || 8080;
var apiKey = "fSTbY9Q5pNCqykcitjBqzw";
var mailchimp = require("@mailchimp/mailchimp_transactional")(apiKey);
var failureArray;
var successArray;
APP.use(express_1.default.json());
APP.use(express_1.default.urlencoded({
    extended: true
}));
APP.get("/", function (req, res) {
    res.send("GlobalShala Backend Task running at port " + PORT);
});
APP.post("/send_mail/", function (req, res) {
    failureArray = [];
    successArray = [];
    var userObject = joi_1.default.object({
        email: joi_1.default.string().required(),
        name: joi_1.default.string(),
        type: joi_1.default.custom(function (str, descr) {
            if (['to', 'cc', 'bcc'].includes(str)) {
                return true;
            }
            else {
                console.log(str, false);
                return descr.error("any.custom", {
                    error: new Error("it's not one of the following: to/cc/bcc")
                });
            }
        })
    });
    var reqSchema = joi_1.default.object({
        userData: joi_1.default.array().min(1).required(),
        emailMessage: joi_1.default.string().required(),
        attachments: joi_1.default.array()
    });
    var success = [];
    var reqSchemaResult = reqSchema.validate(req.body);
    if (reqSchemaResult.error) {
        res.send(reqSchemaResult.error.details[0].message);
    }
    else {
        req.body.userData.forEach(function (user, index) {
            var userObjectResult = userObject.validate(user);
            if (userObjectResult.error) {
                failureArray.push(__assign(__assign({}, user), { error: userObjectResult.error.details[0].message }));
            }
            else {
                success.push(user);
            }
        });
    }
    var mailchimp_response;
    var run = function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, mailchimp.messages.send({
                        message: {
                            "html": req.body.emailMessage,
                            "to": success,
                            "auto_text": true,
                        }
                    })];
                case 1:
                    mailchimp_response = _a.sent();
                    return [2 /*return*/, mailchimp_response];
            }
        });
    }); };
    run().then(function (mail_resp) {
        Array.from(mail_resp).forEach(function (elem) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (elem.status === "rejected" || elem.status === "rejected")
                    failureArray.unshift(elem);
                else
                    successArray.push(elem);
                return [2 /*return*/];
            });
        }); });
        res.status(200).jsonp({
            status: 200,
            message: "Email Sent",
            data: {
                success: successArray,
                failure: failureArray
            }
        });
    });
    run().catch(function (reason) {
        res.jsonp({
            status: "Unexpected error occured",
            message: reason,
            data: {
                validationError: failureArray
            }
        });
    });
});
APP.listen(PORT, function () {
    console.log("Listening to port ", PORT, "...");
});
