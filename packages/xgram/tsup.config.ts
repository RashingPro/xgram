import { defineConfig } from "tsup";

export default defineConfig({
    format: "cjs",
    clean: true,
    entry: ["./src"]
});
