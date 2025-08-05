const randomAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
export function generateRandomString(length: number) {
    if (length < 1) throw new Error("Length must be a positive integer");
    let result = "";
    while (result.length < length) {
        result += randomAlphabet.charAt(Math.floor(randomAlphabet.length * Math.random()));
    }
    return result;
}
