# JS1 - Debugging Exercise

These exercises are designed to have you experiment with the Chrome DevTools for
debugging purposes.

While there may be "_easier_" or "_quicker_" ways you can find to solve the
problems, that would defeat the purpose of learning the tools - stick with the
instructions to get the most out of it.

## forecast.io

The project we're debugging is a copy of the
[developer.forecast.io](http://developer.forecast.io) site when a user has
logged in already.

The copy we're working with has had a couple of bugs purposely inserted, and our
goal is to track down and squish them!

## Getting Started

Fork this repo, then clone it to your machine.

You can find the "_Fork_" button at the top-right of the GitHub page.

Once forked, you can find the correct url to clone from the Green button on the
right called "_Clone or download_".

Once cloned to your computer, run the following commands while inside the
directory containing the project files.

```bash
npm install
```

To correctly load the page, run;

```bash
npm run start
```

Then visit `http://localhost:8080`, and you will see the forecast.io developer
page.

As you make changes to your code, you will have to stop this command with
`Ctrl-C`, then re-run `npm run start`.

## Debugging

Our users have reported 2 bugs with our website:

1. There is no graph showing! It should look like [this](img/expected-graph.png).
2. Generating a new API key results in showing blank in the UI. It should show
   the new API key to the user.

### No Graph

Something's not rendering the graph correctly. Follow each of these steps one at
a time without skipping ahead.

**1. Check for Errors**

First step is to see if there any errors related to the code in
`js/darkskydev.js` (this application's JS).

Once you've checked that and ruled out any errors, then it's time to jump into
the source and start debugging!

**2. Check the code**

_Hint: The file is located in DevTools at Sources > localhost > js >
darkskydev.js_

Helpfully, the previous dev left a note for us (if a little terse);

> The graph is rendered in `display_history`.

Let's start there - drop some breakpoints and see if we can figure out where
it's being called.

**3. Finding where code is executed**

As we drop breakpoints, if they are never triggered (if code execution never
pauses at that point), then we have to go hunt for where that piece of code /
function is meant to be executed, and drop some breakpoints there.

Maybe it's that we miss-spelled a function name, or maybe it's that our logic is
never hitting the condition which executes our code, or maybe it's that we've
forgotten to actually implement executing that function, or... and so on.

To figure out which one we're dealing with here, do a search through the code to
find where the function `display_history` is being called, then drop some
breakponts there.

Continue on like this until you can narrow down where the execution isn't
occuring.

**4. Debugging a line of code**

Once we've narrowed down where the issue lays, we need to debug why that's
happening.

DevTools provides us with some great options, all located to the right hand side
within the "_Sources_" tab. The three sections that will help us most here are
_Watch_, _Scope_, and the icons at the top (play/pause, step over, step into,
etc).

Once code execution is paused, we can use the _Step Over_ ![](img/step-over.png)
option allows us to move one line of code at a time. While doing that, we can
keep an eye on variables that are in scope under the _Scope_ section.
If there is a particular variable you want to track easily, put it into the
_Watch_ section so you can see what's going on there.

Remember that _Watch_ can execute any expression, not just a variable, and it's
often useful to take an expression (a function call, calculation, etc) from the
code you're debugging and place it there to see what the value is as execution
continues.

Once you've found the bug, fix it in your code, restart the server, then check
that it's working as expected.

### Blank API Key

Unfortuantely our previous developer friend didn't leave us any notes for this
one.

We know that clicking the "_Reset API Key_" button triggers the reset, but where
is that in the code?

Follow each of these steps one at a time without skipping ahead.

**1. Finding an event listener**

DevTools allows us to inspect individual elements in the DOM, as well as related
info for those elements.

This is done in the "_Elements_" tab of DevTools. First, _Inspect_ the element
you're interested in (eg; the Button).

On the right hand side, there are tabs showing different categories of
information. In our case, we're interested in "_Event Listeners_". In
particular, the "_click"_ event.

Whoa, there's a lot listed there! Let's filter it down to just the element we've
inspected. Untick "_Ancestors_" At the top of the tab.

Now we can see the event listener we're interested, and it conveniently provides
a link to the source. Follow that to continue debugging.

**2. Debugging with Step Into**

We've found where the event is handled, but it's not doing much. Just calling
out to some other function.

Drop a debugger here to pause execution. Go click the button (with DevTools
still open), and the code will pause on that line.

Now we need to get inside of the function being called. So far we've used "_Step
Over_" which keeps executing line after line, but there's another option next to
it; "_Step Into_" which looks like ![](img/step-into.png).

This will take us inside of the function at the line currently paused on.

**3. Async Debugging**

When we come across some code which uses Callbacks, or does some async process,
using "_Step Over_" or "_Step Into_" ends up with us deep inside some library
code we're not interested in. It never gets us back to that callback we wanted
to debug.

In this case, there are two ways to debug;

1. You could drop a breakpoint inside of the callback once you've realized it's
   executed asynchronously. Once the breakpoint is in place, you can hit Play to
   continue execution until that callback is executed.

2. Check the "Async" box at the top of the right hand column. This will provide
   you with call stacks that work across asynchronous callbacks. Note that this
   can be slow.

**4. Debugging**

As with the first bug, "_No Graph_", we are debugging a case of code not
executed as expected.

Using the "_Watch_" and "_Scope_" sections along with breakpoints is how we can
track down code which isn't doing quite what we expected / where some code may
be written incorrectly or there may be a bug.

Once you've found the bug, fix it in your code, restart the server, then check
that it's working as expected.

## Feature Change

Inevitably, a Project Manager has come to your desk:

> We've got a feature change we'd like you to implement. The previous dev who
> worked on the project is on holiday, so it's up to you to learn their code,
> and make this change for us, ok?
>
> The network folks say we're requesting updated usage history for our users
> _every second_. That's too much for our servers to handle, so we need to
> change this out to every _ten_ seconds.

Hmm, ok, we can give that a go!

There are a couple of hints here:

> requesting updated usage history

That sounds like it's some sort of API request. That'll show up in the _Network_
tab in DevTools.

> updated usage history for our users _every second_

There must be some code which executes regularly, once a second. Let's keep an
eye out for that while we're debugging.

**1. Network debugging**

Starting with the network request is as good a place as any. The "_Network_" tab
shows us all the requests that are being fired by the page.

Here we should be able to see the request being made over and over again.

The "_Initiator_" column looks like it shows where the call is coming from. If
we click it, we can often end up deep inside some library or other, which isn't
very useful.

If we hover over the "_Initiator_" value, it will show us a call stack of how
that line came to be executed. This will often lead you to a more obvious line
of code (for example; in the `darkskydev.js` file for this webpage).

**2. Debugging with Step Out / Call Stack**

So far we've Stepped _Over_, we've Stepped _Into_, and now we're going to step
_Out_ ![](img/step-out.png).

Stepping _Out_ is the opposite of Stepping _In_ - it takes you out of the
current function being executed, one level up the call stack. This allows for
seeing how you ended up where you currently are.

An alternative to using the Step Out, is to use the "Call Stack" section which
shows the current call stack of how you got to where you are. Clicking any of
the items listed in the Call Stack will take you to that line of code.

Once you've found the bug, fix it in your code, restart the server, then check
that it's working as expected.
