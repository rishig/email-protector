import fetch from "node-fetch";
import parse from "parse-email";

// tslint:disable:no-console

/* Tries to get all characters dropbox might include in a slug. Includes all "Safe characters",
 * "Reserved characters", and "Unsafe characters" from https://perishablepress.com/stop-using-unsafe-characters-in-urls/
 * except <, >, ', ", and blank space.
 *
 * Takes care to include things like "check out this linkhttps://dropbox.com", where there is no space before the https
 * (as well as things like "check out this link dropbox.com"). In japanese and possibly other languages it's typical not
 * to leave space before the https, and even in English many email clients correctly linkify "linkhttps://dropbox.com"
 *
 * Also catches all subdomains *.dropbox.com, since e.g. paper links are hosted at paper.dropbox.com.
 */
const linkRegexp = new RegExp(/(https?:\/\/)?[\w\.@]*(dropbox\.com|db\.tt)[\w$\-.+!*(),;/?:@=&#%{}|\\^~[\]`\b]*/g);
// Tries to get all dropbox email addresses
const emailRegexp = new RegExp(/.*@.*(dropbox\.com|db\.tt).*/);
const loginRegexp = new RegExp(/\/(login|sign-in)\?/);

// This stuff should really go in a queue worker that can handle things like
// dropbox.com being down or rate-limiting us
async function isLoginProtected(link: string) {
    const url = await fetch(link, {method: "HEAD"}).then((response) => response.url);
    return loginRegexp.test(url);
}

export async function findSuspectLinks(email: string) {
    const parsedEmail = await parse(email);

    const links: Set<string> = new Set();
    for (const link of parsedEmail.text.match(linkRegexp)) {
        links.add(link);
    }
    for (const link of parsedEmail.html.match(linkRegexp)) {
        links.add(link);
    }
    for (const attachment of parsedEmail.attachments) {
        for (const link of attachment.match(linkRegexp)) {
            links.add(link);
        }
    }

    const suspectLinks = new Array();
    for (const link of links) {
        if (!emailRegexp.test(link)) {
            const loginProtected = await isLoginProtected(link)
                .catch((error) => {console.log(error); return false; });
            if (!loginProtected) {
                suspectLinks.push(link);
            }
        }
    }

    if (suspectLinks.length > 0) {
        console.log("FROM: " + parsedEmail.from.text);
        console.log("SUBJECT: " + parsedEmail.subject);
        for (const link of suspectLinks) {
            console.log(link);
        }
        console.log();
    }

    return suspectLinks;
}
