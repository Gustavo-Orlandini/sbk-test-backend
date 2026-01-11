import * as fs from 'fs';
import * as path from 'path';

export class JsonLoader {
    static load<T>(filePath: string): T {
        try {
            const absolutePath = path.resolve(filePath);
            const fileContent = fs.readFileSync(absolutePath, 'utf-8');
            return JSON.parse(fileContent) as T;
        } catch (error) {
            throw new Error(
                `Error loading JSON file: ${filePath}. ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}