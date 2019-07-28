import express from "express";
import path from "path";

import { finishGoogleAuth, runProtector, startGoogleAuth } from "./googleauth";

// tslint:disable:no-console

const app = express();
const port = 8080;

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/results", (req, res) => {
    runProtector().catch((error) => console.log(error));
    res.render("index", {post_scan: true});
});

app.get("/gmail/auth", (req, res) => {
    startGoogleAuth().catch((error) => console.log(error));
});

app.get("/gmail/authcallback", (req, res) => {
    finishGoogleAuth(req.query.code)
       .then(() => res.redirect("/results"))
       .catch((error) => console.log(error));
});

// start the express server
app.listen(port, () => {
    // tslint:disable-next-line:no-console
    console.log(`server started at http://localhost:${ port }`);
});
