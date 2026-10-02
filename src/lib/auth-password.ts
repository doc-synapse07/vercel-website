import bcrypt from "bcryptjs";

/**
 * bcryptjs is re-exported from its own module because importing it inside a
 * "use server" file pulls the whole library into the server bundle graph.
 * Keeping it in a plain module keeps the action file lean.
 */
export { bcrypt };