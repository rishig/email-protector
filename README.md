# Email protector

Scans your inbox, and prints out a list of emails with unsecured (i.e. public) dropbox links.

## Notes and caveats

A few known bugs and missing features:

* The oAuth flow only works once (and then you have to restart the node server). My guess is I'm not properly destroying the http server created in `startGoogleAuth`, but I haven't investigated.

* Clicking on "Scan mail" opens a new tab rather than the google auth flow happening in the same tab.

* This doesn't handle rate limiting and other http errors (e.g. dropbox.com being down).

* I was learning javascript (and node, etc) on the fly, so while I normally keep good commit disclipline it wasn't really possible here. In the end I just squashed most of the work into a single commit. If this were being put into production I would separate it out to make it easier to read what happened.

* Looking at this now, I might reorganize the code a bit; e.g. it doesn't really make sense for runProtector() to be in a file called googleauth.ts.

Bugs and missing features on the product side:

* I didn't attempt to find all URLs dropbox uses or may have used in the past (e.g. URL shorteners other than db.tt, or products not hosted on *.dropbox.com).

* There are a couple of situations where the file sharing link in an email is secured, but the email still contains sensitive information (e.g. a file preview). Arguably one should still redact the email in that case.

* The current solution catches links to public dropbox pages (e.g. dropbox help articles), which are "unsecured" but also safe. So emails from Dropbox that are otherwise fine might get redacted anyway, due to links in their email templates. (Note though that if the only link in an email from Dropbox is in a boilerplate footer, that'll be fine, since the `gmail.users.messages.list` search won't find it.)

* I didn't attempt to do Box, Google, etc. links.
