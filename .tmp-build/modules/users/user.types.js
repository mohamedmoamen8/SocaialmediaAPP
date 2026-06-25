"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderTypes = exports.Gender = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole[UserRole["user"] = 0] = "user";
    UserRole[UserRole["admin"] = 1] = "admin";
})(UserRole || (exports.UserRole = UserRole = {}));
var Gender;
(function (Gender) {
    Gender[Gender["male"] = 0] = "male";
    Gender[Gender["female"] = 1] = "female";
})(Gender || (exports.Gender = Gender = {}));
var ProviderTypes;
(function (ProviderTypes) {
    ProviderTypes["system"] = "system";
    ProviderTypes["google"] = "google";
})(ProviderTypes || (exports.ProviderTypes = ProviderTypes = {}));
