This is the code that runs www.npmjs.org.

## Getting Started

First, clone this repo.

If you have a reasonably new machine, we strongly recommend using Virtualbox
and Vagrant to run a pre-configured VM containing [couchdb](http://couchdb.apache.org/),
[redis](http://redis.io/), and [elasticsearch](http://www.elasticsearch.org/),
all ready to go. If your machine struggles to run a VM, or you are suspicious
of VMs, you will need to install them yourself.

### 1a. Recommended setup: pre-built VM

First [install VirtualBox](https://www.virtualbox.org/wiki/Downloads), which is
free for personal use.

Then [install Vagrant](https://www.vagrantup.com/downloads.html), also free.

Now go into the root of the repo and run

`vagrant up`

this will download the VM image (~700MB, so go grab a cup of coffee) and start
the VM. After this first run, the VM image will already be available on your
machine, so vagrant up will only take a few seconds.

Now get access to the machine, super simple:

`vagrant ssh`

You are now inside the VM! The code in the repo is linked to `/vagrant`, the
directory you find yourself in when you login. Changes made outside the VM
will be immediately reflected inside of it and vice versa.

### 1b. Old way: install servers locally

You need to install couchdb, redis, and elasticsearch. On OS X, these are
available via [homebrew](http://brew.sh/).

All servers should be available and *not running*. npm-www will run them
itself with the correct configurations; you just need them to be available in
the path, such that the commands `elasticsearch`, `couchdb` and `redis-server`
all hit the right binaries.

### 2. npm install

Note that you should be *inside* the VM and at /vagrant when you do this:

`npm install`

Most of the dependencies are checked-in, but a few will get installed when
you run this.

### 3. Start the server

Again, from inside the VM at /vagrant, run

`npm run dev`

You should see couch, redis and elasticsearch all being started. This can
take a little while, so wait until you see "STARTING DEV SITE NOW". Once it's
running, you can see the site by going to

[https://localhost:15443/](https://localhost:15443/)

That's it! You are good to go. You can edit the code from outside the VM and
the changes will be reflected in the VM. When you're done, remember to exit
the vm and run

`vagrant suspend`

which will save the VM. `vagrant up` will bring it back much faster after the
first run.

### 3b. Running the databases and www separately

If you are making front-end changes to the website, you will soon find that
waiting 60 seconds for the website and all the databases to restart every time
you make a change to the templates is incredibly tedious. Luckily, there's a
way to avoid that. SSH into the VM in two separate terminals, and run

`npm run dev-db`

in one terminal. This will launch couch, redis and elasticsearch. Then run

`npm run dev-www`

This will run only the web worker. You can then make changes to templates and
restart this worker without having to touch the other one, which makes the
whole thing a lot faster and less painful.

### Under the hood

All the `npm run` commands are simply running the script `dev/go.js` with
different arguments. They dump redis and couchdb logs to stdio, and
automatically run the server logs (which are just JSON) into bunyan, which
parses and prints them neatly.

The couchdb clones 1/256th of the published packages, and comes with a
hard-coded set of user accounts for testing. It has a user named 'admin' with
the password 'admin', which you can use to log in and do stuff using futon,
by going here:

[http://localhost:15984/_utils/](http://localhost:15984/_utils/)

It is also running a copy of Elasticsearch, which you can hit locally if you
want to test queries or perform admin:

[http://localhost:9200/](http://localhost:9200/)

If you want to run www as if it were in production instead, you need to copy
`config.admin.example.js` to `config.admin.js`, fill in the appropriate
fields, and then `npm start`

### Where's the code

Data fetcher thingies are in `models`.  They're all defined in
`models.js`.

Define new URL handlers in the `routes` folder.  They're defined on
`router.js`.

The templates are all in `templates`.  They are EJS.

Static assets are in the `static` folder.  The main CSS is generated
using stylus, and it is in the `stylus` folder.

## Design Philosophy

* No frameworks

    Everything is done using small, simple, standalone modules that work
    with vanilla Node.js http servers.

* No lib folder

    If you would put it in `lib/`, then it belongs in a separate module.

* JavaScript, EJS, and Stylus

    We are using JavaScript because that is the language Node.js runs.

    We are using EJS for templating, because that is the template
    language that is closest to HTML.

    We are using Stylus for styling, because CSS is intolerable, and
    stylus is a reasonable superset that adds useful features in a way
    that makes it very clear what the resulting CSS will be.

* Showcase new Node.js Features

    You'll note that many of the dependencies require Node.js 0.7.8 and
    higher.  That's because we're using new cluster features to take
    advantage of multiple CPUs, and the new domains feature to handle
    errors gracefully.

* Ridiculous speed

    This site should be surprisingly fast.  Towards that end, things are
    cached and served from memory whenever possible, and ETagged for
    browser-cacheablility.

* No Single-Page App Insanity, Push-State, Sammy, Etc.

    This is a documentation site.  It should primarily function by
    talking to a database and returning HTML.  It's not an application.

    By returning HTML, we get a lot of benefits for free.  Some
    client-side JavaScript may be added later to smooth out rough edges,
    but first, it must all work with client-side JavaScript disabled.
    It's not that we expect any users to have JavaScript disabled, but
    rather that this discipline forces a consistent approach to the site
    structure.

* Beauty

    The goal of this site is to be so beautiful, that people want to
    publish their programs to npm just to be a part of it.  The design
    of the site must be elegant.  Colors, fonts, and spacing must be
    humane, consistent, and make relevant information clear.

* Security

    User data is sacred.  This site must be a step up in terms of
    security from just doing things on the command line.  If it's not,
    then we have failed.

* Unceremonious MVC

    No big MVC class hierarchy.  Just have the route handler get some
    data, then hand it off to a template.  Simpler is better.

* Small Modules

    No single JavaScript file should be more than about 200 lines.  If
    it is, then that's a sign that it should be split up.

* DRY Dependencies

    If multiple different routes all have to keep doing the same thing,
    then they should either be the same route, or the repeated bits
    belong in a dependency.

* Check in node_modules

    Every time you add a dependency, check it into git.  This is a
    deployed website.  We need to keep things predictable.

* No Binary Dependencies

    There is no need.  We are proxying data to redis and couchdb.  It's
    all JSON and HTML.  Node can do that just fine without compiling
    anything.

* Search using Search Engines

    While we may end up integrating some kind of search into the site
    directly, it's more likely that we'll go with Bing or DuckDuckGo or
    Google.  There are advantages to an integrated search, but no matter
    how nice we may make it, people will always go to their default
    search engines to try to find node modules.  We must optimize for
    that use case first, and then build up from there.

    This is another reason why a plain-jane HTML site is best.  Search
    engines are awesome at searching it.

## Visual specs

* http://chrisglass.com/work/npm/specs/
* http://chrisglass.com/work/npm/

## Contributing

Contributions welcome!

If you are going to take on some huge part of the site, please post an
issue first to discuss the direction.  Beyond that, just fork and send
pull requests, as is the custom of our time.  Your name will be added to
the AUTHORS file, and displayed on the `/about` page.

See the [issues page](https://github.com/npm/npm-www/issues) if you
are looking for something to help out with.  In general, submissions
that add new functionality or fix actual bugs will be favored over those
that are purely stylistic.

Please follow common sense, and these guidelines:

### Git

Learn to use and love the `rebase` command to make your commits tidy.

1. Commits should be atomic.  One thing = one commit.  Do not send a
   pull request with 5 commits doing things, and then 4 un-doing them,
   and then 3 finishing it.  Do not send a pull request with one commit
   that does 15 different things.
2. First line of your commit message should be no more than 50
   characters.  Following the first line, there should be a blank line,
   then optionally some paragraphs providing further detail, which
   should wrap at no more than 80 characters.
3. Please set up your git config so that a real email address appears in
   your commits.  Be advised that this email address is public.

### Code

The npm-www site follows a slightly less strict JavaScript style than
npm itself, but it is similar.

1. Use semicolons minimally, only where they are necessary.
2. Lines should be no more than 70 characters or so.  It's better to be
   too short than too long.
3. 2-space indentation.

### Overall Structure

1. Dependencies are checked in.  This is a website, not a library.
2. There is no `lib` or `utils`.  There is a `node_modules` folder and a
   package.json file.
3. There is no framework.  There are dependencies that do a single thing
   well and are well tested and documented.
4. Routes go in the `routes` folder.  Data fetching and manipulation
   goes in the `models` folder.  HTML construction is done in ejs in the
   `templates` folder.  These concerns must remain separate.
5. Client-side JavaScript shall be used when it is absolutely necessary.
   (There are no features yet, or planned, where this is the case.  But
   that might change, of course, once more of the base functionality is
   established.)
6. See also the "Design Philosophy" above.
