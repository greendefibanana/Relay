import baseX from "base-x";

const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const bs58 = baseX(alphabet);

export const encode = bs58.encode;
export const decode = bs58.decode;
export const decodeUnsafe = bs58.decodeUnsafe;

export default bs58;
