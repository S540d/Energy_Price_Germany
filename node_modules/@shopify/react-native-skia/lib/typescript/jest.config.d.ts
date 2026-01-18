export let preset: string;
export let testEnvironment: string;
export let modulePathIgnorePatterns: string[];
export let transform: {
    "^.+\\.(ts|tsx)$": (string | {
        tsconfig: string;
    })[];
};
export let globals: {};
export let globalSetup: string;
export let globalTeardown: string;
