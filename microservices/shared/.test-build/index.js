"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Shared service kit.
 *
 * Source of truth lives in microservices/shared/. It is copied into each
 * service at microservices/<name>/src/shared/ by scripts/sync-shared.mjs,
 * because each service's Docker build context is its own directory and cannot
 * reach a sibling folder. Edit the source, then run `npm run sync:shared`.
 */
__exportStar(require("./app"), exports);
__exportStar(require("./auth"), exports);
__exportStar(require("./audit"), exports);
__exportStar(require("./db"), exports);
__exportStar(require("./errors"), exports);
__exportStar(require("./firebaseToken"), exports);
__exportStar(require("./logger"), exports);
__exportStar(require("./rateLimit"), exports);
__exportStar(require("./serviceClient"), exports);
__exportStar(require("./validate"), exports);
