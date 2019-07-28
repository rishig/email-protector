import base64url from "base64url";
import fs from "fs";
import { gmail_v1, google } from "googleapis";
import http from "http";
import opn from "open";
import server_destroy from "server-destroy";

import { findSuspectLinks } from "./findlinks";

// tslint:disable:no-console

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];
const TOKEN_PATH = "token.json";

// Initial per-process setup of oAuth2Client.
// Client can be re-used by multiple users.
const {client_secret, client_id} =
  JSON.parse(fs.readFileSync("credentials.json").toString()).installed;
const oAuth2Client = new google.auth.OAuth2(
  client_id, client_secret, "http://localhost:8080/gmail/authcallback");
google.options({
    auth: oAuth2Client
});

export async function runProtector() {
  // We just called getToken, and the token doesn't expire for an
  // hour, so don't need to worry about expiry
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH).toString());
  oAuth2Client.setCredentials(token);
  const gmail = google.gmail({version: "v1", auth: oAuth2Client});
  let moreMessages = true;
  let pageToken: string;

  while (moreMessages) {
    const messageListParams: {[index: string]: string | boolean | number} = {
      includeSpamTrash: true,
      q: "dropbox.com | db.tt",
      userId: "me",
    };
    if (pageToken) {
      messageListParams.pageToken = pageToken;
    }
    const messageList = await gmail.users.messages.list(messageListParams);
    pageToken = messageList.data.nextPageToken;
    if (!pageToken) {
      moreMessages = false;
    }

    if (messageList.data.messages) {
     for (const messageInfo of messageList.data.messages) {
        const message = await gmail.users.messages.get({
          format: "raw",
          id: messageInfo.id,
          userId: "me",
        });
        const contents = base64url.decode(message.data.raw);
        findSuspectLinks(contents);
      }
    }
  }
}

// Adapted from
// https://github.com/googleapis/google-api-nodejs-client/blob/master/samples/oauth2.js
export async function startGoogleAuth() {
  if (fs.existsSync(TOKEN_PATH)) {
    fs.unlinkSync(TOKEN_PATH);
  }
  return new Promise((resolve, reject) => {
    const authorizeUrl = oAuth2Client.generateAuthUrl({
      scope: SCOPES.join(" "),
    });
    const server = http
      .createServer(async (req, res) => {/* intentionally empty */})
      .listen(3000, () => {
        opn(authorizeUrl, {wait: false}).then((cp) => cp.unref());
      });
    server_destroy(server);
  });
}

export async function finishGoogleAuth(code: string) {
  const {tokens} = await oAuth2Client.getToken(code);
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
}
