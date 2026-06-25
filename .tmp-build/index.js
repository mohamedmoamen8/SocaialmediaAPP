"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bootstarp_1 = require("./bootstarp");
(0, bootstarp_1.bootstrap)().then(() => {
    console.log("Application bootstrapped successfully.");
}).catch((error) => {
    console.error("Error during bootstrapping:", error);
});
