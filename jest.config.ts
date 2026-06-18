import type { Config } from 'jest';
import { createDefaultPreset } from 'ts-jest';

const tsJestTransformCfg = createDefaultPreset().transform;

const config: Config = {
    testEnvironment: "jsdom",
    verbose: true,
    transform: {
        ...tsJestTransformCfg,
    },
};

export default config;