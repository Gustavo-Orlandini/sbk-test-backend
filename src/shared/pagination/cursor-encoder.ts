export class CursorEncoder {
    static encode(value: string): string {
        return Buffer.from(JSON.stringify({ id: value })).toString('base64');
    }

    static decode(cursor: string): string {
        try {
            const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
            const parsed = JSON.parse(decoded);
            return parsed.id;
        } catch (error) {
            throw new Error('Cursor inválido');
        }
    }
}