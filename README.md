# ArchiveList
This dynamic list component renders only the items visible in viewport + 1000 pixels over that (+ the newly loaded items on each batch load from server).
# Time complexity
**Time complexity of all rendering and computations in regards of the full list is O(1)**, time only depends on the number of items fitting into the rendering area (vieport + buffer).

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app), using the [Redux](https://redux.js.org/) and [Redux Toolkit](https://redux-toolkit.js.org/) TS template.

## Available Scripts

In the project directory, you can run:

### `npm start`

Builds the Front-End and Back-End and starts a `json-server`-based backend server that hosts everything,
i.e. static files of the compiled React app and the DB API.
Opens [http://localhost:3001](http://localhost:3001) to view it in the browser.

You will also see any lint and server runtime logs and errors in the console.

### `start-fe`

Builds the Front-End in `development` mode and starts a dev webpack server with it on port 3000.
This version uses FakeAPI that doesn't make actual web requests but stores the data in-memory.

### `start-be`

Builds the Back-End and starts the server.
If the Front-End is already built, that's enough to open the app at [http://localhost:3001](http://localhost:3001).

### `build-fe`

Builfd the Front-End React app in production mode.
The output folder `build` is configured to be served as static files by `json-server`.

### `build-be`

Builds the Back-End but doesn't run it. Handy for error-checking.

### `build-all`

Builds both Front-End and Back-End together without starting the server.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
