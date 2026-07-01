import { bootstrap } from "./bootstarp";

bootstrap().then(() => {
    console.log("Application bootstrapped successfully.");
    // If bootstrap returns the server, you can initialize socket.io like this:
    // const { httpServer } = bootstrapResult;
    // initSocket(httpServer);
}).catch((error) => {
    console.error("Error during bootstrapping:", error);
}   );