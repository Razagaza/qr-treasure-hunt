import fs from 'fs';
import path from 'path';

const dir = path.join(process.cwd(), 'data/treasures');
const files = fs.readdirSync(dir);
const errors: string[] = [];

files.forEach(file => {
    if (!file.endsWith('.json')) return;
    try {
        const content = fs.readFileSync(path.join(dir, file), 'utf-8');
        const data = JSON.parse(content);

        // 1. ID Match
        const idFromFile = parseInt(file.split('.')[0]);
        if (data.id !== idFromFile) errors.push(`${file}: ID mismatch (File: ${idFromFile}, Content: ${data.id})`);

        // 2. Fields
        if (typeof data.question !== 'string') errors.push(`${file}: Missing question`);
        if (typeof data.answer !== 'string') errors.push(`${file}: Missing answer`);
        if (!['text', 'choice', 'number'].includes(data.type)) errors.push(`${file}: Invalid type '${data.type}'`);

        if (data.type === 'choice' && (!Array.isArray(data.choices) || data.choices.length === 0)) {
            errors.push(`${file}: Type is choice but choices are missing/empty`);
        }
    } catch (e: any) {
        errors.push(`${file}: Invalid JSON - ${e.message}`);
    }
});

if (errors.length > 0) {
    console.error('Validation Errors:');
    errors.forEach(e => console.error(e));
} else {
    console.log('All 30 JSON files are valid!');
}
