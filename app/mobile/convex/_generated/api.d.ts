/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as attachments from "../attachments.js";
import type * as conversations from "../conversations.js";
import type * as council from "../council.js";
import type * as councilMutations from "../councilMutations.js";
import type * as http from "../http.js";
import type * as messages from "../messages.js";
import type * as openrouter from "../openrouter.js";
import type * as rateLimits from "../rateLimits.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  attachments: typeof attachments;
  conversations: typeof conversations;
  council: typeof council;
  councilMutations: typeof councilMutations;
  http: typeof http;
  messages: typeof messages;
  openrouter: typeof openrouter;
  rateLimits: typeof rateLimits;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
