# Node.js Fundamentals

## What is Node.js?
Node.js is a Javascript runtime environment that uses Chrome's V8 engine. Node allows us to run javascript outside of a web browser on a computer or a server. 

## How does Node.js differ from running JavaScript in the browser?
Node.js differs by allowing us to do extra tasks locally that are not able to be done on the browser. The browser focuses on DOM manipulation, UI rendering, and User Interactions, but restricts system access for security. Node gives us access to things like APIs, file and network interactions. 

## What is the V8 engine, and how does Node use it?
The V8 engine is Google's engine that compiles Javascript into native machine code. Node uses it by giving Javascript access to the computer's files, network, etc.

## What are some key use cases for Node.js?
Key use cases for Node.js include: building REST APIs, real-time applications, video/audio processing applications, etc.

## Explain the difference between CommonJS and ES Modules. Give a code example of each.

The difference between CommonJS and ES Modules are the functions and syntax used to do the same action. For example, to import something from another file, in CommonJS Syntax I would type:

**CommonJS (default in Node.js):**
```js
const { tool1, tool2 } = require("../source");
```

In ES Modules syntax, I would write the same action like this:

**ES Modules (supported in modern Node.js):**
```js
import { tool1, tool2 } from "source";
``` 