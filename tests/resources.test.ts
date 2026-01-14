import { describe, it, expect } from 'vitest';
import resources from '../src/data/resources.json';
import appConfig from '../src/data/app-config.json';

describe('Data Integrity Resources', () => {
    it('resources.json should have essential keys', () => {
        expect(resources).toHaveProperty('logo');
        expect(resources).toHaveProperty('recursos');
        expect(resources.recursos).toBeDefined();
    });

    it('app-config.json should have version', () => {
        expect(appConfig).toHaveProperty('version');
        expect(typeof appConfig.version).toBe('string');
    });
});
