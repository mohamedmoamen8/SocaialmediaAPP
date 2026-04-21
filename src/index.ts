import { bootstrap } from "./bootstarp";
bootstrap().then(() => {
    console.log("Application bootstrapped successfully.");
}).catch((error) => {
    console.error("Error during bootstrapping:", error);
}   );